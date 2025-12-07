import { S3Client } from "@aws-sdk/client-s3";
import { PutObjectCommand, GetObjectCommand, CreateBucketCommand, HeadBucketCommand, PutBucketPolicyCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Check if AWS credentials are configured
const hasAwsCredentials = process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY;

// AWS S3 Configuration (only initialize if credentials exist)
const s3Client = hasAwsCredentials ? new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
}) : null;

const BUCKET_NAME = process.env.AWS_S3_BUCKET || `fitconnect-images-${Date.now()}`;

export interface ImageUploadResult {
  key: string;
  url: string;
  publicUrl: string;
}

export class AWSImageService {
  static async ensureBucketExists(): Promise<void> {
    if (!hasAwsCredentials) {
      // Ensure local uploads directory exists
      const uploadsDir = path.join(process.cwd(), "public", "uploads");
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
        console.log(`Created local uploads directory: ${uploadsDir}`);
      }
      return;
    }

    try {
      // Check if bucket exists
      await s3Client!.send(new HeadBucketCommand({ Bucket: BUCKET_NAME }));
    } catch (error: any) {
      if (error.name === 'NotFound' || error.Code === 'NoSuchBucket') {
        // Create bucket if it doesn't exist
        const createParams: any = { Bucket: BUCKET_NAME };
        
        // For regions other than us-east-1, specify the LocationConstraint
        if (process.env.AWS_REGION !== 'us-east-1') {
          createParams.CreateBucketConfiguration = {
            LocationConstraint: process.env.AWS_REGION
          };
        }
        
        await s3Client!.send(new CreateBucketCommand(createParams));
        console.log(`Created S3 bucket: ${BUCKET_NAME} in region: ${process.env.AWS_REGION}`);
        
        // Set bucket policy to allow public read access
        await this.setPublicReadPolicy();
      }
    }
  }

  static async setPublicReadPolicy(): Promise<void> {
    if (!s3Client) {
      console.error('S3 client not initialized');
      return;
    }

    const policy = {
      Version: "2012-10-17",
      Statement: [
        {
          Sid: "PublicReadGetObject",
          Effect: "Allow",
          Principal: "*",
          Action: "s3:GetObject",
          Resource: `arn:aws:s3:::${BUCKET_NAME}/*`
        }
      ]
    };

    try {
      await s3Client.send(new PutBucketPolicyCommand({
        Bucket: BUCKET_NAME,
        Policy: JSON.stringify(policy)
      }));
      console.log(`Set public read policy on bucket: ${BUCKET_NAME}`);
    } catch (error) {
      console.error('Failed to set bucket policy:', error);
    }
  }

  private static async saveLocally(
    buffer: Buffer,
    fileName: string
  ): Promise<ImageUploadResult> {
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    const localFileName = `${Date.now()}-${fileName.replace(/[^a-zA-Z0-9.-]/g, '')}`;
    const filePath = path.join(uploadsDir, localFileName);
    
    fs.writeFileSync(filePath, buffer);
    console.log(`📁 Saved file locally: ${filePath}`);
    
    const publicUrl = `/uploads/${localFileName}`;
    return {
      key: localFileName,
      url: publicUrl,
      publicUrl,
    };
  }

  static async uploadImage(
    buffer: Buffer,
    fileName: string,
    contentType: string
  ): Promise<ImageUploadResult> {
    await this.ensureBucketExists();
    
    const key = `images/${Date.now()}-${fileName.replace(/[^a-zA-Z0-9.-]/g, '')}`;
    
    if (!hasAwsCredentials) {
      // Local file upload when no credentials
      return this.saveLocally(buffer, fileName);
    }

    // Try S3, fall back to local if it fails
    try {
      const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        // ACL removed - using bucket policy for public access instead
      });

      await s3Client!.send(command);

      const publicUrl = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
      
      return {
        key,
        url: publicUrl,
        publicUrl,
      };
    } catch (error: any) {
      console.warn(`⚠️ S3 upload failed (${error.Code || error.message}), falling back to local storage`);
      return this.saveLocally(buffer, fileName);
    }
  }

  static async getSignedUrl(key: string): Promise<string> {
    if (!hasAwsCredentials) {
      return `/uploads/${key}`;
    }

    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    return await getSignedUrl(s3Client!, command, { expiresIn: 3600 });
  }

  static async deleteImage(key: string): Promise<void> {
    if (!hasAwsCredentials) {
      const filePath = path.join(process.cwd(), "public", "uploads", key);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      return;
    }

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    await s3Client!.send(command);
  }
}