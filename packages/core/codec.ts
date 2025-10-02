export type CodecConfig =
  | { type: 'js'; script: string }
  | { type: 'js'; scriptRef: string };

export function b64ToBytes(b64: string){ return Buffer.from(b64, 'base64'); }
