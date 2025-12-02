import 'dotenv/config';
import { S3Client, PutBucketPolicyCommand } from "@aws-sdk/client-s3";

const client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET || "kratos-images-braden";

async function fixBucketPolicy() {
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
    console.log(`Setting public read policy on bucket: ${BUCKET_NAME}...`);
    await client.send(new PutBucketPolicyCommand({
      Bucket: BUCKET_NAME,
      Policy: JSON.stringify(policy)
    }));
    console.log("✅ Bucket policy set successfully!");
    console.log("Images should now be publicly accessible.");
  } catch (error: any) {
    console.error("❌ Failed to set bucket policy:", error.message);
  }
}

fixBucketPolicy();
