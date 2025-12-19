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
        DROP TABLE IF EXISTS products CASCADE;
        DROP TABLE IF EXISTS product_images CASCADE;
        DROP TABLE IF EXISTS orders CASCADE;
        DROP TABLE IF EXISTS order_items CASCADE;
        DROP TABLE IF EXISTS cart_reservations CASCADE;
        DROP TABLE IF EXISTS youtube_videos CASCADE;
        
        CREATE TABLE products (
            id SERIAL PRIMARY KEY,
            category SMALLINT NOT NULL,
            name VARCHAR(50) NOT NULL,
            quantity SMALLINT DEFAULT 0,
            weight DECIMAL(5,2) DEFAULT 0,
            height DECIMAL(5,2) DEFAULT 0,
            length DECIMAL(5,2) DEFAULT 0,
            width DECIMAL(5,2) DEFAULT 0,
            price DECIMAL(12,2) DEFAULT 0,
            description VARCHAR(8000) DEFAULT 'COMING SOON',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE product_images (
            id SERIAL PRIMARY KEY,
            product_id INT,
            url VARCHAR(1000),
            aws_imagekey VARCHAR(100),
            main_image BOOLEAN DEFAULT FALSE,
            FOREIGN KEY (product_id) REFERENCES products(id)
        );
        
        CREATE TABLE orders (
            id SERIAL PRIMARY KEY,
            total_price DECIMAL(12,2) NOT NULL,
            order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            shipping_address VARCHAR(100) NOT NULL,
            status VARCHAR(30) DEFAULT 'PENDING',
            total_weight Decimal(5,2) NOT NULL
        );

        CREATE TABLE order_items (
            id SERIAL PRIMARY KEY,
            product_id INT,
            order_id INT,
            quantity SMALLINT DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (product_id) REFERENCES products(id),
            FOREIGN KEY (order_id) REFERENCES orders(id)
        );

        CREATE TABLE cart_reservations (
          reservation_id SERIAL PRIMARY KEY,
          user_id UUID NOT NULL,
          product_id INT NOT NULL,
          quantity INT NOT NULL,
          expires_at TIMESTAMP NOT NULL
        );
        
        CREATE TABLE youtube_videos (
          id SERIAL PRIMARY KEY, 
          videoid varchar(50) NOT NULL
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
