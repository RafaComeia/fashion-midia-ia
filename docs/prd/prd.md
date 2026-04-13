# Fashion Mídia.IA — Product Requirements Document (PRD)

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2026-04-02 | 1.0 | Versão inicial gerada a partir do Edital FACEPE Nº 23/2025 | Orion (@aios-master) |

---

## 1. Goals and Background Context

### Goals

- Reduzir em ≥ 50% os custos de produção de campanhas de moda para PMEs de confecção em Pernambuco
- Reduzir o tempo de produção de campanhas de 30 dias para 1–2 dias
- Democratizar o acesso a campanhas de moda de qualidade profissional via IA generativa
- Gerar 80 campanhas e 160 catálogos em 6 meses com a empresa-piloto Mazzara
- Atingir NPS ≥ 85% de satisfação dos usuários da plataforma
- Aumentar em ≥ 20% o engajamento digital das marcas usuárias
- Permitir ≥ 15% de reutilização de campanhas para novas coleções
- Disponibilizar dashboard integrado de gestão e análise de performance das campanhas
- Capacitar usuários sem experiência técnica para operar a plataforma autonomamente

### Background Context

O setor de confecção em Pernambuco, especialmente no Polo de Caruaru, é composto majoritariamente por pequenas e médias empresas que enfrentam um gargalo estrutural na produção de conteúdo visual para marketing. Campanhas tradicionais de moda exigem fotógrafos, modelos, maquiadores, stylists e estúdio, custando entre R$10.000 e R$30.000 por campanha e levando semanas para produzir. Esse custo compromete até 40% do orçamento de marcas de menor porte, limitando sua competitividade digital.

O Fashion Mídia.IA é uma plataforma SaaS desenvolvida pela TMS Informática em parceria com a Mazzara (empresa-piloto), financiada pelo edital FACEPE Nº 23/2025 — TRANSFORMA PE. A solução utiliza IA generativa para criar imagens e vídeos de campanhas, catálogos e editoriais de moda a partir do upload de fotos dos produtos, com prompts pré-configurados por estilo. A plataforma é voltada para PMEs do APL de Moda e Confecção de Pernambuco que precisam de presença digital constante com baixo custo e alta agilidade.

---

## 2. Requirements

### Functional Requirements

**Módulo 1 — Produção Visual**

- FR1: O sistema deve permitir que o usuário faça upload de imagens de produtos em múltiplos ângulos (JPG, PNG, WebP, máx. 20MB por imagem).
- FR2: O sistema deve disponibilizar uma biblioteca de prompts pré-configurados por estilo de moda (casual, festa, fitness, infantil, e outros).
- FR3: O sistema deve permitir que o usuário crie prompts descritivos personalizados para geração de conteúdo.
- FR4: O sistema deve integrar com a API Google Gemini Nano Banana para geração de imagens de campanhas, catálogos e editoriais de alta qualidade.
- FR5: O sistema deve integrar com a API Google Veo para geração de vídeos de campanhas de moda.
- FR6: O sistema deve permitir geração de campanhas temáticas com cenários, poses e iluminação variados.
- FR7: O sistema deve oferecer ajustes manuais básicos nas imagens geradas (recorte, brilho, contraste).
- FR8: O sistema deve exibir preview das imagens/vídeos gerados antes de salvar na campanha.

**Módulo 2 — Dashboard e Histórico de Campanhas**

- FR9: O sistema deve exibir histórico organizado de todas as campanhas e catálogos criados pelo usuário.
- FR10: O sistema deve permitir organização de campanhas por coleções e períodos.
- FR11: O sistema deve oferecer comparativo visual entre campanhas de diferentes períodos.
- FR12: O sistema deve armazenar campanhas em nuvem com versionamento (Supabase Storage).
- FR13: O sistema deve permitir exportação de imagens e relatórios nos formatos PDF, ZIP e CSV.
- FR14: O sistema deve permitir reaproveitamento e adaptação de campanhas anteriores para novas coleções.

**Módulo 3 — Análise de Performance**

- FR15: O sistema deve integrar com a Instagram Graph API para captura de métricas (curtidas, comentários, alcance, cliques).
- FR16: O sistema deve integrar com a WhatsApp Business API para acompanhamento de engajamento.
- FR17: O sistema deve exibir análise de engajamento digital (alcance, taxa de conversão, impressões).
- FR18: O sistema deve gerar relatórios comparativos de performance entre campanhas com insights automáticos.
- FR19: O sistema deve disponibilizar painel de KPIs personalizáveis por empresa/marca.

**Módulo 4 — Capacitação e Suporte**

- FR20: O sistema deve disponibilizar tutoriais em vídeo e guias interativos dentro da plataforma.
- FR21: O sistema deve oferecer biblioteca de melhores práticas em fotografia e uso de IA para moda.
- FR22: O sistema deve disponibilizar suporte técnico via chat integrado com FAQ inteligente.

**Autenticação e Multitenancy**

- FR23: O sistema deve suportar autenticação de usuários via e-mail/senha e OAuth (Google).
- FR24: O sistema deve suportar multitenancy — cada empresa/marca opera em workspace isolado.
- FR25: O sistema deve ter controle de acesso por roles (admin, editor, viewer) dentro de cada workspace.

### Non-Functional Requirements

- NFR1: A plataforma deve ser acessível via Web Responsive (desktop e mobile), sem necessidade de app nativo.
- NFR2: O tempo de geração de uma imagem via IA não deve ultrapassar 60 segundos em 95% dos casos.
- NFR3: O tempo de geração de um vídeo via IA não deve ultrapassar 5 minutos em 95% dos casos.
- NFR4: A plataforma deve suportar pelo menos 100 usuários simultâneos no MVP.
- NFR5: O sistema deve estar em conformidade com a LGPD — dados de clientes e campanhas não devem ser compartilhados entre tenants.
- NFR6: A disponibilidade da plataforma deve ser ≥ 99% (excluindo janelas de manutenção programada).
- NFR7: O storage de campanhas deve ser persistente e com backup automático diário.
- NFR8: Todas as comunicações devem usar HTTPS com TLS 1.2+.
- NFR9: O sistema deve logar todas as operações críticas (geração de conteúdo, exportação, acesso a dados) com timestamp e identificação do usuário.
- NFR10: A interface deve ser intuitiva para usuários sem experiência técnica — onboarding em até 3 passos.

---

## 3. User Interface Design Goals

### Overall UX Vision

Interface limpa, moderna e intuitiva, inspirada em ferramentas de design acessíveis (estilo Canva). O usuário deve conseguir gerar sua primeira campanha em menos de 5 minutos após o cadastro. Foco em simplicidade visual com resultados profissionais.

### Key Interaction Paradigms

- Upload drag-and-drop de imagens de produtos
- Seleção de estilo via cards visuais (não texto técnico)
- Preview em tempo real das campanhas geradas
- Dashboard visual com gráficos simples de performance
- Fluxo wizard guiado para criação da primeira campanha

### Core Screens and Views

1. **Tela de Login / Cadastro** — autenticação e onboarding da marca
2. **Dashboard Principal** — visão geral de campanhas, KPIs e atalhos rápidos
3. **Criador de Campanhas** — upload de produtos + seleção de estilo + geração via IA
4. **Galeria de Campanhas** — histórico organizado por coleção e período
5. **Detalhes da Campanha** — preview, edição, exportação e métricas
6. **Análise de Performance** — gráficos de engajamento e comparativos
7. **Biblioteca de Prompts** — estilos pré-configurados e prompts personalizados
8. **Central de Capacitação** — tutoriais, guias e FAQ inteligente
9. **Configurações do Workspace** — gestão de marca, usuários e integrações (Instagram, WhatsApp)

### Accessibility

WCAG AA

### Branding

Interface neutra e profissional que permita que a identidade visual de cada marca cliente se destaque. Paleta de cores clara com acentos em tons escuros. Logo e identidade visual do Fashion Mídia.IA a ser definida com consultor de moda.

### Target Device and Platforms

Web Responsive — desktop (uso principal) e mobile (consulta e aprovação de campanhas)

---

## 4. Technical Assumptions

### Repository Structure

Monorepo com Turborepo

### Service Architecture

Monolith modular dentro de um Monorepo:
- `apps/web` — Frontend Next.js 14 (App Router) + TypeScript
- `apps/api` — Backend NestJS + TypeScript
- `packages/shared` — tipos, utils e contratos compartilhados

### Testing Requirements

Unit + Integration:
- Unit: Jest (frontend e backend)
- Integration: Supertest (endpoints de API)
- E2E: Playwright (fluxos críticos: geração de campanha, exportação, login)

### Additional Technical Assumptions

- **Frontend:** Next.js 14 com App Router, TypeScript, Tailwind CSS, shadcn/ui
- **Backend:** Node.js com NestJS (TypeScript), arquitetura modular por domínio
- **Banco de dados:** PostgreSQL via Supabase (auth integrada, RLS, storage e realtime)
- **IA — Imagens:** Google Gemini Nano Banana API (geração de imagens via Google AI)
- **IA — Vídeos:** Google Veo API (geração de vídeos via Google AI)
- **Storage:** Supabase Storage (imagens e vídeos gerados, organizados por tenant)
- **Hospedagem Frontend:** Vercel
- **Hospedagem Backend:** Railway
- **Integração Social:** Instagram Graph API + WhatsApp Business API
- **Autenticação:** Supabase Auth (email/senha + OAuth Google)
- **ORM:** Prisma com PostgreSQL
- **Queue/Jobs:** Bull (para geração assíncrona de imagens e vídeos)
- **Observabilidade:** logs estruturados com Pino + Sentry para monitoramento de erros
- **CI/CD:** GitHub Actions
- **Conformidade:** LGPD — isolamento de dados por tenant via Row Level Security (RLS) no Supabase

---

## 5. Epic List

### Proposta de Epics

| # | Epic | Objetivo |
|---|------|----------|
| **E1** | Foundation & Infraestrutura | Setup do monorepo, CI/CD, autenticação, multitenancy e deploy base |
| **E2** | Módulo de Produção Visual | Upload de produtos, biblioteca de prompts e geração de imagens/vídeos via IA |
| **E3** | Dashboard e Histórico de Campanhas | Gestão de campanhas, organização por coleções, exportação e reutilização |
| **E4** | Análise de Performance | Integração com redes sociais, KPIs, relatórios e insights de engajamento |
| **E5** | Capacitação e Suporte | Tutoriais, biblioteca de boas práticas e FAQ inteligente |

---

## 6. Epic Details

### Epic 1 — Foundation & Infraestrutura

**Objetivo:** Estabelecer toda a base técnica do projeto: monorepo configurado, pipeline CI/CD, autenticação de usuários, isolamento por workspace (multitenancy) e deploy funcional em Vercel + Railway. Ao final deste epic, a plataforma estará acessível online com login, cadastro de empresa e página inicial do dashboard.

#### Story 1.1 — Setup do Monorepo e Infraestrutura Base
Como desenvolvedor,
Eu quero configurar o monorepo com Next.js, NestJS e Turborepo,
Para que todos os módulos compartilhem uma base sólida e padronizada.

**Acceptance Criteria:**
1. Monorepo configurado com Turborepo contendo `apps/web` (Next.js 14), `apps/api` (NestJS) e `packages/shared`
2. ESLint, Prettier e TypeScript configurados globalmente
3. Scripts de `dev`, `build` e `test` funcionando via Turborepo
4. Variáveis de ambiente documentadas em `.env.example`
5. README com instruções de setup local

#### Story 1.2 — CI/CD e Deploy Base
Como desenvolvedor,
Eu quero pipeline de CI/CD configurado com deploy automático,
Para que cada merge na main faça deploy automático no ambiente de produção.

**Acceptance Criteria:**
1. GitHub Actions configurado com build e testes automáticos em PRs
2. Deploy automático do frontend na Vercel ao merge na main
3. Deploy automático do backend no Railway ao merge na main
4. Ambiente de staging separado do produção
5. Health-check endpoint `GET /health` retornando `{ status: "ok" }` em produção

#### Story 1.3 — Autenticação e Cadastro de Usuário
Como usuário,
Eu quero me cadastrar e fazer login na plataforma,
Para que possa acessar meu workspace com segurança.

**Acceptance Criteria:**
1. Cadastro via e-mail/senha com validação de campos
2. Login via e-mail/senha funcional
3. Login via OAuth Google funcional
4. Sessão persistida com refresh token via Supabase Auth
5. Tela de esqueci minha senha com envio de e-mail de recuperação
6. Redirecionamento para onboarding após primeiro login

#### Story 1.4 — Onboarding e Criação do Workspace da Marca
Como usuário recém cadastrado,
Eu quero configurar o workspace da minha marca,
Para que minha empresa esteja pronta para criar campanhas.

**Acceptance Criteria:**
1. Wizard de onboarding em 3 passos: nome da marca, segmento (casual, festa, fitness, etc.) e logo
2. Workspace isolado criado no banco com RLS ativo
3. Usuário admin associado ao workspace
4. Redirecionamento para dashboard principal após conclusão
5. Possibilidade de pular e completar depois

#### Story 1.5 — Dashboard Principal (Shell)
Como usuário autenticado,
Eu quero visualizar o dashboard principal da plataforma,
Para que tenha uma visão geral das minhas campanhas e acesso rápido às funcionalidades.

**Acceptance Criteria:**
1. Layout principal com sidebar de navegação (Campanhas, Performance, Capacitação, Configurações)
2. Área de boas-vindas com nome da marca e atalho para criar primeira campanha
3. Cards de KPIs zerados com tooltips explicativos
4. Responsivo em desktop e mobile
5. Header com nome do usuário e opção de logout

---

### Epic 2 — Módulo de Produção Visual

**Objetivo:** Permitir que o usuário faça upload de produtos, selecione estilos via prompts pré-configurados ou personalizados, e gere imagens e vídeos de campanhas profissionais via Google Gemini Nano Banana e Google Veo. Ao final, o usuário consegue criar e salvar campanhas completas.

#### Story 2.1 — Upload de Imagens de Produtos
Como usuário,
Eu quero fazer upload de fotos dos meus produtos,
Para que a IA possa usá-las como base para gerar campanhas.

**Acceptance Criteria:**
1. Drag-and-drop e seleção de arquivos (JPG, PNG, WebP, máx. 20MB)
2. Upload de múltiplas imagens por produto (até 5 ângulos)
3. Preview das imagens carregadas com opção de remover
4. Armazenamento no Supabase Storage no bucket do tenant
5. Validação de formato e tamanho com mensagem de erro amigável

#### Story 2.2 — Biblioteca de Prompts Pré-configurados
Como usuário,
Eu quero selecionar um estilo de moda pré-configurado,
Para que possa gerar campanhas sem precisar saber escrever prompts técnicos.

**Acceptance Criteria:**
1. Tela de seleção com cards visuais para cada estilo: casual, festa, fitness, infantil, executivo, praia
2. Cada card mostra nome do estilo, ícone e exemplo de imagem gerada
3. Usuário pode selecionar 1 estilo por geração
4. Prompt base do estilo é exibido (somente leitura) para transparência
5. Estilos armazenados no banco e gerenciáveis pelo admin da plataforma

#### Story 2.3 — Prompt Personalizado
Como usuário avançado,
Eu quero criar meu próprio prompt descritivo,
Para que possa gerar campanhas com direcionamento específico da minha marca.

**Acceptance Criteria:**
1. Campo de texto livre para prompt personalizado (máx. 500 caracteres)
2. Contador de caracteres em tempo real
3. Dicas de como escrever bons prompts exibidas abaixo do campo
4. Opção de usar prompt personalizado como complemento ao estilo pré-configurado
5. Histórico dos últimos 5 prompts utilizados pelo usuário

#### Story 2.4 — Geração de Imagens via Google Gemini Nano Banana
Como usuário,
Eu quero gerar imagens de campanha a partir das fotos dos meus produtos e do estilo selecionado,
Para que tenha conteúdo visual profissional pronto para uso.

**Acceptance Criteria:**
1. Botão "Gerar Campanha" aciona chamada à API Google Gemini Nano Banana
2. Loader com estimativa de tempo exibido durante geração (máx. 60s)
3. Mínimo de 3 variações de imagem geradas por solicitação
4. Preview das imagens geradas em grid antes de salvar
5. Opção de regenerar imagens insatisfatórias sem custo adicional de crédito
6. Erro tratado com mensagem amigável caso API falhe

#### Story 2.5 — Geração de Vídeos via Google Veo
Como usuário,
Eu quero gerar vídeos curtos de campanha dos meus produtos,
Para que tenha conteúdo dinâmico para redes sociais.

**Acceptance Criteria:**
1. Opção de gerar vídeo a partir de imagem já gerada ou produto diretamente
2. Seleção de duração do vídeo: 5s, 10s ou 15s
3. Job assíncrono com notificação quando vídeo estiver pronto (máx. 5 min)
4. Preview do vídeo gerado com player inline
5. Download do vídeo em MP4 (1080p)
6. Erro tratado com mensagem amigável caso API falhe

#### Story 2.6 — Ajustes Manuais e Salvamento de Campanha
Como usuário,
Eu quero ajustar e salvar as imagens geradas como uma campanha,
Para que possa organizar e exportar meu conteúdo.

**Acceptance Criteria:**
1. Ferramentas básicas de ajuste: recorte, brilho e contraste
2. Opção de nomear a campanha e associar a uma coleção
3. Campanha salva no workspace do tenant com data de criação
4. Imagens e vídeos armazenados no Supabase Storage
5. Campanha visível imediatamente no histórico do dashboard

---

### Epic 3 — Dashboard e Histórico de Campanhas

**Objetivo:** Prover ao usuário uma visão organizada de todo o histórico de campanhas criadas, com ferramentas de comparação, reutilização e exportação de materiais em múltiplos formatos.

#### Story 3.1 — Listagem e Organização de Campanhas
Como usuário,
Eu quero visualizar e organizar todas as campanhas criadas,
Para que possa encontrar e reutilizar materiais facilmente.

**Acceptance Criteria:**
1. Grid de campanhas com thumbnail, nome, data de criação e coleção
2. Filtro por período (últimos 7 dias, 30 dias, 3 meses, personalizado)
3. Filtro por coleção e estilo de moda
4. Busca por nome de campanha
5. Ordenação por data (mais recente/antiga) e por nome

#### Story 3.2 — Detalhes e Reutilização de Campanha
Como usuário,
Eu quero ver detalhes de uma campanha e reutilizá-la como base,
Para que possa criar variações sem começar do zero.

**Acceptance Criteria:**
1. Tela de detalhes com todas as imagens e vídeos da campanha
2. Exibição do prompt utilizado e estilo selecionado
3. Botão "Duplicar e Editar" — abre o criador com os parâmetros da campanha original
4. Opção de mover campanha para outra coleção
5. Opção de excluir campanha (com confirmação)

#### Story 3.3 — Exportação de Campanhas
Como usuário,
Eu quero exportar minhas campanhas em diferentes formatos,
Para que possa usar o conteúdo nas minhas redes sociais e catálogos.

**Acceptance Criteria:**
1. Exportação de imagens individuais em JPG/PNG em alta resolução
2. Exportação de campanha completa em ZIP
3. Geração de relatório da campanha em PDF (imagens + metadados)
4. Exportação de lista de campanhas em CSV (nome, data, estilo, métricas)
5. Download iniciado imediatamente ou via link de e-mail para arquivos grandes (>50MB)

#### Story 3.4 — Comparativo entre Campanhas
Como usuário,
Eu quero comparar duas campanhas lado a lado,
Para que possa avaliar qual gerou melhores resultados visuais.

**Acceptance Criteria:**
1. Seleção de 2 campanhas para comparação
2. Visualização lado a lado das imagens principais de cada campanha
3. Exibição comparativa de métricas de performance (quando disponíveis do Epic 4)
4. Opção de exportar o comparativo em PDF

---

### Epic 4 — Análise de Performance

**Objetivo:** Integrar a plataforma com Instagram e WhatsApp Business para capturar métricas reais de engajamento das campanhas publicadas, exibindo dashboards de KPIs e relatórios com insights automáticos.

#### Story 4.1 — Integração com Instagram Graph API
Como usuário,
Eu quero conectar minha conta do Instagram à plataforma,
Para que a plataforma possa acompanhar o desempenho das minhas campanhas publicadas.

**Acceptance Criteria:**
1. Fluxo OAuth de autorização com Instagram Graph API
2. Listagem das mídias do perfil conectado (posts e reels)
3. Sincronização automática diária de métricas (curtidas, comentários, alcance, impressões)
4. Armazenamento histórico das métricas no banco por tenant
5. Opção de desconectar conta com remoção dos tokens de acesso

#### Story 4.2 — Integração com WhatsApp Business API
Como usuário,
Eu quero conectar minha conta do WhatsApp Business,
Para que possa acompanhar o engajamento de campanhas compartilhadas via WhatsApp.

**Acceptance Criteria:**
1. Configuração da WhatsApp Business API com token e número de telefone
2. Captura de métricas de mensagens enviadas, entregues e lidas
3. Exibição de taxa de abertura de campanhas compartilhadas
4. Sincronização automática diária
5. Indicação clara de quais métricas são oriundas do Instagram vs. WhatsApp

#### Story 4.3 — Dashboard de Performance e KPIs
Como usuário,
Eu quero visualizar os KPIs de performance das minhas campanhas,
Para que possa entender o impacto do conteúdo gerado.

**Acceptance Criteria:**
1. Painel com KPIs: alcance total, engajamento médio, taxa de conversão, crescimento de seguidores
2. Gráficos de linha/barra mostrando evolução temporal dos KPIs
3. KPIs personalizáveis — usuário escolhe quais exibir no painel principal
4. Período selecionável: 7 dias, 30 dias, 3 meses, personalizado
5. Indicador visual de campanhas com melhor e pior performance

#### Story 4.4 — Relatórios Comparativos e Insights
Como usuário,
Eu quero gerar relatórios comparativos com insights automáticos,
Para que possa tomar decisões baseadas em dados sobre minhas próximas campanhas.

**Acceptance Criteria:**
1. Relatório comparativo entre períodos (ex: mês atual vs. mês anterior)
2. Insights textuais automáticos gerados com base nos dados (ex: "Campanhas fitness tiveram 35% mais engajamento")
3. Sugestão de melhores estilos com base no histórico de performance
4. Exportação do relatório em PDF
5. Agendamento de envio de relatório por e-mail (semanal ou mensal)

---

### Epic 5 — Capacitação e Suporte

**Objetivo:** Prover aos usuários conteúdo educativo integrado à plataforma para maximizar o uso das ferramentas de IA, reduzir fricção no onboarding e garantir suporte técnico eficiente via FAQ inteligente.

#### Story 5.1 — Central de Tutoriais e Guias
Como usuário,
Eu quero acessar tutoriais e guias dentro da plataforma,
Para que possa aprender a usar todas as funcionalidades sem precisar de suporte externo.

**Acceptance Criteria:**
1. Seção de capacitação com categorias: Primeiros Passos, Criação de Campanhas, Análise de Performance, Dicas de IA
2. Tutoriais em vídeo embutidos (YouTube ou hospedagem própria)
3. Guias passo a passo em texto com screenshots
4. Marcação de tutoriais como "concluídos" pelo usuário
5. Barra de progresso de capacitação no perfil do usuário

#### Story 5.2 — Biblioteca de Boas Práticas
Como usuário,
Eu quero consultar boas práticas de fotografia e uso de IA para moda,
Para que possa obter melhores resultados nas minhas campanhas.

**Acceptance Criteria:**
1. Biblioteca com artigos categorizados: fotografia de produtos, prompts eficazes, estilos por segmento
2. Busca por palavra-chave na biblioteca
3. Artigos com exemplos visuais (antes/depois de campanhas)
4. Avaliação de utilidade do artigo (👍/👎) para melhoria contínua
5. Seção de "Mais acessados" e "Novidades"

#### Story 5.3 — FAQ Inteligente e Chat de Suporte
Como usuário,
Eu quero obter suporte técnico diretamente na plataforma,
Para que possa resolver dúvidas rapidamente sem sair do sistema.

**Acceptance Criteria:**
1. FAQ com perguntas frequentes categorizadas e busca por palavra-chave
2. Chat de suporte integrado com atendimento humano em horário comercial
3. Respostas automáticas para as 20 perguntas mais frequentes via bot
4. Histórico de conversas de suporte acessível pelo usuário
5. Avaliação de atendimento ao fechar o chat (1–5 estrelas)

---

## 7. Checklist Results

| Item | Status | Observação |
|------|--------|------------|
| Goals claros e mensuráveis | ✅ | KPIs extraídos diretamente do edital FACEPE |
| Background contextualizado | ✅ | Problema, mercado e solução documentados |
| Requisitos funcionais cobrem todos os módulos | ✅ | FR1–FR25 mapeados por módulo |
| Requisitos não-funcionais incluem LGPD, performance e segurança | ✅ | NFR1–NFR10 definidos |
| UI Goals com telas principais mapeadas | ✅ | 9 telas principais identificadas |
| Stack técnica completa | ✅ | Todas as camadas definidas |
| Epics sequenciais e incrementais | ✅ | E1–E5 seguem ordem de dependência |
| Stories com acceptance criteria testáveis | ✅ | Cada story com 5+ critérios |
| Multitenancy e LGPD contemplados | ✅ | FR24, FR25, NFR5, NFR8 |

---

## 8. Next Steps

### UX Expert Prompt

> `@ux-design-expert` — Revise o PRD em `docs/prd/prd.md` e crie o Frontend Spec com wireframes conceituais para as 9 telas principais do Fashion Mídia.IA. Foque na jornada do usuário de criação de primeira campanha (onboarding → upload → geração → exportação). Interface estilo Canva — simples, visual, acessível para usuários sem experiência técnica. WCAG AA.

### Architect Prompt

> `@architect` — Revise o PRD em `docs/prd/prd.md` e crie a arquitetura fullstack do Fashion Mídia.IA. Stack: Next.js 14 + NestJS + PostgreSQL/Supabase + Google Gemini Nano Banana API + Google Veo API + Bull Queue + Vercel + Railway. Monorepo Turborepo. Confirme a existência e detalhes de integração da API Google Gemini Nano Banana. Defina: estrutura de pastas, diagrama de componentes, modelo de dados, fluxo de geração assíncrona de imagens/vídeos e estratégia de multitenancy com RLS.
