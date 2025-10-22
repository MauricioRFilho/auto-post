# Guia de Início Rápido - Auto-Post

Este guia ajudará você a ter o sistema funcionando em **15 minutos**.

## Passo 1: Pré-requisitos (5 min)

Certifique-se de ter instalado:

- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [Node.js 20+](https://nodejs.org/)

Verifique as instalações:

```bash
docker --version
node --version
npm --version
```

## Passo 2: Configuração Inicial (3 min)

Clone o repositório e configure:

```bash
# Clone
git clone <repo-url>
cd auto-post

# Copie as variáveis de ambiente
cp .env.example .env

# Inicie os serviços com Docker
docker-compose up -d
```

Aguarde os containers iniciarem. Verifique com:

```bash
docker-compose ps
```

Todos os serviços devem estar "Up".

## Passo 3: Backend Setup (3 min)

```bash
# Entre na pasta do backend
cd backend

# Instale dependências
npm install

# Execute migrations
npx prisma migrate dev --name init

# Volte para raiz
cd ..
```

## Passo 4: Dashboard Setup (2 min)

```bash
# Entre na pasta do dashboard
cd dashboard

# Instale dependências
npm install

# Inicie o dashboard
npm run dev
```

## Passo 5: Teste o Sistema (2 min)

### 5.1 Acesse o Dashboard

Abra seu navegador em: http://localhost:3000

Você deve ver a interface do Auto-Post.

### 5.2 Adicione um Link de Teste

1. Clique em "Links" no menu lateral
2. Cole um link de produto do Mercado Livre (exemplo):
   ```
   https://www.mercadolivre.com.br/relogio-smartwatch-inteligente-cor-preto/p/MLB15898803
   ```
3. Clique em "Adicionar Link"

### 5.3 Acompanhe o Scraping

1. O sistema detectará automaticamente que é Mercado Livre
2. Em alguns segundos, você verá o status mudar para "success"
3. Clique em "Produtos" para ver o produto coletado

### 5.4 Verifique o n8n (Opcional)

1. Acesse http://localhost:5678
2. Login: `admin` / `admin123`
3. Importe o workflow de `n8n/workflows/post-produto.json`

## Verificação Rápida

Execute este checklist para garantir que tudo está funcionando:

- [ ] Dashboard carregando em http://localhost:3000
- [ ] Backend respondendo em http://localhost:8080
- [ ] n8n acessível em http://localhost:5678
- [ ] Conseguiu adicionar um link
- [ ] Link foi processado com sucesso
- [ ] Produto apareceu na listagem

## Próximos Passos

Agora que o sistema está funcionando:

1. **Configure APIs Sociais**: Veja [n8n/README.md](n8n/README.md) para configurar Instagram, Pinterest e WhatsApp
2. **Teste um Post**: Crie um post de teste em "Posts" > "Criar Post"
3. **Personalize**: Edite templates de legenda no workflow do n8n

## Problemas Comuns

### "Cannot connect to Docker daemon"

**Solução**: Inicie o Docker Desktop

### "Port already in use"

**Solução**: Algum serviço já está usando as portas. Pare-os ou mude as portas no `docker-compose.yml`:

```yaml
services:
  backend:
    ports:
      - "8081:8080"  # Mudou de 8080 para 8081
```

### Dashboard mostra "API error"

**Solução**: Verifique se o backend está rodando:

```bash
curl http://localhost:8080
```

Se não responder, reinicie:

```bash
docker-compose restart backend
```

### Scraper não processa links

**Solução**: Verifique logs do scraper:

```bash
docker-compose logs -f scraper
```

Se houver erros com Playwright, reconstrua a imagem:

```bash
docker-compose build --no-cache scraper
docker-compose up -d scraper
```

## Comandos Úteis

```bash
# Ver logs de todos os serviços
docker-compose logs -f

# Ver logs de um serviço específico
docker-compose logs -f backend

# Reiniciar um serviço
docker-compose restart backend

# Parar tudo
docker-compose down

# Parar e remover volumes (limpa banco de dados)
docker-compose down -v

# Reconstruir imagens
docker-compose build --no-cache

# Ver status dos containers
docker-compose ps
```

## Desenvolvimento

Se você quer desenvolver localmente sem Docker:

### Terminal 1 - PostgreSQL e Redis

```bash
docker-compose up -d postgres redis
```

### Terminal 2 - Backend

```bash
cd backend
npm run start:dev
```

### Terminal 3 - Scraper

```bash
cd scraper
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
playwright install chromium
python src/worker.py
```

### Terminal 4 - Dashboard

```bash
cd dashboard
npm run dev
```

### Terminal 5 - n8n (Opcional)

```bash
docker-compose up -d n8n
```

## Suporte

Problemas? Consulte:

- [README.md](README.md) - Documentação completa
- [SETUP.md](SETUP.md) - Setup detalhado
- [n8n/README.md](n8n/README.md) - Configuração do n8n
- Issues do GitHub

Boa sorte! 🚀
