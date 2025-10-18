import pkg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Client } = pkg;
const {DB_HOST, DB_PORT, DB_USER, DB_PASS, DB_NAME} = process.env;

const appClient = new Client({
  connectionString: process.env.DATABASE_URL_DEFAULT || `postgres://${DB_USER}:${DB_PASS}@${DB_HOST}:${DB_PORT}/${DB_NAME}`,
});


async function seedDB() {
    try {
        await appClient.connect();
      
        console.log(`Connected to '${DB_NAME}'.`);
        const queryResult = await appClient.query(`
            INSERT INTO products
            (name, quantity, weight, price, description)
            VALUES
            ('placeholder', 1, 13.2, 101.27, 'This is a placeholder item')
            `);
        console.log(queryResult);
        console.log('Database seeding complete.');
        await appClient.end();
  
    } catch (err) {
        console.log(`Failed to connect to '${DB_NAME}'.`);
        console.error('Error initializing database:', err);
    }
  }
  
  seedDB();