export async function withTimeout<T>(p: Promise<T>, ms = 10_000) {
  return await Promise.race([
    p,
    new Promise<never>((_, rej) => 
      setTimeout(() => rej(new Error(`Timeout ${ms}ms`)), ms)
    )
  ]);
}
