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

// ... Queries and TypeResolvers (unchanged) ...
export const getOptimizerSettings = async () => {
  const settings = await prisma.optimizerSetting.findFirst();
  if (!settings)
    return {
      id: 0,
      strategy: "balanced",
      campaignWindowDays: 0,
      gravity: true,
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
      gravity: true,
      ...dataToSave,
    },
  });
  return {
    ...settings,
    resourcePriority: parsePriority(settings.resourcePriority),
  };
};

// --- MAIN RUN MUTATION (SYNCHRONOUS) ---
export const runOptimizer = async ({ input }) => {
  const { scenarioId, campaignWindowDays, gravity, resourcePriority } = input;

  // 1. Fetch Scenario Name
  const scenario = await prisma.optimizationScenario.findUnique({
    where: { id: scenarioId },
  });

  // 2. Log DB Record (RUNNING)
  const execution = await prisma.optimizerExecution.create({
    data: {
      status: "RUNNING",
      strategy: scenario ? scenario.name : "Unknown",
      campaignWindowDays: campaignWindowDays || 0,
      gravity: !!gravity,
      resourcePriority: resourcePriority ? resourcePriority.join(",") : "",
      startTime: new Date(),
    },
  });

  // 3. Build Command
  const pythonPath =
    "D:\\coding\\lesto\\preactor2.0\\optiplan-optimizer\\venv\\Scripts\\python.exe";
  const scriptPath =
    "D:\\coding\\lesto\\preactor2.0\\optiplan-optimizer\\main.py";

  const args = [scriptPath, "--scenario_id", String(scenarioId)];
  if (campaignWindowDays && campaignWindowDays > 0)
    args.push("--campaign_window_days", String(campaignWindowDays));
  if (gravity === true) args.push("--gravity");
  else if (gravity === false) args.push("--no-gravity");
  if (resourcePriority && resourcePriority.length > 0)
    args.push("--resource_priority", resourcePriority.join(","));

  console.log(
    `🚀 [Optimizer] Executing (WAITING): "${pythonPath}" ${args.join(" ")}`
  );

  // 4. Wrap Spawn in Promise to WAIT
  const executionResult = await new Promise((resolve) => {
    const process = spawn(pythonPath, args);

    let stdoutData = "";
    let stderrData = "";

    process.stdout.on("data", (data) => {
      stdoutData += data.toString();
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

      console.log(
        `🏁 [Optimizer] Job ${execution.id} finished (Code: ${code})`
      );

      const status = code === 0 ? "SUCCESS" : "FAILED";
      const errorMessage =
        code === 0 ? undefined : stderrData || "Unknown error";

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

      // Resolve the promise so the mutation can finally return
      resolve({
        success: code === 0,
        message:
          code === 0
            ? "Optimization finished successfully."
            : `Failed: ${stderrData}`,
      });
    });
  });

  // 5. Return AFTER the script is done
  return executionResult;
};
