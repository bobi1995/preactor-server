import { exec } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

// Ако ползваш ES Modules, трябва да си вземеш __dirname така:
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const runScheduler = async () => {
  return new Promise((resolve, reject) => {
    // 1. КОНФИГУРАЦИЯ НА ПЪТИЩАТА
    // Трябва да посочим пълния път до папката на Python проекта.
    // Приемаме, че папките 'prector-server' и 'optiplan-optimizer' са една до друга.
    // __dirname е вътре в app/graphql/resolvers/mutation, затова излизаме няколко нива нагоре.

    const projectRoot = path.resolve(__dirname, "../../../../../");
    const pythonScriptDir = path.join(projectRoot, "optiplan-optimizer");
    const scriptName = "production_scheduler.py";

    // 2. КОМАНДАТА
    // Използваме 'python' или 'python3' или пълен път до venv python exe
    const venvPythonPath = path.join(
      pythonScriptDir,
      "venv",
      "Scripts",
      "python.exe"
    );
    const command = `"${venvPythonPath}" "${scriptName}"`;

    console.log(`🚀 Starting Scheduler...`);
    console.log(`🐍 Using Python: ${venvPythonPath}`);
    console.log(`📂 Working Directory: ${pythonScriptDir}`);

    // 3. ИЗПЪЛНЕНИЕ
    exec(
      command,
      {
        cwd: pythonScriptDir, // ВАЖНО: Казваме на Node да изпълни скрипта ВЪТРЕ в папката на Python, за да работят импортите му
        maxBuffer: 1024 * 1024 * 5, // Увеличаваме буфера за логове (5MB), ако скриптът принтира много
        env: { ...process.env, PYTHONIOENCODING: "utf-8" },
      },
      (error, stdout, stderr) => {
        if (error) {
          console.error(`❌ Scheduler Error: ${error.message}`);
          return resolve({
            success: false,
            message: "Scheduler failed execution",
            output: stderr || error.message,
          });
        }

        if (stderr) {
          console.warn(`⚠️ Scheduler Stderr: ${stderr}`);
          // Python понякога пише warnings в stderr, но скриптът е успешен.
          // Не винаги връщаме success: false тук, зависи от логиката.
        }

        console.log(`✅ Scheduler finished.`);

        return resolve({
          success: true,
          message: "Schedule optimized successfully",
          output: stdout, // Връщаме целия лог на клиента, за да го покажеш в някой modal/log прозорец
        });
      }
    );
  });
};
