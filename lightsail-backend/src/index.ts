import pino from "pino";

import { createApp } from "./app.js";
import { getServerRuntimeConfig } from "./server/env.js";

const runtimeConfig = getServerRuntimeConfig();
const logger = pino({
  name: "lightsail-backend",
});

const app = createApp();

app.listen(runtimeConfig.port, () => {
  logger.info(
    {
      port: runtimeConfig.port,
      serverBaseUrl: runtimeConfig.serverBaseUrl,
    },
    "lightsail-backend server started",
  );
});
