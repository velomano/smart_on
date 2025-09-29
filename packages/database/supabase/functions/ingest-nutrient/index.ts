import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type Recipe = {
  crop_key: string;
  crop_name?: string;
  stage: "seedling"|"vegetative"|"flowering"|"fruiting"|"ripening";
  target_ec?: number;
  target_ph?: number;
  macro: Record<string, number>;
  micro: Record<string, number>;
  ions?: Record<string, number>;
  env?: Record<string, number>;
  source?: { name:string; url?:string; org_type:"government"|"academic"|"commercial"|"community"; reliability_default?:number; license?:string; };
  reliability?: number;
  collected_at?: string;
  checksum: string;
};

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const payload = (await req.json()) as Recipe[];

    // 1) source upsert (id 매핑)
    const sourcesMap = new Map<string, number>();
    for (const r of payload) {
      if (!r.source) continue;
      const key = `${r.source.name}::${r.source.url ?? ""}`;
      if (sourcesMap.has(key)) continue;

      const { data, error } = await supabase
        .from("nutrient_sources")
        .upsert({
          name: r.source.name,
          url: r.source.url,
          org_type: r.source.org_type,
          license: r.source.license,
          reliability_default: r.source.reliability_default ?? 0.7
        }, { onConflict: "name" })
        .select("id")
        .single();

      if (error) throw error;
      sourcesMap.set(key, data.id);
    }

    // 2) recipes upsert
    const rows = payload.map((r) => ({
      crop_key: r.crop_key,
      crop_name: r.crop_name,
      stage: r.stage,
      target_ec: r.target_ec,
      target_ph: r.target_ph,
      macro: r.macro,
      micro: r.micro,
      ions: r.ions,
      env: r.env,
      source_id: r.source ? sourcesMap.get(`${r.source.name}::${r.source.url ?? ""}`) : null,
      reliability: r.reliability ?? r.source?.reliability_default ?? 0.7,
      collected_at: r.collected_at ?? new Date().toISOString(),
      checksum: r.checksum
    }));

    const { data: upserted, error: upsertErr } = await supabase
      .from("nutrient_recipes")
      .upsert(rows, { onConflict: "crop_key,stage,checksum" })
      .select("*");

    if (upsertErr) throw upsertErr;

    return new Response(JSON.stringify({ count: upserted?.length ?? 0 }), { status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
  }
});