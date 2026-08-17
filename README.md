<div align="center">

# CinePass

**Plataforma de venda, gestão e validação de ingressos para sessões de cinema.**

[Funcionalidades](#funcionalidades) · [Configuração](#configuração) · [Execução](#executar-o-projeto) · [Fluxos](#fluxos-principais)

</div>

<br />

<div align="center">
  <img src="https://img.shields.io/badge/Status-Em%20desenvolvimento-1f2937?style=for-the-badge" alt="Status do projeto" />
  <img src="https://img.shields.io/badge/Node.js-20%2B-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js 20 ou superior" />
  <img src="https://img.shields.io/badge/License-ISC-334155?style=for-the-badge" alt="Licença ISC" />
</div>

<br />

O CinePass possui três perfis de acesso:

| Perfil      | Responsabilidades                                                                         |
| ----------- | ----------------------------------------------------------------------------------------- |
| Cliente     | Cria conta, reserva assentos, realiza pagamento simulado, acessa e compartilha ingressos. |
| Organizador | Busca filmes no TMDb e publica sessões com mapa de assentos.                              |
| Portaria    | Valida ingressos por código manual ou leitura de QR Code.                                 |

---

## Tecnologias

<p>
  <img src="https://img.shields.io/badge/Next.js-16.3.1-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-19-149eca?style=for-the-badge&logo=react&logoColor=white" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5.9-3178c6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-4-06b6d4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Node.js-20%2B-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Express-5-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express" />
  <img src="https://img.shields.io/badge/PostgreSQL-16-4169e1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Prisma-7-2d3748?style=for-the-badge&logo=prisma&logoColor=white" alt="Prisma" />
  <img src="https://img.shields.io/badge/Docker-Compose-2496ed?style=for-the-badge&logo=docker&logoColor=white" alt="Docker Compose" />
</p>

| Camada         | Tecnologias                               |
| -------------- | ----------------------------------------- |
| Frontend       | Next.js, React, TypeScript e Tailwind CSS |
| Backend        | Node.js, Express e TypeScript             |
| Persistência   | PostgreSQL e Prisma                       |
| Segurança      | JWT e bcrypt                              |
| Integrações    | TMDb, QR Code e leitura por câmera        |
| Ambiente local | Docker Compose                            |

---

## Estrutura do projeto

```text
apps/
  api/       # API Express, Prisma e regras de negócio
  web/       # Aplicação Next.js
docker-compose.yml
PD.md        # Plano de desenvolvimento
docs/        # Documentação complementar
```

---

## Funcionalidades

| Área         | Entregas                                                                              |
| ------------ | ------------------------------------------------------------------------------------- |
| Autenticação | Cadastro, login, JWT e controle de perfis.                                            |
| Eventos      | Busca no TMDb, criação de sessões e mapa de assentos.                                 |
| Compra       | Reserva temporária, pagamento aprovado ou recusado e proteção contra venda duplicada. |
| Ingressos    | QR Code, código manual e link público somente leitura.                                |
| Portaria     | Validação por câmera ou código, incluindo bloqueio de reutilização.                   |

---

## Pré-requisitos

- Node.js 20 ou superior
- npm
- Docker Desktop
- Conta no TMDb para obter o token de leitura da API

## Configuração

### 1. Instalar dependências

Na raiz do projeto:

```bash
npm install
```

### 2. Iniciar o PostgreSQL

```bash
docker compose up -d
```

### 3. Configurar a API

Crie `apps/api/.env` baseado em `apps/api/.env.example`:

```env
DATABASE_URL="postgresql://ticket_shop:ticket_shop_dev@localhost:5432/ticket_shop?schema=public"
PORT=3333
WEB_URL="http://localhost:3000"
JWT_SECRET="gere_uma_chave_aleatoria_com_64_caracteres_hexadecimais"
TMDB_ACCESS_TOKEN="seu_token_de_leitura_do_tmdb"
```

### 4. Configurar o frontend

Crie `apps/web/.env.local`:

```env
NEXT_PUBLIC_API_URL="http://localhost:3333"
```

### 5. Preparar o banco

```bash
cd apps/api
npx prisma generate
npx prisma migrate deploy
npx prisma db seed
cd ../..
```

## Executar o projeto

Em um terminal:

```bash
npm run dev -w api
```

Em outro terminal:

```bash
npm run dev -w web
```

A API roda em `http://localhost:3333` e o frontend em `http://localhost:3000`.

## Contas de demonstração

| Perfil      | E-mail                   | Senha         |
| ----------- | ------------------------ | ------------- |
| Organizador | organizer@ticketshop.dev | Organizer123! |
| Cliente     | cliente1@ticketshop.dev  | Cliente123!   |
| Cliente     | cliente2@ticketshop.dev  | Cliente456!   |
| Portaria    | portaria@ticketshop.dev  | Portaria123!  |

## Fluxos principais

### Cliente

1. Criar conta ou entrar.
2. Escolher uma sessão e um assento disponível.
3. Criar uma reserva válida por 10 minutos.
4. Efetuar o pagamento simulado.
5. Acessar e compartilhar os ingressos.
6. Apresentar QR Code ou código na portaria.

Cartões de teste:

| Número                | Resultado          |
| --------------------- | ------------------ |
| `4242 4242 4242 4242` | Pagamento aprovado |
| `4000 0000 0000 0002` | Pagamento recusado |

### Organizador

1. Entrar como organizador.
2. Buscar filme no TMDb.
3. Preencher sessão, local, preço e mapa de assentos.
4. Publicar o evento.

### Portaria

1. Entrar como portaria.
2. Selecionar o evento.
3. Ler QR Code pela câmera ou informar o código manualmente.
4. Validar a entrada.

Resultados possíveis:

- `VALID`
- `INVALID`
- `EVENT_WRONG`
- `ALREADY_USED`

## Regras de negócio

- Apenas organizadores criam eventos.
- Apenas clientes reservam assentos e efetuam pagamentos.
- Reservas pendentes expiram após 10 minutos.
- Um assento não pode ser reservado ou vendido duas vezes.
- Pagamento recusado libera o assento.
- Pagamento aprovado gera ingresso com código e QR Code.
- Links compartilhados são públicos e somente leitura.
- Um ingresso só pode ser validado uma vez.
- Apenas portaria valida ingressos.

## Testes automatizados

Os testes da API usam um banco separado chamado `ticket_shop_test`; eles não devem usar o banco de desenvolvimento.

Após criar e migrar esse banco, conforme a configuração local de testes, execute:

```bash
npm run test -w api
```

Os testes cobrem a rota de saúde, a prevenção de reserva duplicada, os dois resultados de pagamento e a validação única de ingresso na portaria.

## Build de produção

```bash
npm run build -w api
npm run build -w web
```

## Segurança

- Senhas são armazenadas com hash bcrypt.
- Rotas protegidas usam JWT.
- Variáveis `.env` e `.env.local` não são versionadas.
- Em produção, cookies `httpOnly` são mais seguros que `localStorage`.

## TMDb

Esta aplicação usa a API do TMDb para pesquisa de filmes.

> This product uses the TMDB API but is not endorsed or certified by TMDB.

https://www.themoviedb.org/
