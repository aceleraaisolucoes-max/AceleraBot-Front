# AceleraBot Dashboard

Painel administrativo do ecossistema AceleraBot — construído com Next.js 15. Permite aos donos de negócios gerenciarem o bot de IA do WhatsApp e visualizarem leads gerados.

## Stack

- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Autenticação e Banco**: Supabase

## Setup Local

```bash
# 1. Instalar dependências
npm install

# 2. Configurar variáveis de ambiente
cp .env.example .env
# Edite o arquivo .env definindo a URL do backend (NEXT_PUBLIC_BACKEND_URL)

# 3. Rodar em desenvolvimento
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) no seu navegador para ver o painel rodando.

## Integração com o Backend

O painel consome as APIs do backend do AceleraBot. Certifique-se de que o backend (`acelera-bot-api` / `AceleraBot Back`) está rodando e a variável `NEXT_PUBLIC_BACKEND_URL` está apontando para o endereço correto dele (geralmente `http://localhost:3000` em desenvolvimento local).
