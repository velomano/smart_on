


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."build_device_ui_model"("p_device_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_device RECORD;
  v_profile JSONB;
  v_registry JSONB;
  v_user_template JSONB;
  v_result JSONB;
BEGIN
  -- 1. Device 정보 조회
  SELECT * INTO v_device FROM iot_devices WHERE id = p_device_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Device not found: %', p_device_id;
  END IF;
  
  -- 2. Registry 조회
  SELECT capabilities INTO v_registry FROM device_registry WHERE device_id = p_device_id;
  
  -- 3. Profile 조회
  SELECT capabilities, ui_template INTO v_profile 
  FROM device_profiles 
  WHERE id = v_device.profile_id;
  
  -- 4. User Template 조회
  SELECT template INTO v_user_template FROM device_ui_templates WHERE device_id = p_device_id;
  
  -- 5. Merge (우선순위: Registry > Profile)
  v_result := jsonb_build_object(
    'device', jsonb_build_object('id', v_device.id, 'tenant_id', v_device.tenant_id),
    'capabilities', COALESCE(v_registry, v_profile, '{}'::jsonb),
    'template', COALESCE(v_user_template, v_profile->'ui_template', '{}'::jsonb),
    'updated_at', NOW()
  );
  
  RETURN v_result;
END;
$$;


ALTER FUNCTION "public"."build_device_ui_model"("p_device_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."build_device_ui_model"("p_device_id" "uuid") IS 'UI Model 자동 생성 (Registry > Profile > Auto)';



CREATE OR REPLACE FUNCTION "public"."cleanup_expired_claims"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  DELETE FROM device_claims
  WHERE expires_at < NOW() - INTERVAL '1 day';
END;
$$;


ALTER FUNCTION "public"."cleanup_expired_claims"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_latest_iot_readings"("p_device_uuid" "text", "p_limit" integer DEFAULT 10) RETURNS TABLE("key" "text", "value" numeric, "unit" "text", "ts" timestamp with time zone, "status" "text", "battery" integer)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ir.key,
    ir.value,
    ir.unit,
    ir.ts,
    ir.status,
    ir.battery
  FROM iot_readings ir
  WHERE ir.device_uuid = p_device_uuid
  ORDER BY ir.ts DESC
  LIMIT p_limit;
END;
$$;


ALTER FUNCTION "public"."get_latest_iot_readings"("p_device_uuid" "text", "p_limit" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_tenant_id"() RETURNS "uuid"
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
  select (auth.jwt() ->> 'tenant_id')::uuid;
$$;


ALTER FUNCTION "public"."get_user_tenant_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_expired_invites"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  UPDATE user_invites 
  SET status = 'expired', updated_at = NOW()
  WHERE status = 'pending' 
  AND expires_at < NOW();
END;
$$;


ALTER FUNCTION "public"."update_expired_invites"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_farm_memberships_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_farm_memberships_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_farm_mqtt_configs_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_farm_mqtt_configs_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_iot_commands_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_iot_commands_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_iot_device_last_seen"("p_device_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  UPDATE iot_devices
  SET last_seen_at = NOW()
  WHERE id = p_device_id;
END;
$$;


ALTER FUNCTION "public"."update_iot_device_last_seen"("p_device_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_iot_devices_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_iot_devices_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_modbus_configs_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_modbus_configs_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_transport_configs_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_transport_configs_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."acid_bases" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "type" "text" NOT NULL,
    "normality" numeric NOT NULL,
    CONSTRAINT "acid_bases_type_check" CHECK (("type" = ANY (ARRAY['acid'::"text", 'base'::"text"])))
);


ALTER TABLE "public"."acid_bases" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."adjustments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "recipe_id" "uuid",
    "acid_base_id" "uuid",
    "ml_needed" numeric NOT NULL,
    "rationale" "text"
);


ALTER TABLE "public"."adjustments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."alerts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "farm_id" "uuid" NOT NULL,
    "bed_id" "uuid",
    "severity" "text",
    "title" "text",
    "detail" "text",
    "ts" timestamp with time zone DEFAULT "now"(),
    "ack_by" "uuid",
    CONSTRAINT "alerts_severity_check" CHECK (("severity" = ANY (ARRAY['info'::"text", 'warning'::"text", 'critical'::"text"])))
);


ALTER TABLE "public"."alerts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."audits" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "entity" "text",
    "entity_id" "uuid",
    "action" "text",
    "diff" "jsonb",
    "ts" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."audits" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."bed_crop_data" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "device_id" "text" NOT NULL,
    "tier_number" integer NOT NULL,
    "crop_name" "text" NOT NULL,
    "growing_method" "text",
    "plant_type" "text",
    "start_date" "date",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "harvest_date" "date",
    "stage_boundaries" "jsonb",
    CONSTRAINT "bed_crop_data_plant_type_check" CHECK (("plant_type" = ANY (ARRAY['seed'::"text", 'seedling'::"text"])))
);


ALTER TABLE "public"."bed_crop_data" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."beds" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "farm_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "crop" "text",
    "target_temp" numeric,
    "target_humidity" numeric,
    "target_ec" numeric,
    "target_ph" numeric,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."beds" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."commands" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "device_id" "uuid" NOT NULL,
    "issued_by" "uuid",
    "ts" timestamp with time zone DEFAULT "now"(),
    "command" "text" NOT NULL,
    "payload" "jsonb",
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "correlation_id" "text"
);


ALTER TABLE "public"."commands" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."crop_alias" (
    "alias" "text" NOT NULL,
    "crop_key" "text" NOT NULL
);


ALTER TABLE "public"."crop_alias" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."crop_profiles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "crop_key" "text" NOT NULL,
    "crop_name" "text" NOT NULL,
    "stage" "text" NOT NULL,
    "target_ppm" "jsonb" NOT NULL,
    "target_ec" numeric,
    "target_ph" numeric,
    "metadata" "jsonb",
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "author" "text",
    "source_title" "text",
    "source_year" integer,
    "license" "text",
    "description" "text",
    "growing_conditions" "jsonb",
    "nutrients_detail" "jsonb",
    "usage_notes" "text"[],
    "warnings" "text"[],
    "last_updated" "date",
    "volume_l" integer DEFAULT 100,
    "ec_target" numeric,
    "ph_target" numeric,
    "npk_ratio" "text"
);


ALTER TABLE "public"."crop_profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."device_claims" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "setup_token_hash" "text" NOT NULL,
    "farm_id" "uuid",
    "expires_at" timestamp with time zone NOT NULL,
    "used_at" timestamp with time zone,
    "used_by_device_id" "text",
    "ip_bound" "inet"[],
    "user_agent" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."device_claims" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."device_profiles" (
    "id" "text" NOT NULL,
    "version" "text" DEFAULT '1.0.0'::"text" NOT NULL,
    "scope" "text" DEFAULT 'public'::"text" NOT NULL,
    "tenant_id" "uuid",
    "name" "text" NOT NULL,
    "manufacturer" "text",
    "capabilities" "jsonb" NOT NULL,
    "ui_template" "jsonb",
    "safety_rules" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."device_profiles" OWNER TO "postgres";


COMMENT ON TABLE "public"."device_profiles" IS 'Device Profile - 디바이스 종류별 능력 명세';



CREATE TABLE IF NOT EXISTS "public"."device_registry" (
    "device_id" "uuid" NOT NULL,
    "version" "text" DEFAULT '1.0.0'::"text" NOT NULL,
    "profile_id" "text",
    "tenant_id" "uuid" NOT NULL,
    "capabilities" "jsonb" NOT NULL,
    "reported_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."device_registry" OWNER TO "postgres";


COMMENT ON TABLE "public"."device_registry" IS 'Device Registry - 실제 하드웨어가 신고한 능력';



CREATE TABLE IF NOT EXISTS "public"."device_ui_templates" (
    "device_id" "uuid" NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "template" "jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."device_ui_templates" OWNER TO "postgres";


COMMENT ON TABLE "public"."device_ui_templates" IS 'User UI Templates - 사용자 커스터마이징';



CREATE TABLE IF NOT EXISTS "public"."devices" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "farm_id" "uuid" NOT NULL,
    "bed_id" "uuid",
    "type" "text" NOT NULL,
    "vendor" "text",
    "tuya_device_id" "text",
    "status" "jsonb",
    "meta" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "name" "text" DEFAULT ('디바이스-'::"text" || "substring"(("gen_random_uuid"())::"text", '-4'::integer)) NOT NULL,
    CONSTRAINT "devices_type_check" CHECK (("type" = ANY (ARRAY['switch'::"text", 'pump'::"text", 'fan'::"text", 'light'::"text", 'motor'::"text", 'sensor_gateway'::"text"])))
);


ALTER TABLE "public"."devices" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."farm_memberships" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "farm_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" "text" DEFAULT 'operator'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "farm_memberships_role_check" CHECK (("role" = ANY (ARRAY['owner'::"text", 'operator'::"text", 'viewer'::"text"])))
);


ALTER TABLE "public"."farm_memberships" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."farm_mqtt_configs" (
    "farm_id" "uuid" NOT NULL,
    "broker_url" "text" NOT NULL,
    "port" integer DEFAULT 8883 NOT NULL,
    "auth_mode" "text" NOT NULL,
    "username" "text",
    "secret_enc" "text",
    "client_id_prefix" "text" DEFAULT 'terahub-bridge'::"text",
    "ws_path" "text",
    "qos_default" integer DEFAULT 1,
    "is_active" boolean DEFAULT true,
    "last_test_at" timestamp with time zone,
    "last_test_ok" boolean,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "farm_mqtt_configs_auth_mode_check" CHECK (("auth_mode" = ANY (ARRAY['api_key'::"text", 'user_pass'::"text"])))
);


ALTER TABLE "public"."farm_mqtt_configs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."farms" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "location" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "is_hidden" boolean DEFAULT false
);


ALTER TABLE "public"."farms" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."iot_commands" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "device_id" "uuid" NOT NULL,
    "msg_id" "text" NOT NULL,
    "issued_at" timestamp with time zone DEFAULT "now"(),
    "type" "text" NOT NULL,
    "payload" "jsonb",
    "status" "text" DEFAULT 'pending'::"text",
    "ack_at" timestamp with time zone,
    "retry_count" integer DEFAULT 0,
    "last_error" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "device_uuid" "text",
    "command_type" "text",
    "params" "jsonb",
    "idempotency_key" "text",
    "timeout_ms" integer,
    "priority" "text",
    CONSTRAINT "iot_commands_priority_check" CHECK (("priority" = ANY (ARRAY['low'::"text", 'normal'::"text", 'high'::"text"]))),
    CONSTRAINT "iot_commands_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'sent'::"text", 'acked'::"text", 'failed'::"text", 'timeout'::"text"])))
);


ALTER TABLE "public"."iot_commands" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."iot_devices" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "farm_id" "uuid",
    "device_id" "text" NOT NULL,
    "device_key_hash" "text" NOT NULL,
    "device_type" "text",
    "fw_version" "text",
    "capabilities" "jsonb",
    "last_seen_at" timestamp with time zone,
    "status" "text" DEFAULT 'active'::"text",
    "metadata" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "transport" "text" DEFAULT 'http'::"text",
    CONSTRAINT "iot_devices_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'inactive'::"text", 'maintenance'::"text"]))),
    CONSTRAINT "iot_devices_transport_check" CHECK (("transport" = ANY (ARRAY['mqtt'::"text", 'http'::"text", 'websocket'::"text", 'serial'::"text", 'ble'::"text", 'webhook'::"text", 'rs485'::"text"])))
);


ALTER TABLE "public"."iot_devices" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."iot_readings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "device_id" "uuid" NOT NULL,
    "ts" timestamp with time zone NOT NULL,
    "key" "text" NOT NULL,
    "value" numeric,
    "unit" "text",
    "raw" "jsonb",
    "schema_version" "text" DEFAULT 'v1'::"text",
    "quality" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "device_uuid" "text",
    "metrics" "jsonb",
    "status" "text",
    "battery" integer,
    "signal_strength" integer,
    "version" "text",
    CONSTRAINT "iot_readings_battery_check" CHECK ((("battery" >= 0) AND ("battery" <= 100))),
    CONSTRAINT "iot_readings_quality_check" CHECK (("quality" = ANY (ARRAY['good'::"text", 'fair'::"text", 'poor'::"text"]))),
    CONSTRAINT "iot_readings_status_check" CHECK (("status" = ANY (ARRAY['ok'::"text", 'warn'::"text", 'err'::"text"])))
);


ALTER TABLE "public"."iot_readings" OWNER TO "postgres";


CREATE MATERIALIZED VIEW "public"."iot_readings_hourly" AS
 SELECT "device_id",
    "tenant_id",
    "date_trunc"('hour'::"text", "ts") AS "hour",
    "key",
    "avg"("value") AS "avg_value",
    "min"("value") AS "min_value",
    "max"("value") AS "max_value",
    "stddev"("value") AS "stddev_value",
    "count"(*) AS "count"
   FROM "public"."iot_readings"
  GROUP BY "device_id", "tenant_id", ("date_trunc"('hour'::"text", "ts")), "key"
  WITH NO DATA;


ALTER MATERIALIZED VIEW "public"."iot_readings_hourly" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."memberships" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" "text" NOT NULL,
    "team_id" "uuid",
    CONSTRAINT "memberships_role_check" CHECK (("role" = ANY (ARRAY['owner'::"text", 'operator'::"text", 'viewer'::"text"])))
);


ALTER TABLE "public"."memberships" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."mixing_instructions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "recipe_id" "uuid",
    "step_no" integer NOT NULL,
    "text" "text" NOT NULL
);


ALTER TABLE "public"."mixing_instructions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."mixing_rules" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid",
    "name" "text" NOT NULL,
    "allow_salts" "uuid"[],
    "forbid_salts" "uuid"[],
    "constraints" "jsonb"
);


ALTER TABLE "public"."mixing_rules" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."modbus_configs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "device_id" "uuid" NOT NULL,
    "baud_rate" integer DEFAULT 9600,
    "parity" "text" DEFAULT 'none'::"text",
    "stop_bits" integer DEFAULT 1,
    "slave_id" integer DEFAULT 1,
    "timeout_ms" integer DEFAULT 1000,
    "register_mappings" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "modbus_configs_parity_check" CHECK (("parity" = ANY (ARRAY['none'::"text", 'even'::"text", 'odd'::"text"])))
);


ALTER TABLE "public"."modbus_configs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."nutrient_ions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "symbol" "text" NOT NULL,
    "name" "text" NOT NULL,
    "valence" integer
);


ALTER TABLE "public"."nutrient_ions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."nutrient_jobs" (
    "id" bigint NOT NULL,
    "type" "text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "payload" "jsonb",
    "trace_id" "text",
    "started_at" timestamp with time zone,
    "finished_at" timestamp with time zone,
    "error" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "nutrient_jobs_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'running'::"text", 'success'::"text", 'failed'::"text"]))),
    CONSTRAINT "nutrient_jobs_type_check" CHECK (("type" = ANY (ARRAY['crawl'::"text", 'api'::"text", 'ai'::"text"])))
);


ALTER TABLE "public"."nutrient_jobs" OWNER TO "postgres";


ALTER TABLE "public"."nutrient_jobs" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."nutrient_jobs_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."nutrient_recipe_aliases" (
    "id" bigint NOT NULL,
    "crop_key" "text" NOT NULL,
    "stage" "text" NOT NULL,
    "alias" "text" NOT NULL,
    "source_id" bigint,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "nutrient_recipe_aliases_stage_check" CHECK (("stage" = ANY (ARRAY['seedling'::"text", 'vegetative'::"text", 'flowering'::"text", 'fruiting'::"text", 'ripening'::"text"])))
);


ALTER TABLE "public"."nutrient_recipe_aliases" OWNER TO "postgres";


ALTER TABLE "public"."nutrient_recipe_aliases" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."nutrient_recipe_aliases_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."nutrient_recipes" (
    "id" bigint NOT NULL,
    "crop_key" "text" NOT NULL,
    "crop_name" "text",
    "stage" "text" NOT NULL,
    "target_ec" numeric,
    "target_ph" numeric,
    "macro" "jsonb" NOT NULL,
    "micro" "jsonb" NOT NULL,
    "ions" "jsonb",
    "env" "jsonb",
    "source_id" bigint,
    "reliability" numeric DEFAULT 0.7,
    "collected_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "verified_by" "uuid",
    "verified_at" timestamp with time zone,
    "checksum" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "nutrient_recipes_reliability_check" CHECK ((("reliability" >= (0)::numeric) AND ("reliability" <= (1)::numeric))),
    CONSTRAINT "nutrient_recipes_stage_check" CHECK (("stage" = ANY (ARRAY['seedling'::"text", 'vegetative'::"text", 'flowering'::"text", 'fruiting'::"text", 'ripening'::"text"])))
);


ALTER TABLE "public"."nutrient_recipes" OWNER TO "postgres";


ALTER TABLE "public"."nutrient_recipes" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."nutrient_recipes_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."nutrient_sources" (
    "id" bigint NOT NULL,
    "name" "text" NOT NULL,
    "url" "text",
    "org_type" "text" NOT NULL,
    "license" "text",
    "reliability_default" numeric DEFAULT 0.7 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "nutrient_sources_org_type_check" CHECK (("org_type" = ANY (ARRAY['government'::"text", 'academic'::"text", 'commercial'::"text", 'community'::"text"]))),
    CONSTRAINT "nutrient_sources_reliability_default_check" CHECK ((("reliability_default" >= (0)::numeric) AND ("reliability_default" <= (1)::numeric)))
);


ALTER TABLE "public"."nutrient_sources" OWNER TO "postgres";


ALTER TABLE "public"."nutrient_sources" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."nutrient_sources_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."recipe_lines" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "recipe_id" "uuid",
    "salt_id" "uuid",
    "grams" numeric NOT NULL,
    "tank" "text" DEFAULT 'none'::"text"
);


ALTER TABLE "public"."recipe_lines" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."recipes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid",
    "crop_profile_id" "uuid",
    "water_profile_id" "uuid",
    "target_volume_l" numeric NOT NULL,
    "target_ec" numeric,
    "target_ph" numeric,
    "ec_est" numeric,
    "ph_est" numeric,
    "warnings" "jsonb",
    "status" "text" DEFAULT 'draft'::"text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "name" "text"
);


ALTER TABLE "public"."recipes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."rules" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "farm_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "trigger" "jsonb" NOT NULL,
    "condition" "jsonb",
    "action" "jsonb" NOT NULL,
    "enabled" boolean DEFAULT true,
    "version" integer DEFAULT 1,
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."rules" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."salts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "formula" "text",
    "purity_pct" numeric DEFAULT 100,
    "density_kg_per_l" numeric,
    "ion_contributions" "jsonb" NOT NULL
);


ALTER TABLE "public"."salts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sensor_readings" (
    "id" bigint NOT NULL,
    "sensor_id" "uuid" NOT NULL,
    "ts" timestamp with time zone NOT NULL,
    "value" numeric NOT NULL,
    "quality" integer DEFAULT 1
);


ALTER TABLE "public"."sensor_readings" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."sensor_readings_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."sensor_readings_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."sensor_readings_id_seq" OWNED BY "public"."sensor_readings"."id";



CREATE TABLE IF NOT EXISTS "public"."sensors" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "device_id" "uuid" NOT NULL,
    "type" "text" NOT NULL,
    "unit" "text",
    "meta" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "tier_number" integer
);


ALTER TABLE "public"."sensors" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."teams" AS
 SELECT "id",
    "name",
    "location" AS "description",
    "tenant_id",
    "created_at"
   FROM "public"."farms";


ALTER VIEW "public"."teams" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tenants" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "description" "text",
    "subdomain" "text",
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."tenants" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."transport_configs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "transport" "text" NOT NULL,
    "config" "jsonb" NOT NULL,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "transport_configs_transport_check" CHECK (("transport" = ANY (ARRAY['mqtt'::"text", 'http'::"text", 'websocket'::"text", 'serial'::"text", 'ble'::"text", 'webhook'::"text", 'rs485'::"text"])))
);


ALTER TABLE "public"."transport_configs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_invites" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "email" character varying(255) NOT NULL,
    "role" character varying(50) DEFAULT 'team_member'::character varying NOT NULL,
    "message" "text",
    "invited_by" "uuid" NOT NULL,
    "invited_by_name" character varying(255) NOT NULL,
    "invite_token" character varying(255) NOT NULL,
    "expires_at" timestamp with time zone NOT NULL,
    "status" character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    "accepted_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "user_invites_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['pending'::character varying, 'accepted'::character varying, 'expired'::character varying, 'cancelled'::character varying])::"text"[])))
);


ALTER TABLE "public"."user_invites" OWNER TO "postgres";


COMMENT ON TABLE "public"."user_invites" IS '사용자 초대 관리 테이블';



COMMENT ON COLUMN "public"."user_invites"."email" IS '초대받은 사용자의 이메일';



COMMENT ON COLUMN "public"."user_invites"."role" IS '초대받은 사용자의 역할';



COMMENT ON COLUMN "public"."user_invites"."message" IS '초대 메시지';



COMMENT ON COLUMN "public"."user_invites"."invited_by" IS '초대한 사용자 ID';



COMMENT ON COLUMN "public"."user_invites"."invited_by_name" IS '초대한 사용자 이름';



COMMENT ON COLUMN "public"."user_invites"."invite_token" IS '초대 토큰 (고유)';



COMMENT ON COLUMN "public"."user_invites"."expires_at" IS '초대 만료 시간';



COMMENT ON COLUMN "public"."user_invites"."status" IS '초대 상태 (pending, accepted, expired, cancelled)';



COMMENT ON COLUMN "public"."user_invites"."accepted_at" IS '초대 수락 시간';



CREATE TABLE IF NOT EXISTS "public"."user_settings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "notification_preferences" "jsonb" DEFAULT '{"email": true, "telegram": false, "dashboard": true, "ph_alerts": true, "water_level": true, "low_humidity": true, "sensor_alerts": true, "system_alerts": true, "high_temperature": true}'::"jsonb",
    "ui_preferences" "jsonb" DEFAULT '{"theme": "light", "language": "ko", "dashboard_layout": "default", "sidebar_collapsed": false, "show_advanced_options": false}'::"jsonb",
    "dashboard_preferences" "jsonb" DEFAULT '{"auto_refresh": true, "default_view": "grid", "show_all_beds": false, "show_team_beds": true, "refresh_interval": 30, "show_weather_info": true, "show_sensor_charts": true}'::"jsonb",
    "telegram_chat_id" "text",
    "telegram_bot_token" "text",
    "telegram_notifications_enabled" boolean DEFAULT false,
    "sensor_thresholds" "jsonb" DEFAULT '{"ph": {"max": 7.5, "min": 6.0}, "light": {"max": 1000, "min": 200}, "humidity": {"max": 80, "min": 40}, "temperature": {"max": 35, "min": 15}, "soil_moisture": {"max": 70, "min": 30}}'::"jsonb",
    "timezone" "text" DEFAULT 'Asia/Seoul'::"text",
    "date_format" "text" DEFAULT 'YYYY-MM-DD'::"text",
    "time_format" "text" DEFAULT '24h'::"text",
    "accessibility" "jsonb" DEFAULT '{"large_text": false, "high_contrast": false, "screen_reader": false, "keyboard_navigation": true}'::"jsonb",
    "privacy" "jsonb" DEFAULT '{"share_analytics": true, "allow_team_visibility": true, "share_performance_data": false}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" NOT NULL,
    "email" "text",
    "name" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "company" "text",
    "phone" "text",
    "is_approved" boolean DEFAULT false,
    "approved_at" timestamp with time zone,
    "approved_by" "uuid",
    "is_active" boolean DEFAULT true,
    "role" "text",
    "team_name" "text",
    "tenant_id" "uuid" DEFAULT '00000000-0000-0000-0000-000000000001'::"uuid",
    "preferred_team" "text" DEFAULT 'admin_assign'::"text",
    "avatar_url" "text",
    "last_login_at" timestamp with time zone,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "users_role_check" CHECK (("role" = ANY (ARRAY['super_admin'::"text", 'system_admin'::"text", 'team_leader'::"text", 'team_member'::"text"])))
);


ALTER TABLE "public"."users" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_invite_details" AS
 SELECT "ui"."id",
    "ui"."email",
    "ui"."role",
    "ui"."message",
    "ui"."invited_by",
    "ui"."invited_by_name",
    "ui"."invite_token",
    "ui"."expires_at",
    "ui"."status",
    "ui"."accepted_at",
    "ui"."created_at",
    "ui"."updated_at",
    "u"."name" AS "inviter_name",
    "u"."email" AS "inviter_email",
    "u"."role" AS "inviter_role",
        CASE
            WHEN (("ui"."expires_at" < "now"()) AND (("ui"."status")::"text" = 'pending'::"text")) THEN 'expired'::character varying
            ELSE "ui"."status"
        END AS "actual_status"
   FROM ("public"."user_invites" "ui"
     LEFT JOIN "public"."users" "u" ON (("ui"."invited_by" = "u"."id")));


ALTER VIEW "public"."v_invite_details" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_invite_stats" AS
 SELECT "count"(*) AS "total_invites",
    "count"(*) FILTER (WHERE (("status")::"text" = 'pending'::"text")) AS "pending_invites",
    "count"(*) FILTER (WHERE (("status")::"text" = 'accepted'::"text")) AS "accepted_invites",
    "count"(*) FILTER (WHERE (("status")::"text" = 'expired'::"text")) AS "expired_invites",
    "count"(*) FILTER (WHERE (("status")::"text" = 'cancelled'::"text")) AS "cancelled_invites",
    "count"(*) FILTER (WHERE ("created_at" >= ("now"() - '7 days'::interval))) AS "invites_last_7_days",
    "count"(*) FILTER (WHERE ("created_at" >= ("now"() - '30 days'::interval))) AS "invites_last_30_days"
   FROM "public"."user_invites";


ALTER VIEW "public"."v_invite_stats" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."vw_crop_recipes_latest" AS
 WITH "scored" AS (
         SELECT "r"."id",
            "r"."crop_key",
            "r"."crop_name",
            "r"."stage",
            "r"."target_ec",
            "r"."target_ph",
            "r"."macro",
            "r"."micro",
            "r"."ions",
            "r"."env",
            "r"."source_id",
            "r"."reliability",
            "r"."collected_at",
            "r"."verified_by",
            "r"."verified_at",
            "r"."checksum",
            "r"."created_at",
            ((COALESCE("r"."reliability", 0.7) * 0.7) + (GREATEST((0)::numeric, ((1)::numeric - (EXTRACT(epoch FROM ("now"() - "r"."collected_at")) / (864000)::numeric))) * 0.3)) AS "score"
           FROM "public"."nutrient_recipes" "r"
        )
 SELECT DISTINCT ON ("crop_key", "stage") "id",
    "crop_key",
    "crop_name",
    "stage",
    "target_ec",
    "target_ph",
    "macro",
    "micro",
    "ions",
    "env",
    "source_id",
    "reliability",
    "collected_at",
    "verified_by",
    "verified_at",
    "checksum",
    "created_at",
    "score"
   FROM "scored"
  ORDER BY "crop_key", "stage", "score" DESC, "collected_at" DESC;


ALTER VIEW "public"."vw_crop_recipes_latest" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."water_profiles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid",
    "name" "text" NOT NULL,
    "alkalinity_mg_per_l_as_caco3" numeric DEFAULT 0,
    "ph" numeric DEFAULT 7.0,
    "existing_ions" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL
);


ALTER TABLE "public"."water_profiles" OWNER TO "postgres";


ALTER TABLE ONLY "public"."sensor_readings" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."sensor_readings_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."acid_bases"
    ADD CONSTRAINT "acid_bases_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."adjustments"
    ADD CONSTRAINT "adjustments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."alerts"
    ADD CONSTRAINT "alerts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."audits"
    ADD CONSTRAINT "audits_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."bed_crop_data"
    ADD CONSTRAINT "bed_crop_data_device_id_tier_number_key" UNIQUE ("device_id", "tier_number");



ALTER TABLE ONLY "public"."bed_crop_data"
    ADD CONSTRAINT "bed_crop_data_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."beds"
    ADD CONSTRAINT "beds_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."commands"
    ADD CONSTRAINT "commands_correlation_id_key" UNIQUE ("correlation_id");



ALTER TABLE ONLY "public"."commands"
    ADD CONSTRAINT "commands_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."crop_alias"
    ADD CONSTRAINT "crop_alias_pkey" PRIMARY KEY ("alias");



ALTER TABLE ONLY "public"."crop_profiles"
    ADD CONSTRAINT "crop_profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."device_claims"
    ADD CONSTRAINT "device_claims_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."device_profiles"
    ADD CONSTRAINT "device_profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."device_registry"
    ADD CONSTRAINT "device_registry_pkey" PRIMARY KEY ("device_id");



ALTER TABLE ONLY "public"."device_ui_templates"
    ADD CONSTRAINT "device_ui_templates_pkey" PRIMARY KEY ("device_id");



ALTER TABLE ONLY "public"."devices"
    ADD CONSTRAINT "devices_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."farm_memberships"
    ADD CONSTRAINT "farm_memberships_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."farm_memberships"
    ADD CONSTRAINT "farm_memberships_tenant_id_farm_id_user_id_key" UNIQUE ("tenant_id", "farm_id", "user_id");



ALTER TABLE ONLY "public"."farm_mqtt_configs"
    ADD CONSTRAINT "farm_mqtt_configs_pkey" PRIMARY KEY ("farm_id");



ALTER TABLE ONLY "public"."farms"
    ADD CONSTRAINT "farms_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."iot_commands"
    ADD CONSTRAINT "iot_commands_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."iot_commands"
    ADD CONSTRAINT "iot_commands_tenant_id_msg_id_key" UNIQUE ("tenant_id", "msg_id");



ALTER TABLE ONLY "public"."iot_devices"
    ADD CONSTRAINT "iot_devices_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."iot_devices"
    ADD CONSTRAINT "iot_devices_tenant_id_device_id_key" UNIQUE ("tenant_id", "device_id");



ALTER TABLE ONLY "public"."iot_readings"
    ADD CONSTRAINT "iot_readings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."memberships"
    ADD CONSTRAINT "memberships_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."memberships"
    ADD CONSTRAINT "memberships_tenant_id_user_id_key" UNIQUE ("tenant_id", "user_id");



ALTER TABLE ONLY "public"."mixing_instructions"
    ADD CONSTRAINT "mixing_instructions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."mixing_rules"
    ADD CONSTRAINT "mixing_rules_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."modbus_configs"
    ADD CONSTRAINT "modbus_configs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."nutrient_ions"
    ADD CONSTRAINT "nutrient_ions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."nutrient_ions"
    ADD CONSTRAINT "nutrient_ions_symbol_key" UNIQUE ("symbol");



ALTER TABLE ONLY "public"."nutrient_jobs"
    ADD CONSTRAINT "nutrient_jobs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."nutrient_recipe_aliases"
    ADD CONSTRAINT "nutrient_recipe_aliases_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."nutrient_recipes"
    ADD CONSTRAINT "nutrient_recipes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."nutrient_sources"
    ADD CONSTRAINT "nutrient_sources_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."recipe_lines"
    ADD CONSTRAINT "recipe_lines_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."recipes"
    ADD CONSTRAINT "recipes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."rules"
    ADD CONSTRAINT "rules_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."salts"
    ADD CONSTRAINT "salts_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."salts"
    ADD CONSTRAINT "salts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sensor_readings"
    ADD CONSTRAINT "sensor_readings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sensors"
    ADD CONSTRAINT "sensors_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tenants"
    ADD CONSTRAINT "tenants_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tenants"
    ADD CONSTRAINT "tenants_subdomain_key" UNIQUE ("subdomain");



ALTER TABLE ONLY "public"."transport_configs"
    ADD CONSTRAINT "transport_configs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."transport_configs"
    ADD CONSTRAINT "transport_configs_tenant_id_transport_key" UNIQUE ("tenant_id", "transport");



ALTER TABLE ONLY "public"."nutrient_sources"
    ADD CONSTRAINT "uq_nutrient_sources_name" UNIQUE ("name");



ALTER TABLE ONLY "public"."user_invites"
    ADD CONSTRAINT "user_invites_invite_token_key" UNIQUE ("invite_token");



ALTER TABLE ONLY "public"."user_invites"
    ADD CONSTRAINT "user_invites_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_settings"
    ADD CONSTRAINT "user_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_settings"
    ADD CONSTRAINT "user_settings_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."water_profiles"
    ADD CONSTRAINT "water_profiles_pkey" PRIMARY KEY ("id");



CREATE INDEX "crop_profiles_key_idx" ON "public"."crop_profiles" USING "btree" ("crop_key", "stage");



CREATE INDEX "idx_bed_crop_data_device_id" ON "public"."bed_crop_data" USING "btree" ("device_id");



CREATE INDEX "idx_bed_crop_data_tier" ON "public"."bed_crop_data" USING "btree" ("device_id", "tier_number");



CREATE INDEX "idx_device_claims_expires" ON "public"."device_claims" USING "btree" ("expires_at") WHERE ("used_at" IS NULL);



CREATE INDEX "idx_device_claims_tenant" ON "public"."device_claims" USING "btree" ("tenant_id", "expires_at");



CREATE INDEX "idx_device_profiles_scope" ON "public"."device_profiles" USING "btree" ("scope");



CREATE INDEX "idx_device_profiles_tenant" ON "public"."device_profiles" USING "btree" ("tenant_id");



CREATE INDEX "idx_device_registry_profile" ON "public"."device_registry" USING "btree" ("profile_id");



CREATE INDEX "idx_device_registry_tenant" ON "public"."device_registry" USING "btree" ("tenant_id");



CREATE INDEX "idx_device_ui_templates_tenant" ON "public"."device_ui_templates" USING "btree" ("tenant_id");



CREATE INDEX "idx_devices_name" ON "public"."devices" USING "btree" ("name");



CREATE INDEX "idx_farm_memberships_role" ON "public"."farm_memberships" USING "btree" ("role");



CREATE INDEX "idx_farm_memberships_tenant_farm" ON "public"."farm_memberships" USING "btree" ("tenant_id", "farm_id");



CREATE INDEX "idx_farm_memberships_user" ON "public"."farm_memberships" USING "btree" ("user_id");



CREATE INDEX "idx_farm_mqtt_configs_active" ON "public"."farm_mqtt_configs" USING "btree" ("is_active");



CREATE INDEX "idx_iot_commands_device_status" ON "public"."iot_commands" USING "btree" ("device_id", "status", "issued_at" DESC);



CREATE INDEX "idx_iot_commands_device_uuid_status" ON "public"."iot_commands" USING "btree" ("device_uuid", "status", "issued_at" DESC) WHERE ("device_uuid" IS NOT NULL);



CREATE INDEX "idx_iot_commands_pending" ON "public"."iot_commands" USING "btree" ("tenant_id", "device_id", "status") WHERE ("status" = ANY (ARRAY['pending'::"text", 'sent'::"text"]));



CREATE INDEX "idx_iot_devices_last_seen" ON "public"."iot_devices" USING "btree" ("last_seen_at") WHERE ("status" = 'active'::"text");



CREATE INDEX "idx_iot_devices_tenant_farm" ON "public"."iot_devices" USING "btree" ("tenant_id", "farm_id");



CREATE INDEX "idx_iot_devices_tenant_status" ON "public"."iot_devices" USING "btree" ("tenant_id", "status");



CREATE INDEX "idx_iot_readings_device_key" ON "public"."iot_readings" USING "btree" ("device_id", "key", "ts" DESC);



CREATE INDEX "idx_iot_readings_device_uuid_ts" ON "public"."iot_readings" USING "btree" ("device_uuid", "ts" DESC) WHERE ("device_uuid" IS NOT NULL);



CREATE INDEX "idx_iot_readings_hourly_device" ON "public"."iot_readings_hourly" USING "btree" ("device_id", "hour" DESC);



CREATE INDEX "idx_iot_readings_tenant_device_ts" ON "public"."iot_readings" USING "btree" ("tenant_id", "device_id", "ts" DESC);



CREATE INDEX "idx_iot_readings_ts" ON "public"."iot_readings" USING "btree" ("ts" DESC);



CREATE INDEX "idx_memberships_team_id" ON "public"."memberships" USING "btree" ("team_id");



CREATE INDEX "idx_modbus_configs_device" ON "public"."modbus_configs" USING "btree" ("device_id");



CREATE INDEX "idx_nutrient_jobs_created_at" ON "public"."nutrient_jobs" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_nutrient_jobs_status" ON "public"."nutrient_jobs" USING "btree" ("status");



CREATE INDEX "idx_nutrient_jobs_type" ON "public"."nutrient_jobs" USING "btree" ("type");



CREATE INDEX "idx_readings_sensor_ts" ON "public"."sensor_readings" USING "btree" ("sensor_id", "ts" DESC);



CREATE INDEX "idx_transport_configs_tenant" ON "public"."transport_configs" USING "btree" ("tenant_id", "transport");



CREATE INDEX "idx_user_invites_email" ON "public"."user_invites" USING "btree" ("email");



CREATE INDEX "idx_user_invites_expires_at" ON "public"."user_invites" USING "btree" ("expires_at");



CREATE INDEX "idx_user_invites_status" ON "public"."user_invites" USING "btree" ("status");



CREATE INDEX "idx_user_invites_token" ON "public"."user_invites" USING "btree" ("invite_token");



CREATE INDEX "idx_user_settings_telegram_enabled" ON "public"."user_settings" USING "btree" ("telegram_notifications_enabled");



CREATE INDEX "idx_user_settings_user_id" ON "public"."user_settings" USING "btree" ("user_id");



CREATE INDEX "idx_users_active" ON "public"."users" USING "btree" ("is_active");



CREATE INDEX "idx_users_approved" ON "public"."users" USING "btree" ("is_approved");



CREATE INDEX "idx_users_email" ON "public"."users" USING "btree" ("email");



CREATE INDEX "idx_users_is_active" ON "public"."users" USING "btree" ("is_active");



CREATE INDEX "idx_users_role" ON "public"."users" USING "btree" ("role");



CREATE INDEX "idx_users_tenant_id" ON "public"."users" USING "btree" ("tenant_id");



CREATE UNIQUE INDEX "memberships_user_unique" ON "public"."memberships" USING "btree" ("user_id");



CREATE UNIQUE INDEX "ux_commands_correlation" ON "public"."commands" USING "btree" ("correlation_id");



CREATE UNIQUE INDEX "ux_recipe_ck_stage_checksum" ON "public"."nutrient_recipes" USING "btree" ("crop_key", "stage", "checksum");



CREATE UNIQUE INDEX "ux_sensor_readings_unique" ON "public"."sensor_readings" USING "btree" ("sensor_id", "ts");



CREATE UNIQUE INDEX "ux_sensors_device_type_tier" ON "public"."sensors" USING "btree" ("device_id", "type", COALESCE("tier_number", 0));



CREATE OR REPLACE TRIGGER "iot_commands_updated_at" BEFORE UPDATE ON "public"."iot_commands" FOR EACH ROW EXECUTE FUNCTION "public"."update_iot_commands_updated_at"();



CREATE OR REPLACE TRIGGER "iot_devices_updated_at" BEFORE UPDATE ON "public"."iot_devices" FOR EACH ROW EXECUTE FUNCTION "public"."update_iot_devices_updated_at"();



CREATE OR REPLACE TRIGGER "modbus_configs_updated_at" BEFORE UPDATE ON "public"."modbus_configs" FOR EACH ROW EXECUTE FUNCTION "public"."update_modbus_configs_updated_at"();



CREATE OR REPLACE TRIGGER "transport_configs_updated_at" BEFORE UPDATE ON "public"."transport_configs" FOR EACH ROW EXECUTE FUNCTION "public"."update_transport_configs_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_update_farm_memberships_updated_at" BEFORE UPDATE ON "public"."farm_memberships" FOR EACH ROW EXECUTE FUNCTION "public"."update_farm_memberships_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_update_farm_mqtt_configs_updated_at" BEFORE UPDATE ON "public"."farm_mqtt_configs" FOR EACH ROW EXECUTE FUNCTION "public"."update_farm_mqtt_configs_updated_at"();



CREATE OR REPLACE TRIGGER "update_tenants_updated_at" BEFORE UPDATE ON "public"."tenants" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_user_settings_updated_at" BEFORE UPDATE ON "public"."user_settings" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_users_updated_at" BEFORE UPDATE ON "public"."users" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."adjustments"
    ADD CONSTRAINT "adjustments_acid_base_id_fkey" FOREIGN KEY ("acid_base_id") REFERENCES "public"."acid_bases"("id");



ALTER TABLE ONLY "public"."adjustments"
    ADD CONSTRAINT "adjustments_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."alerts"
    ADD CONSTRAINT "alerts_ack_by_fkey" FOREIGN KEY ("ack_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."alerts"
    ADD CONSTRAINT "alerts_bed_id_fkey" FOREIGN KEY ("bed_id") REFERENCES "public"."beds"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."alerts"
    ADD CONSTRAINT "alerts_farm_id_fkey" FOREIGN KEY ("farm_id") REFERENCES "public"."farms"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."audits"
    ADD CONSTRAINT "audits_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."beds"
    ADD CONSTRAINT "beds_farm_id_fkey" FOREIGN KEY ("farm_id") REFERENCES "public"."farms"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."commands"
    ADD CONSTRAINT "commands_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "public"."devices"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."commands"
    ADD CONSTRAINT "commands_issued_by_fkey" FOREIGN KEY ("issued_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."device_claims"
    ADD CONSTRAINT "device_claims_farm_id_fkey" FOREIGN KEY ("farm_id") REFERENCES "public"."farms"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."device_claims"
    ADD CONSTRAINT "device_claims_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."device_registry"
    ADD CONSTRAINT "device_registry_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."device_profiles"("id");



ALTER TABLE ONLY "public"."devices"
    ADD CONSTRAINT "devices_bed_id_fkey" FOREIGN KEY ("bed_id") REFERENCES "public"."beds"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."devices"
    ADD CONSTRAINT "devices_farm_id_fkey" FOREIGN KEY ("farm_id") REFERENCES "public"."farms"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."farm_memberships"
    ADD CONSTRAINT "farm_memberships_farm_id_fkey" FOREIGN KEY ("farm_id") REFERENCES "public"."farms"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."farm_memberships"
    ADD CONSTRAINT "farm_memberships_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."farm_memberships"
    ADD CONSTRAINT "farm_memberships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."farm_mqtt_configs"
    ADD CONSTRAINT "farm_mqtt_configs_farm_id_fkey" FOREIGN KEY ("farm_id") REFERENCES "public"."farms"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."farms"
    ADD CONSTRAINT "farms_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."iot_commands"
    ADD CONSTRAINT "iot_commands_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "public"."iot_devices"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."iot_commands"
    ADD CONSTRAINT "iot_commands_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."iot_devices"
    ADD CONSTRAINT "iot_devices_farm_id_fkey" FOREIGN KEY ("farm_id") REFERENCES "public"."farms"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."iot_devices"
    ADD CONSTRAINT "iot_devices_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."iot_readings"
    ADD CONSTRAINT "iot_readings_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "public"."iot_devices"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."iot_readings"
    ADD CONSTRAINT "iot_readings_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."memberships"
    ADD CONSTRAINT "memberships_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."memberships"
    ADD CONSTRAINT "memberships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."mixing_instructions"
    ADD CONSTRAINT "mixing_instructions_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."modbus_configs"
    ADD CONSTRAINT "modbus_configs_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "public"."iot_devices"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."modbus_configs"
    ADD CONSTRAINT "modbus_configs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."nutrient_recipe_aliases"
    ADD CONSTRAINT "nutrient_recipe_aliases_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "public"."nutrient_sources"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."nutrient_recipes"
    ADD CONSTRAINT "nutrient_recipes_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "public"."nutrient_sources"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."recipe_lines"
    ADD CONSTRAINT "recipe_lines_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."recipe_lines"
    ADD CONSTRAINT "recipe_lines_salt_id_fkey" FOREIGN KEY ("salt_id") REFERENCES "public"."salts"("id");



ALTER TABLE ONLY "public"."recipes"
    ADD CONSTRAINT "recipes_crop_profile_id_fkey" FOREIGN KEY ("crop_profile_id") REFERENCES "public"."crop_profiles"("id");



ALTER TABLE ONLY "public"."recipes"
    ADD CONSTRAINT "recipes_water_profile_id_fkey" FOREIGN KEY ("water_profile_id") REFERENCES "public"."water_profiles"("id");



ALTER TABLE ONLY "public"."rules"
    ADD CONSTRAINT "rules_farm_id_fkey" FOREIGN KEY ("farm_id") REFERENCES "public"."farms"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sensor_readings"
    ADD CONSTRAINT "sensor_readings_sensor_id_fkey" FOREIGN KEY ("sensor_id") REFERENCES "public"."sensors"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sensors"
    ADD CONSTRAINT "sensors_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "public"."devices"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."transport_configs"
    ADD CONSTRAINT "transport_configs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_invites"
    ADD CONSTRAINT "user_invites_invited_by_fkey" FOREIGN KEY ("invited_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."user_settings"
    ADD CONSTRAINT "user_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id");



CREATE POLICY "Anyone can view invite by token" ON "public"."user_invites" FOR SELECT USING (true);



CREATE POLICY "Anyone can view tenants" ON "public"."tenants" FOR SELECT USING (true);



CREATE POLICY "Authenticated users can view devices" ON "public"."devices" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Authenticated users can view farms" ON "public"."farms" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable delete for authenticated users" ON "public"."devices" FOR DELETE TO "authenticated" USING (true);



CREATE POLICY "Enable delete for authenticated users" ON "public"."farms" FOR DELETE TO "authenticated" USING (true);



CREATE POLICY "Enable insert for authenticated users" ON "public"."devices" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Enable insert for authenticated users" ON "public"."farms" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Enable select for authenticated users" ON "public"."devices" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Enable select for authenticated users" ON "public"."farms" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Enable update for authenticated users" ON "public"."devices" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Enable update for authenticated users" ON "public"."farms" FOR UPDATE TO "authenticated" USING (true);



CREATE POLICY "Members can view their farm devices" ON "public"."devices" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."memberships" "m"
     JOIN "public"."farms" "f" ON (("f"."tenant_id" = "m"."tenant_id")))
  WHERE (("f"."id" = "devices"."farm_id") AND ("m"."user_id" = "auth"."uid"())))));



CREATE POLICY "Members can view their farm sensor readings" ON "public"."sensor_readings" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ((("public"."memberships" "m"
     JOIN "public"."farms" "f" ON (("f"."tenant_id" = "m"."tenant_id")))
     JOIN "public"."devices" "d" ON (("d"."farm_id" = "f"."id")))
     JOIN "public"."sensors" "s" ON (("s"."device_id" = "d"."id")))
  WHERE (("s"."id" = "sensor_readings"."sensor_id") AND ("m"."user_id" = "auth"."uid"())))));



CREATE POLICY "Members can view their farm sensors" ON "public"."sensors" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM (("public"."memberships" "m"
     JOIN "public"."farms" "f" ON (("f"."tenant_id" = "m"."tenant_id")))
     JOIN "public"."devices" "d" ON (("d"."farm_id" = "f"."id")))
  WHERE (("d"."id" = "sensors"."device_id") AND ("m"."user_id" = "auth"."uid"())))));



CREATE POLICY "Members can view their farms" ON "public"."farms" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."memberships" "m"
  WHERE (("m"."tenant_id" = "farms"."tenant_id") AND ("m"."user_id" = "auth"."uid"())))));



CREATE POLICY "Service role can insert sensor readings" ON "public"."sensor_readings" FOR INSERT WITH CHECK (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role full access to device_claims" ON "public"."device_claims" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service role full access to iot_commands" ON "public"."iot_commands" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service role full access to iot_devices" ON "public"."iot_devices" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service role full access to iot_readings" ON "public"."iot_readings" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service role full access to modbus_configs" ON "public"."modbus_configs" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service role full access to transport_configs" ON "public"."transport_configs" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "System admins can manage all farm MQTT configs" ON "public"."farm_mqtt_configs" USING ((EXISTS ( SELECT 1
   FROM "public"."memberships" "m"
  WHERE (("m"."user_id" = "auth"."uid"()) AND ("m"."role" = 'system_admin'::"text")))));



CREATE POLICY "System admins can manage all invites" ON "public"."user_invites" USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role" = ANY (ARRAY['system_admin'::"text", 'super_admin'::"text"]))))));



CREATE POLICY "System admins can update all users" ON "public"."users" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."users" "users_1"
  WHERE (("users_1"."id" = "auth"."uid"()) AND ("users_1"."role" = 'system_admin'::"text") AND ("users_1"."is_active" = true)))));



CREATE POLICY "System admins can view all devices" ON "public"."devices" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role" = 'system_admin'::"text") AND ("users"."is_active" = true)))));



CREATE POLICY "System admins can view all farms" ON "public"."farms" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role" = 'system_admin'::"text") AND ("users"."is_active" = true)))));



CREATE POLICY "System admins can view all sensor readings" ON "public"."sensor_readings" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role" = 'system_admin'::"text") AND ("users"."is_active" = true)))));



CREATE POLICY "System admins can view all sensors" ON "public"."sensors" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role" = 'system_admin'::"text") AND ("users"."is_active" = true)))));



CREATE POLICY "System admins can view all users" ON "public"."users" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."users" "users_1"
  WHERE (("users_1"."id" = "auth"."uid"()) AND ("users_1"."role" = 'system_admin'::"text") AND ("users_1"."is_active" = true)))));



CREATE POLICY "Users can insert own profile" ON "public"."users" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can insert own settings relaxed" ON "public"."user_settings" FOR INSERT WITH CHECK (true);



CREATE POLICY "Users can manage their farm MQTT configs" ON "public"."farm_mqtt_configs" USING (("farm_id" IN ( SELECT "f"."id"
   FROM ("public"."farms" "f"
     JOIN "public"."memberships" "m" ON (("f"."tenant_id" = "m"."tenant_id")))
  WHERE ("m"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can update own profile" ON "public"."users" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can update own settings" ON "public"."user_settings" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view invites they created" ON "public"."user_invites" FOR SELECT USING ((("invited_by" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role" = ANY (ARRAY['system_admin'::"text", 'super_admin'::"text"])))))));



CREATE POLICY "Users can view own profile" ON "public"."users" FOR SELECT USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can view own settings" ON "public"."user_settings" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."alerts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."audits" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."beds" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."commands" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."device_claims" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."device_profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "device_profiles_service_role" ON "public"."device_profiles" TO "service_role" USING (true);



ALTER TABLE "public"."device_registry" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "device_registry_service_role" ON "public"."device_registry" TO "service_role" USING (true);



ALTER TABLE "public"."device_ui_templates" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "device_ui_templates_service_role" ON "public"."device_ui_templates" TO "service_role" USING (true);



ALTER TABLE "public"."farm_mqtt_configs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "fm_insert" ON "public"."farm_memberships" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."memberships" "m"
  WHERE (("m"."tenant_id" = "farm_memberships"."tenant_id") AND ("m"."user_id" = "auth"."uid"()) AND ("m"."role" = ANY (ARRAY['owner'::"text", 'operator'::"text"]))))));



CREATE POLICY "fm_select" ON "public"."farm_memberships" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."memberships" "m"
  WHERE (("m"."tenant_id" = "farm_memberships"."tenant_id") AND ("m"."user_id" = "auth"."uid"())))));



CREATE POLICY "fm_update" ON "public"."farm_memberships" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."memberships" "m"
  WHERE (("m"."tenant_id" = "farm_memberships"."tenant_id") AND ("m"."user_id" = "auth"."uid"()) AND ("m"."role" = ANY (ARRAY['owner'::"text", 'operator'::"text"]))))));



ALTER TABLE "public"."iot_commands" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."iot_devices" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."iot_readings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."modbus_configs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."nutrient_jobs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."nutrient_recipe_aliases" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "p_alias_service" ON "public"."nutrient_recipe_aliases" USING (("auth"."role"() = 'service_role'::"text")) WITH CHECK (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "p_delete_farm_memberships" ON "public"."farm_memberships" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."memberships" "m"
  WHERE (("m"."tenant_id" = "farm_memberships"."tenant_id") AND ("m"."user_id" = "auth"."uid"()) AND ("m"."role" = ANY (ARRAY['super_admin'::"text", 'system_admin'::"text"]))))));



CREATE POLICY "p_insert_beds" ON "public"."beds" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM ("public"."memberships" "m"
     JOIN "public"."farms" "f" ON (("f"."tenant_id" = "m"."tenant_id")))
  WHERE (("f"."id" = "beds"."farm_id") AND ("m"."user_id" = "auth"."uid"()) AND ("m"."role" = ANY (ARRAY['owner'::"text", 'operator'::"text"]))))));



CREATE POLICY "p_insert_commands" ON "public"."commands" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM (("public"."memberships" "m"
     JOIN "public"."farms" "f" ON (("f"."tenant_id" = "m"."tenant_id")))
     JOIN "public"."devices" "d" ON (("d"."farm_id" = "f"."id")))
  WHERE (("d"."id" = "commands"."device_id") AND ("m"."user_id" = "auth"."uid"()) AND ("m"."role" = ANY (ARRAY['owner'::"text", 'operator'::"text"]))))));



CREATE POLICY "p_insert_devices" ON "public"."devices" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM ("public"."memberships" "m"
     JOIN "public"."farms" "f" ON (("f"."tenant_id" = "m"."tenant_id")))
  WHERE (("f"."id" = "devices"."farm_id") AND ("m"."user_id" = "auth"."uid"()) AND ("m"."role" = ANY (ARRAY['owner'::"text", 'operator'::"text"]))))));



CREATE POLICY "p_insert_farm_memberships" ON "public"."farm_memberships" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."memberships" "m"
  WHERE (("m"."tenant_id" = "farm_memberships"."tenant_id") AND ("m"."user_id" = "auth"."uid"()) AND ("m"."role" = ANY (ARRAY['super_admin'::"text", 'system_admin'::"text", 'team_leader'::"text"]))))));



CREATE POLICY "p_insert_farms" ON "public"."farms" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."memberships" "m"
  WHERE (("m"."tenant_id" = "farms"."tenant_id") AND ("m"."user_id" = "auth"."uid"()) AND ("m"."role" = ANY (ARRAY['owner'::"text", 'operator'::"text"]))))));



CREATE POLICY "p_insert_memberships" ON "public"."memberships" FOR INSERT WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "p_insert_rules" ON "public"."rules" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."memberships" "m"
  WHERE (("m"."tenant_id" = ( SELECT "farms"."tenant_id"
           FROM "public"."farms"
          WHERE ("farms"."id" = "rules"."farm_id"))) AND ("m"."user_id" = "auth"."uid"()) AND ("m"."role" = 'owner'::"text")))));



CREATE POLICY "p_jobs_service" ON "public"."nutrient_jobs" USING (("auth"."role"() = 'service_role'::"text")) WITH CHECK (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "p_select_alerts" ON "public"."alerts" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."memberships" "m"
  WHERE (("m"."tenant_id" = ( SELECT "farms"."tenant_id"
           FROM "public"."farms"
          WHERE ("farms"."id" = "alerts"."farm_id"))) AND ("m"."user_id" = "auth"."uid"())))));



CREATE POLICY "p_select_audits" ON "public"."audits" FOR SELECT USING ((("user_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."memberships" "m"
  WHERE (("m"."user_id" = "auth"."uid"()) AND ("m"."role" = 'owner'::"text"))))));



CREATE POLICY "p_select_beds" ON "public"."beds" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."memberships" "m"
     JOIN "public"."farms" "f" ON (("f"."tenant_id" = "m"."tenant_id")))
  WHERE (("f"."id" = "beds"."farm_id") AND ("m"."user_id" = "auth"."uid"())))));



CREATE POLICY "p_select_commands" ON "public"."commands" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM (("public"."memberships" "m"
     JOIN "public"."farms" "f" ON (("f"."tenant_id" = "m"."tenant_id")))
     JOIN "public"."devices" "d" ON (("d"."farm_id" = "f"."id")))
  WHERE (("d"."id" = "commands"."device_id") AND ("m"."user_id" = "auth"."uid"())))));



CREATE POLICY "p_select_farm_memberships" ON "public"."farm_memberships" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."memberships" "m"
  WHERE (("m"."tenant_id" = "farm_memberships"."tenant_id") AND ("m"."user_id" = "auth"."uid"())))));



CREATE POLICY "p_select_memberships" ON "public"."memberships" FOR SELECT USING (true);



CREATE POLICY "p_select_rules" ON "public"."rules" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."memberships" "m"
  WHERE (("m"."tenant_id" = ( SELECT "farms"."tenant_id"
           FROM "public"."farms"
          WHERE ("farms"."id" = "rules"."farm_id"))) AND ("m"."user_id" = "auth"."uid"())))));



CREATE POLICY "p_select_tenants" ON "public"."tenants" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."memberships" "m"
  WHERE (("m"."tenant_id" = "tenants"."id") AND ("m"."user_id" = "auth"."uid"())))));



CREATE POLICY "p_update_farm_memberships" ON "public"."farm_memberships" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."memberships" "m"
  WHERE (("m"."tenant_id" = "farm_memberships"."tenant_id") AND ("m"."user_id" = "auth"."uid"()) AND ("m"."role" = ANY (ARRAY['super_admin'::"text", 'system_admin'::"text", 'team_leader'::"text"]))))));



CREATE POLICY "p_update_memberships" ON "public"."memberships" FOR UPDATE USING (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."rules" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tenants" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."transport_configs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_invites" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_settings" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "사용자 본인 설정 관리" ON "public"."user_settings" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "서비스 키 접근 허용" ON "public"."user_settings" USING (("current_setting"('role'::"text") = 'service_role'::"text"));





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."build_device_ui_model"("p_device_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."build_device_ui_model"("p_device_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."build_device_ui_model"("p_device_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."cleanup_expired_claims"() TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_expired_claims"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_expired_claims"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_latest_iot_readings"("p_device_uuid" "text", "p_limit" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_latest_iot_readings"("p_device_uuid" "text", "p_limit" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_latest_iot_readings"("p_device_uuid" "text", "p_limit" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_tenant_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_tenant_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_tenant_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_expired_invites"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_expired_invites"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_expired_invites"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_farm_memberships_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_farm_memberships_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_farm_memberships_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_farm_mqtt_configs_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_farm_mqtt_configs_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_farm_mqtt_configs_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_iot_commands_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_iot_commands_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_iot_commands_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_iot_device_last_seen"("p_device_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."update_iot_device_last_seen"("p_device_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_iot_device_last_seen"("p_device_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_iot_devices_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_iot_devices_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_iot_devices_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_modbus_configs_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_modbus_configs_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_modbus_configs_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_transport_configs_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_transport_configs_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_transport_configs_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";


















GRANT ALL ON TABLE "public"."acid_bases" TO "anon";
GRANT ALL ON TABLE "public"."acid_bases" TO "authenticated";
GRANT ALL ON TABLE "public"."acid_bases" TO "service_role";



GRANT ALL ON TABLE "public"."adjustments" TO "anon";
GRANT ALL ON TABLE "public"."adjustments" TO "authenticated";
GRANT ALL ON TABLE "public"."adjustments" TO "service_role";



GRANT ALL ON TABLE "public"."alerts" TO "anon";
GRANT ALL ON TABLE "public"."alerts" TO "authenticated";
GRANT ALL ON TABLE "public"."alerts" TO "service_role";



GRANT ALL ON TABLE "public"."audits" TO "anon";
GRANT ALL ON TABLE "public"."audits" TO "authenticated";
GRANT ALL ON TABLE "public"."audits" TO "service_role";



GRANT ALL ON TABLE "public"."bed_crop_data" TO "anon";
GRANT ALL ON TABLE "public"."bed_crop_data" TO "authenticated";
GRANT ALL ON TABLE "public"."bed_crop_data" TO "service_role";



GRANT ALL ON TABLE "public"."beds" TO "anon";
GRANT ALL ON TABLE "public"."beds" TO "authenticated";
GRANT ALL ON TABLE "public"."beds" TO "service_role";



GRANT ALL ON TABLE "public"."commands" TO "anon";
GRANT ALL ON TABLE "public"."commands" TO "authenticated";
GRANT ALL ON TABLE "public"."commands" TO "service_role";



GRANT ALL ON TABLE "public"."crop_alias" TO "anon";
GRANT ALL ON TABLE "public"."crop_alias" TO "authenticated";
GRANT ALL ON TABLE "public"."crop_alias" TO "service_role";



GRANT ALL ON TABLE "public"."crop_profiles" TO "anon";
GRANT ALL ON TABLE "public"."crop_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."crop_profiles" TO "service_role";



GRANT ALL ON TABLE "public"."device_claims" TO "anon";
GRANT ALL ON TABLE "public"."device_claims" TO "authenticated";
GRANT ALL ON TABLE "public"."device_claims" TO "service_role";



GRANT ALL ON TABLE "public"."device_profiles" TO "anon";
GRANT ALL ON TABLE "public"."device_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."device_profiles" TO "service_role";



GRANT ALL ON TABLE "public"."device_registry" TO "anon";
GRANT ALL ON TABLE "public"."device_registry" TO "authenticated";
GRANT ALL ON TABLE "public"."device_registry" TO "service_role";



GRANT ALL ON TABLE "public"."device_ui_templates" TO "anon";
GRANT ALL ON TABLE "public"."device_ui_templates" TO "authenticated";
GRANT ALL ON TABLE "public"."device_ui_templates" TO "service_role";



GRANT ALL ON TABLE "public"."devices" TO "anon";
GRANT ALL ON TABLE "public"."devices" TO "authenticated";
GRANT ALL ON TABLE "public"."devices" TO "service_role";



GRANT ALL ON TABLE "public"."farm_memberships" TO "anon";
GRANT ALL ON TABLE "public"."farm_memberships" TO "authenticated";
GRANT ALL ON TABLE "public"."farm_memberships" TO "service_role";



GRANT ALL ON TABLE "public"."farm_mqtt_configs" TO "anon";
GRANT ALL ON TABLE "public"."farm_mqtt_configs" TO "authenticated";
GRANT ALL ON TABLE "public"."farm_mqtt_configs" TO "service_role";



GRANT ALL ON TABLE "public"."farms" TO "anon";
GRANT ALL ON TABLE "public"."farms" TO "authenticated";
GRANT ALL ON TABLE "public"."farms" TO "service_role";



GRANT ALL ON TABLE "public"."iot_commands" TO "anon";
GRANT ALL ON TABLE "public"."iot_commands" TO "authenticated";
GRANT ALL ON TABLE "public"."iot_commands" TO "service_role";



GRANT ALL ON TABLE "public"."iot_devices" TO "anon";
GRANT ALL ON TABLE "public"."iot_devices" TO "authenticated";
GRANT ALL ON TABLE "public"."iot_devices" TO "service_role";



GRANT ALL ON TABLE "public"."iot_readings" TO "anon";
GRANT ALL ON TABLE "public"."iot_readings" TO "authenticated";
GRANT ALL ON TABLE "public"."iot_readings" TO "service_role";



GRANT ALL ON TABLE "public"."iot_readings_hourly" TO "anon";
GRANT ALL ON TABLE "public"."iot_readings_hourly" TO "authenticated";
GRANT ALL ON TABLE "public"."iot_readings_hourly" TO "service_role";



GRANT ALL ON TABLE "public"."memberships" TO "anon";
GRANT ALL ON TABLE "public"."memberships" TO "authenticated";
GRANT ALL ON TABLE "public"."memberships" TO "service_role";



GRANT ALL ON TABLE "public"."mixing_instructions" TO "anon";
GRANT ALL ON TABLE "public"."mixing_instructions" TO "authenticated";
GRANT ALL ON TABLE "public"."mixing_instructions" TO "service_role";



GRANT ALL ON TABLE "public"."mixing_rules" TO "anon";
GRANT ALL ON TABLE "public"."mixing_rules" TO "authenticated";
GRANT ALL ON TABLE "public"."mixing_rules" TO "service_role";



GRANT ALL ON TABLE "public"."modbus_configs" TO "anon";
GRANT ALL ON TABLE "public"."modbus_configs" TO "authenticated";
GRANT ALL ON TABLE "public"."modbus_configs" TO "service_role";



GRANT ALL ON TABLE "public"."nutrient_ions" TO "anon";
GRANT ALL ON TABLE "public"."nutrient_ions" TO "authenticated";
GRANT ALL ON TABLE "public"."nutrient_ions" TO "service_role";



GRANT ALL ON TABLE "public"."nutrient_jobs" TO "anon";
GRANT ALL ON TABLE "public"."nutrient_jobs" TO "authenticated";
GRANT ALL ON TABLE "public"."nutrient_jobs" TO "service_role";



GRANT ALL ON SEQUENCE "public"."nutrient_jobs_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."nutrient_jobs_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."nutrient_jobs_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."nutrient_recipe_aliases" TO "anon";
GRANT ALL ON TABLE "public"."nutrient_recipe_aliases" TO "authenticated";
GRANT ALL ON TABLE "public"."nutrient_recipe_aliases" TO "service_role";



GRANT ALL ON SEQUENCE "public"."nutrient_recipe_aliases_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."nutrient_recipe_aliases_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."nutrient_recipe_aliases_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."nutrient_recipes" TO "anon";
GRANT ALL ON TABLE "public"."nutrient_recipes" TO "authenticated";
GRANT ALL ON TABLE "public"."nutrient_recipes" TO "service_role";



GRANT ALL ON SEQUENCE "public"."nutrient_recipes_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."nutrient_recipes_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."nutrient_recipes_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."nutrient_sources" TO "anon";
GRANT ALL ON TABLE "public"."nutrient_sources" TO "authenticated";
GRANT ALL ON TABLE "public"."nutrient_sources" TO "service_role";



GRANT ALL ON SEQUENCE "public"."nutrient_sources_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."nutrient_sources_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."nutrient_sources_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."recipe_lines" TO "anon";
GRANT ALL ON TABLE "public"."recipe_lines" TO "authenticated";
GRANT ALL ON TABLE "public"."recipe_lines" TO "service_role";



GRANT ALL ON TABLE "public"."recipes" TO "anon";
GRANT ALL ON TABLE "public"."recipes" TO "authenticated";
GRANT ALL ON TABLE "public"."recipes" TO "service_role";



GRANT ALL ON TABLE "public"."rules" TO "anon";
GRANT ALL ON TABLE "public"."rules" TO "authenticated";
GRANT ALL ON TABLE "public"."rules" TO "service_role";



GRANT ALL ON TABLE "public"."salts" TO "anon";
GRANT ALL ON TABLE "public"."salts" TO "authenticated";
GRANT ALL ON TABLE "public"."salts" TO "service_role";



GRANT ALL ON TABLE "public"."sensor_readings" TO "anon";
GRANT ALL ON TABLE "public"."sensor_readings" TO "authenticated";
GRANT ALL ON TABLE "public"."sensor_readings" TO "service_role";



GRANT ALL ON SEQUENCE "public"."sensor_readings_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."sensor_readings_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."sensor_readings_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."sensors" TO "anon";
GRANT ALL ON TABLE "public"."sensors" TO "authenticated";
GRANT ALL ON TABLE "public"."sensors" TO "service_role";



GRANT ALL ON TABLE "public"."teams" TO "anon";
GRANT ALL ON TABLE "public"."teams" TO "authenticated";
GRANT ALL ON TABLE "public"."teams" TO "service_role";



GRANT ALL ON TABLE "public"."tenants" TO "anon";
GRANT ALL ON TABLE "public"."tenants" TO "authenticated";
GRANT ALL ON TABLE "public"."tenants" TO "service_role";



GRANT ALL ON TABLE "public"."transport_configs" TO "anon";
GRANT ALL ON TABLE "public"."transport_configs" TO "authenticated";
GRANT ALL ON TABLE "public"."transport_configs" TO "service_role";



GRANT ALL ON TABLE "public"."user_invites" TO "anon";
GRANT ALL ON TABLE "public"."user_invites" TO "authenticated";
GRANT ALL ON TABLE "public"."user_invites" TO "service_role";



GRANT ALL ON TABLE "public"."user_settings" TO "anon";
GRANT ALL ON TABLE "public"."user_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."user_settings" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";



GRANT ALL ON TABLE "public"."v_invite_details" TO "anon";
GRANT ALL ON TABLE "public"."v_invite_details" TO "authenticated";
GRANT ALL ON TABLE "public"."v_invite_details" TO "service_role";



GRANT ALL ON TABLE "public"."v_invite_stats" TO "anon";
GRANT ALL ON TABLE "public"."v_invite_stats" TO "authenticated";
GRANT ALL ON TABLE "public"."v_invite_stats" TO "service_role";



GRANT ALL ON TABLE "public"."vw_crop_recipes_latest" TO "anon";
GRANT ALL ON TABLE "public"."vw_crop_recipes_latest" TO "authenticated";
GRANT ALL ON TABLE "public"."vw_crop_recipes_latest" TO "service_role";



GRANT ALL ON TABLE "public"."water_profiles" TO "anon";
GRANT ALL ON TABLE "public"."water_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."water_profiles" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































RESET ALL;

