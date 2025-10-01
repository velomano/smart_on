# 🐍 Python SmartFarm 연결 가이드

## Raspberry Pi 빠른 시작

### 1단계: Python 설치 확인

```bash
python3 --version  # Python 3.7 이상 필요
```

### 2단계: 패키지 설치

```bash
pip3 install requests

# DHT22 센서 사용 시 (옵션)
pip3 install Adafruit-DHT
```

### 3단계: 코드 다운로드

웹 마법사에서 코드를 복사하거나:

```bash
wget https://raw.githubusercontent.com/your-repo/device-sdk/python/smartfarm_client.py
```

### 4단계: 설정 수정

```python
# 서버 설정 (웹 마법사에서 복사)
SERVER_URL = "http://192.168.1.100:3000"  # 서버 주소
DEVICE_ID = "pi-001"                       # 디바이스 ID
DEVICE_KEY = "DK_xxxxxxxxxxxxx"            # 디바이스 키
```

### 5단계: 실행

```bash
python3 smartfarm_client.py
```

### 6단계: 로그 확인

```
🌉 SmartFarm Universal Bridge - Python Client
==================================================
서버: http://192.168.1.100:3000
디바이스 ID: pi-001
==================================================

📊 [10:15:30] 센서 데이터 수집 중...
   🌡️  온도: 25.5 °C
   💧 습도: 65.2 %
   ✅ 전송 성공: 2개 센서 데이터 저장 완료
💤 30초 대기 중...
```

## 🔧 고급 사용법

### systemd 서비스로 자동 실행

```bash
sudo nano /etc/systemd/system/smartfarm.service
```

```ini
[Unit]
Description=SmartFarm Client
After=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/smartfarm
ExecStart=/usr/bin/python3 /home/pi/smartfarm/smartfarm_client.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable smartfarm
sudo systemctl start smartfarm
sudo systemctl status smartfarm
```

## 📊 문제 해결

### 연결 오류
```python
❌ 전송 실패: Connection refused

해결: 서버 주소와 포트 확인
```

### DHT22 센서 오류
```python
❌ Failed to read from DHT sensor

해결: 배선 확인, sudo 권한으로 실행
```

---

간단하죠? 5분이면 완료! 🚀

