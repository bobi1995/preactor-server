import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import prisma from "../../../../prisma/prismaClient.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper: Array <-> CSV
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

export const getOptimizerSettings = async () => {
  const settings = await prisma.optimizerSetting.findFirst();
  if (!settings)
    return {
      id: 0,
      strategy: "balanced",
      campaignWindowDays: 0,
      resourcePriority: "",
    };
  return settings;
};

export const getOptimizerExecutions = async () => {
  return await prisma.optimizerExecution.findMany({
    orderBy: { startTime: "desc" },
    take: 50,
  });
};

export const TypeResolvers = {
  OptimizerSetting: {
    resourcePriority: (parent) =>
      Array.isArray(parent.resourcePriority)
        ? parent.resourcePriority
        : parsePriority(parent.resourcePriority),
  },
  OptimizerExecution: {
    resourcePriority: (parent) =>
      Array.isArray(parent.resourcePriority)
        ? parent.resourcePriority
        : parsePriority(parent.resourcePriority),
  },
};

export const updateOptimizerSettings = async ({ input }) => {
  const { resourcePriority, ...rest } = input;
  const dataToSave = { ...rest };
  if (resourcePriority !== undefined)
    dataToSave.resourcePriority = serializePriority(resourcePriority);

  const settings = await prisma.optimizerSetting.upsert({
    where: { id: 1 },
    update: dataToSave,
    create: {
      id: 1,
      strategy: "balanced",
      campaignWindowDays: 0,
      ...dataToSave,
    },
  });
  return {
    ...settings,
    resourcePriority: parsePriority(settings.resourcePriority),
  };
};
export const runOptimizer = async ({ input }) => {
  // 1. Fetch Global Defaults from DB (to handle cases where UI sends empty)
  const globalSettings = await prisma.optimizerSetting.findFirst();

  // 2. Determine Final Parameters (Input Override > Global Default)
  const scenarioId = input.scenarioId;

  // Window Days: Use Input if > 0, otherwise DB, otherwise 0
  const campaignWindowDays =
    input.campaignWindowDays && input.campaignWindowDays > 0
      ? input.campaignWindowDays
      : globalSettings?.campaignWindowDays || 0;

  // Resource Priority: Use Input if exists/not empty, otherwise DB, otherwise empty
  let finalResourcePriority = [];
  if (input.resourcePriority && input.resourcePriority.length > 0) {
    finalResourcePriority = input.resourcePriority;
  } else if (globalSettings?.resourcePriority) {
    finalResourcePriority = parsePriority(globalSettings.resourcePriority);
  }

  // 3. Fetch Scenario Name (for logging DB record)
  const scenario = await prisma.optimizationScenario.findUnique({
    where: { id: scenarioId },
  });

  // 4. Create DB Execution Record
  const execution = await prisma.optimizerExecution.create({
    data: {
      status: "RUNNING",
      strategy: scenario ? scenario.name : "Unknown",
      campaignWindowDays: campaignWindowDays,
      resourcePriority: finalResourcePriority.join(","), // Store the ACTUAL used priority
      startTime: new Date(),
    },
  });

  console.log(`🚀 Starting Optimizer [Job ID: ${execution.id}]`);

  // 5. Build Command
  const pythonPath =
    "D:\\coding\\lesto\\preactor2.0\\optiplan-optimizer\\venv\\Scripts\\python.exe";
  const scriptPath =
    "D:\\coding\\lesto\\preactor2.0\\optiplan-optimizer\\main.py";

  const args = [scriptPath, "--scenario_id", String(scenarioId)];

  if (campaignWindowDays > 0) {
    args.push("--campaign_window_days", String(campaignWindowDays));
  }

  // ✅ Pass the calculated priority list
  if (finalResourcePriority.length > 0) {
    args.push("--resource_priority", finalResourcePriority.join(","));
  }

  // ✅ Clean Log: Shows exactly what you would type in terminal
  console.log(`Command: ${pythonPath} ${args.join(" ")}`);

  // 6. Execute Synchronously (Wait for finish)
  const executionResult = await new Promise((resolve) => {
    const process = spawn(pythonPath, args);

    let stdoutData = "";
    let stderrData = "";

    process.stdout.on("data", (data) => {
      const str = data.toString();
      stdoutData += str;
      // Optional: Stream output to console so you see progress
      console.log(`[Optimizer]: ${str.trim()}`);
    });

    process.stderr.on("data", (data) => {
      stderrData += data.toString();
    });

    process.on("close", async (code) => {
      const endTime = new Date();
      const duration = (endTime - execution.startTime) / 1000;

      let recordCount = 0;
      const countMatch = stdoutData.match(/PROCESSED_COUNT:\s*(\d+)/);
      if (countMatch) recordCount = parseInt(countMatch[1], 10);

      const status = code === 0 ? "SUCCESS" : "FAILED";
      const errorMessage =
        code === 0 ? undefined : stderrData || "Unknown error";

      console.log(`🏁 Job ${execution.id} finished with code ${code}`);

      await prisma.optimizerExecution.update({
        where: { id: execution.id },
        data: {
          status,
          endTime,
          durationSeconds: duration,
          recordCount,
          errorMessage,
        },
      });

      resolve({
        success: code === 0,
        message:
          code === 0
            ? "Optimization finished successfully."
            : `Failed: ${stderrData}`,
      });
    });
  });

  return executionResult;
};
