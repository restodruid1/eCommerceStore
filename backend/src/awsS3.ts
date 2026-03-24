import { Router } from 'express';
import { Request, Response } from "express";
import * as db from "./db/index.js";
import { requireAdmin } from './Middleware.js';
import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { upload } from './Middleware.js';


const router = Router();

const s3Client = new S3Client({
    region: process.env.AWS_REGION!,
    credentials: {
        accessKeyId: process.env.AWS_KEY!,
        secretAccessKey: process.env.AWS_SECRETKEY!,
    }
});

type Product = {
    id: number;
    name: string;
    category: number;
    price: number;
    quantity: number;
    weight: number;
    length: number;
    height: number;
    width: number;
    description: string;
    urls: {imageId?: number, url: string}[];
    featured: boolean;
};

// --- Helpers ---

async function checkProductNameUnique(productName: string) {
    const result = await db.query(
        `SELECT * FROM products WHERE LOWER(name) = LOWER($1);`,
        [productName]
    );
    if (result.rowCount === null) throw new Error("Unexpected null rowCount on product name check");
    if (result.rowCount > 0) throw new Error("Product name already exists");
}

async function checkImageKeysUnique(files: Express.Multer.File[]) {
    const fileNames = files.map(f => f.originalname);
    const result = await db.query(
        `SELECT aws_imagekey FROM product_images WHERE aws_imagekey = ANY($1)`,
        [fileNames]
    );
    if (result.rowCount === null) throw new Error("Unexpected null rowCount on image key check");
    if (result.rowCount > 0) {
        const existingFiles = result.rows.map(r => r.aws_imagekey);
        throw new Error(`image(s) already exist: ${existingFiles.join(', ')}`);
    }
}

async function uploadToS3(files: Express.Multer.File[]): Promise<string[]> {
    return Promise.all(
        files.map(async (file) => {
            await s3Client.send(
                new PutObjectCommand({
                    Bucket: process.env.AWS_BUCKET,
                    Key: file.originalname,
                    Body: file.buffer,
                    ContentType: file.mimetype,
                })
            );
            return `https://${process.env.AWS_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${file.originalname}`;
        })
    );
}

async function saveProductToDB(body: Record<string, string>, files: Express.Multer.File[], urls: string[]) {
    const { productName, category, quantity, price, length, width, height, weight, description } = body;
    try {
        await db.query("BEGIN");
        const result = await db.query(
            `INSERT INTO products (category, name, quantity, weight, height, length, width, price, description)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             RETURNING id`,
            [category, productName, quantity, weight, height, length, width, price, description]
        );
        const newProductId = result.rows[0].id;

        for (let index = 0; index < files.length; index++) {
            await db.query(
                `INSERT INTO product_images (product_id, url, aws_imagekey, main_image)
                 VALUES ($1, $2, $3, $4)`,
                [newProductId, urls[index], files[index]!.originalname, index === 0]
            );
        }
        await db.query("COMMIT");
    } catch (e) {
        await db.query("ROLLBACK");
        throw e;
    }
}

async function addImageToDB(productId: number, url: string, awsKey: string) {
    await db.query(
        `INSERT INTO product_images (product_id, url, aws_imagekey, main_image)
         VALUES ($1, $2, $3, false)`,
        [productId, url, awsKey]
    );
}

async function setMainImageInDB(imageId: number, productId: number) {
    try {
        await db.query("BEGIN");
        await db.query(
            `UPDATE product_images SET main_image = false WHERE product_id = $1`,
            [productId]
        );
        await db.query(
            `UPDATE product_images SET main_image = true WHERE id = $1`,
            [imageId]
        );
        await db.query("COMMIT");
    } catch (e) {
        await db.query("ROLLBACK");
        throw e;
    }
}

async function deleteImageFromDB(imageId: number): Promise<string> {
    const result = await db.query(
        `DELETE FROM product_images WHERE id = $1 RETURNING aws_imagekey;`,
        [imageId]
    );
    if ((result.rowCount ?? 0) === 0) throw new Error("Image not found");
    return result.rows[0].aws_imagekey;
}

async function deleteProductFromDB(itemId: number): Promise<string[]> {
    try {
        await db.query("BEGIN");
        const result = await db.query(
            `DELETE FROM product_images WHERE product_id = $1 RETURNING aws_imagekey;`,
            [itemId]
        );
        await db.query(`DELETE FROM products WHERE id = $1;`, [itemId]);
        await db.query("COMMIT");
        return result.rows.map((r: {aws_imagekey: string}) => r.aws_imagekey);
    } catch (e) {
        await db.query("ROLLBACK");
        throw e;
    }
}

async function deleteFromS3(imageKeys: string[]) {
    await Promise.all(
        imageKeys.map((key) =>
            s3Client.send(new DeleteObjectCommand({ Bucket: process.env.AWS_BUCKET, Key: key }))
        )
    );
}

async function updateProductInDB(productData: Product) {
    try {
        await db.query("BEGIN");
        
        const nameCheck = await db.query(
            `SELECT * FROM products WHERE LOWER(name) = LOWER($1);`,
            [productData.name]
        );
        if (nameCheck.rowCount === null) throw new Error("Unexpected null rowCount on product name check");
        if (nameCheck.rowCount > 0) throw new Error("Product name already exists");
        
        const results = await db.query(
            `SELECT name, category, price, quantity, weight, length, height, width, description, featured
             FROM products WHERE id = $1;`,
            [productData.id]
        );
        const current = results.rows[0] as Omit<Product, 'id' | 'urls'>;
        
        if (current === null) throw new Error("Something went wrong");

        for (const field of ['category', 'name', 'price', 'quantity', 'weight', 'length', 'height', 'width', 'description', 'featured'] as const) {
            if (current[field] !== productData[field]) {
                await db.query(
                    `UPDATE products SET ${field} = $1 WHERE id = $2;`,
                    [productData[field], productData.id]
                );
            }
        }

        await db.query("COMMIT");
    } catch (e) {
        await db.query("ROLLBACK");
        throw e;
    }
}

// --- Routes ---

router.post('/', upload.array("images"), requireAdmin, async (req, res) => {
    const files = req.files as Express.Multer.File[];
    try {
        await checkProductNameUnique(req.body.productName);
        await checkImageKeysUnique(files);
        const urls = await uploadToS3(files);
        await saveProductToDB(req.body, files, urls);
        return res.json({ success: true });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, error: err instanceof Error ? err.message : "Something went wrong" });
    }
});

router.post('/productData', requireAdmin, async (_req, res) => {
    try {
        const result = await db.query(
            `SELECT
                p.*,
                COALESCE(
                    JSONB_AGG(
                        JSONB_BUILD_OBJECT('imageId', pi.id, 'url', pi.url, 'main_image', pi.main_image)
                    ORDER BY pi.id
                    ) FILTER (WHERE pi.id IS NOT NULL),
                    '[]'
                ) AS urls
            FROM products p
            LEFT JOIN product_images pi ON pi.product_id = p.id
            GROUP BY p.id, p.name, p.price
            ORDER BY p.id;`
        );
        return res.status(200).json({ result: result.rows });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, error: err instanceof Error ? err.message : "Something went wrong" });
    }
});

router.post('/deleteProductData', requireAdmin, async (req: Request<{}, {}, {itemId: number}>, res: Response) => {
    const { itemId } = req.body;
    try {
        const imageKeys = await deleteProductFromDB(itemId);
        await deleteFromS3(imageKeys);
        return res.status(200).json({ success: true });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, error: err instanceof Error ? err.message : "Something went wrong" });
    }
});

router.post('/updateProductData', requireAdmin, async (req: Request<{}, {}, {jwt: string, product: Product}>, res: Response) => {
    try {
        await updateProductInDB(req.body.product);
        return res.status(200).json({ success: true });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, error: err instanceof Error ? err.message : "Something went wrong" });
    }
});

router.post('/addProductImage', upload.single("image"), requireAdmin, async (req, res) => {
    const file = req.file as Express.Multer.File;
    const productId = Number(req.body.productId);
    try {
        await checkImageKeysUnique([file]);
        const urls = await uploadToS3([file]);
        if (!urls[0]) throw new Error("Failed to get URL from S3 upload");
        await addImageToDB(productId, urls[0], file.originalname);
        return res.json({ success: true });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, error: err instanceof Error ? err.message : "Something went wrong" });
    }
});

router.post('/deleteProductImage', requireAdmin, async (req: Request<{}, {}, {imageId: number}>, res: Response) => {
    const { imageId } = req.body;
    try {
        const awsKey = await deleteImageFromDB(imageId);
        await deleteFromS3([awsKey]);
        return res.status(200).json({ success: true });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, error: err instanceof Error ? err.message : "Something went wrong" });
    }
});

router.post('/setMainImage', requireAdmin, async (req: Request<{}, {}, {imageId: number, productId: number}>, res: Response) => {
    const { imageId, productId } = req.body;
    try {
        await setMainImageInDB(imageId, productId);
        return res.status(200).json({ success: true });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, error: err instanceof Error ? err.message : "Something went wrong" });
    }
});

router.get('/YouTubeVideoId', requireAdmin, async (req, res) => {
    try {
        const result = await db.query(`SELECT * FROM youtube_videos;`);
        if (result.rowCount && result.rowCount > 0) {
            return res.status(200).json({ result: result.rows[0] });
        }
        return res.status(404).json({ error: "No videos found" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Internal server error" });
    }
});

router.post('/UpdateYouTubeVideoId', requireAdmin, async (req: Request<{}, {}, {videoid: string}>, res: Response) => {
    const { videoid } = req.body;
    try {
        await db.query(`UPDATE youtube_videos SET videoid = $1`, [videoid]);
        return res.status(200).json({ message: "YouTube video ID updated successfully" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Internal server error" });
    }
});

export default router;
