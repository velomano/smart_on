import React, { useState } from 'react';

interface FarmMqttSettingsFormProps {
  farmId: string;
  farmName: string;
  initialConfig?: any;
  onSave: (config: any) => Promise<void>;
  onTest: () => Promise<boolean>;
}

export default function FarmMqttSettingsForm({
  farmId,
  farmName,
  initialConfig,
  onSave,
  onTest
}: FarmMqttSettingsFormProps) {
  const [config, setConfig] = useState({
    broker_url: initialConfig?.broker_url || '',
    port: initialConfig?.port || 8883,
    auth_mode: initialConfig?.auth_mode || 'api_key',
    username: initialConfig?.username || '',
    api_key: '',
    password: '',
    client_id_prefix: initialConfig?.client_id_prefix || 'terahub-bridge',
    ws_path: initialConfig?.ws_path || '',
    qos_default: initialConfig?.qos_default || 1,
  });

  const [testResult, setTestResult] = useState<{
    testing: boolean;
    success: boolean | null;
    message: string;
  }>({
    testing: false,
    success: null,
    message: ''
  });

  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      await onSave(config);
      alert('MQTT 설정이 저장되었습니다.');
    } catch (error) {
      alert('저장에 실패했습니다: ' + (error as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTestResult({ testing: true, success: null, message: '' });
    
    try {
      const success = await onTest();
      setTestResult({
        testing: false,
        success,
        message: success ? '연결 성공!' : '연결 실패'
      });
    } catch (error) {
      setTestResult({
        testing: false,
        success: false,
        message: '테스트 중 오류 발생: ' + (error as Error).message
      });
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900">MQTT 브로커 설정</h3>
        <div className="text-sm text-gray-500">
          농장 ID: {farmId.slice(0, 8)}...
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 기본 설정 */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              브로커 URL *
            </label>
            <input
              type="text"
              value={config.broker_url}
              onChange={(e) => setConfig(prev => ({ ...prev, broker_url: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
              placeholder="mqtts://your-broker.com 또는 wss://your-broker.com/mqtt"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              💡 SSL/TLS를 사용하려면 mqtts:// 또는 wss://를 사용하세요
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              포트 *
            </label>
            <input
              type="number"
              value={config.port}
              onChange={(e) => setConfig(prev => ({ ...prev, port: parseInt(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
              placeholder="8883"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              💡 일반적으로 1883 (비암호화), 8883 (SSL), 443 (WSS)
            </p>
          </div>
        </div>

        {/* 인증 방식 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            인증 방식 *
          </label>
          <div className="flex space-x-4">
            <label className="flex items-center text-gray-900">
              <input
                type="radio"
                value="api_key"
                checked={config.auth_mode === 'api_key'}
                onChange={(e) => setConfig(prev => ({ ...prev, auth_mode: e.target.value }))}
                className="mr-2"
              />
              API 키
            </label>
            <label className="flex items-center text-gray-900">
              <input
                type="radio"
                value="user_pass"
                checked={config.auth_mode === 'user_pass'}
                onChange={(e) => setConfig(prev => ({ ...prev, auth_mode: e.target.value }))}
                className="mr-2"
              />
              사용자명/비밀번호
            </label>
          </div>
        </div>

        {/* 인증 정보 */}
        <div className="grid grid-cols-2 gap-4">
          {config.auth_mode === 'user_pass' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                사용자명
              </label>
              <input
                type="text"
                value={config.username}
                onChange={(e) => setConfig(prev => ({ ...prev, username: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                placeholder="username"
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {config.auth_mode === 'api_key' ? 'API 키 *' : '비밀번호 *'}
            </label>
            <input
              type="password"
              value={config.auth_mode === 'api_key' ? config.api_key : config.password}
              onChange={(e) => setConfig(prev => ({ 
                ...prev, 
                [config.auth_mode === 'api_key' ? 'api_key' : 'password']: e.target.value 
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
              placeholder={config.auth_mode === 'api_key' ? 'API 키 입력' : '비밀번호 입력'}
              required
            />
          </div>
        </div>

        {/* 고급 설정 */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              클라이언트 ID 접두사
            </label>
            <input
              type="text"
              value={config.client_id_prefix}
              onChange={(e) => setConfig(prev => ({ ...prev, client_id_prefix: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
              placeholder="terahub-bridge"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              WebSocket 경로
            </label>
            <input
              type="text"
              value={config.ws_path}
              onChange={(e) => setConfig(prev => ({ ...prev, ws_path: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
              placeholder="/mqtt"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            기본 QoS 레벨
          </label>
          <select
            value={config.qos_default}
            onChange={(e) => setConfig(prev => ({ ...prev, qos_default: parseInt(e.target.value) }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
          >
            <option value={0}>QoS 0 (최대 한 번)</option>
            <option value={1}>QoS 1 (최소 한 번)</option>
            <option value={2}>QoS 2 (정확히 한 번)</option>
          </select>
        </div>

        {/* 연결 테스트 결과 */}
        {testResult.success !== null && (
          <div className={`p-4 rounded-lg ${
            testResult.success 
              ? 'bg-green-50 border border-green-200 text-green-700'
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}>
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full mr-3 ${
                testResult.success ? 'bg-green-500' : 'bg-red-500'
              }`} />
              <span className="font-medium">
                {testResult.testing ? '연결 테스트 중...' : testResult.message}
              </span>
            </div>
          </div>
        )}

        {/* 버튼 */}
        <div className="flex space-x-4">
          <button
            type="button"
            onClick={handleTest}
            disabled={testResult.testing}
            className="flex-1 px-6 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 disabled:opacity-50 transition-colors"
          >
            {testResult.testing ? '연결 테스트 중...' : '연결 테스트'}
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 px-6 py-3 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 disabled:opacity-50 transition-colors"
          >
            {saving ? '저장 중...' : '설정 저장'}
          </button>
        </div>
      </form>
    </div>
  );
}
