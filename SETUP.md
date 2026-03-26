# ⚙️ Detailed Setup Guide | Guia de Setup Detalhado

[**English**](#🇺🇸-english-setup) | [**Português**](#🇧🇷-setup-em-português)

---

## 🇺🇸 English Setup

This guide explains step-by-step how to configure the Cadence Auto-Post system from scratch.

### 1. Environment Preparation
Install dependencies for your OS:
- **Windows**: `winget install OpenJS.NodeJS.LTS Python.Python.3.11 Docker.DockerDesktop`
- **Linux/Mac**: Use `nvm`, `brew` or `apt-get` for Node.js 20, Python 3.11, and Docker.

### 2. Services Installation (Docker)
```bash
git clone https://github.com/MauricioRFilho/auto-post.git
cd auto-post
cp .env.example .env
docker-compose up -d
```

### 3. Backend Configuration
1. **Install Dependencies**: `cd backend && npm install`
2. **Database Migration**: `npx prisma generate && npx prisma migrate dev`
3. **Start**: `npm run start:dev` (Verify at http://localhost:8080)

### 4. Scraper Configuration
1. **Virtual Env**: `cd scraper && python -m venv venv && source venv/bin/activate`
2. **Dependencies**: `pip install -r requirements.txt && playwright install chromium`
3. **Start**: `python src/worker.py`

### 5. n8n Configuration
1. **Access**: http://localhost:5678 (admin/admin123)
2. **Import Workflow**: Import `n8n/workflows/post-produto.json`.
3. **Activate**: Toggle the workflow to "Active".

### 6. Dashboard Configuration
1. **Install**: `cd dashboard && npm install`
2. **Start**: `npm run dev` (Access at http://localhost:3000)

---

## 🇧🇷 Setup em Português

Este guia explica passo a passo como configurar o sistema Cadence Auto-Post do zero.

### 1. Preparação do Ambiente
- **Node.js 20+**
- **Python 3.11+**
- **Docker e Docker Compose**

### 2. Instalação dos Serviços (Docker)
```bash
git clone https://github.com/MauricioRFilho/auto-post.git
cd auto-post
cp .env.example .env
docker-compose up -d
```

### 3. Configuração do Backend
1. **Dependências**: `cd backend && npm install`
2. **Migrations**: `npx prisma generate && npx prisma migrate dev`
3. **Iniciar**: `npm run start:dev`

### 4. Configuração do Scraper (Local)
1. **Venv**: `cd scraper && python -m venv venv && source venv/bin/activate`
2. **Dep**: `pip install -r requirements.txt && playwright install chromium`
3. **Iniciar**: `python src/worker.py`

### 5. Configuração do n8n
Acesse http://localhost:5678 e importe o workflow da pasta `n8n/workflows`.

### 6. Configuração do Dashboard
`cd dashboard && npm install && npm run dev`

---
*© 2026 Cadence Code | Built with rhythmic excellence.*
