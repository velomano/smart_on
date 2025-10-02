import mqtt from 'mqtt';
import { BridgeAdapter, Telemetry, Command, Ack } from '@smart-on/core/bridge';
import { b64ToBytes } from '@smart-on/core/codec';

type Mode = 'mqtt'|'webhook';
type LNSType = 'the-things-stack'|'chirpstack'|'carrier';

export type LoraWanCfg = {
  transport: 'lorawan';
  mode: Mode;
  lns: LNSType;
  region: string;
  deviceMap?: Record<string,string>; // DevEUI -> device_id
  codec?: { type:'js'; script?: string; scriptRef?: string };
  mqtt?: {
    host: string; port: number; username: string; password: string;
    uplinkTopic: string;       // v3/appId/devices/+/up
    downlinkTopicTpl: string;  // v3/appId/devices/{devId}/down/push
    tls?: boolean;
  };
  webhook?: { secret: string; path: string; }; // /rpc/lorawan/webhook
  api?: { baseUrl: string; token: string };    // downlink(웹훅 모드)
};

export class LoraWanAdapter implements BridgeAdapter {
  name: 'lorawan' = 'lorawan';
  private client?: mqtt.MqttClient;

  constructor(
    private cfg: LoraWanCfg,
    private uplinkPublish: (t: Telemetry)=>Promise<void>
  ) {}

  async init() {
    if (this.cfg.mode === 'mqtt' && this.cfg.mqtt) {
      const url = `${this.cfg.mqtt.tls===false?'mqtt':'mqtts'}://${this.cfg.mqtt.host}:${this.cfg.mqtt.port}`;
      this.client = mqtt.connect(url, { username: this.cfg.mqtt.username, password: this.cfg.mqtt.password });
      this.client.subscribe(this.cfg.mqtt.uplinkTopic);
      this.client.on('message', async (_topic, buf) => {
        try {
          const raw = JSON.parse(buf.toString());
          const devEui = raw?.end_device_ids?.dev_eui || raw?.deviceInfo?.devEui || 'unknown';
          const device_id = this.cfg.deviceMap?.[devEui] ?? devEui;
          const ts = raw?.received_at || new Date().toISOString();
          const frm = raw?.uplink_message?.frm_payload || raw?.data?.payload || '';
          const bytes = typeof frm === 'string' ? b64ToBytes(frm) : Buffer.from([]);
          const metrics = await this.decode(bytes);
          await this.uplinkPublish({ device_id, ts, metrics, status:'ok' });
        } catch {}
      });
    }
  }

  async publishTelemetry(_t: Telemetry) {}

  async sendCommand(c: Command): Promise<Ack> {
    const devId = (c.params.devId ?? c.device_id) as string;
    const port  = (c.params.port ?? 10) as number;
    const bytes: number[] = c.params.bytes ?? [];
    const b64 = Buffer.from(Uint8Array.from(bytes)).toString('base64');

    if (this.client && this.cfg.mode==='mqtt' && this.cfg.mqtt) {
      const topic = this.cfg.mqtt.downlinkTopicTpl.replace('{devId}', devId);
      this.client.publish(topic, JSON.stringify({ downlinks:[{ f_port:port, frm_payload:b64, confirmed:false }]}));
      return { ok: true };
    }
    if (this.cfg.mode==='webhook' && this.cfg.api) {
      const url = `${this.cfg.api.baseUrl}/devices/${devId}/queue`;
      const res = await fetch(url, {
        method:'POST',
        headers:{ 'authorization':this.cfg.api.token, 'content-type':'application/json' },
        body: JSON.stringify({ deviceQueueItem:{ fPort:port, data:b64, confirmed:false } })
      });
      return { ok: res.ok, message: res.statusText };
    }
    return { ok:false, message:'unsupported' };
  }

  private async decode(bytes: Buffer): Promise<Record<string, any>> {
    if (!this.cfg.codec?.script) return { payload_size: bytes.length };
    const fn = new Function('bytes', `${this.cfg.codec.script}; return decode(bytes);`);
    return fn(Array.from(bytes));
  }
}
