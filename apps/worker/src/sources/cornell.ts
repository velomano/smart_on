import fetch from "node-fetch";
import pdf from "pdf-parse";
import { checksum } from "../lib/hash";

export async function fetchCornellLettuce() {
  const url = "https://hort.cornell.edu/greenhouse/crops/factsheets/hydroponic-recipes.pdf";
  const buf = await (await fetch(url)).arrayBuffer();
  await pdf(Buffer.from(buf)); // 실제 테이블 파싱 로직은 추후 구현
  const recipe = {
    crop_key: "lettuce",
    crop_name: "상추",
    stage: "vegetative" as const,
    target_ec: 1.8,
    target_ph: 5.8,
    macro: { N:150, P:30, K:200, Ca:180, Mg:50, S:60 },
    micro: { Fe:2, Mn:0.5, B:0.5, Zn:0.05, Cu:0.02, Mo:0.01 },
    source: { name: "Cornell CEA", url, org_type: "academic", reliability_default: 0.9 }
  };
  return [{ ...recipe, checksum: checksum(recipe) }];
}
