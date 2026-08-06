const { spawnSync } = require("node:child_process");
const path = require("node:path");

const isWindows = process.platform === "win32";
const scriptName = isWindows ? "setup-dev.ps1" : "setup-dev.sh";
const scriptPath = path.join(__dirname, "..", scriptName);

const command = isWindows ? "powershell" : "bash";
const args = isWindows
  ? ["-ExecutionPolicy", "Bypass", "-File", scriptPath]
  : [scriptPath];

const result = spawnSync(command, args, { stdio: "inherit" });
process.exit(result.status ?? 1);
