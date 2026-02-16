import { config } from "./config.js";
import { pool } from "./db/pool.js";
import { runMigrations } from "./db/migrate.js";
import { app } from "./app.js";

async function start() {
  // Verify DB connection
  try {
    await pool.query("SELECT 1");
    console.log("Database connected");
  } catch (err) {
    console.error("Failed to connect to database:", err);
    process.exit(1);
  }

  // Auto-run migrations
  await runMigrations();

  app.listen(config.PORT, "0.0.0.0", () => {
    console.log(`Server running on 0.0.0.0:${config.PORT}`);
  });
}

process.on("uncaughtException", (err) => {
  console.error("Uncaught exception:", err);
});
process.on("unhandledRejection", (err) => {
  console.error("Unhandled rejection:", err);
});

start();
