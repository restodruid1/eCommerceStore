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

router.post('/', upload.array("images"),requireAdmin, async (req,res)=>{
    // console.log(req.body);
    console.log("AWS");
    console.log(req.files);
    // console.log(req.file!.buffer);
   
    try {
        const s3Client = new S3Client(
            { 
                region: process.env.AWS_REGION!,
                credentials: {
                    accessKeyId: process.env.AWS_KEY!,
                    secretAccessKey:process.env.AWS_SECRETKEY!,
                } 
            });
        const input = {
            Bucket: process.env.AWS_BUCKET,
            Key:"restAPI.png"
        };
        
        const command = new GetObjectCommand(input);
        const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
        
        return res.status(200).json({message:signedUrl});
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