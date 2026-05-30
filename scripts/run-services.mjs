import { spawn } from "node:child_process";

const childProcesses = [
  spawn("node", [".next/standalone/server.js"], {
    stdio: "inherit",
    env: process.env,
  }),
  spawn("node", ["realtime/server.mjs"], {
    stdio: "inherit",
    env: process.env,
  }),
];

let shuttingDown = false;

for (const childProcess of childProcesses) {
  childProcess.on("exit", (code, signal) => {
    if (shuttingDown) {
      return;
    }

    shuttingDown = true;

    for (const processToKill of childProcesses) {
      if (processToKill.pid && !processToKill.killed) {
        processToKill.kill("SIGTERM");
      }
    }

    if (signal) {
      process.kill(process.pid, signal);
      return;
    }

    process.exit(code ?? 0);
  });
}

for (const eventName of ["SIGINT", "SIGTERM"]) {
  process.on(eventName, () => {
    if (shuttingDown) {
      return;
    }

    shuttingDown = true;

    for (const childProcess of childProcesses) {
      if (childProcess.pid && !childProcess.killed) {
        childProcess.kill("SIGTERM");
      }
    }
  });
}
