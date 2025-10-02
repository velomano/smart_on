"use client";

import { useEffect, useMemo, useState } from "react";
import { DeviceModelSchema, ProvisionSchema, type DeviceModel, type ProvisionInput } from "@/lib/iot/schema";

// shadcn/ui (프로젝트에 이미 설치돼 있다고 가정)
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";

// 간단 헬퍼
function dl(filename: string, text: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([text], { type: "application/json" }));
  a.download = filename; a.click();
  URL.revokeObjectURL(a.href);
}

export default function IoTDesignerUnifiedPage() {
  // ---- Designer 상태 ----
  const [modelJson, setModelJson] = useState<string>(() => JSON.stringify({
    id: "temperature-sensor",
    protocol: "mqtt",
    topics: {
      telemetry: "tenants/${TENANT_ID}/devices/${DEVICE_ID}/telemetry",
      commands:  "tenants/${TENANT_ID}/devices/${DEVICE_ID}/commands/#",
      status:    "tenants/${TENANT_ID}/devices/${DEVICE_ID}/status"
    },
    properties: [
      { key: "temp", unit: "°C", type: "number", min: -40, max: 85, pollMs: 1000 }
    ],
    rules: [{ expr: "temp > 35", action: "warn", message: "High temperature" }]
  }, null, 2));

  const parsedModel = useMemo(() => {
    try { return { ok: true as const, data: DeviceModelSchema.parse(JSON.parse(modelJson)) }; }
    catch (e: any) { return { ok: false as const, error: e?.message ?? String(e) }; }
  }, [modelJson]);

  // ---- Provisioning 상태 ----
  const [prov, setProv] = useState<ProvisionInput>({
    deviceId: "temp-001",
    tenantId: "demo-tenant",
    mqttUrl: "mqtt://localhost:1883",
    intervalMs: 5000,
  });

  // ---- Live Test 상태 ----
  const [status, setStatus] = useState<"idle"|"online"|"offline">("idle");
  const [telemetry, setTelemetry] = useState<string[]>([]);
  const [testing, setTesting] = useState(false);

  async function handleExportDesigner() {
    if (!parsedModel.ok) {
      toast({ title: "모델 오류", description: parsedModel.error, variant: "destructive" });
      return;
    }
    // 서버(브릿지)로 업로드하는 API 호출(목업)
    const res = await fetch("/api/iot/models", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(parsedModel.data)
    });
    if (!res.ok) {
      toast({ title: "업로드 실패", description: await res.text(), variant: "destructive" });
      return;
    }
    toast({ title: "디자이너 산출물 업로드 완료", description: "서버 브릿지가 모델을 사용할 수 있어요." });
  }

  function handleDownloadEnv() {
    const check = ProvisionSchema.safeParse(prov);
    if (!check.success) {
      toast({ title: "입력값 확인", description: check.error.issues.map(i=>i.message).join(", "), variant: "destructive" });
      return;
    }
    const env = [
      `DEVICE_ID=${prov.deviceId}`,
      `TENANT_ID=${prov.tenantId}`,
      `MQTT_URL=${prov.mqttUrl}`,
      `TELEMETRY_INTERVAL_MS=${prov.intervalMs}`
    ].join("\n");
    dl(".env", env + "\n");
    toast({ title: ".env 다운로드 완료", description: "라즈베리파이에 배포하세요." });
  }

  async function handleLiveTestStart() {
    if (!parsedModel.ok) {
      toast({ title: "모델 오류", description: parsedModel.error, variant: "destructive" });
      return;
    }
    setTesting(true);
    setTelemetry([]);
    setStatus("idle");
    const res = await fetch("/api/iot/live-test/start", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ modelId: parsedModel.data.id, deviceId: prov.deviceId })
    });
    if (!res.ok) {
      toast({ title: "테스트 시작 실패", description: await res.text(), variant: "destructive" });
      setTesting(false);
      return;
    }
    setStatus("online");
    toast({ title: "라이브 테스트 시작", description: "브릿지와 장치 상태를 확인 중…" });
  }

  async function handleSendCommand() {
    const res = await fetch("/api/iot/live-test/command", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ deviceId: prov.deviceId, cmd: "ping", payload: { now: Date.now() } })
    });
    if (!res.ok) {
      toast({ title: "명령 전송 실패", description: await res.text(), variant: "destructive" });
      return;
    }
    toast({ title: "명령 전송", description: "장치로 ping 명령을 보냈습니다." });
  }

  // 데모용 텔레메트리 폴링 (실제로는 SSE/WebSocket 권장)
  useEffect(() => {
    if (!testing) return;
    const iv = setInterval(async () => {
      const res = await fetch(`/api/iot/live-test/telemetry?deviceId=${encodeURIComponent(prov.deviceId)}`);
      if (res.ok) {
        const arr: string[] = await res.json();
        setTelemetry(arr.slice(-20));
      } else {
        setStatus("offline");
      }
    }, 2000);
    return () => clearInterval(iv);
  }, [testing, prov.deviceId]);

  return (
    <div className="mx-auto max-w-5xl p-6 space-y-6">
      <h1 className="text-2xl font-bold">IoT Designer — Provisioning — Live Test (Unified)</h1>

      <Tabs defaultValue="designer" className="w-full">
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="designer">1) Designer</TabsTrigger>
          <TabsTrigger value="provision">2) Provisioning</TabsTrigger>
          <TabsTrigger value="live">3) Live Test</TabsTrigger>
        </TabsList>

        {/* Designer */}
        <TabsContent value="designer">
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>디바이스 모델 정의(JSON)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Label htmlFor="model">Model JSON</Label>
              <Textarea id="model" className="min-h-[260px] font-mono"
                value={modelJson} onChange={(e)=>setModelJson(e.target.value)} />
              {!parsedModel.ok ? (
                <p className="text-sm text-red-500">❌ {parsedModel.error}</p>
              ) : (
                <p className="text-sm text-green-600">✅ 유효한 모델입니다: <code>{parsedModel.data.id}</code></p>
              )}
            </CardContent>
            <CardFooter className="gap-2">
              <Button onClick={handleExportDesigner} disabled={!parsedModel.ok}>서버로 업로드</Button>
              <Button variant="secondary" onClick={()=>dl(`${Date.now()}-${parsedModel.ok ? parsedModel.data.id : "model"}.json`, modelJson)}>
                JSON 다운로드
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Provisioning */}
        <TabsContent value="provision">
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>라즈베리파이 .env 생성</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>DEVICE_ID</Label>
                <Input value={prov.deviceId} onChange={(e)=>setProv(p=>({...p, deviceId: e.target.value}))}/>
                <Label>TENANT_ID</Label>
                <Input value={prov.tenantId} onChange={(e)=>setProv(p=>({...p, tenantId: e.target.value}))}/>
              </div>
              <div className="space-y-2">
                <Label>MQTT_URL</Label>
                <Input value={prov.mqttUrl} onChange={(e)=>setProv(p=>({...p, mqttUrl: e.target.value}))}/>
                <Label>TELEMETRY_INTERVAL_MS</Label>
                <Input type="number" value={prov.intervalMs} onChange={(e)=>setProv(p=>({...p, intervalMs: Number(e.target.value)||5000}))}/>
              </div>
              <div className="col-span-1 md:col-span-2 text-sm text-muted-foreground">
                ⚠️ Wi-Fi SSID/비밀번호는 코드에 하드코딩하지 않습니다. OS(wpa_supplicant/NM)에서 설정하거나, 캡티브 포털/원격 토큰 프로비저닝을 사용하세요.
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleDownloadEnv}>.env 다운로드</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Live Test */}
        <TabsContent value="live">
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>라이브 테스트</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Button onClick={handleLiveTestStart}>테스트 시작</Button>
                <Button variant="secondary" onClick={handleSendCommand}>명령(ping) 전송</Button>
                <span className={`text-sm ${status==="online"?"text-green-600":status==="offline"?"text-red-600":"text-muted-foreground"}`}>
                  상태: {status}
                </span>
              </div>
              <div className="space-y-2">
                <Label>최근 텔레메트리</Label>
                <div className="rounded-md border p-3 font-mono text-sm min-h-[120px] max-h-[260px] overflow-auto">
                  {telemetry.length===0 ? <span className="text-muted-foreground">데이터 없음</span> :
                    telemetry.map((t,i)=><div key={i}>{t}</div>)}
                </div>
              </div>
            </CardContent>
            <CardFooter className="text-sm text-muted-foreground">
              실제 운영에서는 WebSocket/SSE로 브릿지와 실시간 연결을 권장합니다.
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
