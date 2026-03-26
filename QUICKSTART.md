# 🏁 Quick Start Guide | Guia de Início Rápido

[**English**](#🇺🇸-english-guide) | [**Português**](#🇧🇷-guia-em-português)

---

## 🇺🇸 English Guide

This guide will help you get the system up and running in **15 minutes**.

### Step 1: Prerequisites
Ensure you have the following installed:
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [Node.js 20+](https://nodejs.org/)

Verify installations:
```bash
docker --version
node --version
```

### Step 2: Initial Setup
Clone the repository and configure:
```bash
git clone https://github.com/MauricioRFilho/auto-post.git
cd auto-post
cp .env.example .env
docker-compose up -d
```
Verify services are "Up" with `docker-compose ps`.

### Step 3: Backend Setup
```bash
cd backend
npm install
npx prisma migrate dev --name init
cd ..
```

### Step 4: Dashboard Setup
```bash
cd dashboard
npm install
npm run dev
```

### Step 5: Test the System
1. **Access Dashboard**: Open http://localhost:3000
2. **Add a Test Link**: Go to "Links" and paste a Mercado Livre product URL.
3. **Check Scraping**: In a few seconds, the status should change to "success".
4. **View Product**: Click "Products" to see the extracted data.

---

## 🇧🇷 Guia em Português

Este guia ajudará você a ter o sistema funcionando em **15 minutos**.

### Passo 1: Pré-requisitos
Certifique-se de ter instalado:
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [Node.js 20+](https://nodejs.org/)

### Passo 2: Configuração Inicial
```bash
git clone https://github.com/MauricioRFilho/auto-post.git
cd auto-post
cp .env.example .env
docker-compose up -d
```

### Passo 3: Setup do Backend
```bash
cd backend
npm install
npx prisma migrate dev --name init
cd ..
```

### Passo 4: Setup do Dashboard
```bash
cd dashboard
npm install
npm run dev
```

### Passo 5: Teste o Sistema
1. **Acesse o Dashboard**: http://localhost:3000
2. **Adicione um Link**: Vá em "Links" e cole um link de produto do Mercado Livre.
3. **Acompanhe**: O status mudará para "success" em alguns segundos.
4. **Veja o Produto**: Verifique os dados em "Produtos".

---
Explore [**SETUP.md**](SETUP.md) for a detailed step-by-step setup guide.
Veja o [**SETUP.md**](SETUP.md) para um guia de configuração detalhado.
