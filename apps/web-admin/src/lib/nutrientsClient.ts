export async function planNutrients(payload: any) {
  if (process.env.NEXT_PUBLIC_USE_SUPABASE === '1') {
    // todo: supabase.functions.invoke('plan-nutrients', { body: payload })
    throw new Error('Supabase Functions 경로는 아직 미연결');
  }
  const r = await fetch('/api/nutrients/plan', { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify(payload) });
  const j = await r.json();
  if (!j.ok) throw new Error(j.error||'fail');
  return j.result;
}
