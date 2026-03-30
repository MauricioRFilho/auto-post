# ⚙️ Configuration | Configuração | Configuración

This guide details all environment variables and dynamic settings. | Todas as variáveis do sistema.

---

## 🇧🇷 Português (PT-BR)

### 📄 Variáveis de Ambiente (.env)
O arquivo `.env` na raiz do projeto é a base da configuração.

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `PORT` | Porta onde o backend irá rodar | `8080` |
| `DATABASE_URL` | URL de conexão com o Postgres | `postgresql://user:pass@host:5432/db` |
| `REDIS_URL` | URL de conexão com o Redis | `redis://localhost:6379/0` |
| `JWT_SECRET` | Chave para tokens de segurança | `qualquer_texto_secreto` |
| `TELEGRAM_BOT_TOKEN` | Token do bot (Fallback) | `000000:AAAbbb...` |
| `TELEGRAM_CHAT_ID` | ID do Canal (Fallback) | `-100123456789` |

### 🛠️ Configurações Dinâmicas (SystemConfig)
As configurações de Telegram podem ser alteradas em tempo real pelo Dashboard sem reiniciar o sistema.

---

## 🇺🇸 English (EN)

### 📄 Environment Variables (.env)
The `.env` file at the root is the configuration base.

| Variable | Description | Example |
|----------|-----------|---------|
| `PORT` | Port where the backend will run | `8080` |
| `DATABASE_URL` | Postgres connection URL | `...` |
| `TELEGRAM_BOT_TOKEN` | Bot token (Fallback) | `000000:AAAbbb...` |

---

## 🇪🇸 Español (ES)

### 📄 Variables de Entorno (.env)
El archivo `.env` en la raíz es la base de la configuración.

| Variable | Descripción | Ejemplo |
|----------|-----------|---------|
| `PORT` | Puerto donde correrá el backend | `8080` |
| `TELEGRAM_BOT_TOKEN` | Token del bot (Respaldo) | `000000:AAAbbb...` |

---
[**← Voltar ao README**](../README.md)
