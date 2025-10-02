'use client';
import { useState } from 'react';

export default function LoRaWanForm({ value, onChange }:{ value?:any; onChange:(v:any)=>void; }){
  const [mode,setMode] = useState(value?.mode ?? 'mqtt');
  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm">LNS</label>
        <select defaultValue={value?.lns ?? 'the-things-stack'} onChange={e=>onChange({ ...value, lns:e.target.value })} className="border p-2 rounded">
          <option value="the-things-stack">The Things Stack</option>
          <option value="chirpstack">ChirpStack</option>
          <option value="carrier">Carrier</option>
        </select>
      </div>
      <div>
        <label className="block text-sm">Mode</label>
        <select value={mode} onChange={e=>{ setMode(e.target.value); onChange({ ...value, mode:e.target.value }); }} className="border p-2 rounded">
          <option value="mqtt">MQTT</option>
          <option value="webhook">Webhook</option>
        </select>
      </div>
      {mode==='mqtt' && (
        <div className="grid grid-cols-2 gap-2">
          <input className="border p-2 rounded" placeholder="host" onChange={e=>onChange({ ...value, mqtt:{ ...(value?.mqtt||{}), host:e.target.value }})}/>
          <input className="border p-2 rounded" placeholder="port (8883)" onChange={e=>onChange({ ...value, mqtt:{ ...(value?.mqtt||{}), port:Number(e.target.value||8883) }})}/>
          <input className="border p-2 rounded col-span-2" placeholder="username(appId)" onChange={e=>onChange({ ...value, mqtt:{ ...(value?.mqtt||{}), username:e.target.value }})}/>
          <input className="border p-2 rounded col-span-2" placeholder="password(API key)" onChange={e=>onChange({ ...value, mqtt:{ ...(value?.mqtt||{}), password:e.target.value }})}/>
          <input className="border p-2 rounded col-span-2" placeholder="uplinkTopic v3/appId/devices/+/up" onChange={e=>onChange({ ...value, mqtt:{ ...(value?.mqtt||{}), uplinkTopic:e.target.value }})}/>
          <input className="border p-2 rounded col-span-2" placeholder="downlinkTopicTpl v3/appId/devices/{devId}/down/push" onChange={e=>onChange({ ...value, mqtt:{ ...(value?.mqtt||{}), downlinkTopicTpl:e.target.value }})}/>
        </div>
      )}
      {mode==='webhook' && (
        <div className="grid grid-cols-2 gap-2">
          <input className="border p-2 rounded col-span-2" placeholder="Webhook Secret(HMAC)" onChange={e=>onChange({ ...value, webhook:{ ...(value?.webhook||{}), secret:e.target.value }})}/>
          <input className="border p-2 rounded col-span-2" placeholder="Bridge Path /rpc/lorawan/webhook" onChange={e=>onChange({ ...value, webhook:{ ...(value?.webhook||{}), path:e.target.value }})}/>
          <input className="border p-2 rounded col-span-2" placeholder="API baseUrl (downlink)" onChange={e=>onChange({ ...value, api:{ ...(value?.api||{}), baseUrl:e.target.value }})}/>
          <input className="border p-2 rounded col-span-2" placeholder="API token (downlink)" onChange={e=>onChange({ ...value, api:{ ...(value?.api||{}), token:e.target.value }})}/>
        </div>
      )}
    </div>
  );
}
