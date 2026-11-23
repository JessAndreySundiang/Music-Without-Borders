import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { E2E_ADMIN_CREDENTIALS_FILE } from "./global-setup";

export default async function globalTeardown(): Promise<void> {
  const credsPath = path.join(os.tmpdir(), E2E_ADMIN_CREDENTIALS_FILE);
  if (fs.existsSync(credsPath)) {
    try {
      fs.unlinkSync(credsPath);
    } catch {
      // Ignore if already deleted or inaccessible
    }
  }
}
