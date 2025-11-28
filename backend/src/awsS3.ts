import { Router } from 'express';
import { Request, Response } from "express";
import { stripe } from './server.js';  
import * as db from "./db/index.js";
import { requireAdmin } from './Middleware.js';

import { S3Client } from "@aws-sdk/client-s3";
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
                const { productName, category, price, length, width, height, weight, description } = req.body;

                await db.query("BEGIN");
                const result = await db.query(
                    `
                    INSERT INTO products (category, name, quantity, weight, price, description)
                    VALUES ($1, $2, $3, $4, $5, $6)
                    RETURNING id
                    `,
                    [category, productName, 1, weight, price, description]
                );
                const newProductId = result.rows[0].id;     // ID of new DB entry
                console.log("PRODUCT ID: " + newProductId);
                for (let index = 0; index < files.length; index++) {
                    const imageUrl = results[index];
                    const mainImage = index === 0;      // Main display image is first image only
                    
                    await db.query(
                      `
                      INSERT INTO product_images (product_id, url, main_image)
                      VALUES ($1, $2, $3)
                      `,
                      [newProductId, imageUrl, mainImage]
                    );
                  }
                await db.query("COMMIT");
            } catch (e) {
                await db.query("ROLLBACK");
                return res.json({success: false, error: e instanceof Error ? e.message : "Write to DB unsuccessful"});
            }
        } catch (e) {
            return res.json({success: false, error: e instanceof Error ? e.message : "Issue With AWS"});
        }
        
    } catch (err) {
        console.error(err);
    }
    res.json({message:"hello"});
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

export default router;