
import { hashPassword } from "./server/password.ts";

async function run() {
  const hash = await hashPassword("admin123");
  console.log(hash);
}

run();
