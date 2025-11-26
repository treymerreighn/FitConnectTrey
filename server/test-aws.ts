import { S3Client, HeadBucketCommand, PutObjectCommand, GetBucketPolicyCommand, PutBucketPolicyCommand } from "@aws-sdk/client-s3";
import * as dotenv from "dotenv";

dotenv.config();

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET || "fitconnect-images-braden";

async function testAWSSetup() {
  console.log("\n🔍 Testing AWS S3 Configuration...\n");
  
  // Test 1: Check credentials
  console.log("1️⃣ Checking AWS Credentials:");
  console.log(`   Access Key ID: ${process.env.AWS_ACCESS_KEY_ID?.substring(0, 8)}...`);
  console.log(`   Region: ${process.env.AWS_REGION}`);
  console.log(`   Bucket: ${BUCKET_NAME}\n`);

  // Test 2: Check if bucket exists
  try {
    console.log("2️⃣ Checking if bucket exists...");
    await s3Client.send(new HeadBucketCommand({ Bucket: BUCKET_NAME }));
    console.log(`   ✅ Bucket '${BUCKET_NAME}' exists!\n`);
  } catch (error: any) {
    console.log(`   ❌ Bucket check failed: ${error.message}`);
    console.log(`   Error Code: ${error.Code || error.name}\n`);
    return;
  }

  // Test 3: Check bucket policy
  try {
    console.log("3️⃣ Checking bucket policy...");
    const policyResponse = await s3Client.send(new GetBucketPolicyCommand({ Bucket: BUCKET_NAME }));
    const policy = JSON.parse(policyResponse.Policy || "{}");
    console.log(`   Current policy:`, JSON.stringify(policy, null, 2));
  } catch (error: any) {
    if (error.name === 'NoSuchBucketPolicy') {
      console.log(`   ⚠️  No bucket policy found - setting one now...\n`);
      
      // Set a public read policy
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
        console.log(`   ✅ Bucket policy set successfully!\n`);
      } catch (policyError: any) {
        console.log(`   ❌ Failed to set bucket policy: ${policyError.message}\n`);
      }
    } else {
      console.log(`   ❌ Failed to check policy: ${error.message}\n`);
    }
  }

  // Test 4: Try uploading a test file
  try {
    console.log("4️⃣ Testing file upload...");
    const testKey = `test-${Date.now()}.txt`;
    await s3Client.send(new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: testKey,
      Body: Buffer.from("Test upload from FitConnect"),
      ContentType: "text/plain",
    }));
    
    const publicUrl = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${testKey}`;
    console.log(`   ✅ Upload successful!`);
    console.log(`   URL: ${publicUrl}\n`);
  } catch (error: any) {
    console.log(`   ❌ Upload failed: ${error.message}`);
    console.log(`   Error Code: ${error.Code || error.name}\n`);
  }

  console.log("\n✅ AWS diagnostic complete!\n");
}

testAWSSetup().catch(console.error);
