FROM node:20-alpine

WORKDIR /app

# Install system dependencies for Prisma
RUN apk add --no-cache openssl

# Install dependencies first for better caching
COPY package*.json ./
COPY prisma ./prisma/

RUN npm install --legacy-peer-deps

# Generate Prisma client
RUN npx prisma generate

# Copy source code (use .dockerignore to skip node_modules)
COPY . .

# Expose the API port
EXPOSE 8080

# Start the application
CMD ["npm", "run", "start:dev"]
