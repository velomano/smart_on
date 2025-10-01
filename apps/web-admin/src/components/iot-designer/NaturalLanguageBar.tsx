// 자연어 입력바 컴포넌트
'use client';

import { useState } from 'react';
import { keywordMapping } from 'iot-templates';

interface NaturalLanguageBarProps {
  onParse: (result: { sensors: Array<{ type: string; count: number }>; controls: Array<{ type: string; count: number }> }) => void;
}

export function parseQuickKorean(input: string) {
  // 간단 규칙: 숫자+키워드 매핑
  // "온도 2개, 습도 1개, 스프링클러 4개, 팬 2개"
  const sensors: Array<{ type: string; count: number }> = [];
  const controls: Array<{ type: string; count: number }> = [];
  
  // 숫자와 키워드 추출
  const items = input.split(/[,，]/).map(item => item.trim());
  
  items.forEach(item => {
    const match = item.match(/(\d+)\s*개?\s*(.+)/);
    if (match) {
      const count = parseInt(match[1]);
      const keyword = match[2].trim();
      
      // 키워드 매핑
      const mappedType = keywordMapping[keyword as keyof typeof keywordMapping];
      if (mappedType) {
        // 센서인지 제어인지 판단
        if (['dht22', 'ds18b20', 'bh1750', 'soil_moisture', 'ph_sensor'].includes(mappedType)) {
          sensors.push({ type: mappedType, count });
        } else {
          controls.push({ type: mappedType, count });
        }
      }
    }
  });
  
  return { sensors, controls };
}

export default function NaturalLanguageBar({ onParse }: NaturalLanguageBarProps) {
  const [input, setInput] = useState('');
  const [isLLMEnabled, setIsLLMEnabled] = useState(false);
  
  const handleParse = () => {
    if (!input.trim()) return;
    
    try {
      const result = parseQuickKorean(input);
      onParse(result);
    } catch (error) {
      console.error('파싱 오류:', error);
    }
  };
  
  const handleLLMParse = async () => {
    if (!input.trim()) return;
    
    try {
      // LLM API 호출 (추후 구현)
      const response = await fetch('/api/iot/parse-natural-language', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input })
      });
      
      if (response.ok) {
        const result = await response.json();
        onParse(result);
      } else {
        // LLM 실패 시 규칙 기반 파서로 폴백
        const result = parseQuickKorean(input);
        onParse(result);
      }
    } catch (error) {
      console.error('LLM 파싱 오류:', error);
      // 폴백
      const result = parseQuickKorean(input);
      onParse(result);
    }
  };
  
  return (
    <div className="bg-white border rounded-lg p-6">
      <h3 className="text-lg font-bold mb-4">🤖 자연어 IoT 설계</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            시스템 설명을 자연어로 입력하세요:
          </label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="예: 온도 센서 2개, 습도 센서 1개, 스프링클러 4개, 팬 2개로 스마트팜을 만들어줘"
            className="w-full p-3 border rounded-lg resize-none"
            rows={3}
          />
        </div>
        
        <div className="flex items-center space-x-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={isLLMEnabled}
              onChange={(e) => setIsLLMEnabled(e.target.checked)}
              className="mr-2"
            />
            <span className="text-sm">AI 분석 사용 (LLM)</span>
          </label>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={handleParse}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            📋 규칙 기반 분석
          </button>
          <button
            onClick={handleLLMParse}
            disabled={!isLLMEnabled}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300"
          >
            🤖 AI 분석
          </button>
        </div>
        
        <div className="text-sm text-gray-600">
          <p>💡 예시 입력:</p>
          <ul className="list-disc list-inside ml-4">
            <li>"온도 센서 2개, 습도 센서 1개, 스프링클러 4개, 팬 2개"</li>
            <li>"토양 수분 센서 3개와 LED 조명 5개로 식물 재배 시스템"</li>
            <li>"환기창 자동 제어와 온도 모니터링이 가능한 온실 시스템"</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
