import { Router } from 'express';
import crypto from 'crypto';
import type { LoraWanAdapter } from '@smart-on/adapters/loraWanAdapter';

export function lorawanRoutes(adapter: LoraWanAdapter){
  const r = Router();
  r.post('/rpc/lorawan/webhook', async (req:any,res:any)=>{
    try{
      const secret = (adapter as any).cfg?.webhook?.secret || '';
      const sig = req.headers['x-signature'] || '';
      const body = JSON.stringify(req.body||{});
      const h = crypto.createHmac('sha256', secret).update(body).digest('hex');
      if (secret && sig && sig!==h) return res.status(401).send('invalid signature');

      const devEui = req.body?.devEui || req.body?.end_device_ids?.dev_eui || 'unknown';
      const device_id = (adapter as any).cfg.deviceMap?.[devEui] ?? devEui;
      const ts = req.body?.time || new Date().toISOString();
      const frm = req.body?.data || req.body?.uplink_message?.frm_payload || '';
      const bytes = typeof frm==='string' ? Buffer.from(frm,'base64') : Buffer.from([]);
      const metrics = await (adapter as any).decode(bytes);
      await (adapter as any).uplinkPublish({ device_id, ts, metrics, status:'ok' });
      res.sendStatus(204);
    }catch(e:any){ res.status(500).send(e?.message||'error');}
  });
  return r;
}
