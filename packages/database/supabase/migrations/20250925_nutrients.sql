-- ions
create table if not exists nutrient_ions(
  id uuid primary key default gen_random_uuid(),
  symbol text unique not null,
  name text not null,
  valence int
);

insert into nutrient_ions(symbol,name,valence) values
  ('N_NO3','Nitrate-N',-1),
  ('N_NH4','Ammonium-N',1),
  ('P','Phosphorus',-3),
  ('K','Potassium',1),
  ('Ca','Calcium',2),
  ('Mg','Magnesium',2),
  ('S','Sulfur',-2),
  ('Fe','Iron',2),
  ('Mn','Manganese',2),
  ('B','Boron',3),
  ('Zn','Zinc',2),
  ('Cu','Copper',2),
  ('Mo','Molybdenum',6)
on conflict do nothing;

-- salts
create table if not exists salts(
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  formula text,
  purity_pct numeric default 100,
  density_kg_per_l numeric,
  ion_contributions jsonb not null -- { "N_NO3": 11.86, "Ca": 16.98 } (mass %)
);

insert into salts(name,formula,ion_contributions) values
  ('Calcium nitrate tetrahydrate','Ca(NO3)2·4H2O','{"N_NO3":11.86,"Ca":16.98}'),
  ('Potassium nitrate','KNO3','{"N_NO3":13.86,"K":38.67}'),
  ('Monopotassium phosphate','KH2PO4','{"P":22.76,"K":28.73}'),
  ('Magnesium sulfate heptahydrate','MgSO4·7H2O','{"Mg":9.86,"S":13.01}')
on conflict do nothing;

-- crops (기본 프로파일)
create table if not exists crop_profiles(
  id uuid primary key default gen_random_uuid(),
  crop_key text not null,
  crop_name text not null,
  stage text not null,
  target_ppm jsonb not null,  -- {"N_NO3":120,"P":30,"K":200,"Ca":150,"Mg":40,"S":60}
  target_ec numeric,
  target_ph numeric
);
create index if not exists crop_profiles_key_idx on crop_profiles(crop_key, stage);

-- 최소 시드(참고값, 현장 도입 전 검증 필수)
insert into crop_profiles(crop_key,crop_name,stage,target_ppm,target_ec,target_ph) values
  ('lettuce','상추','vegetative','{"N_NO3":120,"P":30,"K":200,"Ca":150,"Mg":40,"S":60}',1.6,6.0),
  ('tomato','토마토','vegetative','{"N_NO3":140,"P":40,"K":220,"Ca":150,"Mg":45,"S":70}',2.2,6.0),
  ('cucumber','오이','vegetative','{"N_NO3":130,"P":35,"K":230,"Ca":150,"Mg":45,"S":70}',2.0,6.0),
  ('strawberry','딸기','vegetative','{"N_NO3":110,"P":35,"K":180,"Ca":120,"Mg":40,"S":60}',1.5,5.8)
on conflict do nothing;

-- water profiles (기본값 2종)
create table if not exists water_profiles(
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid,
  name text not null,
  alkalinity_mg_per_l_as_caco3 numeric default 0,
  ph numeric default 7.0,
  existing_ions jsonb not null default '{}'::jsonb
);
insert into water_profiles(name,alkalinity_mg_per_l_as_caco3,ph,existing_ions) values
  ('RO_Default', 0, 6.5, '{}'),
  ('Well_Default', 80, 7.5, '{"Ca":20,"Mg":5,"S":10}')
on conflict do nothing;

-- mixing rules (기본 A/B 분리)
create table if not exists mixing_rules(
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid,
  name text not null,
  allow_salts uuid[],
  forbid_salts uuid[],
  constraints jsonb -- {"split": {"A":["Calcium nitrate tetrahydrate"],"B":["Monopotassium phosphate","Magnesium sulfate heptahydrate","Potassium nitrate"]}}
);

-- recipes + lines + adjustments + instructions
create table if not exists recipes(
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid,
  crop_profile_id uuid references crop_profiles(id),
  water_profile_id uuid references water_profiles(id),
  target_volume_l numeric not null,
  target_ec numeric,
  target_ph numeric,
  ec_est numeric,
  ph_est numeric,
  warnings jsonb,
  status text default 'draft',
  created_by uuid,
  created_at timestamptz default now()
);

create table if not exists recipe_lines(
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid references recipes(id) on delete cascade,
  salt_id uuid references salts(id),
  grams numeric not null,
  tank text default 'none'
);

create table if not exists acid_bases(
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null check (type in ('acid','base')),
  normality numeric not null
);
insert into acid_bases(name,type,normality) values
  ('Nitric acid 1N','acid',1.0),
  ('Phosphoric acid 1N','acid',1.0)
on conflict do nothing;

create table if not exists adjustments(
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid references recipes(id) on delete cascade,
  acid_base_id uuid references acid_bases(id),
  ml_needed numeric not null,
  rationale text
);

create table if not exists mixing_instructions(
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid references recipes(id) on delete cascade,
  step_no int not null,
  text text not null
);

-- 별칭 테이블(오탈자/한영 변환)
create table if not exists crop_alias(
  alias text primary key,
  crop_key text not null
);
insert into crop_alias(alias,crop_key) values
  ('상추','lettuce'),('lettus','lettuce'),('lettuce','lettuce'),
  ('토마토','tomato'),('tomato','tomato'),
  ('오이','cucumber'),('cucumber','cucumber'),
  ('딸기','strawberry'),('strawberry','strawberry')
on conflict do nothing;
