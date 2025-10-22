# Guia de Setup Detalhado

Este guia explica passo a passo como configurar o sistema Auto-Post do zero.

## Índice

1. [Preparação do Ambiente](#preparação-do-ambiente)
2. [Instalação dos Serviços](#instalação-dos-serviços)
3. [Configuração do Backend](#configuração-do-backend)
4. [Configuração do Scraper](#configuração-do-scraper)
5. [Configuração do n8n](#configuração-do-n8n)
6. [Configuração do Dashboard](#configuração-do-dashboard)
7. [Testes](#testes)

## Preparação do Ambiente

### 1. Instalar dependências

**Windows:**
```powershell
# Node.js
winget install OpenJS.NodeJS.LTS

# Python
winget install Python.Python.3.11

# Docker Desktop
winget install Docker.DockerDesktop
```

**Linux/Mac:**
```bash
# Node.js (via nvm)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 20

# Python
# Linux: apt-get install python3.11
# Mac: brew install python@3.11

# Docker
# Seguir instruções em https://docs.docker.com/engine/install/
```

### 2. Verificar instalações

```bash
node --version  # v20.x.x
python --version  # 3.11.x
docker --version  # 24.x.x
```

## Instalação dos Serviços

### Opção 1: Docker Compose (Recomendado)

```bash
# Clonar repositório
git clone <repo-url>
cd auto-post

# Copiar .env
cp .env.example .env

# Iniciar todos os serviços
docker-compose up -d

# Ver logs
docker-compose logs -f
```

### Opção 2: Manual (Desenvolvimento)

#### PostgreSQL

```bash
docker run -d \
  --name auto-post-postgres \
  -e POSTGRES_USER=autopost \
  -e POSTGRES_PASSWORD=autopost_dev_pass \
  -e POSTGRES_DB=affiliates \
  -p 5432:5432 \
  postgres:16-alpine
```

#### Redis

```bash
docker run -d \
  --name auto-post-redis \
  -p 6379:6379 \
  redis:7-alpine
```

#### n8n

```bash
docker run -d \
  --name auto-post-n8n \
  -p 5678:5678 \
  -e N8N_BASIC_AUTH_ACTIVE=true \
  -e N8N_BASIC_AUTH_USER=admin \
  -e N8N_BASIC_AUTH_PASSWORD=admin123 \
  -v ~/.n8n:/home/node/.n8n \
  n8nio/n8n
```

## Configuração do Backend

### 1. Instalar dependências

```bash
cd backend
npm install
```

### 2. Configurar .env

Crie `backend/.env`:

```env
DATABASE_URL=postgresql://autopost:autopost_dev_pass@localhost:5432/affiliates
REDIS_URL=redis://localhost:6379/0
JWT_SECRET=dev_jwt_secret_change_in_production
NODE_ENV=development
PORT=8080

N8N_BASE_URL=http://localhost:5678
N8N_WEBHOOK_PATH=/webhook/post-produto
N8N_CALLBACK_SECRET=dev_callback_secret

BACKEND_BASE_URL=http://localhost:8080
```

### 3. Executar migrations

```bash
npx prisma generate
npx prisma migrate dev --name init
```

### 4. Iniciar servidor

```bash
npm run start:dev
```

Verifique em http://localhost:8080

## Configuração do Scraper

### 1. Criar ambiente virtual

```bash
cd scraper
python -m venv venv

# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate
```

### 2. Instalar dependências

```bash
pip install -r requirements.txt
playwright install chromium
playwright install-deps chromium  # Linux apenas
```

### 3. Configurar .env

Crie `scraper/.env`:

```env
DATABASE_URL=postgresql://autopost:autopost_dev_pass@localhost:5432/affiliates
REDIS_URL=redis://localhost:6379/0
LOG_LEVEL=INFO
```

### 4. Iniciar worker

```bash
python src/worker.py
```

## Configuração do n8n

### 1. Acessar interface

Abra http://localhost:5678

Login:
- Usuário: `admin`
- Senha: `admin123`

### 2. Importar workflow

1. Clique em "Add workflow"
2. Menu (⋮) > "Import from file"
3. Selecione `n8n/workflows/post-produto.json`
4. Clique em "Save"

### 3. Ativar workflow

1. Clique no toggle no canto superior direito
2. O workflow deve ficar "Active"

### 4. Testar webhook

```bash
curl -X POST http://localhost:5678/webhook/post-produto \
  -H "Content-Type: application/json" \
  -d '{
    "postJobId": "test-123",
    "backendBaseUrl": "http://localhost:8080",
    "channels": {"instagram": true},
    "product": {
      "title": "Teste",
      "priceCents": 9990
    }
  }'
```

### 5. Configurar APIs Sociais (Opcional)

#### Instagram Graph API

1. Criar app no https://developers.facebook.com
2. Configurar Instagram Business Account
3. Obter Page Access Token
4. No n8n: Credentials > Add > Instagram Graph API

#### Pinterest API

1. Criar app em https://developers.pinterest.com
2. Gerar Access Token
3. No n8n: Credentials > Add > Pinterest API

#### WhatsApp Cloud API

1. Configurar em https://developers.facebook.com
2. Obter Phone Number ID e Access Token
3. No n8n: Credentials > Add > WhatsApp Cloud API

## Configuração do Dashboard

### 1. Instalar dependências

```bash
cd dashboard
npm install
```

### 2. Configurar .env

Crie `dashboard/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8080
```

### 3. Iniciar aplicação

```bash
npm run dev
```

Acesse http://localhost:3000

## Testes

### 1. Testar API Backend

```bash
# Health check
curl http://localhost:8080

# Criar link de afiliado
curl -X POST http://localhost:8080/links \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://produto.mercadolivre.com.br/MLB-123456789"
  }'

# Listar links
curl http://localhost:8080/links
```

### 2. Testar Scraper

O scraper deve processar automaticamente os jobs da fila. Veja logs:

```bash
# Docker
docker-compose logs -f scraper

# Local
# (saída do python src/worker.py)
```

### 3. Testar Dashboard

1. Abra http://localhost:3000
2. Adicione um link de afiliado
3. Aguarde o scraping completar
4. Veja o produto em "Produtos"
5. Crie um post
6. Acompanhe em "Posts"

### 4. Fluxo Completo End-to-End

```bash
# 1. Adicionar link via API
LINK_ID=$(curl -X POST http://localhost:8080/links \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.mercadolivre.com.br/..."}' | jq -r '.affiliateLinkId')

# 2. Aguardar scraping (verificar logs)

# 3. Verificar produto criado
curl http://localhost:8080/links/$LINK_ID | jq '.product'

# 4. Criar post
PRODUCT_ID=$(curl http://localhost:8080/links/$LINK_ID | jq -r '.product.id')
curl -X POST http://localhost:8080/posts \
  -H "Content-Type: application/json" \
  -d "{\"productId\": \"$PRODUCT_ID\", \"channels\": {\"instagram\": true}}"

# 5. Verificar callbacks do n8n nos logs do backend
```

## Troubleshooting

### Erro de conexão com banco

```bash
# Verificar se PostgreSQL está rodando
docker ps | grep postgres

# Ver logs
docker logs auto-post-postgres

# Recriar container
docker-compose down
docker-compose up -d postgres
```

### Scraper não processa jobs

```bash
# Verificar Redis
docker ps | grep redis
docker logs auto-post-redis

# Verificar fila
redis-cli
> KEYS bull:*
> LLEN bull:scrape:wait
```

### n8n não responde

```bash
# Verificar container
docker ps | grep n8n
docker logs auto-post-n8n

# Reiniciar
docker-compose restart n8n
```

### Dashboard não carrega dados

1. Abrir DevTools (F12)
2. Ver Console e Network
3. Verificar se API está respondendo:
   ```bash
   curl http://localhost:8080/links
   ```

## Próximos Passos

Após o setup completo:

1. Configure as credenciais das APIs sociais no n8n
2. Teste o fluxo completo com um link real
3. Customize templates de legenda
4. Configure backup do banco de dados
5. Configure monitoramento (logs, métricas)

## Suporte

Para problemas específicos, verifique:

- Logs do Docker: `docker-compose logs -f [service]`
- Issues do GitHub
- Documentação técnica em `plano-scraper-afiliados.md`
