import mqtt from 'mqtt';
import { decrypt } from '@/lib/crypto';
import { supaAdmin } from '@/lib/supabaseAdmin';

export async function POST(_req: Request, { params }: { params: { farmId: string }}) {
  const supa = supaAdmin();
  const { data: cfg, error } = await supa.from('farm_mqtt_configs').select('*').eq('farm_id', params.farmId).maybeSingle();
  if (error || !cfg) return Response.json({ success:false, error: 'NO_CONFIG' }, { status: 404 });

  const secret = cfg.secret_enc ? decrypt(cfg.secret_enc) : undefined;
  const ok = await new Promise<boolean>((resolve) => {
    const client = mqtt.connect(cfg.broker_url, {
      port: cfg.port,
      username: cfg.auth_mode === 'api_key' ? 'apikey' : cfg.username || undefined,
      password: secret,
      connectTimeout: 3000,
      rejectUnauthorized: true,
    });
    client.on('connect', () => { client.end(true, () => resolve(true)); });
    client.on('error', () => { client.end(true, () => resolve(false)); });
    setTimeout(() => resolve(false), 3500);
  });

  await supa.from('farm_mqtt_configs')
    .update({ last_test_at: new Date().toISOString(), last_test_ok: ok })
    .eq('farm_id', params.farmId);

  return Response.json({ success: ok });
}
