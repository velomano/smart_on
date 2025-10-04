export const MODE = {
  // 429 심할 때 Scholar OFF
  USE_SCHOLAR: false,
  // PubMed는 반드시 Europe PMC로 풀어가기
  PUBMED_TO_EPMC: true,
  // DOI 랜딩 중 "책/인용서지/IT학회"는 즉시 스킵
  SKIP_BAD_PUBLISHERS: true,
  // 기관 화이트리스트 우선, 그 외는 PDF만 시도
  INSTITUTION_FIRST: true,
  // 배치 크기: 1(디버그) / 3~5(튜닝) / 10(운영)
  BATCH_SIZE: 1, // 디버그 모드
  // 시간 기반 플러시 (2분마다)
  FLUSH_INTERVAL_MS: 120000,
  
  // ===== 효과 큰 스위치 8개 =====
  // 1) OA(오픈액세스) 강제 해제 - 유료 논문도 추출 허용
  ALLOW_PAYWALLED: false,
  // 2) Scholar/RISS 켜기
  USE_RISS: false,
  // 3) 한국어 키워드 확장 (동의어 사전)
  USE_KOREAN_SYNONYMS: true,
  // 4) 시드 보강(한국 로컬)
  USE_KOREAN_SEEDS: true,
  // 5) PDF 파서 유닛 보정
  FIX_UNIT_CONVERSION: true,
  // 6) 추출 허용 기준 완화
  RELAXED_ACCEPTANCE: true,
  // 7) HTML 본문 표 파싱 강화
  ENHANCED_TABLE_PARSING: true,
  // 8) 중복 판정 키 개선
  IMPROVED_DEDUP: true,
};
