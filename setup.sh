#!/bin/bash

# --- Cores e Estilos ---
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BOLD='\033[1m'
NC='\033[0m' # No Color

clear

echo -e "${BLUE}${BOLD}"
echo "  🤖  CADENCE AUTO-POST  🤖  "
echo "------------------------------"
echo -e "${NC}"

echo -e "${YELLOW}Bem-vindo ao assistente de configuração automática!${NC}"
echo "Este script irá preparar o ambiente para você postar ofertas rapidamente."
echo ""

# --- Verificação de Docker ---
if ! command -v docker &> /dev/null
then
    echo -e "${RED}[ERRO] Docker não encontrado.${NC}"
    echo "Por favor, instale o Docker e o Docker Compose antes de continuar."
    exit 1
fi

# --- Coleta de Dados ---
echo -e "${BOLD}1. Configurações do Telegram${NC}"
echo "Vá ao @BotFather no Telegram para criar seu bot e obter o Token."
read -p ">> Digite o seu Telegram Bot Token: " TELEGRAM_TOKEN

echo ""
echo "Agora, digite o Chat ID do seu canal ou grupo."
echo "Dica: Você pode conseguir isso enviando uma mensagem para o @userinfobot."
read -p ">> Digite o seu Telegram Chat ID: " TELEGRAM_CHAT_ID

echo ""
echo -e "${BOLD}2. Preparando o ambiente...${NC}"

# Criar .env a partir do exemplo se não existir
if [ ! -f .env ]; then
    cp .env.example .env
    echo -e "${GREEN}[OK] Arquivo .env criado.${NC}"
else
    echo -e "${YELLOW}[AVISO] .env já existe. Fazendo backup para .env.bak...${NC}"
    cp .env .env.bak
fi

# Substituir as chaves no .env
# Usando sed para Windows/Linux/Mac (compatibilidade variada resolvida com "" no mac)
if [[ "$OSTYPE" == "darwin"* ]]; then
    sed -i "" "s|TELEGRAM_BOT_TOKEN=.*|TELEGRAM_BOT_TOKEN=$TELEGRAM_TOKEN|g" .env
    sed -i "" "s|TELEGRAM_CHAT_ID=.*|TELEGRAM_CHAT_ID=$TELEGRAM_CHAT_ID|g" .env
else
    sed -i "s|TELEGRAM_BOT_TOKEN=.*|TELEGRAM_BOT_TOKEN=$TELEGRAM_TOKEN|g" .env
    sed -i "s|TELEGRAM_CHAT_ID=.*|TELEGRAM_CHAT_ID=$TELEGRAM_CHAT_ID|g" .env
fi

echo -e "${GREEN}[OK] Chaves do Telegram atualizadas no .env.${NC}"

echo ""
echo -e "${BOLD}3. Tudo pronto!${NC}"
read -p "Deseja ligar os motores (Docker) agora? (y/N): " START_DOCKER

if [[ "$START_DOCKER" =~ ^([yY][eE][sS]|[yY])$ ]]
then
    echo -e "${BLUE}Iniciando containers... Aguarde uns instantes.${NC}"
    docker compose up -d --build
    
    echo ""
    echo -e "${GREEN}${BOLD}🚀 SUCESSO! O SISTEMA ESTÁ RODANDO.${NC}"
    echo "------------------------------------------------"
    echo -e "${BOLD}Dashboard:${NC} http://localhost:3000"
    echo -e "${BOLD}Configurações:${NC} http://localhost:3000/settings"
    echo "------------------------------------------------"
    echo "Acesse o Dashboard para começar a cadastrar seus links!"
else
    echo -e "${YELLOW}Configuração concluída! Quando quiser rodar, use:${NC}"
    echo "docker compose up -d"
fi

echo ""
echo -e "${BLUE}Obrigado por usar o Cadence Auto-Post!${NC}"
