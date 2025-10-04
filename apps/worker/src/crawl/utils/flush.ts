import { upsertToSupabase } from "./save_to_db";

type Recipe = Record<string, any>;

export class BatchFlusher {
  private buf: Recipe[] = [];
  private lastFlushAt = Date.now();
  constructor(
    private table = "crop_profiles",
    private batchSize = 10,
    private flushIntervalMs = 120_000 // 2분
  ) {}

  push(r: Recipe) {
    this.buf.push(r);
    if (this.buf.length >= this.batchSize) {
      return this.flush("threshold");
    }
    if (Date.now() - this.lastFlushAt >= this.flushIntervalMs) {
      return this.flush("interval");
    }
  }

  size() { return this.buf.length; }

  async flush(reason: "threshold"|"interval"|"seeds-complete"|"period-end"|"final") {
    if (this.buf.length === 0) return;
    const chunk = this.buf.splice(0, this.buf.length);
    console.log(`💾 배치 저장(${reason}): ${chunk.length}건`);
    const { inserted, skipped } = await upsertToSupabase(chunk, this.table);
    console.log(`📥 Supabase 업서트 완료 → inserted=${inserted}, skipped(dup)=${skipped}`);
    this.lastFlushAt = Date.now();
  }
}
