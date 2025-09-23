-- RLS 정책 설정
-- 모든 테이블에 RLS 활성화
alter table tenants enable row level security;
alter table users enable row level security;
alter table memberships enable row level security;
alter table farms enable row level security;
alter table beds enable row level security;
alter table devices enable row level security;
alter table sensors enable row level security;
alter table sensor_readings enable row level security;
alter table commands enable row level security;
alter table rules enable row level security;
alter table alerts enable row level security;
alter table audits enable row level security;

-- 테넌트별 접근 제어 함수
create or replace function get_user_tenant_id()
returns uuid as $$
  select (auth.jwt() ->> 'tenant_id')::uuid;
$$ language sql security definer;

-- tenants 정책
create policy p_select_tenants on tenants
  for select using (
    exists(
      select 1 from memberships m
      where m.tenant_id = tenants.id
        and m.user_id = auth.uid()
    )
  );

-- farms 정책
create policy p_select_farms on farms
  for select using (
    exists(
      select 1 from memberships m
      where m.tenant_id = farms.tenant_id
        and m.user_id = auth.uid()
    )
  );

create policy p_insert_farms on farms
  for insert with check (
    exists(
      select 1 from memberships m
      where m.tenant_id = farms.tenant_id
        and m.user_id = auth.uid()
        and m.role in ('owner', 'operator')
    )
  );

-- beds 정책
create policy p_select_beds on beds
  for select using (
    exists(
      select 1 from memberships m
      join farms f on f.tenant_id = m.tenant_id
      where f.id = beds.farm_id
        and m.user_id = auth.uid()
    )
  );

create policy p_insert_beds on beds
  for insert with check (
    exists(
      select 1 from memberships m
      join farms f on f.tenant_id = m.tenant_id
      where f.id = beds.farm_id
        and m.user_id = auth.uid()
        and m.role in ('owner', 'operator')
    )
  );

-- devices 정책
create policy p_select_devices on devices
  for select using (
    exists(
      select 1 from memberships m
      join farms f on f.tenant_id = m.tenant_id
      where f.id = devices.farm_id
        and m.user_id = auth.uid()
    )
  );

create policy p_insert_devices on devices
  for insert with check (
    exists(
      select 1 from memberships m
      join farms f on f.tenant_id = m.tenant_id
      where f.id = devices.farm_id
        and m.user_id = auth.uid()
        and m.role in ('owner', 'operator')
    )
  );

-- sensors 정책
create policy p_select_sensors on sensors
  for select using (
    exists(
      select 1 from memberships m
      join farms f on f.tenant_id = m.tenant_id
      join devices d on d.farm_id = f.id
      where d.id = sensors.device_id
        and m.user_id = auth.uid()
    )
  );

-- sensor_readings 정책 (읽기 전용)
create policy p_select_sensor_readings on sensor_readings
  for select using (
    exists(
      select 1 from memberships m
      join farms f on f.tenant_id = m.tenant_id
      join devices d on d.farm_id = f.id
      join sensors s on s.device_id = d.id
      where s.id = sensor_readings.sensor_id
        and m.user_id = auth.uid()
    )
  );

-- commands 정책
create policy p_select_commands on commands
  for select using (
    exists(
      select 1 from memberships m
      join farms f on f.tenant_id = m.tenant_id
      join devices d on d.farm_id = f.id
      where d.id = commands.device_id
        and m.user_id = auth.uid()
    )
  );

create policy p_insert_commands on commands
  for insert with check (
    exists(
      select 1 from memberships m
      join farms f on f.tenant_id = m.tenant_id
      join devices d on d.farm_id = f.id
      where d.id = commands.device_id
        and m.user_id = auth.uid()
        and m.role in ('owner', 'operator')
    )
  );

-- rules 정책
create policy p_select_rules on rules
  for select using (
    exists(
      select 1 from memberships m
      where m.tenant_id = (select tenant_id from farms where id = rules.farm_id)
        and m.user_id = auth.uid()
    )
  );

create policy p_insert_rules on rules
  for insert with check (
    exists(
      select 1 from memberships m
      where m.tenant_id = (select tenant_id from farms where id = rules.farm_id)
        and m.user_id = auth.uid()
        and m.role = 'owner'
    )
  );

-- alerts 정책
create policy p_select_alerts on alerts
  for select using (
    exists(
      select 1 from memberships m
      where m.tenant_id = (select tenant_id from farms where id = alerts.farm_id)
        and m.user_id = auth.uid()
    )
  );

-- audits 정책 (읽기 전용)
create policy p_select_audits on audits
  for select using (
    user_id = auth.uid() or
    exists(
      select 1 from memberships m
      where m.user_id = auth.uid()
        and m.role = 'owner'
    )
  );
