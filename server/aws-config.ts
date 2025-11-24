import { S3Client } from "@aws-sdk/client-s3";
import { PutObjectCommand, GetObjectCommand, CreateBucketCommand, HeadBucketCommand, PutBucketPolicyCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// AWS S3 Configuration
const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET || `fitconnect-images-${Date.now()}`;

export interface ImageUploadResult {
  key: string;
  url: string;
  publicUrl: string;
}

export class AWSImageService {
  static async ensureBucketExists(): Promise<void> {
    try {
      // Check if bucket exists
      await s3Client.send(new HeadBucketCommand({ Bucket: BUCKET_NAME }));
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
        
        await s3Client.send(new CreateBucketCommand(createParams));
        console.log(`Created S3 bucket: ${BUCKET_NAME} in region: ${process.env.AWS_REGION}`);
        
        // Set bucket policy to allow public read access
        await this.setPublicReadPolicy();
      }
    }
  }

  static async setPublicReadPolicy(): Promise<void> {
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

  static async uploadImage(
    buffer: Buffer,
    fileName: string,
    contentType: string
  ): Promise<ImageUploadResult> {
    await this.ensureBucketExists();
    
    const key = `images/${Date.now()}-${fileName}`;
    
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      // ACL removed - using bucket policy for public access instead
    });

    await s3Client.send(command);

    const publicUrl = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
    
    return {
      key,
      url: publicUrl,
      publicUrl,
    };
  }

  static async getSignedUrl(key: string): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    return await getSignedUrl(s3Client, command, { expiresIn: 3600 });
  }

  static async deleteImage(key: string): Promise<void> {
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    await s3Client.send(command);
  }
}