/**
 * Universal IoT Actuator Interface
 * 80/20 원칙 기반 추상화 시스템
 */

#ifndef ACTUATOR_INTERFACE_H
#define ACTUATOR_INTERFACE_H

#include <String.h>

struct ActuatorCommand {
  String key;
  float value;
  String unit;
  unsigned long timestamp;
  
  ActuatorCommand(const String& k, float v, const String& u) 
    : key(k), value(v), unit(u), timestamp(millis()) {}
};

class IActuator {
public:
  virtual ~IActuator() = default;
  virtual bool begin() = 0;
  virtual bool set(const ActuatorCommand& command) = 0;
  virtual String getModel() const = 0;
  virtual String getInterface() const = 0;
  virtual bool isConnected() const = 0;
};

// 릴레이 (범용 GPIO)
class GenericRelay : public IActuator {
public:
  GenericRelay(int pin, bool inverted = false);
  bool begin() override;
  bool set(const ActuatorCommand& command) override;
  String getModel() const override { return "GenericRelay"; }
  String getInterface() const override { return "gpio"; }
  bool isConnected() const override { return true; }
  
private:
  int pin_;
  bool inverted_;
};

// DC 모터 (PWM + 방향)
class GenericDCMotor : public IActuator {
public:
  GenericDCMotor(int pwmPin, int dirPin1, int dirPin2, int channel = 0);
  bool begin() override;
  bool set(const ActuatorCommand& command) override;
  String getModel() const override { return "GenericDCMotor"; }
  String getInterface() const override { return "pwm+dir"; }
  bool isConnected() const override { return true; }
  
private:
  int pwmPin_, dirPin1_, dirPin2_, channel_;
  void setDirection(bool forward);
};

// 서보 모터 (PWM)
class GenericServo : public IActuator {
public:
  GenericServo(int pin, int channel = 0);
  bool begin() override;
  bool set(const ActuatorCommand& command) override;
  String getModel() const override { return "GenericServo"; }
  String getInterface() const override { return "pwm"; }
  bool isConnected() const override { return true; }
  
private:
  int pin_, channel_;
};

// LED (PWM 또는 GPIO)
class GenericLED : public IActuator {
public:
  GenericLED(int pin, bool pwm = true, int channel = 0);
  bool begin() override;
  bool set(const ActuatorCommand& command) override;
  String getModel() const override { return "GenericLED"; }
  String getInterface() const override { return pwm_ ? "pwm" : "gpio"; }
  bool isConnected() const override { return true; }
  
private:
  int pin_, channel_;
  bool pwm_;
};

// 부저 (PWM)
class GenericBuzzer : public IActuator {
public:
  GenericBuzzer(int pin, int channel = 0);
  bool begin() override;
  bool set(const ActuatorCommand& command) override;
  String getModel() const override { return "GenericBuzzer"; }
  String getInterface() const override { return "pwm"; }
  bool isConnected() const override { return true; }
  
private:
  int pin_, channel_;
};

#endif // ACTUATOR_INTERFACE_H
