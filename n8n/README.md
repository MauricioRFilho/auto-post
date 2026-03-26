# 🔀 n8n Automation Guide | Guia de Automação n8n

[**English**](#🇺🇸-english-guide) | [**Português**](#🇧🇷-guia-em-português)

---

## 🇺🇸 English Guide

This directory contains n8n workflows for the Cadence Auto-Post system.

### 1. Import Workflow
1. Access n8n at `http://localhost:5678` (admin/admin123).
2. "Workflows" > "Add workflow" > (⋮) > "Import from file".
3. Select `workflows/post-produto.json`.

### 2. Configure Credentials
- **Instagram Graph API**: Add Page ID and Access Token.
- **Pinterest API**: Add Access Token and Board ID.
- **WhatsApp Cloud API**: Add Phone Number ID and Access Token.

### 3. How it Works
The workflow receives a webhook from the backend with product data and:
1. **Generates Caption** using AI or templates.
2. **Publishes to Channels** (Instagram, Pinterest, WhatsApp).
3. **Sends Callbacks** back to the backend to update status.

---

## 🇧🇷 Guia em Português

Este diretório contém os workflows do n8n para o sistema Cadence Auto-Post.

### 1. Importar Workflow
1. Acesse o n8n em `http://localhost:5678` (admin/admin123).
2. Clique em "Workflows" > "Add workflow" > (⋮) > "Import from file".
3. Selecione o arquivo `workflows/post-produto.json`.

### 2. Configurar Credenciais
Adicione as credenciais para as APIs do Instagram, Pinterest e WhatsApp na seção "Credentials".

### 3. Como Funciona
O workflow recebe um webhook do backend com os dados do produto e:
1. **Gera legenda** usando templates ou IA.
2. **Publica nos canais** configurados.
3. **Envia callbacks** ao backend para cada etapa do processo.

---
*© 2026 Cadence Code | Rhythmic Excellence.*
