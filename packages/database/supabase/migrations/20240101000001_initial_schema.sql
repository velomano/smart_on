-- 스마트팜 초기 스키마
-- 테넌트 및 사용자 관리
create extension if not exists pgcrypto;

create table if not exists tenants(
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz default now()
);

create table if not exists users(
  id uuid primary key,
  email text unique,
  name text,
  created_at timestamptz default now()
);

create table if not exists memberships(
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  role text not null check(role in('owner','operator','viewer')),
  unique(tenant_id, user_id)
);

-- 도메인 모델
create table if not exists farms(
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  name text not null,
  location text,
  created_at timestamptz default now()
);

create table if not exists beds(
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references farms(id) on delete cascade,
  name text not null,
  crop text,
  target_temp numeric,
  target_humidity numeric,
  target_ec numeric,
  target_ph numeric,
  created_at timestamptz default now()
);

create table if not exists devices(
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references farms(id) on delete cascade,
  bed_id uuid references beds(id) on delete set null,
  type text not null check (type in ('switch','pump','fan','light','motor','sensor_gateway')),
  vendor text,
  tuya_device_id text,
  status jsonb,
  meta jsonb,
  created_at timestamptz default now()
);

create table if not exists sensors(
  id uuid primary key default gen_random_uuid(),
  device_id uuid not null references devices(id) on delete cascade,
  type text not null,
  unit text,
  meta jsonb,
  created_at timestamptz default now()
);

create table if not exists sensor_readings(
  id bigserial primary key,
  sensor_id uuid not null references sensors(id) on delete cascade,
  ts timestamptz not null,
  value numeric not null,
  quality int default 1
);

create index if not exists idx_readings_sensor_ts on sensor_readings(sensor_id, ts desc);

create table if not exists commands(
  id uuid primary key default gen_random_uuid(),
  device_id uuid not null references devices(id) on delete cascade,
  issued_by uuid references users(id),
  ts timestamptz default now(),
  command text not null,
  payload jsonb,
  status text not null default 'pending',
  correlation_id text unique
);

create table if not exists rules(
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references farms(id) on delete cascade,
  name text not null,
  trigger jsonb not null,
  condition jsonb,
  action jsonb not null,
  enabled boolean default true,
  version int default 1,
  updated_at timestamptz default now()
);

create table if not exists alerts(
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references farms(id) on delete cascade,
  bed_id uuid references beds(id) on delete set null,
  severity text check(severity in('info','warning','critical')),
  title text,
  detail text,
  ts timestamptz default now(),
  ack_by uuid references users(id)
);

create table if not exists audits(
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id),
  entity text, 
  entity_id uuid,
  action text, 
  diff jsonb,
  ts timestamptz default now()
);
