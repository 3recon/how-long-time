import assert from "node:assert/strict";

import { createApp } from "../src/app.js";

async function main() {
  const app = createApp({
    now: () => new Date("2026-04-10T09:00:00.000Z"),
  });

  const server = app.listen(0);

  try {
    await new Promise<void>((resolve) => server.once("listening", resolve));

    const address = server.address();

    if (!address || typeof address === "string") {
      throw new Error("Failed to resolve test server port.");
    }

    const response = await fetch(`http://127.0.0.1:${address.port}/health`);

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), {
      ok: true,
      service: "lightsail-backend",
      timestamp: "2026-04-10T09:00:00.000Z",
    });
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    });
  }

  console.log("health spec passed");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
