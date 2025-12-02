import 'dotenv/config';
import { S3Client, ListBucketsCommand } from "@aws-sdk/client-s3";

const client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

async function test() {
  try {
    console.log("Testing AWS credentials...\n");
    const result = await client.send(new ListBucketsCommand({}));
    console.log("✅ Credentials work!");
    console.log(`Found ${result.Buckets?.length || 0} buckets:`);
    result.Buckets?.forEach(b => console.log(`  - ${b.Name}`));
  } catch (error: any) {
    console.log("❌ Error:", error.message);
    console.log("Code:", error.Code || error.$metadata?.httpStatusCode);
  }
}

test();
