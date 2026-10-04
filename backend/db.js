const { types } = require("pg");
const { Pool } = require("pg");
require("dotenv").config({ quiet: true });

// Return PostgreSQL DATE values as YYYY-MM-DD strings.
// Prevents timezone shifting when dates are sent as JSON.
types.setTypeParser(1082, (val) => val);

const pool = new Pool({
  host: process.env.DB_HOST || "127.0.0.1",
  port: Number(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || "parkease",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "",
});

module.exports = pool;