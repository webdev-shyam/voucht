const { spawn } = require("child_process");
const path = require("path");

const nextBin = path.join(__dirname, "node_modules", ".bin", "next");

const child = spawn(nextBin, ["dev", "-p", "3000", "-H", "0.0.0.0"], {
  stdio: "inherit",
  env: process.env,
});

child.on("exit", (code) => {
  process.exit(code || 0);
});

process.on("SIGINT", () => {
  child.kill("SIGINT");
});

process.on("SIGTERM", () => {
  child.kill("SIGTERM");
});
