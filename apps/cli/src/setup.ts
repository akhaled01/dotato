import { join } from "node:path";
import { config } from "dotenv";

config({ path: join(process.cwd(), ".env") });
