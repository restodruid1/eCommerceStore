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

// Pool releases clients internally automatically
export const query = async (text:string, params:[]) => {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  console.log('executed query', { text, duration, rows: res.rowCount });
  return res;
}

export default pool;