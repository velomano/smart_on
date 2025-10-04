// apps/worker/src/crawl/utils/safe_get.ts
import fetch from "node-fetch";

// 안전한 GET 유틸리티 (퍼블리셔 403 방지)
export async function safeGet(url: string) {
  // 1) HEAD로 먼저 확인
  const head = await fetch(url, { 
    method: "HEAD", 
    redirect: "manual",
    headers: {
      "User-Agent": "terahub-crawler (+mailto:sky3rain7@gmail.com)"
    }
  });
  
  const loc = head.headers.get("location");
  const finalUrl = loc ? (new URL(loc, url)).toString() : url;
  
  // 2) pdf만 본문 요청
  if (!finalUrl.toLowerCase().endsWith(".pdf")) {
    throw new Error("non-pdf blocked");
  }
  
  return fetch(finalUrl, { 
    headers: { 
      "User-Agent": "terahub-crawler (+mailto:sky3rain7@gmail.com)" 
    }
  });
}
