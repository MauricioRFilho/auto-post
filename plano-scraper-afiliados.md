# Plano Técnico — Sistema de Scraping + n8n para Posts (Instagram, Pinterest e WhatsApp)

> **Objetivo:** A partir de um **link de afiliado** de Mercado Livre, Magalu ou Shopee, coletar os dados do produto, **persistir** as informações e **disparar** um fluxo no **n8n** que publica automaticamente no Instagram, Pinterest e WhatsApp. Ter um **dashboard** para gerir links, acompanhar execuções e status dos posts.

---

## 1) Escopo do MVP (2–3 semanas)
- ✅ Receber link de afiliado (ML, Magalu, Shopee) via dashboard ou API.
- ✅ Scraping do produto (título, preço, imagens, rating, loja, categoria, estoque/variações se disponível) preservando o **link de afiliado**.
- ✅ Persistência em banco (histórico de versões do produto).
- ✅ Disparo via **n8n** (workflow importável via JSON) para postar:
  - Instagram (Feed/Reels com legenda gerada + link na bio/CTA).
  - Pinterest (Pin com imagem + link de afiliado).
  - WhatsApp (mensagem via WhatsApp Cloud API com card/legenda).
- ✅ Retorno de status ao dashboard (via webhook do n8n).
- ✅ Logs e reexecução manual.
- ❌ Fora do MVP: encurtador próprio, geração de imagem avançada (canva-like), editor de templates complexos.

---

## 2) Arquitetura (alto nível)

```
[Dashboard (Next.js)]  <->  [Backend API (Node/NestJS)]
                                   |
                                   | queue (BullMQ/Redis)
                                   v
                           [Worker: Scraper (Python + Playwright)]
                                   |
                                   v
                                [Postgres]
                                   |
                       (HTTP) ---> [n8n Workflow]
                                   |
                                   v
                 Instagram Graph API | Pinterest API | WhatsApp Cloud API
                                   |
                           (HTTP callback)
                                   v
                              [Backend API] ---> atualiza status / eventos
```

**Stack sugerida**
- **Dashboard**: Next.js + Tailwind + shadcn/ui.
- **API Backend**: Node.js (NestJS + Prisma) + **Postgres**.
- **Fila/Jobs**: BullMQ + **Redis**.
- **Scraper Service**: Python 3.11 + **Playwright** (Chromium, `stealth`), `pydantic`.
- **Observabilidade**: Pino logger (API), `structlog` (Python), Prometheus + Grafana (post-MVP).
- **Infra**: Docker Compose (dev) e Docker (prod).

---

## 3) Fluxo ponta-a-ponta

1. Usuário cadastra um **link de afiliado** pelo dashboard.
2. Backend valida domínio (ML/Magalu/Shopee) e cria um **job** de scraping.
3. Worker Python consome o job, resolve/normaliza a URL, abre com Playwright, coleta dados e salva:
   - `products` (snapshot canônico) + `product_versions` (histórico) + `affiliate_links`.
4. Backend dispara **n8n** (HTTP Request) com payload do produto + parâmetros (templates, canais ativos).
5. **n8n** executa: gera legenda (prompt LLM opcional), baixa imagem (se necessário), publica nos canais.
6. **n8n callback** → Backend (`/webhooks/n8n/status`) para cada etapa (OK/ERRO), o dashboard exibe em tempo real.
7. Reexecução manual possível a partir do dashboard (recreate job / re-post).

---

## 4) Modelo de Dados (Postgres)

```sql
-- Produtos
CREATE TABLE products (
  id UUID PRIMARY KEY,
  marketplace TEXT NOT NULL CHECK (marketplace IN ('mercado_livre','magalu','shopee')),
  canonical_product_id TEXT,
  title TEXT NOT NULL,
  price_cents BIGINT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'BRL',
  rating NUMERIC(3,2),
  review_count INT,
  seller_name TEXT,
  category TEXT,
  main_image_url TEXT,
  images JSONB DEFAULT '[]',
  url_affiliate TEXT NOT NULL,
  url_canonical TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Histórico de versões
CREATE TABLE product_versions (
  id UUID PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  snapshot JSONB NOT NULL,
  scraped_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Links de afiliado
CREATE TABLE affiliate_links (
  id UUID PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  raw_url TEXT NOT NULL,
  normalized_url TEXT,
  marketplace TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Execuções de scraping
CREATE TABLE scrape_runs (
  id UUID PRIMARY KEY,
  affiliate_link_id UUID REFERENCES affiliate_links(id) ON DELETE SET NULL,
  status TEXT NOT NULL CHECK (status IN ('queued','running','success','error')),
  error TEXT,
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ
);

-- Jobs de postagem
CREATE TABLE post_jobs (
  id UUID PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  channels JSONB NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('queued','running','partial','success','error')),
  context JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Eventos de integração
CREATE TABLE integration_events (
  id UUID PRIMARY KEY,
  post_job_id UUID REFERENCES post_jobs(id) ON DELETE CASCADE,
  source TEXT NOT NULL,
  stage TEXT NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**Índices úteis**
- `products (marketplace, canonical_product_id)`
- `affiliate_links (marketplace, is_active)`
- `scrape_runs (status, started_at desc)`
- `integration_events (post_job_id, created_at)`

---

## 5) API Backend (NestJS) — Contratos

### Autenticação
- JWT ou Clerk/Auth0 (MVP: token único por ambiente).

### Endpoints
- `POST /links` — Cadastra link de afiliado.
  - Body: `{ "url": "string", "channels": { "instagram": true, "pinterest": true, "whatsapp": true }, "context": {} }`
  - Resposta: `{ "affiliateLinkId": "uuid", "normalizedUrl": "string", "marketplace": "mercado_livre|magalu|shopee" }`
- `POST /links/:id/scrape` — Força scraping agora.
- `GET  /products?search=...&marketplace=...`
- `GET  /products/:id`
- `POST /posts` — Cria job de post (dispara n8n).
  - Body: `{ "productId": "uuid", "channels": {...}, "context": {...} }`
- `GET  /posts/:id` — Status resumido do job.
- `GET  /posts/:id/events` — Timeline de eventos.
- `POST /webhooks/n8n/status` — **Callback** do n8n (assinado com secret).
  - Body (exemplo): `{ "postJobId": "...", "channel": "instagram", "stage": "posted", "status": "success", "detail": { ... } }`

### Fila (BullMQ)
- `queue:scrape` — jobs com `{ affiliateLinkId }`
- `queue:post` — jobs com `{ productId, channels, context }`

---

## 6) Scraper Service (Python + Playwright)

### Estratégia
- **Playwright headless** (Chromium) com `stealth` (User-Agent, timezone, langs, viewport).
- Timeout + backoff + retries (jitter).
- Extração via `page.locator(...).text_content()` + captura de **JSONs embutidos** (ex.: `window.__STATE__`, `application/ld+json`).
- Normalização: preço → centavos (inteiro); rating → float 0–5; imagens → lista `https`.
- **Nunca** alterar o link de afiliado (preservar tal como enviado). Guardar também uma versão canônica da página (quando aplicável).

### Detecção de marketplace e parsing de ID
```python
from urllib.parse import urlparse

def detect_marketplace(url: str) -> str:
    h = urlparse(url).netloc
    if 'mercadolivre' in h or 'mercadolibre' in h: return 'mercado_livre'
    if 'magazineluiza' in h or 'magalu' in h: return 'magalu'
    if 'shopee' in h: return 'shopee'
    raise ValueError('Marketplace não suportado')
```

### Pseudocódigo de scraping por marketplace
```python
async def scrape(url_affiliate: str) -> dict:
    mp = detect_marketplace(url_affiliate)
    page = await browser.new_page()
    await page.goto(url_affiliate, wait_until='domcontentloaded', timeout=60000)

    if mp == 'mercado_livre':
        title = (await page.locator('h1').text_content()) or ''
        ld = await extract_ld_json(page)
        price = parse_price_from_ld(ld) or await parse_price_from_dom(page)
        images = await collect_images(page, ['img.ui-pdp-image','img[itemprop="image"]'])
        seller = await text(page, '[data-testid="store-info"] .ui-seller-info__status-info, .ui-pdp-seller__link-trigger')
        rating, review_count = await parse_rating(page)

    elif mp == 'magalu':
        # Seletores/acordos do Magalu product page
        pass

    elif mp == 'shopee':
        # Shopee costuma ter dados em script JSON; observar XHRs e ld+json
        pass
    
    return normalize({
        "marketplace": mp,
        "title": title,
        "price_cents": to_cents(price),
        "images": images,
        "seller_name": seller,
        "rating": rating,
        "review_count": review_count,
        "url_affiliate": url_affiliate
    })
```

### Anti-bot e Resiliência
- Rotação de UA, `accept-language=pt-BR`, timezone `America/Sao_Paulo`.
- Esperas humanas (randomizadas) e **retry** com backoff.
- Captura de **screenshot** e **HTML bruto** em caso de erro para debug.
- **Limites**: controlar taxa por domínio (token bucket).

---

## 7) n8n — Workflow (import JSON)

### Visão geral
- **Webhook Trigger**: recebe payload do backend com `{ postJobId, product: {...}, channels, context, backendBaseUrl }`.
- **Nós por canal** (condicionais): Instagram / Pinterest / WhatsApp.
- **Gerar legenda** (opcional): usar LLM/templating simples no próprio n8n.
- **Callback**: HTTP Request para `/webhooks/n8n/status` em cada etapa.

### Variáveis/credenciais esperadas no n8n
- `ENV_BACKEND_BASE_URL` (ex.: `https://api.suaapp.com`)
- `ENV_BACKEND_WEBHOOK_SECRET` (para assinar callbacks, ex.: HMAC)
- Credenciais das APIs:
  - **Instagram Graph API**
  - **Pinterest API**
  - **WhatsApp Cloud API**

### Workflow de exemplo
O JSON de importação está no arquivo `workflow-n8n-post-produto.json` deste pacote.

---

## 8) Dashboard (Next.js)

### Páginas
- **/links**: listagem; criar novo link; status do último scrape; botão “Scrapear agora”.
- **/products/:id**: detalhes + histórico (tabela de `product_versions`).
- **/posts**: lista de jobs; filtros por status/canal.
- **/posts/:id**: timeline de eventos (realtime via SSE/WebSocket), botões reexecutar/cancelar.
- **/settings**: credenciais (guardadas no backend como Secrets).

### Telemetria/UX
- Toasts com resultado de ações; badges de status; tabela com paginação; busca full-text por título.

---

## 9) Contrato com o n8n (payload recomendado)

**Disparo do backend → n8n** (`POST https://<n8n>/webhook/post-produto`)

```json
{
  "postJobId": "uuid",
  "backendBaseUrl": "https://api.seusistema.com",
  "channels": { "instagram": true, "pinterest": true, "whatsapp": true },
  "product": {
    "id": "uuid",
    "marketplace": "mercado_livre",
    "title": "Tênis XYZ",
    "price_cents": 19990,
    "currency": "BRL",
    "rating": 4.7,
    "review_count": 321,
    "seller_name": "Loja ABC",
    "category": "Moda/Tênis",
    "images": ["https://..."],
    "url_affiliate": "https://..."
  },
  "context": {
    "caption_template": "🔥 Oferta: {{title}} por {{price}}. Link na bio!",
    "hashtags": ["#promo", "#oferta", "#achadinhos"],
    "pinterest_board": "achados-2025"
  }
}
```

**Callback do n8n → Backend** (`POST /webhooks/n8n/status`)
```json
{
  "postJobId": "uuid",
  "channel": "instagram|pinterest|whatsapp|system",
  "stage": "start|caption_ready|image_ready|posted|error",
  "status": "running|success|error",
  "detail": { "raw": "..." },
  "signature": "HMAC-SHA256(hex)"
}
```

---

## 10) Segurança, Compliance e Legais
- **Respeitar ToS** dos marketplaces. Scraping apenas de páginas públicas; evitar sobrecarga (rate-limit).
- Guardar somente o necessário; **não** armazenar dados sensíveis de contas.
- Assinatura HMAC nos callbacks do n8n; secret rotacionável.
- **Robustez**: circuit breaker por API externa; retries exponenciais com dead-letter queue.

---

## 11) DevOps — `.env` (exemplo)

```
# Backend
PORT=8080
DATABASE_URL=postgresql://user:pass@postgres:5432/affiliates
REDIS_URL=redis://redis:6379/0
JWT_SECRET=supersecret

# n8n
N8N_BASE_URL=https://n8n.seudominio.com
N8N_WEBHOOK_PATH=/webhook/post-produto
N8N_CALLBACK_SECRET=...

# IG / Pinterest / WhatsApp (placeholders)
IG_PAGE_ID=...
IG_ACCESS_TOKEN=...
PINTEREST_TOKEN=...
PINTEREST_BOARD_ID=...
WA_PHONE_ID=...
WA_ACCESS_TOKEN=...
```

---

## 12) Roadmap pós-MVP
- Geração de **imagens compostas** (preço + selo “OFERTA”).
- Scheduler por janela de engajamento.
- Captura regular de variação de preço (alertas).
- UTM/encurtadores por canal para analytics.
- Modelos de legenda por categoria de produto.

---

## 13) Critérios de Aceite (MVP)
- Cadastrar link e ver **produto** no dashboard com dados essenciais.
- Disparar post e receber **status** por canal.
- Ver timeline de eventos e **reexecutar**.
- Testes básicos (unitários para parser; E2E feliz via staging).

---

## 14) Tarefas para iniciar (Backlog Sprint 1)
- [ ] Projeto NestJS + Prisma + entidades.
- [ ] Docker Compose (Postgres, Redis, API, Worker, n8n).
- [ ] Endpoints `/links`, `/posts`, `/webhooks/n8n/status`.
- [ ] Worker Python base (Playwright + estrutura por marketplace).
- [ ] Implementar scraping **Mercado Livre** primeiro.
- [ ] Dashboard `/links` e `/posts` básico.
- [ ] Workflow n8n importável (esqueleto acima).
