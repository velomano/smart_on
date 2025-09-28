-- MQTT 브리지 스키마 마이그레이션
-- 확장
create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

-- 농장별 MQTT 설정
create table if not exists farm_mqtt_configs (
  farm_id uuid primary key references farms(id) on delete cascade,
  broker_url text not null,            -- mqtts://host 또는 wss://host/mqtt
  port int not null default 8883,
  auth_mode text not null check (auth_mode in ('api_key','user_pass')),
  username text,
  secret_enc text,                     -- api_key 또는 password의 암호화 저장본
  client_id_prefix text default 'terahub-bridge',
  ws_path text,                        -- /mqtt (WSS일 때)
  qos_default int default 1,
  topics_version int default 1,
  is_active boolean default true,
  last_test_at timestamptz,
  last_test_ok boolean,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 센서/리딩 중복방지 & 조회 인덱스(이미 있으면 skip)
create unique index if not exists ux_sensors_device_type on sensors(device_id, type);
create unique index if not exists ux_sensor_readings_unique on sensor_readings(sensor_id, ts);
create index if not exists idx_readings_sensor_ts on sensor_readings(sensor_id, ts desc);

-- commands와 상관키
create unique index if not exists ux_commands_correlation on commands(correlation_id);
create index if not exists idx_commands_status_ts on commands(status, ts desc);

-- devices.status 온라인 퀵 필터(선택)
create index if not exists idx_devices_status_online on devices((status->>'online'));

-- 레시피 최신 업데이트(보너스)
create or replace view v_recent_recipes as
select
  r.id, c.common_name as crop, r.stage, r.volume_l,
  r.created_at, rs.title as source_title, rs.year as source_year, rs.license
from recipes r
join crops c on c.id = r.crop_id
left join recipe_sources rs on rs.id = r.source_id
where r.is_public = true
order by r.created_at desc
limit 20;

create table if not exists recipe_updates_log (
  day date primary key,
  added_count int not null default 0,
  last_update timestamptz default now()
);

create or replace function bump_recipe_updates_log()
returns trigger language plpgsql as $$
begin
  insert into recipe_updates_log(day, added_count, last_update)
  values (current_date, 1, now())
  on conflict (day) do update set
    added_count = recipe_updates_log.added_count + 1,
    last_update = now();
  return new;
end; $$;

drop trigger if exists trg_recipe_updates on recipes;
create trigger trg_recipe_updates
after insert on recipes
for each row execute function bump_recipe_updates_log();

-- 컴플라이언스(보너스)
alter table if not exists raw_documents add column if not exists is_open_access boolean;
alter table if not exists raw_documents add column if not exists license_url text;
alter table if not exists recipe_sources add column if not exists license text;
alter table if not exists recipe_sources add column if not exists license_url text;

create table if not exists takedown_requests (
  id uuid primary key default gen_random_uuid(),
  raw_id uuid references raw_documents(id) on delete set null,
  url text,
  reason text,
  requester text,
  status text default 'received',
  created_at timestamptz default now()
);

create table if not exists ingest_audit (
  id uuid primary key default gen_random_uuid(),
  action text not null,  -- 'fetch'|'parse'|'extract'|'upsert'
  source text,
  ref_id text,
  ok boolean default true,
  message text,
  created_at timestamptz default now()
);

-- RLS 정책: farm_mqtt_configs는 관리자/해당 농장 사용자만 읽고 쓰도록
create policy "Users can view farm mqtt configs in their tenant" on farm_mqtt_configs
  for select using (
    farm_id in (
      select tenant_id from memberships 
      where user_id = auth.uid()
    )
  );

create policy "Users can insert farm mqtt configs in their tenant" on farm_mqtt_configs
  for insert with check (
    farm_id in (
      select tenant_id from memberships 
      where user_id = auth.uid()
    )
  );

create policy "Users can update farm mqtt configs in their tenant" on farm_mqtt_configs
  for update using (
    farm_id in (
      select tenant_id from memberships 
      where user_id = auth.uid()
    )
  );

create policy "Users can delete farm mqtt configs in their tenant" on farm_mqtt_configs
  for delete using (
    farm_id in (
      select tenant_id from memberships 
      where user_id = auth.uid()
    )
  );

-- RLS 활성화
alter table farm_mqtt_configs enable row level security;
