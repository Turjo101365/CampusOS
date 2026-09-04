import { app } from "./app.js";
import { database } from "./config/database.js";
import { environment } from "./config/environment.js";
import { notificationScheduler } from "./modules/notifications/notification.scheduler.js";

const server = app.listen(environment.BACKEND_PORT, () => {
  console.info(`CampusOS API listening on http://localhost:${environment.BACKEND_PORT}`);
  notificationScheduler.start();
});

server.on("error", (err: NodeJS.ErrnoException) => {
  if (err.code === "EADDRINUSE") {
    console.warn(`Port ${environment.BACKEND_PORT} is temporarily busy, retrying in 1s...`);
    setTimeout(() => {
      server.close();
      server.listen(environment.BACKEND_PORT);
    }, 1000);
  } else {
    console.error("Server error:", err);
    process.exit(1);
  }
});

async function shutdown(signal: string): Promise<void> {
  console.info(`${signal} received; closing CampusOS API`);
  notificationScheduler.stop();
  server.close(async () => {
    await database.$disconnect();
    process.exit(0);
  });
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
