# Fashion Mídia.IA — Fullstack Architecture

**Versão:** 1.1  
**Data:** 2026-04-02  
**Arquiteta:** Aria (@architect)  
**Status:** Aprovado — API Google Gemini Nano Banana confirmada e integrada

---

## 1. Visão Geral do Sistema

Fashion Mídia.IA é uma plataforma SaaS multi-tenant que permite PMEs do setor de moda gerar campanhas, catálogos e editoriais visuais usando IA generativa. A arquitetura é projetada para ser **simples de operar, segura por design e escalável progressivamente**.

```
┌─────────────────────────────────────────────────────────────┐
│                        USUÁRIO FINAL                         │
│                  (PME do setor de moda)                      │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTPS
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                  VERCEL (CDN + Edge)                         │
│               Next.js 14 — App Router                        │
│          (SSR + RSC + Client Components)                     │
└──────────────────────────┬──────────────────────────────────┘
                           │ REST/JSON
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                  RAILWAY (Node.js)                           │
│               NestJS API — Porta 3001                        │
│         (Módulos: Auth | Campaigns | AI | Analytics)         │
└──────┬───────────────────┬──────────────────┬───────────────┘
       │                   │                  │
       ▼                   ▼                  ▼
┌────────────┐    ┌─────────────────┐  ┌────────────────────┐
│  Supabase  │    │  Bull + Redis   │  │   APIs Externas    │
│  Postgres  │    │  (Job Queue)    │  │  Google AI / Meta  │
│  Auth      │    │                 │  │  Instagram / WA    │
│  Storage   │    └────────┬────────┘  └────────────────────┘
└────────────┘             │
                           ▼
                  ┌─────────────────┐
                  │  Worker Process │
                  │  (NestJS Bull   │
                  │   Workers)      │
                  └─────────────────┘
```

---

## 2. Estrutura do Monorepo

```
fashion-midia-ia/
├── apps/
│   ├── web/                          # Next.js 14 Frontend
│   │   ├── app/                      # App Router
│   │   │   ├── (auth)/               # Route group: login, cadastro
│   │   │   ├── (dashboard)/          # Route group: área logada
│   │   │   │   ├── campanhas/        # Galeria e criador
│   │   │   │   ├── performance/      # Analytics
│   │   │   │   ├── capacitacao/      # Tutoriais e FAQ
│   │   │   │   └── configuracoes/    # Workspace settings
│   │   │   └── layout.tsx
│   │   ├── components/
│   │   │   ├── ui/                   # shadcn/ui components
│   │   │   ├── campaigns/            # Componentes de campanha
│   │   │   ├── analytics/            # Gráficos e KPIs
│   │   │   └── shared/               # Layout, Nav, Header
│   │   ├── hooks/                    # Custom React hooks
│   │   ├── lib/
│   │   │   ├── api.ts                # Cliente HTTP (fetch wrapper)
│   │   │   ├── supabase.ts           # Supabase client
│   │   │   └── utils.ts
│   │   └── middleware.ts             # Auth middleware (Supabase)
│   │
│   └── api/                          # NestJS Backend
│       ├── src/
│       │   ├── main.ts               # Bootstrap
│       │   ├── app.module.ts         # Root module
│       │   ├── modules/
│       │   │   ├── auth/             # Autenticação e JWT
│       │   │   ├── workspaces/       # Multitenancy
│       │   │   ├── campaigns/        # CRUD de campanhas
│       │   │   ├── ai/               # Integração Google AI
│       │   │   │   ├── image/        # Google Imagen / Gemini
│       │   │   │   └── video/        # Google Veo
│       │   │   ├── analytics/        # Performance e KPIs
│       │   │   │   ├── instagram/    # Instagram Graph API
│       │   │   │   └── whatsapp/     # WhatsApp Business API
│       │   │   ├── prompts/          # Biblioteca de prompts
│       │   │   ├── storage/          # Supabase Storage
│       │   │   ├── jobs/             # Bull Queue workers
│       │   │   └── notifications/    # Email e notificações
│       │   ├── common/
│       │   │   ├── guards/           # AuthGuard, TenantGuard
│       │   │   ├── decorators/       # @CurrentTenant, @CurrentUser
│       │   │   ├── interceptors/     # Logging, Transform
│       │   │   └── filters/          # Exception filters
│       │   └── config/               # Config modules
│       └── test/
│
├── packages/
│   ├── shared/                       # Tipos e contratos compartilhados
│   │   ├── src/
│   │   │   ├── types/                # Interfaces TypeScript
│   │   │   ├── dtos/                 # Data Transfer Objects
│   │   │   ├── enums/                # Enums compartilhados
│   │   │   └── constants/            # Constantes globais
│   │   └── package.json
│   │
│   └── config/                       # Configs compartilhadas
│       ├── eslint/
│       ├── typescript/
│       └── tailwind/
│
├── turbo.json                        # Turborepo pipeline
├── package.json                      # Workspace root
├── .env.example                      # Variáveis de ambiente documentadas
└── docker-compose.yml                # Redis local para dev
```

---

## 3. Arquitetura Frontend (Next.js 14)

### 3.1 Estratégia de Renderização

| Tipo | Uso |
|------|-----|
| **Server Components (RSC)** | Listagem de campanhas, dashboard de KPIs, páginas estáticas |
| **Client Components** | Upload drag-and-drop, criador de campanha, preview de IA, gráficos |
| **Server Actions** | Formulários de criação, exportação, configurações |
| **Route Handlers** | Webhooks (Instagram, WhatsApp), callbacks OAuth |

### 3.2 Gerenciamento de Estado

```
Estado Global (Zustand)
├── authStore         — usuário, workspace ativo, roles
├── campaignStore     — campanha em criação (wizard state)
└── notificationStore — toasts e alertas

Estado do Servidor (TanStack Query)
├── campanhas         — listagem, detalhes, histórico
├── analytics         — métricas, KPIs (cache 5min)
└── prompts           — biblioteca de estilos (cache 1h)

Estado Local (useState/useReducer)
└── UI state          — modais, tabs, filtros ativos
```

### 3.3 Fluxo de Autenticação Frontend

```
Acesso à rota protegida
        │
        ▼
middleware.ts (Edge)
        │
        ├─→ Session válida? ──→ continua
        │
        └─→ Sem session ──→ redirect /login
                                  │
                                  ▼
                         Supabase Auth UI
                         (email/senha ou Google OAuth)
                                  │
                                  ▼
                         Callback → set cookie session
                                  │
                                  ▼
                    Primeiro acesso? → /onboarding
                    Retorno?        → /dashboard
```

### 3.4 Componentes Críticos

**CampaignCreator** (Client Component complexo):
```
CampaignCreator
├── ProductUploader      — drag-and-drop, preview, validação
├── StyleSelector        — grid de cards de estilo
├── PromptComposer       — prompt personalizado + histórico
├── GenerationPanel      — botão gerar + progress + preview
│   ├── ImageGrid        — variações geradas
│   └── VideoPlayer      — preview de vídeo inline
└── CampaignSaver        — nome, coleção, salvar
```

---

## 4. Arquitetura Backend (NestJS)

### 4.1 Módulos e Responsabilidades

```
AppModule
├── AuthModule           — JWT validation, Supabase session sync
├── WorkspacesModule     — tenant CRUD, RLS context injection
├── CampaignsModule      — campanhas CRUD, coleções, exportação
├── AIModule
│   ├── ImageModule      — integração Google Imagen/Gemini [A CONFIRMAR]
│   └── VideoModule      — integração Google Veo API
├── PromptsModule        — biblioteca de prompts, estilos
├── StorageModule        — Supabase Storage (upload, download, delete)
├── JobsModule           — Bull Queue: image-gen, video-gen, export, sync
├── AnalyticsModule
│   ├── InstagramModule  — OAuth, sync métricas, webhooks
│   └── WhatsappModule   — token config, métricas mensagens
└── NotificationsModule  — email (Resend), push (futuro)
```

### 4.2 Padrão de Módulo NestJS

Cada módulo segue a estrutura:
```
module-name/
├── module-name.module.ts
├── module-name.controller.ts   # HTTP endpoints
├── module-name.service.ts      # Business logic
├── module-name.repository.ts   # Data access (Prisma)
├── dto/
│   ├── create-*.dto.ts
│   └── update-*.dto.ts
└── entities/
    └── *.entity.ts
```

### 4.3 Multitenancy — Estratégia de Isolamento

**Mecanismo:** Row Level Security (RLS) no PostgreSQL via Supabase + injeção de `tenant_id` em todas as queries.

```typescript
// TenantGuard — injeta tenant_id no request context
@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const user = request.user; // do JWT Supabase
    request.tenantId = user.user_metadata.workspace_id;
    return true;
  }
}

// @CurrentTenant decorator
export const CurrentTenant = createParamDecorator(
  (_, ctx: ExecutionContext) => ctx.switchToHttp().getRequest().tenantId
);

// Uso em controller
@Get('campaigns')
@UseGuards(TenantGuard)
findAll(@CurrentTenant() tenantId: string) {
  return this.campaignsService.findAll(tenantId);
}
```

**RLS no Supabase:**
```sql
-- Política: usuário só vê dados do próprio workspace
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON campaigns
  USING (workspace_id = auth.jwt() ->> 'workspace_id');
```

### 4.4 API Design

**Base URL:** `https://api.fashionmidia.com.br/v1`

**Convenções:**
- REST com recursos aninhados onde faz sentido
- Paginação cursor-based para listas grandes
- Respostas padronizadas: `{ data, meta, error }`
- Rate limiting por tenant: 100 req/min (geração IA: 10 req/min)

**Endpoints principais:**

```
POST   /auth/sync                    # Sincronizar sessão Supabase → API
POST   /workspaces                   # Criar workspace (onboarding)
GET    /workspaces/me                # Workspace do tenant atual

POST   /campaigns                    # Criar campanha
GET    /campaigns                    # Listar campanhas (paginado)
GET    /campaigns/:id                # Detalhes
PUT    /campaigns/:id                # Atualizar
DELETE /campaigns/:id                # Remover

POST   /campaigns/:id/generate-image # Acionar geração de imagem (async)
POST   /campaigns/:id/generate-video # Acionar geração de vídeo (async)
GET    /campaigns/:id/jobs/:jobId    # Status do job de geração

POST   /storage/upload               # Upload de produto
GET    /storage/signed-url/:key      # URL temporária para download

GET    /prompts/styles               # Biblioteca de estilos
POST   /prompts/custom               # Salvar prompt personalizado

POST   /analytics/instagram/connect  # OAuth Instagram
GET    /analytics/instagram/metrics  # Métricas Instagram
POST   /analytics/whatsapp/config    # Configurar WhatsApp Business
GET    /analytics/kpis               # KPIs consolidados do workspace
GET    /analytics/reports            # Relatórios comparativos
```

---

## 5. Fluxo Assíncrono de Geração de IA

Este é o fluxo crítico da plataforma — geração de imagens e vídeos é lenta e não pode bloquear a API.

### 5.1 Fluxo de Geração de Imagem

```
Frontend                API NestJS              Bull Queue           Google AI API
   │                        │                       │                     │
   │─ POST /generate-image ─▶│                       │                     │
   │                        │── enqueue job ────────▶│                     │
   │◀─ { jobId, status }────│                       │                     │
   │                        │                       │── processJob ───────▶│
   │── GET /jobs/:jobId ────▶│                       │                     │
   │◀─ { status: pending } ─│                       │◀─ { images[] } ─────│
   │                        │                       │                     │
   │                        │◀──── job complete ────│                     │
   │                        │── save to Storage      │                     │
   │                        │── update campaign      │                     │
   │                        │── notify via WS/Poll   │                     │
   │── GET /jobs/:jobId ────▶│                       │                     │
   │◀─ { status: done,      │                       │                     │
   │     images: [...] } ───│                       │                     │
```

### 5.2 Implementação Bull Queue

```typescript
// jobs/image-generation.processor.ts
@Processor('image-generation')
export class ImageGenerationProcessor {
  constructor(
    private readonly googleAIService: GoogleAIService,
    private readonly storageService: StorageService,
    private readonly campaignsService: CampaignsService,
  ) {}

  @Process('generate')
  async handleGeneration(job: Job<ImageGenerationJobData>) {
    const { campaignId, tenantId, prompt, productImageUrls } = job.data;

    // 1. Chamar Google AI API
    const images = await this.googleAIService.generateImages({
      prompt,
      referenceImages: productImageUrls,
      count: 3,
    });

    // 2. Salvar no Supabase Storage (bucket do tenant)
    const storedImages = await Promise.all(
      images.map(img => this.storageService.upload(img, tenantId))
    );

    // 3. Atualizar campanha com imagens geradas
    await this.campaignsService.updateGeneratedImages(
      campaignId,
      storedImages,
      tenantId,
    );

    return { images: storedImages };
  }

  @OnQueueFailed()
  async onFailed(job: Job, error: Error) {
    // Log + marcar campanha como falha
    await this.campaignsService.markGenerationFailed(
      job.data.campaignId,
      error.message,
    );
  }
}
```

### 5.3 Polling de Status no Frontend

```typescript
// hooks/useGenerationStatus.ts
export function useGenerationStatus(jobId: string | null) {
  return useQuery({
    queryKey: ['job', jobId],
    queryFn: () => api.get(`/campaigns/jobs/${jobId}`),
    enabled: !!jobId,
    refetchInterval: (data) => {
      if (data?.status === 'completed' || data?.status === 'failed') return false;
      return 3000; // poll a cada 3 segundos
    },
  });
}
```

---

## 6. Integrações Externas

### 6.1 Google Veo (Vídeos) ✅

- **SDK:** Google Cloud AI Platform Python/Node SDK ou REST API
- **Modelo:** `veo-2.0-generate-001` (Vertex AI)
- **Latência esperada:** 2–5 minutos por vídeo
- **Output:** MP4 (1080p)
- **Autenticação:** Service Account com permissões Vertex AI

```typescript
// ai/video/google-veo.service.ts
@Injectable()
export class GoogleVeoService {
  async generateVideo(params: VideoGenerationParams): Promise<string> {
    const operation = await this.vertexAI.predict({
      model: 'veo-2.0-generate-001',
      instances: [{
        prompt: params.prompt,
        image: params.referenceImage, // base64
        duration_seconds: params.duration,
      }],
    });

    // Long-running operation — poll até completar
    return this.pollOperation(operation.name);
  }
}
```

### 6.2 Google Gemini Nano Banana — Geração de Imagens ✅ CONFIRMADO

**Documentação oficial:** https://ai.google.dev/gemini-api/docs/image-generation  
**SDK Node.js:** `@google/genai`  
**Autenticação:** API Key via Google AI Studio (`aistudio.google.com/apikey`) — header `x-goog-api-key`

#### Modelos disponíveis

| Modelo | ID | Indicação |
|--------|----|-----------|
| **Nano Banana** | `gemini-2.5-flash-image` | Velocidade — geração rápida no MVP |
| **Nano Banana 2** | `gemini-3.1-flash-image-preview` | Eficiência + velocidade — padrão recomendado |
| **Nano Banana Pro** | `gemini-3-pro-image-preview` | Qualidade máxima — campanhas premium |

> **Estratégia para o MVP:** usar `gemini-3.1-flash-image-preview` (Nano Banana 2) como padrão. Nano Banana Pro disponível como opção premium futura.

#### Parâmetros de geração

| Parâmetro | Valores | Uso |
|-----------|---------|-----|
| `aspect_ratio` | 1:1, 9:16, 16:9, 4:5, 3:4... | Feed Instagram = 1:1 ou 4:5 |
| `image_size` | 512, 1K, 2K, 4K | Campanhas = 2K |
| `response_modalities` | ["TEXT", "IMAGE"] | Sempre incluir IMAGE |
| `thinking_level` | "minimal" / "High" | MVP = minimal (velocidade) |
| Imagens de referência | até 14 simultâneas | Usar fotos do produto |

**Diferencial:** Suporta até **14 imagens de referência simultâneas** — ideal para enviar múltiplos ângulos do produto.  
**SynthID:** Todas as imagens geradas incluem watermark digital invisível (conformidade com políticas de IA).

#### Implementação

```typescript
// ai/image/gemini-nano-banana.service.ts
import { GoogleGenAI } from '@google/genai';

@Injectable()
export class GeminiNanoBananaService {
  private readonly client: GoogleGenAI;

  constructor(private readonly configService: ConfigService) {
    this.client = new GoogleGenAI({
      apiKey: this.configService.get('GOOGLE_GEMINI_API_KEY'),
    });
  }

  async generateImages(params: ImageGenerationParams): Promise<Buffer[]> {
    const { prompt, referenceImages, count = 3, aspectRatio = '1:1' } = params;

    // Montar partes da request (texto + imagens de referência do produto)
    const parts = [
      { text: prompt },
      ...referenceImages.map(img => ({
        inlineData: {
          mimeType: 'image/jpeg',
          data: img.base64, // base64 das fotos do produto
        },
      })),
    ];

    const results: Buffer[] = [];

    // Gerar N variações (API gera 1 por chamada — paralelizar)
    const generations = await Promise.all(
      Array.from({ length: count }).map(() =>
        this.client.models.generateContent({
          model: 'gemini-3.1-flash-image-preview',
          contents: [{ role: 'user', parts }],
          config: {
            responseModalities: ['TEXT', 'IMAGE'],
            generationConfig: {
              imageGenerationConfig: {
                aspectRatio,
                imageSize: '2K',
              },
            },
          },
        })
      )
    );

    // Extrair imagens da resposta
    for (const response of generations) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData?.mimeType?.startsWith('image/')) {
          results.push(Buffer.from(part.inlineData.data, 'base64'));
        }
      }
    }

    return results;
  }
}
```

#### Variáveis de ambiente

```bash
GOOGLE_GEMINI_API_KEY=   # API Key do Google AI Studio
```

> **Nota:** Esta integração usa Google AI Studio (API Key simples), diferente do Veo que usa Vertex AI (Service Account). São dois sistemas de autenticação distintos.

### 6.3 Instagram Graph API

- **Auth:** OAuth 2.0 (Long-lived tokens — 60 dias, renovação automática)
- **Permissões:** `instagram_basic`, `instagram_manage_insights`, `pages_show_list`
- **Sincronização:** Cron job diário via Bull (às 02:00 BRT)
- **Rate Limit:** 200 calls/hora por token

### 6.4 WhatsApp Business API

- **Tipo:** Cloud API (Meta for Developers)
- **Auth:** Bearer token permanente (configurado por empresa)
- **Métricas:** Webhook para delivery status (sent, delivered, read)
- **Armazenamento:** Webhook receiver via Route Handler Next.js

---

## 7. Banco de Dados — Modelo Conceitual

> **Nota:** Schema detalhado (DDL, indexes, RLS policies) será produzido pelo `@data-engineer`.

### 7.1 Entidades Principais

```
workspaces          — tenant root (uma empresa = um workspace)
├── users           — usuários com roles (admin, editor, viewer)
├── campaigns       — campanhas criadas
│   ├── campaign_assets    — imagens e vídeos gerados
│   └── campaign_metrics   — métricas de performance
├── collections     — agrupamento de campanhas
├── prompt_styles   — estilos pré-configurados (global)
├── custom_prompts  — prompts salvos pelo usuário
├── social_connections  — tokens Instagram/WhatsApp por workspace
└── generation_jobs — fila de jobs de geração (histórico)
```

### 7.2 Estratégia de Multitenancy no Banco

- **Coluna `workspace_id`** em todas as tabelas de domínio
- **RLS ativo** em todas as tabelas (Supabase)
- **Índice composto** em `(workspace_id, created_at)` nas tabelas de alto volume
- **Storage:** Bucket por workspace → `/{workspace_id}/campaigns/{campaign_id}/`

### 7.3 Configuração Supabase

```
Supabase Project
├── Auth           — gerência de sessões (email + Google OAuth)
├── Database       — PostgreSQL com RLS
├── Storage
│   ├── products/  — imagens de produtos enviadas
│   │   └── {workspace_id}/{upload_id}/
│   └── campaigns/ — assets gerados pela IA
│       └── {workspace_id}/{campaign_id}/
└── Edge Functions — (reservado para futuro: webhooks críticos)
```

---

## 8. Infraestrutura e Deploy

### 8.1 Ambientes

| Ambiente | Frontend | Backend | Banco |
|----------|----------|---------|-------|
| **Local** | `localhost:3000` | `localhost:3001` | Supabase Dev Project |
| **Staging** | `staging.fashionmidia.com.br` | Railway staging | Supabase Staging |
| **Produção** | `app.fashionmidia.com.br` | Railway prod | Supabase Prod |

### 8.2 GitHub Actions — Pipeline CI/CD

```yaml
# .github/workflows/ci.yml
on: [push, pull_request]

jobs:
  test:
    - Lint (ESLint + Prettier)
    - Type check (tsc --noEmit)
    - Unit tests (Jest)
    - Integration tests (Supertest)
    - Build (Turborepo)

  deploy-staging:    # merge em develop
    - Deploy web → Vercel preview
    - Deploy api → Railway staging
    - Run E2E (Playwright)

  deploy-production: # merge em main
    - Deploy web → Vercel production
    - Deploy api → Railway production
    - Run migrations (Prisma)
    - Health check
```

### 8.3 Variáveis de Ambiente

```bash
# .env.example

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Google Gemini Nano Banana (AI Studio — geração de imagens)
GOOGLE_GEMINI_API_KEY=            # API Key em aistudio.google.com/apikey

# Google Veo (Vertex AI — geração de vídeos)
GOOGLE_PROJECT_ID=
GOOGLE_LOCATION=us-central1
GOOGLE_APPLICATION_CREDENTIALS=  # path para service account JSON

# Redis (Bull Queue)
REDIS_URL=redis://localhost:6379

# Instagram
INSTAGRAM_APP_ID=
INSTAGRAM_APP_SECRET=

# WhatsApp Business
WHATSAPP_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=

# Email (Resend)
RESEND_API_KEY=

# App
NEXT_PUBLIC_APP_URL=
API_URL=
JWT_SECRET=
```

---

## 9. Observabilidade e Segurança

### 9.1 Logging

- **Backend:** Pino (JSON estruturado) com campos: `tenantId`, `userId`, `operation`, `duration`, `traceId`
- **Frontend:** Sentry (client-side errors + performance)
- **API:** Sentry + Pino → Railway logs

### 9.2 Rate Limiting

```typescript
// main.ts
app.use(
  rateLimit({
    windowMs: 60 * 1000, // 1 minuto
    max: 100,             // geral
    keyGenerator: (req) => req.tenantId ?? req.ip,
  })
);

// Endpoint de geração de IA — limite específico
@UseGuards(SpecificRateLimit({ max: 10, windowMs: 60000 }))
@Post('generate-image')
async generateImage() { ... }
```

### 9.3 Segurança

| Camada | Mecanismo |
|--------|-----------|
| **Autenticação** | Supabase JWT — validado em todo request |
| **Autorização** | TenantGuard + RoleGuard por endpoint |
| **Isolamento de dados** | RLS PostgreSQL (LGPD) |
| **Storage** | URLs assinadas com TTL (15min) — nunca URLs públicas permanentes |
| **API Keys** | Nunca expostas no frontend — sempre via backend |
| **Input validation** | class-validator em todos os DTOs |
| **CORS** | Apenas domínios da aplicação |
| **Headers** | Helmet.js (Content-Security-Policy, HSTS, etc.) |

---

## 10. Decisões Arquiteturais Pendentes

| # | Decisão | Status | Responsável |
|---|---------|--------|-------------|
| D1 | API Google Gemini Nano Banana confirmada (`gemini-3.1-flash-image-preview`) | **RESOLVIDO** ✅ | Usuário |
| D2 | Schema detalhado do banco (DDL + indexes + RLS) | **DELEGAR** | @data-engineer |
| D3 | Estratégia de créditos/uso por tenant (billing) | Para MVP v2 | @pm |
| D4 | Real-time via WebSocket vs Polling para jobs de IA | Polling MVP, WS v2 | @architect |
| D5 | CDN para assets de campanha (Cloudflare vs Vercel) | Supabase Storage MVP | @devops |

---

## 11. Handoff para @data-engineer

Com base nesta arquitetura, o `@data-engineer` deve:

1. Criar o schema DDL completo para as entidades: `workspaces`, `users`, `campaigns`, `campaign_assets`, `campaign_metrics`, `collections`, `prompt_styles`, `custom_prompts`, `social_connections`, `generation_jobs`
2. Definir indexes compostos (especialmente para queries por `workspace_id + created_at`)
3. Escrever as policies RLS para cada tabela
4. Definir estratégia de migrations com Prisma
5. Criar seed data para `prompt_styles` (estilos iniciais: casual, festa, fitness, infantil, executivo, praia)

---

*Documento gerado por Aria (@architect) — Fashion Mídia.IA v1.0*  
*Próximo passo: confirmação D1 (API imagens) → @data-engineer (schema) → @dev (implementação)*
