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
            (category, name, quantity, weight,height, length, width, price, description, featured)
            VALUES
            (1,'placeholder', 10, 13.2, 5, 4, 6 ,8, 'This is a placeholder item', true);
            
            INSERT INTO products
            (category, name, quantity, weight,height, length, width, price, description, featured)
            VALUES
            (2,'placeholder2', 10, 2.4, 11, 8, 2 ,22.99, 'testing this out', false);

            INSERT INTO product_images
            (product_id, url, aws_imagekey, main_image)
            VALUES
            (1, 'https://cdk-hnb659fds-assets-289931925246-us-east-1.s3.us-east-1.amazonaws.com/JuanSotoBaseballWeb.jpg', 'JuanSotoBaseballWeb.jpg', true);
            
            INSERT INTO product_images
            (product_id, url, aws_imagekey, main_image)
            VALUES
            (2, 'https://cdk-hnb659fds-assets-289931925246-us-east-1.s3.us-east-1.amazonaws.com/LindorBaseballWeb.jpg', 'LindorBaseballWeb.jpg', true);
            
            INSERT INTO youtube_videos
            (videoid)
            VALUES
            ('NZ96QcpBdmM');
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