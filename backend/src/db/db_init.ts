import pkg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Client } = pkg;
const {DB_HOST, DB_PORT, DB_USER, DB_PASS} = process.env;

const defaultClient = new Client({
  connectionString: process.env.DATABASE_URL_DEFAULT || `postgres://${DB_USER}:${DB_PASS}@${DB_HOST}:${DB_PORT}/postgres`,
});

const appDbName = 'ecommerce_db'; 

async function initDB() {
  try {
    await defaultClient.connect();
    console.log('Connected to default Postgres instance.');

    // Create db if not exists
    const res = await defaultClient.query(`SELECT 1 FROM pg_database WHERE datname = '${appDbName}';`);
    if (res.rowCount === 0) {
      await defaultClient.query(`CREATE DATABASE ${appDbName};`);
      console.log(`Database '${appDbName}' created.`);
    } else {
      console.log(`Database '${appDbName}' already exists.`);
    }

    await defaultClient.end();

    // Connect to db
    const appClient = new Client({
      connectionString: `postgres://${DB_USER}:${DB_PASS}@${DB_HOST}:${DB_PORT}/${appDbName}`,
    });
    await appClient.connect();
    console.log(`Connected to ${appDbName}.`);

    // Create tables in db
    await appClient.query(`
        DROP TABLE IF EXISTS product CASCADE;

        CREATE TABLE product (
            id SERIAL PRIMARY KEY,
            name VARCHAR(50) NOT NULL,
            quantity SMALLINT DEFAULT 0,
            weight DECIMAL(3,2) DEFAULT 0,
            price DECIMAL(12,2) DEFAULT 0,
            description VARCHAR(8000) DEFAULT 'COMING SOON',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    
    `);

    console.log('Tables created or already exist.');

    await appClient.end();
    console.log('Database initialization complete.');
  } catch (err) {
    console.error('Error initializing database:', err);
  }
}

initDB();
