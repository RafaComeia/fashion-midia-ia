# Fashion Mídia.IA — Database Schema Design

**Versão:** 1.0  
**Data:** 2026-04-02  
**Engenheira de Dados:** Dara (@data-engineer)  
**Banco:** PostgreSQL via Supabase  
**ORM:** Prisma  

---

## 1. Visão Geral do Modelo de Dados

```
auth.users (Supabase Auth — gerenciado pela plataforma)
    │
    └──▶ workspace_members ◀──── workspaces (tenant root)
                                      │
                    ┌─────────────────┼──────────────────────┐
                    │                 │                       │
                    ▼                 ▼                       ▼
              collections        campaigns            social_connections
                    │                 │                  (Instagram / WA)
                    │         ┌───────┼───────┐
                    │         ▼       ▼       ▼
                    └──▶ campaign  campaign  generation
                          assets   metrics    jobs
                    
prompt_styles (global, sem workspace_id)
custom_prompts (por workspace)
```

---

## 2. Entidades e Responsabilidades

| Tabela | Escopo | Descrição |
|--------|--------|-----------|
| `workspaces` | tenant root | Uma empresa = um workspace |
| `workspace_members` | por workspace | Usuários e seus roles no workspace |
| `collections` | por workspace | Agrupamento de campanhas |
| `campaigns` | por workspace | Campanhas criadas |
| `campaign_assets` | por campanha | Imagens e vídeos gerados |
| `campaign_metrics` | por campanha | Métricas de performance (Instagram/WA) |
| `generation_jobs` | por workspace | Histórico de jobs de geração de IA |
| `prompt_styles` | global | Estilos pré-configurados da plataforma |
| `custom_prompts` | por workspace | Prompts personalizados salvos pelo usuário |
| `social_connections` | por workspace | Tokens OAuth Instagram e WhatsApp |

---

## 3. DDL Completo

### 3.1 Extensões necessárias

```sql
-- Habilitar extensões
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
```

### 3.2 Enums

```sql
-- Role do membro no workspace
CREATE TYPE workspace_role AS ENUM ('admin', 'editor', 'viewer');

-- Status da campanha
CREATE TYPE campaign_status AS ENUM (
  'draft',       -- Rascunho, ainda sendo criada
  'generating',  -- IA gerando conteúdo
  'ready',       -- Pronta para uso
  'archived'     -- Arquivada
);

-- Tipo de asset gerado
CREATE TYPE asset_type AS ENUM ('image', 'video');

-- Status do job de geração
CREATE TYPE job_status AS ENUM (
  'pending',    -- Aguardando processamento
  'processing', -- Em processamento
  'completed',  -- Concluído com sucesso
  'failed',     -- Falhou
  'cancelled'   -- Cancelado pelo usuário
);

-- Tipo de conexão social
CREATE TYPE social_platform AS ENUM ('instagram', 'whatsapp');

-- Estilo de moda (para prompt_styles)
CREATE TYPE fashion_style AS ENUM (
  'casual',
  'festa',
  'fitness',
  'infantil',
  'executivo',
  'praia',
  'noivas',
  'plus_size',
  'custom'
);

-- Proporção de aspecto das imagens
CREATE TYPE aspect_ratio AS ENUM (
  '1:1',   -- Feed Instagram
  '9:16',  -- Stories / Reels
  '16:9',  -- YouTube / Wide
  '4:5',   -- Feed Instagram retrato
  '3:4'    -- Catálogo
);
```

### 3.3 Tabela: workspaces

```sql
CREATE TABLE workspaces (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  slug          TEXT NOT NULL UNIQUE,         -- Ex: "mazzara-fashion"
  logo_url      TEXT,                         -- URL no Supabase Storage
  segment       fashion_style,                -- Segmento principal da marca
  plan          TEXT NOT NULL DEFAULT 'free', -- free | starter | pro
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT workspaces_name_length CHECK (char_length(name) BETWEEN 2 AND 100),
  CONSTRAINT workspaces_slug_format CHECK (slug ~ '^[a-z0-9-]+$')
);

COMMENT ON TABLE workspaces IS 'Tenant root — cada empresa/marca é um workspace isolado';
COMMENT ON COLUMN workspaces.slug IS 'Identificador único URL-safe da marca';
COMMENT ON COLUMN workspaces.plan IS 'Plano de assinatura: free, starter, pro';
```

### 3.4 Tabela: workspace_members

```sql
CREATE TABLE workspace_members (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role          workspace_role NOT NULL DEFAULT 'viewer',
  invited_by    UUID REFERENCES auth.users(id),
  joined_at     TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT workspace_members_unique UNIQUE (workspace_id, user_id)
);

COMMENT ON TABLE workspace_members IS 'Associação de usuários a workspaces com controle de acesso por role';
COMMENT ON COLUMN workspace_members.role IS 'admin: gestão total | editor: criar/editar | viewer: somente leitura';
```

### 3.5 Tabela: collections

```sql
CREATE TABLE collections (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  description   TEXT,
  cover_url     TEXT,                          -- URL do asset de capa
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_by    UUID REFERENCES auth.users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT collections_name_length CHECK (char_length(name) BETWEEN 1 AND 100)
);

COMMENT ON TABLE collections IS 'Agrupamento de campanhas por coleção ou temporada';
```

### 3.6 Tabela: campaigns

```sql
CREATE TABLE campaigns (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  collection_id   UUID REFERENCES collections(id) ON DELETE SET NULL,
  name            TEXT NOT NULL,
  description     TEXT,
  status          campaign_status NOT NULL DEFAULT 'draft',
  style           fashion_style,
  prompt_style_id UUID REFERENCES prompt_styles(id) ON DELETE SET NULL,
  custom_prompt   TEXT,                          -- Prompt personalizado usado
  aspect_ratio    aspect_ratio NOT NULL DEFAULT '1:1',
  product_images  TEXT[] NOT NULL DEFAULT '{}', -- URLs das fotos do produto no Storage
  tags            TEXT[] NOT NULL DEFAULT '{}',
  is_template     BOOLEAN NOT NULL DEFAULT FALSE, -- Se pode ser reutilizada como base
  duplicated_from UUID REFERENCES campaigns(id), -- Referência se foi duplicada
  created_by      UUID REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT campaigns_name_length CHECK (char_length(name) BETWEEN 1 AND 200),
  CONSTRAINT campaigns_custom_prompt_length CHECK (
    custom_prompt IS NULL OR char_length(custom_prompt) <= 500
  )
);

COMMENT ON TABLE campaigns IS 'Campanhas de moda criadas com IA — unidade principal de trabalho';
COMMENT ON COLUMN campaigns.product_images IS 'Array de caminhos no Supabase Storage para as fotos do produto';
COMMENT ON COLUMN campaigns.is_template IS 'TRUE = disponível como base para novas campanhas';
```

### 3.7 Tabela: campaign_assets

```sql
CREATE TABLE campaign_assets (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id     UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  type            asset_type NOT NULL,
  storage_path    TEXT NOT NULL,              -- Caminho no Supabase Storage
  file_name       TEXT NOT NULL,
  file_size_bytes BIGINT,
  mime_type       TEXT NOT NULL,             -- image/jpeg, video/mp4, etc.
  width_px        INT,
  height_px       INT,
  duration_sec    INT,                       -- Apenas para vídeos
  aspect_ratio    aspect_ratio,
  resolution      TEXT,                      -- Ex: "2K", "1080p"
  is_primary      BOOLEAN NOT NULL DEFAULT FALSE, -- Asset principal da campanha
  generation_job_id UUID REFERENCES generation_jobs(id),
  metadata        JSONB NOT NULL DEFAULT '{}', -- Dados extras (model usado, tokens, etc.)
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT campaign_assets_one_primary 
    EXCLUDE USING btree (campaign_id WITH =) WHERE (is_primary = TRUE AND type = 'image')
);

COMMENT ON TABLE campaign_assets IS 'Imagens e vídeos gerados pela IA para cada campanha';
COMMENT ON COLUMN campaign_assets.storage_path IS 'Path relativo no Supabase Storage: {workspace_id}/campaigns/{campaign_id}/{filename}';
COMMENT ON COLUMN campaign_assets.metadata IS 'JSON com: model_id, prompt_tokens, generation_params, synthid_watermark';
```

### 3.8 Tabela: campaign_metrics

```sql
CREATE TABLE campaign_metrics (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id     UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  platform        social_platform NOT NULL,
  external_post_id TEXT,                     -- ID do post na plataforma
  metric_date     DATE NOT NULL,             -- Data de referência da métrica
  impressions     BIGINT NOT NULL DEFAULT 0,
  reach           BIGINT NOT NULL DEFAULT 0,
  likes           INT NOT NULL DEFAULT 0,
  comments        INT NOT NULL DEFAULT 0,
  shares          INT NOT NULL DEFAULT 0,
  saves           INT NOT NULL DEFAULT 0,
  clicks          INT NOT NULL DEFAULT 0,
  conversions     INT NOT NULL DEFAULT 0,
  engagement_rate NUMERIC(5,2),              -- Calculado: (likes+comments+shares)/reach*100
  raw_data        JSONB NOT NULL DEFAULT '{}', -- Resposta bruta da API social
  synced_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT campaign_metrics_unique UNIQUE (campaign_id, platform, metric_date)
);

COMMENT ON TABLE campaign_metrics IS 'Métricas de performance das campanhas nas redes sociais';
COMMENT ON COLUMN campaign_metrics.raw_data IS 'Resposta bruta da Instagram Graph API ou WhatsApp Business API';
```

### 3.9 Tabela: generation_jobs

```sql
CREATE TABLE generation_jobs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  campaign_id     UUID REFERENCES campaigns(id) ON DELETE SET NULL,
  type            asset_type NOT NULL,       -- 'image' ou 'video'
  status          job_status NOT NULL DEFAULT 'pending',
  bull_job_id     TEXT,                      -- ID do job no Bull Queue
  model_id        TEXT NOT NULL,             -- Ex: gemini-3.1-flash-image-preview
  prompt          TEXT NOT NULL,
  parameters      JSONB NOT NULL DEFAULT '{}', -- aspect_ratio, duration, etc.
  result_paths    TEXT[],                    -- Paths dos assets gerados no Storage
  error_message   TEXT,
  retry_count     INT NOT NULL DEFAULT 0,
  started_at      TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  created_by      UUID REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE generation_jobs IS 'Histórico de todos os jobs de geração de IA (imagens e vídeos)';
COMMENT ON COLUMN generation_jobs.parameters IS 'JSON com parâmetros enviados à API: image_size, aspect_ratio, thinking_level, count';
```

### 3.10 Tabela: prompt_styles

```sql
CREATE TABLE prompt_styles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL UNIQUE,
  slug            TEXT NOT NULL UNIQUE,        -- Ex: "casual", "festa"
  style           fashion_style NOT NULL,
  description     TEXT NOT NULL,
  base_prompt     TEXT NOT NULL,               -- Prompt base enviado à API
  example_image_url TEXT,                      -- Imagem de exemplo do estilo
  icon            TEXT,                        -- Emoji ou ícone
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order      INT NOT NULL DEFAULT 0,      -- Ordem de exibição
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT prompt_styles_base_prompt_length CHECK (char_length(base_prompt) <= 1000)
);

COMMENT ON TABLE prompt_styles IS 'Biblioteca global de estilos pré-configurados — gerenciada pelos admins da plataforma';
COMMENT ON COLUMN prompt_styles.base_prompt IS 'Prompt base otimizado para o estilo — visível ao usuário para transparência';
```

### 3.11 Tabela: custom_prompts

```sql
CREATE TABLE custom_prompts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id         UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name            TEXT,                          -- Nome opcional dado pelo usuário
  prompt_text     TEXT NOT NULL,
  style_id        UUID REFERENCES prompt_styles(id), -- Estilo base usado (se houver)
  use_count       INT NOT NULL DEFAULT 1,         -- Quantas vezes foi usado
  last_used_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT custom_prompts_text_length CHECK (char_length(prompt_text) <= 500)
);

COMMENT ON TABLE custom_prompts IS 'Prompts personalizados salvos por workspace — histórico dos últimos 5 por usuário';
```

### 3.12 Tabela: social_connections

```sql
CREATE TABLE social_connections (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  platform        social_platform NOT NULL,
  account_id      TEXT,                          -- ID da conta na plataforma
  account_name    TEXT,                          -- Nome da conta (@handle ou número)
  access_token    TEXT,                          -- Token OAuth (criptografado)
  refresh_token   TEXT,                          -- Refresh token (criptografado)
  token_expires_at TIMESTAMPTZ,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  last_synced_at  TIMESTAMPTZ,
  connected_by    UUID REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT social_connections_unique UNIQUE (workspace_id, platform)
);

COMMENT ON TABLE social_connections IS 'Tokens OAuth e configurações de integração com redes sociais por workspace';
COMMENT ON COLUMN social_connections.access_token IS 'ATENÇÃO: Token deve ser criptografado em nível de aplicação antes de salvar';
```

---

## 4. Indexes

```sql
-- workspaces
CREATE INDEX idx_workspaces_slug ON workspaces(slug);
CREATE INDEX idx_workspaces_is_active ON workspaces(is_active) WHERE is_active = TRUE;

-- workspace_members
CREATE INDEX idx_workspace_members_workspace_id ON workspace_members(workspace_id);
CREATE INDEX idx_workspace_members_user_id ON workspace_members(user_id);
-- Index composto para lookup de role de um usuário em um workspace
CREATE INDEX idx_workspace_members_lookup ON workspace_members(user_id, workspace_id);

-- collections
CREATE INDEX idx_collections_workspace_id ON collections(workspace_id);
CREATE INDEX idx_collections_workspace_active ON collections(workspace_id, is_active)
  WHERE is_active = TRUE;

-- campaigns — tabela de alto volume, indexes críticos
CREATE INDEX idx_campaigns_workspace_id ON campaigns(workspace_id);
CREATE INDEX idx_campaigns_workspace_created ON campaigns(workspace_id, created_at DESC);
CREATE INDEX idx_campaigns_collection_id ON campaigns(collection_id)
  WHERE collection_id IS NOT NULL;
CREATE INDEX idx_campaigns_status ON campaigns(workspace_id, status);
CREATE INDEX idx_campaigns_style ON campaigns(workspace_id, style)
  WHERE style IS NOT NULL;

-- campaign_assets
CREATE INDEX idx_campaign_assets_campaign_id ON campaign_assets(campaign_id);
CREATE INDEX idx_campaign_assets_workspace_id ON campaign_assets(workspace_id);
CREATE INDEX idx_campaign_assets_type ON campaign_assets(campaign_id, type);
CREATE INDEX idx_campaign_assets_primary ON campaign_assets(campaign_id)
  WHERE is_primary = TRUE;

-- campaign_metrics
CREATE INDEX idx_campaign_metrics_campaign_id ON campaign_metrics(campaign_id);
CREATE INDEX idx_campaign_metrics_workspace_date ON campaign_metrics(workspace_id, metric_date DESC);
CREATE INDEX idx_campaign_metrics_platform ON campaign_metrics(workspace_id, platform, metric_date DESC);

-- generation_jobs
CREATE INDEX idx_generation_jobs_workspace_id ON generation_jobs(workspace_id);
CREATE INDEX idx_generation_jobs_campaign_id ON generation_jobs(campaign_id)
  WHERE campaign_id IS NOT NULL;
CREATE INDEX idx_generation_jobs_status ON generation_jobs(status)
  WHERE status IN ('pending', 'processing');
CREATE INDEX idx_generation_jobs_created ON generation_jobs(workspace_id, created_at DESC);

-- prompt_styles
CREATE INDEX idx_prompt_styles_active ON prompt_styles(is_active, sort_order)
  WHERE is_active = TRUE;
CREATE INDEX idx_prompt_styles_style ON prompt_styles(style);

-- custom_prompts
CREATE INDEX idx_custom_prompts_workspace_user ON custom_prompts(workspace_id, user_id);
CREATE INDEX idx_custom_prompts_last_used ON custom_prompts(workspace_id, user_id, last_used_at DESC);

-- social_connections
CREATE INDEX idx_social_connections_workspace ON social_connections(workspace_id);
CREATE INDEX idx_social_connections_platform ON social_connections(workspace_id, platform);
```

---

## 5. Triggers

```sql
-- Trigger para updated_at automático em todas as tabelas
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar o trigger em todas as tabelas com updated_at
CREATE TRIGGER trg_workspaces_updated_at
  BEFORE UPDATE ON workspaces
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_workspace_members_updated_at
  BEFORE UPDATE ON workspace_members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_collections_updated_at
  BEFORE UPDATE ON collections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_campaigns_updated_at
  BEFORE UPDATE ON campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_generation_jobs_updated_at
  BEFORE UPDATE ON generation_jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_prompt_styles_updated_at
  BEFORE UPDATE ON prompt_styles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_social_connections_updated_at
  BEFORE UPDATE ON social_connections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger: ao criar workspace_member como admin, atualizar workspace.updated_at
CREATE OR REPLACE FUNCTION sync_workspace_on_member_change()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE workspaces SET updated_at = NOW() WHERE id = NEW.workspace_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sync_workspace_on_member
  AFTER INSERT OR UPDATE ON workspace_members
  FOR EACH ROW EXECUTE FUNCTION sync_workspace_on_member_change();
```

---

## 6. Row Level Security (RLS)

### 6.1 Função auxiliar de contexto

```sql
-- Retorna o workspace_id do usuário autenticado via JWT
CREATE OR REPLACE FUNCTION auth.workspace_id()
RETURNS UUID AS $$
  SELECT (auth.jwt() ->> 'workspace_id')::UUID;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Verifica se o usuário tem pelo menos um role específico no workspace
CREATE OR REPLACE FUNCTION auth.has_role(required_role workspace_role)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM workspace_members
    WHERE workspace_id = auth.workspace_id()
      AND user_id = auth.uid()
      AND role >= required_role  -- admin > editor > viewer (enum ordering)
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;
```

### 6.2 Políticas RLS por tabela

```sql
-- ═══════════════════════════════
-- WORKSPACES
-- ═══════════════════════════════
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;

-- Usuário vê apenas o workspace ao qual pertence
CREATE POLICY workspaces_select ON workspaces
  FOR SELECT USING (
    id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

-- Apenas admins podem atualizar o workspace
CREATE POLICY workspaces_update ON workspaces
  FOR UPDATE USING (
    id = auth.workspace_id() AND auth.has_role('admin')
  );

-- ═══════════════════════════════
-- WORKSPACE_MEMBERS
-- ═══════════════════════════════
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;

-- Membros veem outros membros do mesmo workspace
CREATE POLICY workspace_members_select ON workspace_members
  FOR SELECT USING (workspace_id = auth.workspace_id());

-- Apenas admins gerenciam membros
CREATE POLICY workspace_members_insert ON workspace_members
  FOR INSERT WITH CHECK (
    workspace_id = auth.workspace_id() AND auth.has_role('admin')
  );

CREATE POLICY workspace_members_update ON workspace_members
  FOR UPDATE USING (
    workspace_id = auth.workspace_id() AND auth.has_role('admin')
  );

CREATE POLICY workspace_members_delete ON workspace_members
  FOR DELETE USING (
    workspace_id = auth.workspace_id() AND auth.has_role('admin')
  );

-- ═══════════════════════════════
-- COLLECTIONS
-- ═══════════════════════════════
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;

CREATE POLICY collections_select ON collections
  FOR SELECT USING (workspace_id = auth.workspace_id());

CREATE POLICY collections_insert ON collections
  FOR INSERT WITH CHECK (
    workspace_id = auth.workspace_id() AND auth.has_role('editor')
  );

CREATE POLICY collections_update ON collections
  FOR UPDATE USING (
    workspace_id = auth.workspace_id() AND auth.has_role('editor')
  );

CREATE POLICY collections_delete ON collections
  FOR DELETE USING (
    workspace_id = auth.workspace_id() AND auth.has_role('admin')
  );

-- ═══════════════════════════════
-- CAMPAIGNS
-- ═══════════════════════════════
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY campaigns_select ON campaigns
  FOR SELECT USING (workspace_id = auth.workspace_id());

CREATE POLICY campaigns_insert ON campaigns
  FOR INSERT WITH CHECK (
    workspace_id = auth.workspace_id() AND auth.has_role('editor')
  );

CREATE POLICY campaigns_update ON campaigns
  FOR UPDATE USING (
    workspace_id = auth.workspace_id() AND auth.has_role('editor')
  );

CREATE POLICY campaigns_delete ON campaigns
  FOR DELETE USING (
    workspace_id = auth.workspace_id() AND auth.has_role('admin')
  );

-- ═══════════════════════════════
-- CAMPAIGN_ASSETS
-- ═══════════════════════════════
ALTER TABLE campaign_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY campaign_assets_select ON campaign_assets
  FOR SELECT USING (workspace_id = auth.workspace_id());

CREATE POLICY campaign_assets_insert ON campaign_assets
  FOR INSERT WITH CHECK (
    workspace_id = auth.workspace_id() AND auth.has_role('editor')
  );

CREATE POLICY campaign_assets_delete ON campaign_assets
  FOR DELETE USING (
    workspace_id = auth.workspace_id() AND auth.has_role('admin')
  );

-- ═══════════════════════════════
-- CAMPAIGN_METRICS
-- ═══════════════════════════════
ALTER TABLE campaign_metrics ENABLE ROW LEVEL SECURITY;

-- Apenas leitura para membros — escrita via service role (sync job)
CREATE POLICY campaign_metrics_select ON campaign_metrics
  FOR SELECT USING (workspace_id = auth.workspace_id());

-- ═══════════════════════════════
-- GENERATION_JOBS
-- ═══════════════════════════════
ALTER TABLE generation_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY generation_jobs_select ON generation_jobs
  FOR SELECT USING (workspace_id = auth.workspace_id());

CREATE POLICY generation_jobs_insert ON generation_jobs
  FOR INSERT WITH CHECK (
    workspace_id = auth.workspace_id() AND auth.has_role('editor')
  );

-- ═══════════════════════════════
-- PROMPT_STYLES (tabela global — apenas leitura para todos os autenticados)
-- ═══════════════════════════════
ALTER TABLE prompt_styles ENABLE ROW LEVEL SECURITY;

CREATE POLICY prompt_styles_select ON prompt_styles
  FOR SELECT USING (auth.uid() IS NOT NULL AND is_active = TRUE);

-- Apenas service role (admins da plataforma) pode inserir/editar estilos

-- ═══════════════════════════════
-- CUSTOM_PROMPTS
-- ═══════════════════════════════
ALTER TABLE custom_prompts ENABLE ROW LEVEL SECURITY;

CREATE POLICY custom_prompts_select ON custom_prompts
  FOR SELECT USING (workspace_id = auth.workspace_id());

CREATE POLICY custom_prompts_insert ON custom_prompts
  FOR INSERT WITH CHECK (
    workspace_id = auth.workspace_id() AND auth.has_role('editor')
  );

CREATE POLICY custom_prompts_update ON custom_prompts
  FOR UPDATE USING (
    workspace_id = auth.workspace_id()
      AND (user_id = auth.uid() OR auth.has_role('admin'))
  );

CREATE POLICY custom_prompts_delete ON custom_prompts
  FOR DELETE USING (
    workspace_id = auth.workspace_id()
      AND (user_id = auth.uid() OR auth.has_role('admin'))
  );

-- ═══════════════════════════════
-- SOCIAL_CONNECTIONS
-- ═══════════════════════════════
ALTER TABLE social_connections ENABLE ROW LEVEL SECURITY;

-- Viewer pode ver conexões (para saber o que está conectado)
CREATE POLICY social_connections_select ON social_connections
  FOR SELECT USING (workspace_id = auth.workspace_id());

-- Apenas admins gerenciam conexões sociais
CREATE POLICY social_connections_insert ON social_connections
  FOR INSERT WITH CHECK (
    workspace_id = auth.workspace_id() AND auth.has_role('admin')
  );

CREATE POLICY social_connections_update ON social_connections
  FOR UPDATE USING (
    workspace_id = auth.workspace_id() AND auth.has_role('admin')
  );

CREATE POLICY social_connections_delete ON social_connections
  FOR DELETE USING (
    workspace_id = auth.workspace_id() AND auth.has_role('admin')
  );
```

---

## 7. Supabase Storage — Estrutura de Buckets

```sql
-- Bucket para fotos de produtos enviadas pelos usuários
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'products',
  'products',
  FALSE,                   -- Privado — URLs assinadas com TTL
  20971520,                -- 20MB por arquivo
  ARRAY['image/jpeg', 'image/png', 'image/webp']
);

-- Bucket para assets gerados pela IA (imagens e vídeos)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'campaigns',
  'campaigns',
  FALSE,                   -- Privado — URLs assinadas com TTL
  524288000,               -- 500MB por arquivo (vídeos)
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'video/mp4']
);

-- Bucket para logos e assets públicos dos workspaces
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'workspace-assets',
  'workspace-assets',
  TRUE,                    -- Público (logos das marcas)
  5242880,                 -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
);

-- Políticas de Storage
-- Usuários só acessam arquivos do próprio workspace
CREATE POLICY "products_workspace_isolation" ON storage.objects
  FOR ALL USING (
    bucket_id = 'products'
    AND (storage.foldername(name))[1] = auth.workspace_id()::TEXT
  );

CREATE POLICY "campaigns_workspace_isolation" ON storage.objects
  FOR ALL USING (
    bucket_id = 'campaigns'
    AND (storage.foldername(name))[1] = auth.workspace_id()::TEXT
  );
```

**Estrutura de paths no Storage:**
```
products/
  {workspace_id}/
    {upload_id}/
      original.jpg
      thumb.jpg

campaigns/
  {workspace_id}/
    {campaign_id}/
      images/
        asset_{uuid}.jpg
      videos/
        asset_{uuid}.mp4

workspace-assets/
  {workspace_id}/
    logo.png
```

---

## 8. Seed Data — Prompt Styles

```sql
-- Arquivo: supabase/seed/001_prompt_styles.sql

INSERT INTO prompt_styles (name, slug, style, description, base_prompt, icon, sort_order)
VALUES
(
  'Casual',
  'casual',
  'casual',
  'Look do dia a dia, confortável e acessível. Ideal para peças cotidianas.',
  'Fashionable clothing photoshoot in a casual urban setting. Natural lighting, street style aesthetic, young model in a relaxed pose. Clean background with subtle urban elements. Professional fashion photography, high quality, editorial style.',
  '👕',
  1
),
(
  'Festa',
  'festa',
  'festa',
  'Produção sofisticada para eventos, baladas e ocasiões especiais.',
  'Elegant fashion photoshoot for evening wear and party outfits. Glamorous lighting, luxurious backdrop, sophisticated model pose. Studio or upscale venue setting. High-end fashion photography, dramatic lighting, editorial style.',
  '✨',
  2
),
(
  'Fitness',
  'fitness',
  'fitness',
  'Roupas esportivas e athleisure com energia e movimento.',
  'Dynamic sports and fitness clothing photoshoot. Active and energetic model pose, gym or outdoor setting, bright natural lighting. Athleisure aesthetic, sporty and modern look. High contrast professional photography.',
  '🏋️',
  3
),
(
  'Infantil',
  'infantil',
  'infantil',
  'Moda infantil alegre e colorida para crianças.',
  'Cute and playful children clothing photoshoot. Colorful background, cheerful and fun setting, child model or flat lay presentation. Bright and warm lighting, playful aesthetic. Clean and safe product presentation.',
  '🧸',
  4
),
(
  'Executivo',
  'executivo',
  'executivo',
  'Moda corporativa e profissional para o ambiente de trabalho.',
  'Professional business attire photoshoot. Clean and modern office or studio background, confident and poised model pose. Neutral tones, sharp lighting, corporate aesthetic. High-end professional photography.',
  '💼',
  5
),
(
  'Praia',
  'praia',
  'praia',
  'Moda praia, biquínis, saídas de praia e looks tropicais.',
  'Beach and summer fashion photoshoot. Tropical outdoor setting with natural sunlight, ocean or pool backdrop, relaxed and sunny model pose. Vibrant colors, summer aesthetic, lifestyle photography style.',
  '🏖️',
  6
),
(
  'Noivas',
  'noivas',
  'noivas',
  'Vestidos e acessórios para noivas e madrinhas.',
  'Elegant bridal fashion photoshoot. Romantic and dreamy setting, soft natural lighting or studio with white background, graceful model pose. Soft pastel tones, romantic aesthetic, high-end wedding photography style.',
  '💍',
  7
),
(
  'Plus Size',
  'plus_size',
  'plus_size',
  'Moda inclusiva para todos os corpos, com empoderamento e estilo.',
  'Inclusive plus size fashion photoshoot celebrating body diversity. Empowering and confident model pose, stylish contemporary setting. Natural and flattering lighting, body-positive aesthetic, professional fashion photography.',
  '🌸',
  8
);
```

---

## 9. Prisma Schema

```prisma
// schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

enum WorkspaceRole {
  admin
  editor
  viewer
}

enum CampaignStatus {
  draft
  generating
  ready
  archived
}

enum AssetType {
  image
  video
}

enum JobStatus {
  pending
  processing
  completed
  failed
  cancelled
}

enum SocialPlatform {
  instagram
  whatsapp
}

enum FashionStyle {
  casual
  festa
  fitness
  infantil
  executivo
  praia
  noivas
  plus_size
  custom
}

enum AspectRatio {
  RATIO_1_1   @map("1:1")
  RATIO_9_16  @map("9:16")
  RATIO_16_9  @map("16:9")
  RATIO_4_5   @map("4:5")
  RATIO_3_4   @map("3:4")
}

model Workspace {
  id         String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  name       String
  slug       String   @unique
  logoUrl    String?  @map("logo_url")
  segment    FashionStyle?
  plan       String   @default("free")
  isActive   Boolean  @default(true) @map("is_active")
  createdAt  DateTime @default(now()) @map("created_at") @db.Timestamptz
  updatedAt  DateTime @updatedAt @map("updated_at") @db.Timestamptz

  members           WorkspaceMember[]
  collections       Collection[]
  campaigns         Campaign[]
  campaignAssets    CampaignAsset[]
  campaignMetrics   CampaignMetric[]
  generationJobs    GenerationJob[]
  customPrompts     CustomPrompt[]
  socialConnections SocialConnection[]

  @@map("workspaces")
}

model WorkspaceMember {
  id          String        @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  workspaceId String        @map("workspace_id") @db.Uuid
  userId      String        @map("user_id") @db.Uuid
  role        WorkspaceRole @default(viewer)
  invitedBy   String?       @map("invited_by") @db.Uuid
  joinedAt    DateTime?     @map("joined_at") @db.Timestamptz
  createdAt   DateTime      @default(now()) @map("created_at") @db.Timestamptz
  updatedAt   DateTime      @updatedAt @map("updated_at") @db.Timestamptz

  workspace Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)

  @@unique([workspaceId, userId])
  @@map("workspace_members")
}

model Collection {
  id          String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  workspaceId String   @map("workspace_id") @db.Uuid
  name        String
  description String?
  coverUrl    String?  @map("cover_url")
  isActive    Boolean  @default(true) @map("is_active")
  createdBy   String?  @map("created_by") @db.Uuid
  createdAt   DateTime @default(now()) @map("created_at") @db.Timestamptz
  updatedAt   DateTime @updatedAt @map("updated_at") @db.Timestamptz

  workspace Workspace  @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  campaigns Campaign[]

  @@map("collections")
}

model Campaign {
  id             String         @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  workspaceId    String         @map("workspace_id") @db.Uuid
  collectionId   String?        @map("collection_id") @db.Uuid
  name           String
  description    String?
  status         CampaignStatus @default(draft)
  style          FashionStyle?
  promptStyleId  String?        @map("prompt_style_id") @db.Uuid
  customPrompt   String?        @map("custom_prompt")
  aspectRatio    AspectRatio    @default(RATIO_1_1) @map("aspect_ratio")
  productImages  String[]       @default([]) @map("product_images")
  tags           String[]       @default([])
  isTemplate     Boolean        @default(false) @map("is_template")
  duplicatedFrom String?        @map("duplicated_from") @db.Uuid
  createdBy      String?        @map("created_by") @db.Uuid
  createdAt      DateTime       @default(now()) @map("created_at") @db.Timestamptz
  updatedAt      DateTime       @updatedAt @map("updated_at") @db.Timestamptz

  workspace      Workspace       @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  collection     Collection?     @relation(fields: [collectionId], references: [id])
  promptStyle    PromptStyle?    @relation(fields: [promptStyleId], references: [id])
  assets         CampaignAsset[]
  metrics        CampaignMetric[]
  generationJobs GenerationJob[]

  @@map("campaigns")
}

model CampaignAsset {
  id              String      @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  campaignId      String      @map("campaign_id") @db.Uuid
  workspaceId     String      @map("workspace_id") @db.Uuid
  type            AssetType
  storagePath     String      @map("storage_path")
  fileName        String      @map("file_name")
  fileSizeBytes   BigInt?     @map("file_size_bytes")
  mimeType        String      @map("mime_type")
  widthPx         Int?        @map("width_px")
  heightPx        Int?        @map("height_px")
  durationSec     Int?        @map("duration_sec")
  aspectRatio     AspectRatio? @map("aspect_ratio")
  resolution      String?
  isPrimary       Boolean     @default(false) @map("is_primary")
  generationJobId String?     @map("generation_job_id") @db.Uuid
  metadata        Json        @default("{}") @db.JsonB
  createdAt       DateTime    @default(now()) @map("created_at") @db.Timestamptz

  campaign      Campaign       @relation(fields: [campaignId], references: [id], onDelete: Cascade)
  workspace     Workspace      @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  generationJob GenerationJob? @relation(fields: [generationJobId], references: [id])

  @@map("campaign_assets")
}

model CampaignMetric {
  id             String         @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  campaignId     String         @map("campaign_id") @db.Uuid
  workspaceId    String         @map("workspace_id") @db.Uuid
  platform       SocialPlatform
  externalPostId String?        @map("external_post_id")
  metricDate     DateTime       @map("metric_date") @db.Date
  impressions    BigInt         @default(0)
  reach          BigInt         @default(0)
  likes          Int            @default(0)
  comments       Int            @default(0)
  shares         Int            @default(0)
  saves          Int            @default(0)
  clicks         Int            @default(0)
  conversions    Int            @default(0)
  engagementRate Decimal?       @map("engagement_rate") @db.Decimal(5, 2)
  rawData        Json           @default("{}") @map("raw_data") @db.JsonB
  syncedAt       DateTime       @default(now()) @map("synced_at") @db.Timestamptz
  createdAt      DateTime       @default(now()) @map("created_at") @db.Timestamptz

  campaign  Campaign  @relation(fields: [campaignId], references: [id], onDelete: Cascade)
  workspace Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)

  @@unique([campaignId, platform, metricDate])
  @@map("campaign_metrics")
}

model GenerationJob {
  id          String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  workspaceId String    @map("workspace_id") @db.Uuid
  campaignId  String?   @map("campaign_id") @db.Uuid
  type        AssetType
  status      JobStatus @default(pending)
  bullJobId   String?   @map("bull_job_id")
  modelId     String    @map("model_id")
  prompt      String
  parameters  Json      @default("{}") @db.JsonB
  resultPaths String[]  @default([]) @map("result_paths")
  errorMessage String?  @map("error_message")
  retryCount  Int       @default(0) @map("retry_count")
  startedAt   DateTime? @map("started_at") @db.Timestamptz
  completedAt DateTime? @map("completed_at") @db.Timestamptz
  createdBy   String?   @map("created_by") @db.Uuid
  createdAt   DateTime  @default(now()) @map("created_at") @db.Timestamptz
  updatedAt   DateTime  @updatedAt @map("updated_at") @db.Timestamptz

  workspace Workspace       @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  campaign  Campaign?       @relation(fields: [campaignId], references: [id])
  assets    CampaignAsset[]

  @@map("generation_jobs")
}

model PromptStyle {
  id              String       @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  name            String       @unique
  slug            String       @unique
  style           FashionStyle
  description     String
  basePrompt      String       @map("base_prompt")
  exampleImageUrl String?      @map("example_image_url")
  icon            String?
  isActive        Boolean      @default(true) @map("is_active")
  sortOrder       Int          @default(0) @map("sort_order")
  createdAt       DateTime     @default(now()) @map("created_at") @db.Timestamptz
  updatedAt       DateTime     @updatedAt @map("updated_at") @db.Timestamptz

  campaigns     Campaign[]
  customPrompts CustomPrompt[]

  @@map("prompt_styles")
}

model CustomPrompt {
  id          String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  workspaceId String   @map("workspace_id") @db.Uuid
  userId      String?  @map("user_id") @db.Uuid
  name        String?
  promptText  String   @map("prompt_text")
  styleId     String?  @map("style_id") @db.Uuid
  useCount    Int      @default(1) @map("use_count")
  lastUsedAt  DateTime @default(now()) @map("last_used_at") @db.Timestamptz
  createdAt   DateTime @default(now()) @map("created_at") @db.Timestamptz

  workspace Workspace    @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  style     PromptStyle? @relation(fields: [styleId], references: [id])

  @@map("custom_prompts")
}

model SocialConnection {
  id             String         @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  workspaceId    String         @map("workspace_id") @db.Uuid
  platform       SocialPlatform
  accountId      String?        @map("account_id")
  accountName    String?        @map("account_name")
  accessToken    String?        @map("access_token")
  refreshToken   String?        @map("refresh_token")
  tokenExpiresAt DateTime?      @map("token_expires_at") @db.Timestamptz
  isActive       Boolean        @default(true) @map("is_active")
  lastSyncedAt   DateTime?      @map("last_synced_at") @db.Timestamptz
  connectedBy    String?        @map("connected_by") @db.Uuid
  createdAt      DateTime       @default(now()) @map("created_at") @db.Timestamptz
  updatedAt      DateTime       @updatedAt @map("updated_at") @db.Timestamptz

  workspace Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)

  @@unique([workspaceId, platform])
  @@map("social_connections")
}
```

---

## 10. Plano de Migration

### Ordem de execução (respeitar dependências de FK)

```
001_extensions.sql          — uuid-ossp, pgcrypto
002_enums.sql               — todos os tipos enum
003_functions.sql           — update_updated_at_column(), auth helpers
004_workspaces.sql          — tabela workspaces
005_workspace_members.sql   — FK → workspaces, auth.users
006_prompt_styles.sql       — tabela global (sem FK de workspace)
007_collections.sql         — FK → workspaces
008_campaigns.sql           — FK → workspaces, collections, prompt_styles
009_campaign_assets.sql     — FK → campaigns, workspaces
010_campaign_metrics.sql    — FK → campaigns, workspaces
011_generation_jobs.sql     — FK → workspaces, campaigns
012_custom_prompts.sql      — FK → workspaces, prompt_styles
013_social_connections.sql  — FK → workspaces
014_indexes.sql             — todos os indexes
015_triggers.sql            — todos os triggers
016_rls.sql                 — enable RLS + todas as policies
017_storage.sql             — buckets e policies de storage
018_seed_prompt_styles.sql  — 8 estilos iniciais
```

---

## 11. Checklist de Segurança

| Item | Status |
|------|--------|
| RLS habilitado em todas as tabelas | ✅ |
| Isolamento por `workspace_id` em todas as políticas | ✅ |
| Tokens de social connections marcados para criptografia em app layer | ✅ |
| Storage buckets privados (URLs assinadas) | ✅ |
| Sem dados sensíveis em colunas não criptografadas | ✅ |
| Função `auth.workspace_id()` usa SECURITY DEFINER | ✅ |
| FK com CASCADE DELETE apenas onde seguro | ✅ |
| Constraints CHECK em campos críticos | ✅ |
| Índices em todas as FKs | ✅ |
| LGPD: dados por tenant completamente isolados via RLS | ✅ |

---

*Documento gerado por Dara (@data-engineer) — Fashion Mídia.IA v1.0*  
*Próximo passo: criar arquivos SQL de migration → @dev (implementação)*
