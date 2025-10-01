# 🌉 Universal IoT Bridge v2.0

## Production-Ready Enterprise IoT Integration Platform

### Features

- 🔐 **3-Stage Provisioning**: Claim → Bind → Rotate
- 🏢 **Multi-Tenant**: Complete data isolation with RLS
- 📋 **Schema Registry**: Zod-based validation with versioning
- 🔄 **Reliability**: Idempotency, QoS, offline buffering
- 📊 **Observability**: OpenTelemetry integration
- 🛡️ **Security**: PSK/JWT/X.509, rate limiting, CORS
- 🌐 **Multi-Protocol**: MQTT, HTTP, WebSocket, Serial, BLE

### Quick Start

```bash
# Install dependencies
npm install

# Development
npm run dev

# Build
npm run build

# Production
npm start
```

### Environment Variables

```bash
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Security
BRIDGE_ENCRYPTION_KEY=your-32-character-secret-key

# Redis (for idempotency & rate limiting)
BRIDGE_REDIS_URL=redis://localhost:6379

# MQTT (optional)
BRIDGE_MQTT_BROKER_TYPE=managed  # or 'self-hosted'
BRIDGE_MQTT_URL=mqtts://mqtt.smartfarm.app:8883
BRIDGE_MQTT_USERNAME=
BRIDGE_MQTT_PASSWORD=

# HTTP/WS
BRIDGE_HTTP_PORT=3000
BRIDGE_WS_PORT=8080

# Observability
BRIDGE_OTEL_ENABLED=true
BRIDGE_OTEL_ENDPOINT=http://localhost:4318

# Logging
NODE_ENV=production
LOG_LEVEL=info
```

### Architecture

See [../../docs/UNIVERSAL_BRIDGE_ARCHITECTURE.md](../../docs/UNIVERSAL_BRIDGE_ARCHITECTURE.md)

### Documentation

- [Device Provisioning](../../docs/13_UNIVERSAL_BRIDGE_V2.md)
- [Connection Wizard](../../docs/15_CONNECTION_WIZARD.md)
- [Integration Kits](../../docs/16_INTEGRATION_KITS.md)

---

**Status**: 🚧 Under Development (Skeleton Phase)

