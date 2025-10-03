"use client";
import React from "react";
import { getSafeOutputPins, getSafePwmPins, isPwmSupportedPin } from "@/lib/iot/pinPolicy";

interface PinPickerProps {
  value: number;
  onChange: (pin: number) => void;
  pwm?: boolean;
  label?: string;
  className?: string;
}

export function PinPicker({ 
  value, 
  onChange, 
  pwm = false, 
  label = "핀 선택",
  className = ""
}: PinPickerProps) {
  const pins = pwm ? getSafePwmPins() : getSafeOutputPins();

  return (
    <div className={`space-y-2 ${className}`}>
      <label className="block text-sm font-medium text-gray-700">
        {label} {pwm && <span className="text-blue-600">(PWM 지원)</span>}
      </label>
      
      <div className="flex flex-wrap gap-2">
        {pins.map(pin => (
          <button
            key={pin}
            type="button"
            className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${
              pin === value
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
            }`}
            onClick={() => onChange(pin)}
          >
            GPIO{pin}
            {pwm && isPwmSupportedPin(pin) && (
              <span className="ml-1 text-xs text-blue-500">• PWM</span>
            )}
          </button>
        ))}
      </div>
      
      {value > 0 && (
        <p className="text-xs text-gray-500">
          선택된 핀: GPIO{value}
          {pwm && isPwmSupportedPin(value) && " (PWM 지원)"}
        </p>
      )}
    </div>
  );
}

// I2C 핀 표시 컴포넌트 (디바이스별 동적)
export function I2CPinDisplay({ device = 'esp32' }: { device?: string }) {
  const getI2CPins = (device: string) => {
    switch (device) {
      case 'esp32':
        return { sda: 'GPIO21', scl: 'GPIO22' };
      case 'arduino':
      case 'arduino_uno':
      case 'arduino_r4':
        return { sda: 'A4', scl: 'A5' };
      case 'raspberry_pi':
      case 'raspberry_pi3':
      case 'raspberry_pi4':
      case 'raspberry_pi5':
        return { sda: 'GPIO2', scl: 'GPIO3' };
      case 'esp8266':
        return { sda: 'D2', scl: 'D1' };
      default:
        return { sda: 'GPIO21', scl: 'GPIO22' };
    }
  };

  const i2cPins = getI2CPins(device);
  const deviceNames: Record<string, string> = {
    'esp32': 'ESP32',
    'arduino': 'Arduino',
    'arduino_uno': 'Arduino Uno',
    'arduino_r4': 'Arduino R4',
    'raspberry_pi': 'Raspberry Pi',
    'raspberry_pi3': 'Raspberry Pi 3',
    'raspberry_pi4': 'Raspberry Pi 4',
    'raspberry_pi5': 'Raspberry Pi 5',
    'esp8266': 'ESP8266'
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        I2C 통신 핀 <span className="text-green-600">(고정)</span>
      </label>
      
      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center space-x-1">
            <span className="font-medium text-green-800">SDA:</span>
            <span className="bg-green-100 text-green-800 px-2 py-1 rounded">{i2cPins.sda}</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="font-medium text-green-800">SCL:</span>
            <span className="bg-green-100 text-green-800 px-2 py-1 rounded">{i2cPins.scl}</span>
          </div>
        </div>
        <p className="text-xs text-green-600 mt-1">
          I2C 핀은 {deviceNames[device] || 'ESP32'} 표준에 따라 고정됩니다.
        </p>
      </div>
    </div>
  );
}
