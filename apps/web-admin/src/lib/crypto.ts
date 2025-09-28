import crypto from 'crypto';

const ALG = 'aes-256-cbc';
const KEY = crypto.createHash('sha256').update(process.env.ENCRYPTION_KEY || 'change-me').digest();
const IV = Buffer.alloc(16, 0);

export function encrypt(plain: string): string {
  const c = crypto.createCipheriv(ALG, KEY, IV);
  return c.update(plain, 'utf8', 'hex') + c.final('hex');
}

export function decrypt(hex: string): string {
  const d = crypto.createDecipheriv(ALG, KEY, IV);
  return d.update(hex, 'hex', 'utf8') + d.final('utf8');
}
