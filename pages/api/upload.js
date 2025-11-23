import multiparty from 'multiparty';
import {PutObjectCommand, S3Client} from '@aws-sdk/client-s3';
import fs from 'fs';
import mime from 'mime-types';
import {mongooseConnect} from "@/lib/mongoose";
import {isAdminRequest} from "@/pages/api/auth/[...nextauth]";
const bucketName = process.env.S3_BUCKET_NAME;

export default async function handle(req,res) {
  await mongooseConnect();
  await isAdminRequest(req,res);

  // Конфигурираме multiparty
  // Забележка: Vercel ограничава request body до 4.5MB
  const form = new multiparty.Form({
    maxFilesSize: 4 * 1024 * 1024, // 4MB (под Vercel лимита)
    maxFieldsSize: 1 * 1024 * 1024, // 1MB
  });
  
  const {fields,files} = await new Promise((resolve,reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) {
        console.error('Multiparty parse error:', err);
        if (err.message && err.message.includes('maxFilesSize')) {
          return res.status(413).json({message: 'Файлът е твърде голям. Максималният размер е 4MB.'});
        }
        return res.status(400).json({message: 'Грешка при обработка на файла', error: err.message});
      }
      resolve({fields,files});
    });
  });
  console.log('length:', files.file.length);
  const client = new S3Client({
    region: process.env.S3_REGION || 'us-east-1',
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
    },
  });
  const links = [];
  for (const file of files.file) {
    const ext = file.originalFilename.split('.').pop();
    const newFilename = Date.now() + '.' + ext;
    await client.send(new PutObjectCommand({
      Bucket: bucketName,
      Key: newFilename,
      Body: fs.readFileSync(file.path),
      ContentType: mime.lookup(file.path),
    }));
    const link = `https://${bucketName}.s3.amazonaws.com/${newFilename}`;
    links.push(link);
  }
  return res.json({links});
}

export const config = {
  api: {bodyParser: false},
};