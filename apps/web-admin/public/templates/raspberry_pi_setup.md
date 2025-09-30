# 🍓 라즈베리파이5 스마트팜 디바이스 설정 가이드

## 📋 개요

라즈베리파이5를 사용하여 스마트팜 IoT 디바이스를 구축하는 완전한 가이드입니다.

## 🛠️ 필요한 하드웨어

### 필수 하드웨어
- **라즈베리파이5** (4GB 이상 권장)
- **MicroSD 카드** (32GB 이상, Class 10)
- **전원 어댑터** (USB-C, 5V 3A)
- **케이스** (방열판 포함 권장)

### 센서 및 액추에이터
- **DHT22** 온습도 센서
- **토양 수분 센서** (STEMMA Soil Sensor)
- **릴레이 모듈** (펌프, LED, 팬 제어용)
- **점퍼 와이어**
- **브레드보드**

### 선택적 하드웨어
- **7인치 터치스크린** (모니터링용)
- **USB WiFi 어댑터** (더 안정적인 연결)
- **UPS** (정전 대비)

## 🔧 시스템 설정

### 1단계: 라즈베리 OS 설치

```bash
# Raspberry Pi Imager 다운로드 및 설치
# https://www.raspberrypi.org/downloads/

# SD 카드에 라즈베리 OS 설치
# - SSH 활성화
# - WiFi 설정
# - 사용자 계정 설정
```

### 2단계: 시스템 업데이트

```bash
# SSH로 라즈베리파이 연결
ssh pi@your-raspberry-pi-ip

# 시스템 업데이트
sudo apt update && sudo apt upgrade -y

# 필요한 패키지 설치
sudo apt install -y python3-pip python3-venv git vim
```

### 3단계: Python 환경 설정

```bash
# 프로젝트 디렉토리 생성
mkdir -p ~/smartfarm-device
cd ~/smartfarm-device

# 가상환경 생성
python3 -m venv venv
source venv/bin/activate

# 필요한 Python 패키지 설치
pip install --upgrade pip
pip install paho-mqtt RPi.GPIO adafruit-circuitpython-dht adafruit-circuitpython-seesaw
```

### 4단계: GPIO 설정

```bash
# GPIO 접근 권한 설정
sudo usermod -a -G gpio pi
sudo usermod -a -G i2c pi
sudo usermod -a -G spi pi

# I2C 활성화
sudo raspi-config
# 3 Interface Options → I2C → Enable
```

## 🔌 하드웨어 연결

### GPIO 핀 매핑

| 기능 | GPIO 핀 | 물리적 핀 |
|------|---------|-----------|
| DHT22 데이터 | GPIO 4 | 핀 7 |
| 펌프 제어 | GPIO 18 | 핀 12 |
| LED 제어 | GPIO 19 | 핀 35 |
| 팬 제어 | GPIO 20 | 핀 38 |
| I2C SDA | GPIO 2 | 핀 3 |
| I2C SCL | GPIO 3 | 핀 5 |
| 3.3V | - | 핀 1, 17 |
| GND | - | 핀 6, 9, 14, 20, 25, 30, 34, 39 |

### 연결 다이어그램

```
라즈베리파이5     센서/액추에이터
┌─────────────┐   ┌──────────────┐
│ GPIO 4      │───│ DHT22 Data   │
│ GPIO 18     │───│ 릴레이1 (펌프) │
│ GPIO 19     │───│ 릴레이2 (LED)  │
│ GPIO 20     │───│ 릴레이3 (팬)   │
│ SDA (GPIO 2)│───│ 토양센서 SDA  │
│ SCL (GPIO 3)│───│ 토양센서 SCL  │
│ 3.3V        │───│ 센서 전원     │
│ GND         │───│ 공통 그라운드  │
└─────────────┘   └──────────────┘
```

## 📝 소프트웨어 설정

### 1단계: 템플릿 다운로드

```bash
# 템플릿 파일 다운로드
wget https://your-domain.com/api/templates/download?type=raspberry_pi -O smartfarm_device.py

# 실행 권한 부여
chmod +x smartfarm_device.py
```

### 2단계: 설정 파일 수정

```python
# smartfarm_device.py 파일의 Config 클래스 수정
class Config:
    # MQTT 브로커 설정
    MQTT_BROKER_HOST = "your-mqtt-broker.com"  # 실제 브로커 주소
    MQTT_BROKER_PORT = 1883
    MQTT_USERNAME = "your_username"            # 실제 사용자명
    MQTT_PASSWORD = "your_password"            # 실제 비밀번호
    
    # 디바이스 정보
    FARM_ID = "your_farm_id"                   # 농장 ID
    DEVICE_ID = "raspberry_pi_001"             # 디바이스 ID
```

### 3단계: 시스템 서비스 등록

```bash
# 서비스 파일 생성
sudo nano /etc/systemd/system/smartfarm-device.service
```

```ini
[Unit]
Description=SmartFarm Raspberry Pi Device
After=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/smartfarm-device
Environment=PATH=/home/pi/smartfarm-device/venv/bin
ExecStart=/home/pi/smartfarm-device/venv/bin/python smartfarm_device.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
# 서비스 활성화
sudo systemctl daemon-reload
sudo systemctl enable smartfarm-device
sudo systemctl start smartfarm-device

# 서비스 상태 확인
sudo systemctl status smartfarm-device
```

## 🔍 테스트 및 검증

### 1단계: 하드웨어 테스트

```bash
# GPIO 테스트
python3 -c "
import RPi.GPIO as GPIO
import time
GPIO.setmode(GPIO.BCM)
GPIO.setup(18, GPIO.OUT)
GPIO.output(18, GPIO.HIGH)
time.sleep(2)
GPIO.output(18, GPIO.LOW)
GPIO.cleanup()
print('GPIO 테스트 완료')
"
```

### 2단계: 센서 테스트

```bash
# 온습도 센서 테스트
python3 -c "
import board
import adafruit_dht
dht = adafruit_dht.DHT22(board.D4)
try:
    temp = dht.temperature
    humidity = dht.humidity
    print(f'온도: {temp}°C, 습도: {humidity}%')
except:
    print('센서 읽기 실패')
"
```

### 3단계: MQTT 연결 테스트

```bash
# MQTT 연결 테스트
python3 -c "
import paho.mqtt.client as mqtt
import time

def on_connect(client, userdata, flags, rc):
    print(f'연결 결과: {rc}')
    client.disconnect()

client = mqtt.Client()
client.on_connect = on_connect
client.connect('your-broker.com', 1883, 60)
client.loop_start()
time.sleep(2)
"
```

## 📊 모니터링 및 로그

### 로그 확인

```bash
# 실시간 로그 확인
sudo journalctl -u smartfarm-device -f

# 파일 로그 확인
tail -f /var/log/smartfarm_device.log
```

### 시스템 상태 확인

```bash
# CPU/메모리 사용률
htop

# 온도 확인
vcgencmd measure_temp

# 디스크 사용량
df -h

# 네트워크 상태
iwconfig
```

## 🔧 문제해결

### 일반적인 문제들

#### 1. GPIO 권한 오류
```bash
# 해결방법
sudo usermod -a -G gpio pi
sudo reboot
```

#### 2. I2C 장치 인식 안됨
```bash
# 해결방법
sudo raspi-config  # I2C 활성화
sudo i2cdetect -y 1  # I2C 장치 확인
```

#### 3. MQTT 연결 실패
```bash
# 네트워크 연결 확인
ping your-mqtt-broker.com

# 포트 연결 확인
telnet your-mqtt-broker.com 1883
```

#### 4. 센서 읽기 실패
```bash
# 센서 연결 확인
python3 -c "
import board
print('GPIO 4 핀 상태:', board.D4)
"
```

### 성능 최적화

#### 1. 메모리 사용량 최적화
```bash
# GPU 메모리 제한
sudo raspi-config
# Advanced Options → Memory Split → 16
```

#### 2. 부팅 시간 단축
```bash
# 불필요한 서비스 비활성화
sudo systemctl disable bluetooth
sudo systemctl disable hciuart
```

## 🔄 업데이트 및 유지보수

### 펌웨어 업데이트

```bash
# 새로운 템플릿 다운로드
cd ~/smartfarm-device
wget https://your-domain.com/api/templates/download?type=raspberry_pi -O smartfarm_device.py.new

# 백업 및 교체
cp smartfarm_device.py smartfarm_device.py.backup
mv smartfarm_device.py.new smartfarm_device.py

# 서비스 재시작
sudo systemctl restart smartfarm-device
```

### 설정 변경

```bash
# 설정 파일 편집
nano smartfarm_device.py

# 서비스 재시작
sudo systemctl restart smartfarm-device
```

## 📞 지원 및 도움말

### 유용한 명령어

```bash
# 서비스 상태 확인
sudo systemctl status smartfarm-device

# 서비스 재시작
sudo systemctl restart smartfarm-device

# 로그 확인
sudo journalctl -u smartfarm-device --since "1 hour ago"

# 시스템 정보
uname -a
cat /proc/cpuinfo
```

### 추가 리소스

- [라즈베리파이 공식 문서](https://www.raspberrypi.org/documentation/)
- [GPIO 핀 매핑](https://pinout.xyz/)
- [Python GPIO 라이브러리](https://pypi.org/project/RPi.GPIO/)
- [MQTT 클라이언트 라이브러리](https://pypi.org/project/paho-mqtt/)

---

**⚠️ 주의사항:**
- GPIO 핀 연결 시 전압 확인 (3.3V 사용)
- 릴레이 모듈 사용 시 별도 전원 공급 필요
- 정전 시 자동 재시작을 위해 UPS 사용 권장
- 정기적인 로그 확인 및 시스템 업데이트 필요
