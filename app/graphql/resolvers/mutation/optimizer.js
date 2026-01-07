import { exec } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import prisma from "../../../../prisma/prismaClient.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ==========================================
// HELPER: Array <-> CSV Conversion
// ==========================================
const parsePriority = (csv) => {
  if (!csv || csv.trim() === "") return [];
  return csv
    .split(",")
    .map((id) => parseInt(id))
    .filter((n) => !isNaN(n));
};

const serializePriority = (arr) => {
  if (!arr || arr.length === 0) return "";
  return arr.join(",");
};

export const TypeResolvers = {
  OptimizerSetting: {
    resourcePriority: (parent) => {
      if (Array.isArray(parent.resourcePriority))
        return parent.resourcePriority;
      return parsePriority(parent.resourcePriority);
    },
  },
  OptimizerExecution: {
    resourcePriority: (parent) => {
      if (Array.isArray(parent.resourcePriority))
        return parent.resourcePriority;
      return parsePriority(parent.resourcePriority);
    },
  },
};

// ==========================================
// MUTATIONS
// ==========================================

export const updateOptimizerSettings = async ({ input }) => {
  const { resourcePriority, ...rest } = input;

  const dataToSave = { ...rest };
  if (resourcePriority !== undefined) {
    dataToSave.resourcePriority = serializePriority(resourcePriority);
  }

  const settings = await prisma.optimizerSetting.upsert({
    where: { id: 1 },
    update: dataToSave,
    create: {
      id: 1,
      strategy: "balanced",
      campaignWindowDays: 0,
      gravity: true,
      ...dataToSave,
    },
  });

  return {
    ...settings,
    resourcePriority: parsePriority(settings.resourcePriority),
  };
};

export const runOptimizer = async ({ input }) => {
  // 1. Resolve Parameters (Input > Defaults)
  let params = {};

  if (input) {
    params = {
      strategy: input.strategy,
      campaignWindowDays: input.campaignWindowDays,
      gravity: input.gravity,
      resourcePriority: input.resourcePriority
        ? serializePriority(input.resourcePriority)
        : undefined,
    };
  }

  const defaults = await prisma.optimizerSetting.findUnique({
    where: { id: 1 },
  });

  const finalStrategy = params.strategy ?? defaults?.strategy ?? "balanced";
  const finalDays =
    params.campaignWindowDays ?? defaults?.campaignWindowDays ?? 0;

  // Handle Gravity (can be false, so check undefined)
  const finalGravity =
    params.gravity !== undefined ? params.gravity : defaults?.gravity ?? true;

  const finalPriorityCSV =
    params.resourcePriority ?? defaults?.resourcePriority ?? "";

  // 2. Create "RUNNING" Log
  const execution = await prisma.optimizerExecution.create({
    data: {
      status: "RUNNING",
      strategy: finalStrategy,
      campaignWindowDays: finalDays,
      gravity: finalGravity,
      resourcePriority: finalPriorityCSV,
      startTime: new Date(),
    },
  });

  // 3. Prepare Python Command
  const projectRoot = path.resolve(__dirname, "../../../../../");
  const pythonScriptDir = path.join(projectRoot, "optiplan-optimizer");
  const venvPythonPath = path.join(
    pythonScriptDir,
    "venv",
    "Scripts",
    "python.exe"
  );
  const scriptName = "main.py";

  // --- CONSTRUCT ARGUMENTS ---
  let args = `--strategy "${finalStrategy}"`;

  // ✅ ONLY ADD DAYS IF > 0
  if (finalDays > 0) {
    args += ` --campaign_window_days ${finalDays}`;
  }

  // ✅ GRAVITY FLAG (Boolean flag, not value)
  if (finalGravity) {
    args += ` --gravity`;
  } else {
    args += ` --no-gravity`;
  }

  // ✅ RESOURCE PRIORITY
  if (finalPriorityCSV && finalPriorityCSV.length > 0) {
    args += ` --resource_priority "${finalPriorityCSV}"`;
  }

  const command = `"${venvPythonPath}" "${scriptName}" ${args}`;

  console.log(`🚀 Starting Optimizer [ID: ${execution.id}]`);
  console.log(`Command: ${command}`);

  // 4. Execution Logic (Async)
  return new Promise((resolve) => {
    exec(
      command,
      {
        cwd: pythonScriptDir,
        env: { ...process.env, PYTHONIOENCODING: "utf-8" },
        maxBuffer: 1024 * 1024 * 10, // 10MB buffer
      },
      async (error, stdout, stderr) => {
        const endTime = new Date();
        const duration = (endTime - execution.startTime) / 1000;

        if (error) {
          console.error(`❌ Optimizer Failed: ${error.message}`);
          await prisma.optimizerExecution.update({
            where: { id: execution.id },
            data: {
              status: "FAILED",
              endTime,
              durationSeconds: duration,
              errorMessage: stderr || error.message,
            },
          });

          return resolve({
            success: false,
            message: `Execution failed: ${stderr || error.message}`,
          });
        }

        // 5. Parse Output for Record Count
        let recordCount = 0;
        const countMatch = stdout.match(/PROCESSED_COUNT:\s*(\d+)/);
        if (countMatch) {
          recordCount = parseInt(countMatch[1], 10);
        }

        console.log(`✅ Optimizer Finished. Records: ${recordCount}`);

        await prisma.optimizerExecution.update({
          where: { id: execution.id },
          data: {
            status: "SUCCESS",
            endTime,
            durationSeconds: duration,
            recordCount,
          },
        });

        return resolve({
          success: true,
          message: "Optimizer finished successfully.",
        });
      }
    );
  });
};
