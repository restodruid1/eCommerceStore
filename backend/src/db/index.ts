import pg from 'pg';
import dotenv from "dotenv";
// import { initDB } from './db_init.js';

dotenv.config();
const { Pool } = pg;
 
const pool = new Pool({
  connectionString:  process.env.DB_URL,
  });
// const pool = new Pool({
//   connectionString:  process.env.DB_LOCAL_URL,
//   });

// DO NOT USE POOL IF A TRANSACTION IS NEEDED i.e. A SERIES OF QUERIES WHERE ALL MUST BE SUCCESSFUL OR NONE ARE
// USE THE PG CLIENT FOR TRANSACTIONS. POOL IS MORE EFFICIENT IS OTHER CASES
export const client = await pool.connect();

// await initDB();
try {
  await client.query("SELECT 1"); // test connection
} catch (err) {
  console.log("FAILED TO CONNECT TO DB " + err);
  process.exit();
}
// finally {
//   client.release(); // returns connection to the pool
  
// }

// Pool releases clients internally automatically
export const query = async (text:string, params: any[] = []) => {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  console.log('executed query', { text, duration, rows: res.rowCount });
  return res;
}

// Cleanup expired carts
setInterval(async () => {
  try {
    await client.query("BEGIN");

    // Find the expired carts
    const data = await client.query(`
      SELECT * FROM cart_reservations
      WHERE expires_at < NOW();
    `);
    
    // Add products back to db
    data.rows.forEach(async (product)=>{
      console.log("UPDATE QUERY");
      await client.query(`
        UPDATE products
        SET quantity = quantity + $1
        WHERE id = $2
        `, [product.quantity, product.product_id])
    })
    // console.log(data.rows);
    // Delete expired carts
    await client.query(`
      DELETE FROM cart_reservations
      WHERE expires_at < NOW();
    `);
    await client.query("COMMIT");
    // console.log(data);
  } catch (e) {
    console.error(e);
    await client.query("ROLLBACK");
  }
}, 5000);


export default pool;