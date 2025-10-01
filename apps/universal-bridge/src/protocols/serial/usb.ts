/**
 * USB Serial
 * 
 * Phase 2+에서 구현
 * TODO: USB Serial 통신 구현
 */

/**
 * USB Serial 핸들러
 * 
 * TODO:
 * - [ ] 시리얼 포트 열기
 * - [ ] 데이터 읽기/쓰기
 * - [ ] 자동 감지
 */
export class USBSerialHandler {
  async list(): Promise<string[]> {
    console.log('[USB Serial] TODO: List available ports');
    return [];
  }

  async open(port: string): Promise<void> {
    console.log('[USB Serial] TODO: Open port:', port);
  }

  async write(port: string, data: string): Promise<void> {
    console.log('[USB Serial] TODO: Write to port:', port);
  }
}

