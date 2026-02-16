import { config } from "./config.js";
import { pool } from "./db/pool.js";
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

  app.listen(config.PORT, () => {
    console.log(`Server running on http://localhost:${config.PORT}`);
  });
}

start();
