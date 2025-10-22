# n8n Workflow

Este diretório contém os workflows do n8n para o sistema de auto-post.

## Importar Workflow

1. Acesse o n8n em `http://localhost:5678`
2. Login: `admin` / `admin123`
3. Clique em "Workflows" > "Add workflow"
4. Clique no menu (⋮) > "Import from file"
5. Selecione o arquivo `workflows/post-produto.json`

## Configurar Credenciais

### Instagram Graph API
1. Vá em "Credentials" > "Add credential"
2. Selecione "Instagram Graph API"
3. Configure:
   - Access Token: seu token do Instagram
   - Page ID: ID da sua página

### Pinterest API
1. Vá em "Credentials" > "Add credential"
2. Selecione "Pinterest API"
3. Configure:
   - Access Token: seu token do Pinterest
   - Board ID: ID do board onde postar

### WhatsApp Cloud API
1. Vá em "Credentials" > "Add credential"
2. Selecione "WhatsApp Cloud API"
3. Configure:
   - Access Token: seu token do WhatsApp
   - Phone Number ID: ID do seu número

## Como Funciona

O workflow recebe um webhook do backend com os dados do produto e:

1. **Recebe dados** via webhook POST
2. **Gera legenda** usando template com dados do produto
3. **Publica nos canais** (Instagram, Pinterest, WhatsApp) conforme configurado
4. **Envia callbacks** ao backend para cada etapa

## Estrutura do Payload

```json
{
  "postJobId": "uuid",
  "backendBaseUrl": "http://backend:8080",
  "channels": {
    "instagram": true,
    "pinterest": true,
    "whatsapp": true
  },
  "product": {
    "id": "uuid",
    "marketplace": "mercado_livre",
    "title": "Produto Exemplo",
    "priceCents": 9990,
    "currency": "BRL",
    "rating": "4.5",
    "images": ["https://..."],
    "urlAffiliate": "https://..."
  },
  "context": {
    "hashtags": ["#oferta", "#promo"],
    "pinterest_board": "ofertas"
  }
}
```

## Próximos Passos

Para implementar a integração real com as APIs sociais, substitua os nós de callback por:

- **Instagram**: Use o nó "Instagram" com a credencial configurada
- **Pinterest**: Use o nó "Pinterest" com a credencial configurada
- **WhatsApp**: Use o nó "WhatsApp Business" com a credencial configurada

Este workflow atual é um esqueleto que envia callbacks de sucesso para testar a integração.
