# Auto-Post - Sistema de Scraping + n8n para Posts Automáticos

Sistema completo para coletar dados de produtos de links de afiliados (Mercado Livre, Magalu, Shopee) e publicar automaticamente no Instagram, Pinterest e WhatsApp via n8n.

## Arquitetura

```
┌─────────────────┐      ┌──────────────────┐
│  Dashboard      │ ───> │  Backend API     │
│  (Next.js)      │      │  (NestJS)        │
└─────────────────┘      └──────────────────┘
                                  │
                    ┌─────────────┼─────────────┐
                    │             │             │
                    v             v             v
              ┌──────────┐  ┌──────────┐  ┌──────────┐
              │PostgreSQL│  │  Redis   │  │   n8n    │
              └──────────┘  └──────────┘  └──────────┘
                                  │
                                  v
                         ┌─────────────────┐
                         │  Scraper Worker │
                         │  (Python)       │
                         └─────────────────┘
```

## Stack Tecnológica

- **Backend**: NestJS + Prisma + PostgreSQL
- **Filas**: BullMQ + Redis
- **Scraper**: Python + Playwright
- **Automação**: n8n
- **Dashboard**: Next.js 14 + Tailwind CSS + shadcn/ui
- **Infraestrutura**: Docker + Docker Compose

## Pré-requisitos

- Node.js 20+
- Python 3.11+
- Docker e Docker Compose
- Git

## Instalação Rápida

### 1. Clone o repositório

```bash
git clone <repo-url>
cd auto-post
```

### 2. Configure as variáveis de ambiente

```bash
cp .env.example .env
```

Edite o arquivo `.env` conforme necessário.

### 3. Inicie os serviços com Docker Compose

```bash
docker-compose up -d
```

Isso iniciará:
- PostgreSQL (porta 5432)
- Redis (porta 6379)
- n8n (porta 5678)
- Backend API (porta 8080)
- Scraper Worker
- Dashboard (porta 3000)

### 4. Execute as migrations do banco de dados

```bash
cd backend
npm install
npx prisma migrate dev
```

### 5. Acesse as aplicações

- **Dashboard**: http://localhost:3000
- **Backend API**: http://localhost:8080
- **n8n**: http://localhost:5678 (admin/admin123)

## Desenvolvimento Local (sem Docker)

### Backend

```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev
npm run start:dev
```

### Scraper

```bash
cd scraper
pip install -r requirements.txt
playwright install chromium
python src/worker.py
```

### Dashboard

```bash
cd dashboard
npm install
npm run dev
```

### Serviços necessários

Certifique-se de ter PostgreSQL e Redis rodando localmente:

```bash
# PostgreSQL
docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=autopost_dev_pass -e POSTGRES_USER=autopost -e POSTGRES_DB=affiliates postgres:16-alpine

# Redis
docker run -d -p 6379:6379 redis:7-alpine

# n8n
docker run -d -p 5678:5678 -e N8N_BASIC_AUTH_ACTIVE=true -e N8N_BASIC_AUTH_USER=admin -e N8N_BASIC_AUTH_PASSWORD=admin123 n8nio/n8n
```

## Configuração do n8n

### 1. Importe o workflow

1. Acesse http://localhost:5678
2. Login: `admin` / `admin123`
3. Vá em "Workflows" > "Add workflow"
4. Clique no menu (⋮) > "Import from file"
5. Selecione `n8n/workflows/post-produto.json`

### 2. Configure as credenciais das APIs sociais

Veja instruções detalhadas em [n8n/README.md](n8n/README.md)

## Como Usar

### 1. Adicionar Link de Afiliado

1. Acesse o dashboard em http://localhost:3000
2. Vá para "Links"
3. Cole o link de afiliado (Mercado Livre, Magalu ou Shopee)
4. Clique em "Adicionar Link"
5. O sistema automaticamente:
   - Detecta o marketplace
   - Enfileira job de scraping
   - Coleta dados do produto
   - Salva no banco de dados

### 2. Visualizar Produtos

1. Vá para "Produtos"
2. Veja todos os produtos coletados
3. Use a busca para filtrar
4. Clique em um produto para ver detalhes e histórico

### 3. Criar Post

1. Selecione um produto
2. Configure os canais (Instagram, Pinterest, WhatsApp)
3. Clique em "Criar Post"
4. O sistema:
   - Dispara workflow no n8n
   - Gera legenda automaticamente
   - Publica nos canais selecionados
   - Retorna status via webhook

### 4. Acompanhar Posts

1. Vá para "Posts"
2. Veja status de todos os posts
3. Filtre por status
4. Clique em um post para ver timeline de eventos

## API Endpoints

### Links

- `POST /links` - Criar link de afiliado
- `GET /links` - Listar links
- `GET /links/:id` - Ver detalhes
- `POST /links/:id/scrape` - Forçar scraping

### Produtos

- `GET /products` - Listar produtos
- `GET /products/:id` - Ver detalhes

### Posts

- `POST /posts` - Criar job de postagem
- `GET /posts` - Listar posts
- `GET /posts/:id` - Ver detalhes
- `GET /posts/:id/events` - Ver timeline

### Webhooks

- `POST /webhooks/n8n/status` - Callback do n8n

## Estrutura do Projeto

```
auto-post/
├── backend/          # API NestJS
│   ├── src/
│   │   ├── links/    # Módulo de links
│   │   ├── products/ # Módulo de produtos
│   │   ├── posts/    # Módulo de posts
│   │   ├── webhooks/ # Webhooks do n8n
│   │   └── queues/   # BullMQ
│   └── prisma/       # Schema e migrations
├── scraper/          # Worker Python
│   └── src/
│       ├── scrapers/ # Scrapers por marketplace
│       └── worker.py # Worker principal
├── dashboard/        # Frontend Next.js
│   └── src/
│       ├── app/      # Páginas (App Router)
│       └── components/
├── n8n/              # Workflows n8n
└── docker/           # Dockerfiles
```

## Troubleshooting

### Scraper não funciona

1. Verifique se o Playwright está instalado:
   ```bash
   cd scraper
   playwright install chromium
   ```

2. Veja logs do scraper:
   ```bash
   docker-compose logs -f scraper
   ```

### n8n não recebe webhook

1. Verifique se o workflow está ativo
2. Confira as variáveis de ambiente `N8N_BASE_URL` e `N8N_WEBHOOK_PATH`
3. Teste manualmente:
   ```bash
   curl -X POST http://localhost:5678/webhook/post-produto \
     -H "Content-Type: application/json" \
     -d '{"test": true}'
   ```

### Banco de dados com erro

1. Recrie as migrations:
   ```bash
   cd backend
   npx prisma migrate reset
   ```

## Roadmap

- [ ] Implementar scrapers para Magalu e Shopee
- [ ] Adicionar geração de imagens com preço/selo
- [ ] Scheduler automático por horário
- [ ] Analytics e relatórios
- [ ] Templates de legenda customizáveis
- [ ] Encurtador de URLs integrado

## Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Adiciona MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

## Licença

MIT

## Suporte

Para questões e suporte, abra uma issue no GitHub.
