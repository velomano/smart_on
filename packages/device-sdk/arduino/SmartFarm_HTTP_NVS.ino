/**
 * SmartFarm IoT Client with NVS (Non-Volatile Storage)
 * 
 * 특징:
 * - Device Key를 NVS에 안전하게 저장
 * - 시리얼 로그에 키 노출 금지
 * - 재부팅 후에도 설정 유지
 * - HMAC-SHA256 서명 검증
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <Preferences.h>
#include <mbedtls/md.h>

// WiFi 설정
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// 서버 설정
const char* serverUrl = "http://192.168.0.204:3000";
const char* setupToken = "ST_PUT_YOUR_SETUP_TOKEN_HERE";

// NVS 저장소
Preferences preferences;

// 디바이스 정보
String deviceId = "";
String deviceKey = "";  // 메모리에만 유지, NVS에서 읽음
bool isProvisioned = false;

void setup() {
  Serial.begin(115200);
  delay(1000);
  
  Serial.println("\n🌉 SmartFarm IoT Client Starting...");
  
  // NVS 초기화
  preferences.begin("smartfarm", false);
  
  // 기존 설정 로드
  loadConfiguration();
  
  // WiFi 연결
  connectWiFi();
  
  // 프로비저닝 체크
  if (!isProvisioned) {
    Serial.println("🔧 Provisioning 모드...");
    provisionDevice();
  } else {
    Serial.println("✅ 이미 프로비저닝됨");
    Serial.println("Device ID: " + deviceId);
    Serial.println("Device Key: ********** (보안상 숨김)");
  }
  
  delay(5000);
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    connectWiFi();
  }
  
  if (isProvisioned) {
    sendTelemetry();
  }
  
  delay(10000);  // 10초마다
}

void loadConfiguration() {
  deviceId = preferences.getString("device_id", "");
  deviceKey = preferences.getString("device_key", "");
  
  if (deviceId.length() > 0 && deviceKey.length() > 0) {
    isProvisioned = true;
    Serial.println("📂 설정 로드 완료");
  } else {
    Serial.println("📂 설정 없음 - 프로비저닝 필요");
  }
}

void saveConfiguration(String devId, String devKey) {
  preferences.putString("device_id", devId);
  preferences.putString("device_key", devKey);
  
  deviceId = devId;
  deviceKey = devKey;
  isProvisioned = true;
  
  Serial.println("💾 설정 저장 완료 (NVS)");
}

void connectWiFi() {
  if (WiFi.status() == WL_CONNECTED) {
    return;
  }
  
  Serial.print("📡 WiFi 연결 중");
  WiFi.begin(ssid, password);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✅ WiFi 연결 성공!");
    Serial.println("IP: " + WiFi.localIP().toString());
  } else {
    Serial.println("\n❌ WiFi 연결 실패");
  }
}

void provisionDevice() {
  HTTPClient http;
  http.begin(String(serverUrl) + "/api/provisioning/bind");
  http.addHeader("Content-Type", "application/json");
  http.addHeader("x-setup-token", setupToken);
  
  // MAC 주소 기반 디바이스 ID 생성
  String macAddr = WiFi.macAddress();
  macAddr.replace(":", "");
  String tempDeviceId = "ESP32-" + macAddr;
  
  String payload = "{\"device_id\":\"" + tempDeviceId + 
                   "\",\"device_type\":\"esp32-sensor\"," +
                   "\"capabilities\":[\"temperature\",\"humidity\"]}";
  
  int httpCode = http.POST(payload);
  
  if (httpCode == 200) {
    String response = http.getString();
    Serial.println("✅ 디바이스 등록 성공!");
    
    // JSON 파싱 (간단한 방법)
    int keyStart = response.indexOf("\"device_key\":\"") + 14;
    int keyEnd = response.indexOf("\"", keyStart);
    String receivedKey = response.substring(keyStart, keyEnd);
    
    if (receivedKey.length() > 0) {
      // NVS에 안전하게 저장
      saveConfiguration(tempDeviceId, receivedKey);
      Serial.println("💾 Device Key가 NVS에 안전하게 저장되었습니다.");
      Serial.println("⚠️  Device Key는 시리얼 로그에 표시되지 않습니다.");
    } else {
      Serial.println("❌ Device Key 파싱 실패");
    }
  } else {
    Serial.println("❌ 등록 실패: " + String(httpCode));
    Serial.println(http.getString());
  }
  
  http.end();
}

void sendTelemetry() {
  // 센서 값 읽기 (예시: DHT22)
  float temperature = 20.0 + random(0, 100) / 10.0;  // 20-30°C
  float humidity = 50.0 + random(0, 300) / 10.0;     // 50-80%
  
  // ISO 타임스탬프
  unsigned long epochTime = getEpochTime();
  String isoTimestamp = getISOTimestamp(epochTime);
  
  // JSON 페이로드 생성
  String payload = "{\"readings\":[" +
    "{\"key\":\"temperature\",\"value\":" + String(temperature) + ",\"unit\":\"C\",\"ts\":\"" + isoTimestamp + "\"}," +
    "{\"key\":\"humidity\",\"value\":" + String(humidity) + ",\"unit\":\"%\",\"ts\":\"" + isoTimestamp + "\"}" +
  "]}";
  
  // HMAC-SHA256 서명 생성
  String signature = generateHMAC(deviceKey, deviceId + "|" + String(epochTime) + "|" + payload);
  
  HTTPClient http;
  http.begin(String(serverUrl) + "/api/bridge/telemetry");
  http.addHeader("Content-Type", "application/json");
  http.addHeader("x-device-id", deviceId);
  http.addHeader("x-tenant-id", "00000000-0000-0000-0000-000000000001");
  http.addHeader("x-sig", signature);
  http.addHeader("x-ts", String(epochTime));
  
  int httpCode = http.POST(payload);
  
  if (httpCode == 200) {
    Serial.println("✅ 데이터 전송 성공!");
    Serial.println("   Temperature: " + String(temperature) + "°C");
    Serial.println("   Humidity: " + String(humidity) + "%");
  } else {
    Serial.println("❌ 전송 실패: " + String(httpCode));
  }
  
  http.end();
}

String generateHMAC(String key, String message) {
  byte hmacResult[32];
  
  mbedtls_md_context_t ctx;
  mbedtls_md_type_t md_type = MBEDTLS_MD_SHA256;
  
  mbedtls_md_init(&ctx);
  mbedtls_md_setup(&ctx, mbedtls_md_info_from_type(md_type), 1);
  mbedtls_md_hmac_starts(&ctx, (const unsigned char*)key.c_str(), key.length());
  mbedtls_md_hmac_update(&ctx, (const unsigned char*)message.c_str(), message.length());
  mbedtls_md_hmac_finish(&ctx, hmacResult);
  mbedtls_md_free(&ctx);
  
  // Hex 변환
  String signature = "";
  for (int i = 0; i < 32; i++) {
    char hex[3];
    sprintf(hex, "%02x", hmacResult[i]);
    signature += hex;
  }
  
  return signature;
}

unsigned long getEpochTime() {
  // TODO: NTP 시간 동기화
  // 임시: millis() 기반
  return millis() / 1000;
}

String getISOTimestamp(unsigned long epochTime) {
  // 간단한 ISO 형식 (정확하지 않음, NTP 사용 권장)
  char timestamp[25];
  sprintf(timestamp, "2025-10-01T%02lu:%02lu:%02luZ", 
    (epochTime / 3600) % 24,
    (epochTime / 60) % 60,
    epochTime % 60
  );
  return String(timestamp);
}

/**
 * 🔐 보안 참고사항:
 * 
 * 1. Device Key는 NVS에만 저장, 시리얼 로그 노출 금지
 * 2. HMAC 서명으로 메시지 무결성 보장
 * 3. Timestamp로 Replay Attack 방지
 * 4. NTP 시간 동기화 필수 (운영 모드)
 * 5. OTA 업데이트 시 NVS 보존
 */

