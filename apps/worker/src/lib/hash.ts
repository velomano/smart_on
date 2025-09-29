import crypto from "node:crypto";
export const checksum = (obj:any) =>
  crypto.createHash("sha256").update(JSON.stringify(obj)).digest("hex");
