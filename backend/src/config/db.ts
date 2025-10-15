import pg from 'pg';
import dotenv from "dotenv";

dotenv.config();
const { Pool } = pg;
 
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASS,
    port: Number(process.env.DB_PORT) || 5432,
  });

// DO NOT USE POOL IF A TRANSACTION IS NEEDED i.e. A SERIES OF QUERIES WHERE ALL MUST BE SUCCESSFUL OR NONE ARE
// USE THE PG CLIENT FOR TRANSACTIONS. POOL IS MORE EFFICIENT IS OTHER CASES
const client = await pool.connect();
try {
  await client.query("SELECT 1"); // test connection
} catch (err) {
  console.log("FAILED TO CONNECT TO DB " + err);
  process.exit();
}finally {
  client.release(); // returns connection to the pool
  
}
export default pool;