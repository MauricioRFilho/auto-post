# 🏛️ Architecture | Arquitetura

[**English**](#🇺🇸-system-architecture) | [**Português**](#🇧🇷-arquitetura-do-sistema)

---

## 🇺🇸 System Architecture

Cadence Auto-Post is a monorepo multi-service system designed for high scalability and modularity. It separates the heavy scraping tasks from the main API and dashboard to ensure consistent performance.

### Component Overview
1. **Dashboard (Next.js)**: A modern UI built with shadcn/ui and Tailwind CSS for managing links, products, and posts.
2. **Backend API (NestJS)**: The brain of the system, handling database operations, queues, and integration logic via Prisma and BullMQ.
3. **Scraper Worker (Python)**: A dedicated worker using Playwright and Chromium to extract product data from marketplaces without blocking the main event loop.
4. **Automation Engine (n8n)**: A flexible low-code workflow tool that handles the complex social media posting logic and caption generation.

### Data Flow
```mermaid
sequenceDiagram
    participant User as User (Dashboard)
    participant API as Backend (NestJS)
    participant DB as Postgres
    participant Redis as Redis (BullMQ)
    participant Worker as Scraper (Python)
    participant n8n as n8n Workflow

    User->>API: Add Affiliate Link
    API->>Redis: Enqueue Scrape Job
    Redis->>Worker: Consume Job
    Worker->>Worker: Scrape Playwright
    Worker->>DB: Save Product Data
    API->>n8n: Trigger Post Webhook
    n8n->>n8n: Generate AI Caption
    n8n->>API: Update Status (Callback)
```

---

## 🇧🇷 Arquitetura do Sistema

O Cadence Auto-Post é um sistema monorepo multi-serviço projetado para alta escalabilidade e modularidade. Ele separa as tarefas pesadas de scraping da API principal para garantir uma performance consistente.

### Visão Geral dos Componentes
1. **Dashboard (Next.js)**: Interface moderna para gerir links, produtos e posts.
2. **Backend API (NestJS)**: O cérebro do sistema, lidando com banco de dados, filas e lógica de integração.
3. **Scraper Worker (Python)**: Worker dedicado usando Playwright para extrair dados sem bloquear o fluxo principal.
4. **Motor de Automação (n8n)**: Ferramenta low-code para lidar com a lógica de postagem e geração de legendas.

### Modelo de Dados (Resumo)
- **Product**: Armazena dados canônicos do produto (título, preço, imagens).
- **AffiliateLink**: Vincula a URL original do afiliado ao produto coletado.
- **ScrapeRun**: Histórico de execuções de coleta.
- **PostJob**: Estado e logs da postagem multi-canal.

---
*© 2026 Cadence Code | Built with rhythmic excellence.*
