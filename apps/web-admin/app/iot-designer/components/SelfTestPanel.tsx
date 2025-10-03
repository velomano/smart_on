"use client";
import React, { useState } from "react";

export default function SelfTestPanel() {
  const [running, setRunning] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);

  async function triggerSelfTest() {
    try {
      setRunning(true);
      setLastResult(null);
      
      const response = await fetch("/api/iot/selftest", { 
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: "farm/bridge1/cmd/selftest",
          payload: "{}"
        })
      });
      
      const result = await response.json();
      setLastResult(result);
      
      if (result.ok) {
        alert("Self-Test 명령 전송 완료!\nMQTT 토픽에서 결과를 확인하세요.");
      } else {
        alert("전송 실패: " + (result.error || "알 수 없는 오류"));
      }
    } catch (error) {
      console.error('Self-Test 실행 오류:', error);
      alert("Self-Test 실행 중 오류가 발생했습니다.");
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-800">장치 자가 테스트</h3>
        <button
          disabled={running}
          onClick={triggerSelfTest}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            running
              ? 'bg-gray-400 text-white cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {running ? "전송 중..." : "Self-Test 실행"}
        </button>
      </div>
      
      <div className="space-y-2 text-sm text-gray-600">
        <p>• 릴레이/SSR/펌프를 순차 토글합니다</p>
        <p>• 부저가 있다면 PWM 스윕을 실행합니다</p>
        <p>• 결과는 MQTT <code className="bg-gray-100 px-1 rounded">/status/selftest</code> 토픽으로 수신됩니다</p>
      </div>

      {lastResult && (
        <div className={`mt-3 p-3 rounded-lg text-sm ${
          lastResult.ok 
            ? 'bg-green-50 border border-green-200 text-green-800'
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          <div className="font-medium">
            {lastResult.ok ? '✅ 전송 성공' : '❌ 전송 실패'}
          </div>
          {lastResult.message && (
            <div className="mt-1">{lastResult.message}</div>
          )}
          {lastResult.error && (
            <div className="mt-1">{lastResult.error}</div>
          )}
        </div>
      )}
    </div>
  );
}
