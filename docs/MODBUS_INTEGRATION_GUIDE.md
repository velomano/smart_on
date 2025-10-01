# Modbus RTU/TCP 통합 가이드

## 개요

Universal Bridge는 산업용 Modbus 프로토콜을 완전 지원합니다:
- **RS-485 (Modbus RTU)**: 유선 장거리 통신 (수백 미터)
- **Modbus TCP**: 네트워크 기반 통신 (LAN/WAN)

## 안전/운영 주의사항

### 🔒 보안 설정
- **포트 502/TCP**: 방화벽 규칙 설정 필요
- **VPN/프라이빗 네트워크**: 공개 네트워크 사용 금지
- **인증**: Unit ID 기반 접근 제어

### 📋 장치 매뉴얼 준수
- **슬레이브 주소**: 벤더별 상이하므로 매뉴얼 확인 필수
- **레지스터 맵**: 장치별 레지스터 주소 및 기능 코드 확인
- **통신 파라미터**: Baud Rate, Parity, Stop Bits 등

### 🔧 데이터 타입 및 엔디안
- **엔디안**: Big Endian (기본) / Little Endian
- **자료형**: U16, S16, U32, S32, Float
- **값 변환**: 센서별 스케일링 팩터 적용

### ⚡ 안전 가드
- **타임아웃**: 기본 1000ms, 네트워크 상황에 따라 조정
- **재시도**: 기본 3회, 지수 백오프 적용
- **안전 한계값**: 명령 실행 전 범위 체크
- **롤백**: 실패 시 이전 값으로 자동 복원

## 설정 방법

### 1. IoT Designer에서 설정

#### 기본 연결 정보
```
호스트 주소: 192.168.1.100
포트: 502 (Modbus TCP) / 9600 (RS-485)
Unit ID: 1
```

#### 레지스터 매핑
각 센서/제어 장치에 대해:
- **레지스터 주소**: 0x0001 ~ 0xFFFF
- **자료형**: U16, S16, U32, S32, Float
- **읽기/쓰기**: 센서(읽기), 제어(쓰기)

#### 안전 한계값
제어 장치에 대해:
- **최소값**: 안전 하한선
- **최대값**: 안전 상한선
- **범위 초과 시**: 명령 거부

### 2. 코드 생성 예시

#### Modbus TCP (Arduino)
```cpp
#include <ModbusMaster.h>

ModbusMaster node;

void setup() {
  Serial.begin(9600);
  node.begin(1, Serial); // Unit ID = 1
  
  // 안전 한계값 설정
  setSafeLimits("relay_control", 0, 1);
  setSafeLimits("set_pwm", 0, 100);
}

void loop() {
  // 센서 읽기
  uint16_t temperature = readSensor("sensor_temperature");
  uint16_t humidity = readSensor("sensor_humidity");
  
  // 텔레메트리 전송
  sendTelemetry({
    "temperature": temperature / 10.0,
    "humidity": humidity / 10.0
  });
  
  // 명령 처리
  Command cmd = getCommand();
  if (cmd.type == "relay_control") {
    writeRegister(cmd.params.register, cmd.params.value);
  }
  
  delay(5000);
}

uint16_t readSensor(String sensorType) {
  uint16_t registerAddr = getRegisterAddress(sensorType);
  uint8_t result = node.readHoldingRegisters(registerAddr, 1);
  
  if (result == node.ku8MBSuccess) {
    return node.getResponseBuffer(0);
  }
  return 0;
}

void writeRegister(uint16_t addr, uint16_t value) {
  // 안전 한계값 체크
  if (!checkSafeLimits(addr, value)) {
    return;
  }
  
  uint8_t result = node.writeSingleRegister(addr, value);
  if (result == node.ku8MBSuccess) {
    Serial.println("Write successful");
  }
}
```

#### Modbus TCP (Python/Raspberry Pi)
```python
from pymodbus.client.sync import ModbusTcpClient
import time

class ModbusTCPClient:
    def __init__(self, host, port=502, unit_id=1):
        self.client = ModbusTcpClient(host, port)
        self.unit_id = unit_id
        self.safe_limits = {
            'relay_control': {'min': 0, 'max': 1},
            'set_pwm': {'min': 0, 'max': 100}
        }
    
    def connect(self):
        return self.client.connect()
    
    def read_sensor(self, sensor_type):
        register_addr = self.get_register_address(sensor_type)
        result = self.client.read_holding_registers(
            register_addr, 1, unit=self.unit_id
        )
        
        if result.isError():
            return None
        
        return result.registers[0]
    
    def write_register(self, addr, value):
        # 안전 한계값 체크
        if not self.check_safe_limits(addr, value):
            return False
        
        result = self.client.write_register(
            addr, value, unit=self.unit_id
        )
        
        return not result.isError()
    
    def check_safe_limits(self, addr, value):
        for cmd_type, limits in self.safe_limits.items():
            if self.get_register_address(cmd_type) == addr:
                return limits['min'] <= value <= limits['max']
        return True

# 사용 예시
client = ModbusTCPClient('192.168.1.100')
if client.connect():
    # 센서 읽기
    temperature = client.read_sensor('sensor_temperature')
    humidity = client.read_sensor('sensor_humidity')
    
    # 제어 명령
    client.write_register(0x0001, 1)  # 릴레이 ON
```

## 문제 해결

### 연결 실패
1. **네트워크 연결 확인**: ping 테스트
2. **포트 확인**: 502 포트 개방 여부
3. **Unit ID 확인**: 장치 매뉴얼 참조
4. **방화벽 설정**: 포트 502 허용

### 데이터 오류
1. **엔디안 확인**: Big/Little Endian 설정
2. **자료형 확인**: U16/S16/U32/S32/Float
3. **스케일링 팩터**: 센서별 변환 공식
4. **레지스터 주소**: 매뉴얼과 일치 여부

### 성능 문제
1. **타임아웃 조정**: 네트워크 지연 고려
2. **폴링 간격**: 너무 빈번한 요청 방지
3. **재시도 횟수**: 네트워크 안정성에 따라 조정
4. **백오프 간격**: 지수 백오프 적용

## 벤더별 설정 예시

### Schneider Electric
```
Unit ID: 1-247
Baud Rate: 9600, 19200, 38400
Parity: Even
Stop Bits: 1
```

### Siemens
```
Unit ID: 1-247
Baud Rate: 9600, 19200, 38400
Parity: Even
Stop Bits: 1
```

### Mitsubishi
```
Unit ID: 1-247
Baud Rate: 9600, 19200, 38400
Parity: Even
Stop Bits: 1
```

## 모니터링 및 로깅

### 연결 상태 모니터링
- **온라인/오프라인**: 주기적 ping 테스트
- **응답 시간**: 평균/최대/최소 측정
- **에러율**: 실패/성공 비율

### 로그 레벨
- **INFO**: 정상 동작 로그
- **WARN**: 재시도, 타임아웃
- **ERROR**: 연결 실패, 명령 실패
- **DEBUG**: 상세 통신 로그

### 알림 설정
- **연결 끊김**: 즉시 알림
- **에러율 증가**: 임계값 초과 시
- **응답 지연**: 평균 응답시간 초과 시

## 보안 체크리스트

- ✅ **포트 502 방화벽 규칙 설정**
- ✅ **VPN 또는 프라이빗 네트워크 사용**
- ✅ **Unit ID 기반 접근 제어**
- ✅ **안전 한계값 설정 및 검증**
- ✅ **명령 롤백 기능 활성화**
- ✅ **통신 로그 암호화 저장**
- ✅ **정기적인 보안 업데이트**

## 성능 최적화

### 네트워크 최적화
- **배치 읽기**: 여러 레지스터 한 번에 읽기
- **캐싱**: 자주 읽는 데이터 캐시
- **압축**: 대용량 데이터 압축 전송

### 메모리 최적화
- **연결 풀**: 재사용 가능한 연결 관리
- **버퍼 관리**: 적절한 버퍼 크기 설정
- **가비지 컬렉션**: 메모리 누수 방지

### CPU 최적화
- **비동기 처리**: 논블로킹 I/O 사용
- **스레드 풀**: 적절한 스레드 수 설정
- **우선순위**: 중요한 명령 우선 처리
