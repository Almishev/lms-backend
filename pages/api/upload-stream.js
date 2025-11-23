import {S3Client, PutObjectCommand} from '@aws-sdk/client-s3';
import {mongooseConnect} from "@/lib/mongoose";
import {isAdminRequest} from "@/pages/api/auth/[...nextauth]";

const bucketName = process.env.S3_BUCKET_NAME;

export default async function handle(req, res) {
  await mongooseConnect();
  await isAdminRequest(req, res);

  if (req.method !== 'POST') {
    return res.status(405).json({message: 'Method not allowed'});
  }

  try {
    const client = new S3Client({
      region: process.env.S3_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
      },
    });

    // Четем файла като stream от request body
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const fileBuffer = Buffer.concat(chunks);

    // Взимаме metadata от headers
    const fileName = req.headers['x-file-name'] || 'video.mp4';
    const fileType = req.headers['content-type'] || 'video/mp4';
    
    // Генерираме уникално име
    const ext = fileName.split('.').pop();
    const newFilename = `videos/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;

    // Качваме в S3
    await client.send(new PutObjectCommand({
      Bucket: bucketName,
      Key: newFilename,
      Body: fileBuffer,
      ContentType: fileType,
    }));

    const fileUrl = `https://${bucketName}.s3.amazonaws.com/${newFilename}`;

    res.json({
      link: fileUrl,
      key: newFilename,
    });
  } catch (error) {
    console.error('Error in stream upload:', error);
    res.status(500).json({
      message: 'Грешка при качване на файла',
      error: error.message,
    });
  }
}

export const config = {
  api: {
    bodyParser: false, // Изключваме bodyParser за streaming
  },
};

