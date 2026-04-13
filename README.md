# Fashion Mídia.IA

Plataforma SaaS de geração de campanhas de moda com IA generativa.

**Executora:** TMS Informática | **Piloto:** Mazzara (Caruaru/PE) | **Edital:** FACEPE 23/2025

---

## Pré-requisitos

- **Node.js** 18 ou superior
- **npm** 9 ou superior
- **Git**

## Instalação

```bash
# Clone o repositório
git clone <repo-url>
cd fashion-midia-ia

# Instale as dependências (todos os workspaces)
npm install

# Configure as variáveis de ambiente
cp .env.example .env
cp apps/web/.env.example apps/web/.env.local
cp apps/api/.env.example apps/api/.env
# Edite os arquivos .env com suas credenciais
```

## Scripts Disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Inicia frontend (porta 3000) e backend (porta 3001) simultaneamente |
| `npm run build` | Compila todos os apps para produção |
| `npm run test` | Executa todos os testes |
| `npm run lint` | Verifica lint em todos os apps |
| `npm run typecheck` | Verifica tipos TypeScript |
| `npm run format` | Formata código com Prettier |

## Estrutura do Projeto

```
fashion-midia-ia/
├── apps/
│   ├── web/          # Next.js 14 — porta 3000
│   └── api/          # NestJS — porta 3001
├── packages/
│   ├── shared/       # Tipos e contratos compartilhados
│   └── config/       # ESLint, TypeScript configs
├── docs/
│   ├── prd/          # Product Requirements Document
│   ├── architecture/ # Documentação de arquitetura
│   ├── database/     # Schema do banco de dados
│   └── stories/      # User stories
├── turbo.json        # Turborepo pipeline
└── .env.example      # Variáveis de ambiente documentadas
```

## Stack Técnica

| Camada | Tecnologia |
|--------|-----------|
| Frontend | Next.js 16 App Router + shadcn/ui + Tailwind CSS |
| Backend | NestJS + Prisma ORM |
| Banco | Supabase (PostgreSQL + Auth + Storage) |
| IA — Imagens | Google Gemini (`gemini-3.1-flash-image-preview`) |
| IA — Vídeos | Google Veo (`veo-2.0-generate-001`) |
| Jobs | Bull Queue + Redis |
| Deploy | Vercel (frontend) + Railway (backend) |
| CI/CD | GitHub Actions |
| Monorepo | Turborepo |

## Documentação

- [PRD](docs/prd/prd.md) — Requisitos do produto
- [Arquitetura](docs/architecture/architecture.md) — Design técnico
- [Schema do Banco](docs/database/schema.md) — Modelo de dados
- [Stories](docs/stories/) — User stories de desenvolvimento
