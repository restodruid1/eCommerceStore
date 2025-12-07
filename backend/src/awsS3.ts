import { Router } from 'express';
import { Request, Response } from "express";
import { stripe } from './server.js';  
import * as db from "./db/index.js";
import { requireAdmin } from './Middleware.js';

import { DeleteObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { readFileSync, readdirSync } from "fs";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { upload } from './Middleware.js';


const router = Router();

router.post('/', upload.array("images"), requireAdmin, async (req,res)=>{
    console.log("AWS");
    console.log(req.body);
    console.log(req.files);
    // console.log(req.file!.buffer);
    
    const files = req.files as Express.Multer.File[];

    try {

        try {
            const result = await db.query(
                `
                SELECT * FROM products WHERE LOWER(name) = LOWER($1);
                `, [req.body.productName]
            );
            if (result.rowCount! > 0) {
                return res.status(500).json({success: false, error: "Product name already exists"})
            }
        } 
        catch (err) {
            return res.json({success: false, error: err instanceof Error ? err.message : "Product name already exists"});
        }

        try {
            for (const file of files) {
                const result = await db.query(
                  `
                  SELECT * FROM product_images WHERE aws_imagekey = $1;
                  `,
                  [file.originalname]
                );
                if (result.rowCount! > 0) {
                    return res.status(500).json({success: false, error: `image ${file.originalname} already exists`})
                }
            }
        } 
        catch (err) {
            return res.json({success: false, error: err instanceof Error ? err.message : "Failed to query database aws_imagekeys"});
        }

        const s3Client = new S3Client(
            { 
                region: process.env.AWS_REGION!,
                credentials: {
                    accessKeyId: process.env.AWS_KEY!,
                    secretAccessKey:process.env.AWS_SECRETKEY!,
                } 
            });
        
        try {
            // Upload product images to AWS S3
            const results = await Promise.all(
                files.map(async (file) => {
                    await s3Client.send(
                        new PutObjectCommand({
                            Bucket: process.env.AWS_BUCKET,
                            Key: file.originalname,
                            Body: file.buffer,
                            ContentType: file.mimetype,
                        })
                    );
                    
            
                    // Return the S3 URL for this file
                    return `https://${process.env.AWS_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${file.originalname}`;
                }));
            
            // console.log("UPLOAD SUCCESSFUL?: ", results);
            if (!results) return {success: false, error: "Failed to upload to AWS"};


            // Create entry in products and product_images tables
            try{
                const { productName, category, quantity, price, length, width, height, weight, description } = req.body;

                await db.query("BEGIN");
                const result = await db.query(
                    `
                    INSERT INTO products (category, name, quantity, weight, price, description)
                    VALUES ($1, $2, $3, $4, $5, $6)
                    RETURNING id
                    `,
                    [category, productName, quantity, weight, price, description]
                );
                const newProductId = result.rows[0].id;     // ID of new DB entry
                console.log("PRODUCT ID: " + newProductId);
                for (let index = 0; index < files.length; index++) {
                    const imageUrl = results[index];
                    const mainImage = index === 0;      // Main display image is first image only
                    
                    await db.query(
                      `
                      INSERT INTO product_images (product_id, url, aws_imagekey, main_image)
                      VALUES ($1, $2, $3, $4)
                      `,
                      [newProductId, imageUrl, files[index]!.originalname, mainImage]
                    );
                  }
                await db.query("COMMIT");
            } 
            catch (e) {
                await db.query("ROLLBACK");
                return res.json({success: false, error: e instanceof Error ? e.message : "Write to DB unsuccessful"});
            }
        } 
        catch (e) {
            return res.json({success: false, error: e instanceof Error ? e.message : "Issue With AWS"});
        }
        
    } 
    catch (err) {
        console.error(err);
    }
    res.json({success: true, message:"hello"});
})

router.post('/productData', requireAdmin, async (req,res)=>{
    try{
        const result = await db.query(
                  `SELECT 
                      p.*, 
                      pi.url
                  FROM products p
                  JOIN product_images pi 
                      ON pi.product_id = p.id
                  ;`
                  ,[]);
        console.log(result);
        return res.status(200).json({result: result.rows})
    } catch (err) {
        console.error(err);
    }
    res.json({message:"hello"});
})

router.post('/deleteProductData', requireAdmin, async (req: Request<{}, {}, {itemId:number, itemCategory:number}>,res:Response)=>{
    const { itemId, itemCategory } = req.body;
    console.log(itemId ,"", itemCategory);
    try{
        var results;
        try{
            await db.query("BEGIN");
            results = await db.query(
                        `DELETE FROM product_images
                        WHERE product_id = $1
                        RETURNING aws_imagekey
                        ;`
                    ,[itemId]);
            await db.query(
                        `DELETE FROM products
                        WHERE id = $1
                        ;`
                    ,[itemId]);
            await db.query("COMMIT");
        } catch (e) {
            await db.query("ROLLBACK");
            return res.json({success: false, error: e instanceof Error ? e.message : "Delete from DB unsuccessful"});
        }
        try {
            const s3Client = new S3Client(
                { 
                    region: process.env.AWS_REGION!,
                    credentials: {
                        accessKeyId: process.env.AWS_KEY!,
                        secretAccessKey:process.env.AWS_SECRETKEY!,
                    } 
                });

            // console.log(results.rows) 
            const awsImageKeys = results.rows as {aws_imagekey:string}[];
            await Promise.all(
                awsImageKeys.map(async (imageKey) => {
                    // console.log(imageKey);
                    await s3Client.send(
                        new DeleteObjectCommand({
                            Bucket: process.env.AWS_BUCKET,
                            Key: imageKey.aws_imagekey,
                        })
                    );}))
        } catch (e) {
            return res.json({success: false, error: e instanceof Error ? e.message : "Delete from AWS unsuccessful"});
        }
        return res.status(200).json({success:true});
    } catch (e) {
        return res.json({success: false, error: e instanceof Error ? e.message : "Something wrong with server"});
    }
})

export default router;