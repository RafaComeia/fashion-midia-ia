-- Fashion Mídia.IA — Initial Schema Migration
-- Aplicar via Supabase Dashboard > SQL Editor

-- ─── Extensões ────────────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── Enums ────────────────────────────────────────────────────────────────────

CREATE TYPE "workspace_role" AS ENUM ('admin', 'editor', 'viewer');

CREATE TYPE "campaign_status" AS ENUM ('draft', 'generating', 'ready', 'archived');

CREATE TYPE "asset_type" AS ENUM ('image', 'video');

CREATE TYPE "job_status" AS ENUM ('pending', 'processing', 'completed', 'failed', 'cancelled');

CREATE TYPE "social_platform" AS ENUM ('instagram', 'whatsapp');

CREATE TYPE "fashion_style" AS ENUM (
  'casual', 'festa', 'fitness', 'infantil',
  'executivo', 'praia', 'noivas', 'plus_size', 'custom'
);

CREATE TYPE "aspect_ratio" AS ENUM ('1:1', '9:16', '16:9', '4:5', '3:4');

-- ─── Tabela: workspaces ───────────────────────────────────────────────────────

CREATE TABLE "workspaces" (
  "id"         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name"       TEXT NOT NULL,
  "slug"       TEXT NOT NULL UNIQUE,
  "logo_url"   TEXT,
  "segment"    "fashion_style",
  "plan"       TEXT NOT NULL DEFAULT 'free',
  "is_active"  BOOLEAN NOT NULL DEFAULT TRUE,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT "workspaces_name_length" CHECK (char_length("name") BETWEEN 2 AND 100),
  CONSTRAINT "workspaces_slug_format" CHECK ("slug" ~ '^[a-z0-9-]+$')
);

COMMENT ON TABLE "workspaces" IS 'Tenant root — cada empresa/marca é um workspace isolado';
COMMENT ON COLUMN "workspaces"."slug" IS 'Identificador único URL-safe da marca';
COMMENT ON COLUMN "workspaces"."plan" IS 'Plano de assinatura: free, starter, pro';

-- ─── Tabela: workspace_members ────────────────────────────────────────────────

CREATE TABLE "workspace_members" (
  "id"           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "workspace_id" UUID NOT NULL REFERENCES "workspaces"("id") ON DELETE CASCADE,
  "user_id"      UUID NOT NULL REFERENCES auth.users("id") ON DELETE CASCADE,
  "role"         "workspace_role" NOT NULL DEFAULT 'viewer',
  "invited_by"   UUID REFERENCES auth.users("id"),
  "joined_at"    TIMESTAMPTZ,
  "created_at"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT "workspace_members_unique" UNIQUE ("workspace_id", "user_id")
);

COMMENT ON TABLE "workspace_members" IS 'Associação de usuários a workspaces com controle de acesso por role';

-- ─── Tabela: collections ──────────────────────────────────────────────────────

CREATE TABLE "collections" (
  "id"           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "workspace_id" UUID NOT NULL REFERENCES "workspaces"("id") ON DELETE CASCADE,
  "name"         TEXT NOT NULL,
  "description"  TEXT,
  "cover_url"    TEXT,
  "is_active"    BOOLEAN NOT NULL DEFAULT TRUE,
  "created_by"   UUID REFERENCES auth.users("id"),
  "created_at"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT "collections_name_length" CHECK (char_length("name") BETWEEN 1 AND 100)
);

COMMENT ON TABLE "collections" IS 'Agrupamento de campanhas por coleção ou temporada';

-- ─── Tabela: prompt_styles ────────────────────────────────────────────────────

CREATE TABLE "prompt_styles" (
  "id"                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name"              TEXT NOT NULL UNIQUE,
  "slug"              TEXT NOT NULL UNIQUE,
  "style"             "fashion_style" NOT NULL,
  "description"       TEXT NOT NULL,
  "base_prompt"       TEXT NOT NULL,
  "example_image_url" TEXT,
  "icon"              TEXT,
  "is_active"         BOOLEAN NOT NULL DEFAULT TRUE,
  "sort_order"        INT NOT NULL DEFAULT 0,
  "created_at"        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at"        TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT "prompt_styles_base_prompt_length" CHECK (char_length("base_prompt") <= 1000)
);

COMMENT ON TABLE "prompt_styles" IS 'Biblioteca global de estilos pré-configurados';

-- ─── Tabela: campaigns ───────────────────────────────────────────────────────

CREATE TABLE "campaigns" (
  "id"              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "workspace_id"    UUID NOT NULL REFERENCES "workspaces"("id") ON DELETE CASCADE,
  "collection_id"   UUID REFERENCES "collections"("id") ON DELETE SET NULL,
  "name"            TEXT NOT NULL,
  "description"     TEXT,
  "status"          "campaign_status" NOT NULL DEFAULT 'draft',
  "style"           "fashion_style",
  "prompt_style_id" UUID REFERENCES "prompt_styles"("id") ON DELETE SET NULL,
  "custom_prompt"   TEXT,
  "aspect_ratio"    "aspect_ratio" NOT NULL DEFAULT '1:1',
  "product_images"  TEXT[] NOT NULL DEFAULT '{}',
  "tags"            TEXT[] NOT NULL DEFAULT '{}',
  "is_template"     BOOLEAN NOT NULL DEFAULT FALSE,
  "duplicated_from" UUID REFERENCES "campaigns"("id"),
  "created_by"      UUID REFERENCES auth.users("id"),
  "created_at"      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at"      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT "campaigns_name_length" CHECK (char_length("name") BETWEEN 1 AND 200),
  CONSTRAINT "campaigns_custom_prompt_length" CHECK (
    "custom_prompt" IS NULL OR char_length("custom_prompt") <= 500
  )
);

COMMENT ON TABLE "campaigns" IS 'Campanhas de moda criadas com IA — unidade principal de trabalho';

-- ─── Tabela: generation_jobs ─────────────────────────────────────────────────

CREATE TABLE "generation_jobs" (
  "id"            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "workspace_id"  UUID NOT NULL REFERENCES "workspaces"("id") ON DELETE CASCADE,
  "campaign_id"   UUID REFERENCES "campaigns"("id") ON DELETE SET NULL,
  "type"          "asset_type" NOT NULL,
  "status"        "job_status" NOT NULL DEFAULT 'pending',
  "bull_job_id"   TEXT,
  "model_id"      TEXT NOT NULL,
  "prompt"        TEXT NOT NULL,
  "parameters"    JSONB NOT NULL DEFAULT '{}',
  "result_paths"  TEXT[],
  "error_message" TEXT,
  "retry_count"   INT NOT NULL DEFAULT 0,
  "started_at"    TIMESTAMPTZ,
  "completed_at"  TIMESTAMPTZ,
  "created_by"    UUID REFERENCES auth.users("id"),
  "created_at"    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at"    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE "generation_jobs" IS 'Histórico de todos os jobs de geração de IA';

-- ─── Tabela: campaign_assets ─────────────────────────────────────────────────

CREATE TABLE "campaign_assets" (
  "id"                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "campaign_id"       UUID NOT NULL REFERENCES "campaigns"("id") ON DELETE CASCADE,
  "workspace_id"      UUID NOT NULL REFERENCES "workspaces"("id") ON DELETE CASCADE,
  "type"              "asset_type" NOT NULL,
  "storage_path"      TEXT NOT NULL,
  "file_name"         TEXT NOT NULL,
  "file_size_bytes"   BIGINT,
  "mime_type"         TEXT NOT NULL,
  "width_px"          INT,
  "height_px"         INT,
  "duration_sec"      INT,
  "aspect_ratio"      "aspect_ratio",
  "resolution"        TEXT,
  "is_primary"        BOOLEAN NOT NULL DEFAULT FALSE,
  "generation_job_id" UUID REFERENCES "generation_jobs"("id"),
  "metadata"          JSONB NOT NULL DEFAULT '{}',
  "created_at"        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE "campaign_assets" IS 'Imagens e vídeos gerados pela IA para cada campanha';

-- ─── Tabela: campaign_metrics ────────────────────────────────────────────────

CREATE TABLE "campaign_metrics" (
  "id"               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "campaign_id"      UUID NOT NULL REFERENCES "campaigns"("id") ON DELETE CASCADE,
  "workspace_id"     UUID NOT NULL REFERENCES "workspaces"("id") ON DELETE CASCADE,
  "platform"         "social_platform" NOT NULL,
  "external_post_id" TEXT,
  "metric_date"      DATE NOT NULL,
  "impressions"      BIGINT NOT NULL DEFAULT 0,
  "reach"            BIGINT NOT NULL DEFAULT 0,
  "likes"            INT NOT NULL DEFAULT 0,
  "comments"         INT NOT NULL DEFAULT 0,
  "shares"           INT NOT NULL DEFAULT 0,
  "saves"            INT NOT NULL DEFAULT 0,
  "clicks"           INT NOT NULL DEFAULT 0,
  "conversions"      INT NOT NULL DEFAULT 0,
  "engagement_rate"  NUMERIC(5,2),
  "raw_data"         JSONB NOT NULL DEFAULT '{}',
  "synced_at"        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "created_at"       TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT "campaign_metrics_unique" UNIQUE ("campaign_id", "platform", "metric_date")
);

COMMENT ON TABLE "campaign_metrics" IS 'Métricas de performance das campanhas nas redes sociais';

-- ─── Tabela: custom_prompts ──────────────────────────────────────────────────

CREATE TABLE "custom_prompts" (
  "id"           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "workspace_id" UUID NOT NULL REFERENCES "workspaces"("id") ON DELETE CASCADE,
  "user_id"      UUID REFERENCES auth.users("id") ON DELETE SET NULL,
  "name"         TEXT,
  "prompt_text"  TEXT NOT NULL,
  "style_id"     UUID REFERENCES "prompt_styles"("id"),
  "use_count"    INT NOT NULL DEFAULT 1,
  "last_used_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "created_at"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT "custom_prompts_text_length" CHECK (char_length("prompt_text") <= 500)
);

COMMENT ON TABLE "custom_prompts" IS 'Prompts personalizados salvos por workspace';

-- ─── Tabela: social_connections ──────────────────────────────────────────────

CREATE TABLE "social_connections" (
  "id"               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "workspace_id"     UUID NOT NULL REFERENCES "workspaces"("id") ON DELETE CASCADE,
  "platform"         "social_platform" NOT NULL,
  "account_id"       TEXT,
  "account_name"     TEXT,
  "access_token"     TEXT,
  "refresh_token"    TEXT,
  "token_expires_at" TIMESTAMPTZ,
  "is_active"        BOOLEAN NOT NULL DEFAULT TRUE,
  "last_synced_at"   TIMESTAMPTZ,
  "connected_by"     UUID REFERENCES auth.users("id"),
  "created_at"       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at"       TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT "social_connections_unique" UNIQUE ("workspace_id", "platform")
);

COMMENT ON TABLE "social_connections" IS 'Tokens OAuth e configurações de integração com redes sociais';

-- ─── Indexes ─────────────────────────────────────────────────────────────────

-- workspaces
CREATE INDEX "idx_workspaces_slug" ON "workspaces"("slug");
CREATE INDEX "idx_workspaces_is_active" ON "workspaces"("is_active") WHERE "is_active" = TRUE;

-- workspace_members
CREATE INDEX "idx_workspace_members_workspace_id" ON "workspace_members"("workspace_id");
CREATE INDEX "idx_workspace_members_user_id" ON "workspace_members"("user_id");
CREATE INDEX "idx_workspace_members_lookup" ON "workspace_members"("user_id", "workspace_id");

-- collections
CREATE INDEX "idx_collections_workspace_id" ON "collections"("workspace_id");

-- campaigns
CREATE INDEX "idx_campaigns_workspace_id" ON "campaigns"("workspace_id");
CREATE INDEX "idx_campaigns_workspace_created" ON "campaigns"("workspace_id", "created_at" DESC);
CREATE INDEX "idx_campaigns_status" ON "campaigns"("workspace_id", "status");

-- campaign_assets
CREATE INDEX "idx_campaign_assets_campaign_id" ON "campaign_assets"("campaign_id");
CREATE INDEX "idx_campaign_assets_workspace_id" ON "campaign_assets"("workspace_id");

-- generation_jobs
CREATE INDEX "idx_generation_jobs_workspace_id" ON "generation_jobs"("workspace_id");
CREATE INDEX "idx_generation_jobs_campaign_id" ON "generation_jobs"("campaign_id");
CREATE INDEX "idx_generation_jobs_status" ON "generation_jobs"("workspace_id", "status");

-- ─── Row Level Security ──────────────────────────────────────────────────────

-- Habilitar RLS em todas as tabelas
ALTER TABLE "workspaces" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "workspace_members" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "collections" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "campaigns" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "campaign_assets" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "campaign_metrics" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "generation_jobs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "prompt_styles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "custom_prompts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "social_connections" ENABLE ROW LEVEL SECURITY;

-- ─── RLS Policies: workspaces ────────────────────────────────────────────────

-- Usuário vê workspaces onde é membro
CREATE POLICY "workspaces_select" ON "workspaces"
  FOR SELECT USING (
    id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

-- Qualquer usuário autenticado pode criar workspace
CREATE POLICY "workspaces_insert" ON "workspaces"
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Apenas admin do workspace pode atualizar
CREATE POLICY "workspaces_update" ON "workspaces"
  FOR UPDATE USING (
    id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- ─── RLS Policies: workspace_members ────────────────────────────────────────

-- Membros veem outros membros do mesmo workspace
CREATE POLICY "workspace_members_select" ON "workspace_members"
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

-- Apenas admin pode adicionar membros
CREATE POLICY "workspace_members_insert" ON "workspace_members"
  FOR INSERT WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
    OR (
      -- Permite auto-inserção durante onboarding (primeiro membro = admin)
      NOT EXISTS (
        SELECT 1 FROM workspace_members wm2
        WHERE wm2.workspace_id = workspace_members.workspace_id
      )
    )
  );

-- ─── RLS Policies: collections, campaigns, assets ────────────────────────────

-- Apenas membros do workspace têm acesso
CREATE POLICY "collections_member_access" ON "collections"
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "campaigns_member_access" ON "campaigns"
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "campaign_assets_member_access" ON "campaign_assets"
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "campaign_metrics_member_access" ON "campaign_metrics"
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "generation_jobs_member_access" ON "generation_jobs"
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "custom_prompts_member_access" ON "custom_prompts"
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "social_connections_member_access" ON "social_connections"
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

-- prompt_styles são públicos para leitura (global, sem workspace)
CREATE POLICY "prompt_styles_public_read" ON "prompt_styles"
  FOR SELECT USING (is_active = TRUE);

-- ─── Função: atualização automática de updated_at ────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
CREATE TRIGGER "workspaces_updated_at"
  BEFORE UPDATE ON "workspaces"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER "workspace_members_updated_at"
  BEFORE UPDATE ON "workspace_members"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER "collections_updated_at"
  BEFORE UPDATE ON "collections"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER "prompt_styles_updated_at"
  BEFORE UPDATE ON "prompt_styles"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER "campaigns_updated_at"
  BEFORE UPDATE ON "campaigns"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER "generation_jobs_updated_at"
  BEFORE UPDATE ON "generation_jobs"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER "social_connections_updated_at"
  BEFORE UPDATE ON "social_connections"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
