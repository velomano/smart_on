import { supaAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: Request) {
  const supa = supaAdmin();
  const { device_id, command, payload, expires_at } = await req.json();
  
  const correlation_id = crypto.randomUUID();
  
  const { data, error } = await supa.from('commands').insert({
    device_id,
    command,
    payload,
    status: 'pending',
    correlation_id,
    expires_at: expires_at ? new Date(expires_at).toISOString() : null,
    created_at: new Date().toISOString()
  }).select().single();

  if (error) {
    return Response.json({ success: false, error }, { status: 400 });
  }

  return Response.json({ success: true, data });
}
