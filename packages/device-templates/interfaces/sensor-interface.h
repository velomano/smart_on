/**
 * Universal IoT Sensor Interface
 * 80/20 원칙 기반 추상화 시스템
 */

#ifndef SENSOR_INTERFACE_H
#define SENSOR_INTERFACE_H

#include <vector>
#include <String.h>

struct SensorReading {
  String key;
  float value;
  String unit;
  unsigned long timestamp;
  
  SensorReading(const String& k, float v, const String& u) 
    : key(k), value(v), unit(u), timestamp(millis()) {}
};

class ISensor {
public:
  virtual ~ISensor() = default;
  virtual bool begin() = 0;
  virtual bool read(std::vector<SensorReading>& readings) = 0;
  virtual String getModel() const = 0;
  virtual String getInterface() const = 0;
  virtual bool isConnected() const = 0;
};

// 자동 탐지 센서 래퍼
class AutoDetectSensor : public ISensor {
public:
  AutoDetectSensor(const String& type, int pin, const String& interface);
  bool begin() override;
  bool read(std::vector<SensorReading>& readings) override;
  String getModel() const override { return "AutoDetect"; }
  String getInterface() const override { return interface_; }
  bool isConnected() const override { return driver_ != nullptr && driver_->isConnected(); }
  
private:
  String type_;
  String interface_;
  int pin_;
  std::unique_ptr<ISensor> driver_;
  
  void scanAndDetect();
  std::unique_ptr<ISensor> createDriver(const String& detectedModel);
};

// PseudoDriver - 모델 미선택 시 더미값 발행
class PseudoSensor : public ISensor {
public:
  PseudoSensor(const String& type, int pin);
  bool begin() override { return true; }
  bool read(std::vector<SensorReading>& readings) override;
  String getModel() const override { return "Pseudo"; }
  String getInterface() const override { return "simulation"; }
  bool isConnected() const override { return true; }
  
private:
  String type_;
  int pin_;
  unsigned long lastUpdate_;
  float generateSimulatedValue();
};

// I2C 자동 탐지 센서
class AutoI2CSensor : public ISensor {
public:
  AutoI2CSensor(int sdaPin, int sclPin);
  bool begin() override;
  bool read(std::vector<SensorReading>& readings) override;
  String getModel() const override { return detectedModel_; }
  String getInterface() const override { return "i2c"; }
  bool isConnected() const override { return driver_ != nullptr; }
  
private:
  int sdaPin_, sclPin_;
  String detectedModel_;
  std::unique_ptr<ISensor> driver_;
  
  void scanI2C();
  String detectModelByAddress(uint8_t address);
};

// OneWire 자동 탐지 센서
class AutoOneWireSensor : public ISensor {
public:
  AutoOneWireSensor(int dataPin);
  bool begin() override;
  bool read(std::vector<SensorReading>& readings) override;
  String getModel() const override { return detectedModel_; }
  String getInterface() const override { return "onewire"; }
  bool isConnected() const override { return driver_ != nullptr; }
  
private:
  int dataPin_;
  String detectedModel_;
  std::unique_ptr<ISensor> driver_;
  
  void scanOneWire();
  String detectModelByROM(uint8_t* rom);
};

// 아날로그 센서 (범용)
class GenericAnalogSensor : public ISensor {
public:
  GenericAnalogSensor(int pin, const String& type);
  bool begin() override;
  bool read(std::vector<SensorReading>& readings) override;
  String getModel() const override { return "GenericAnalog"; }
  String getInterface() const override { return "analog"; }
  bool isConnected() const override { return true; }
  
private:
  int pin_;
  String type_;
  float convertToValue(int raw);
};

#endif // SENSOR_INTERFACE_H
