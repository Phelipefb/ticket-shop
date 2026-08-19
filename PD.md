# Plano de Desenvolvimento — Plataforma de Eventos e Ingressos

Este documento é o nosso roteiro para construir o desafio de forma manual, com entregas pequenas e verificáveis. Não vamos tentar fazer tudo de uma vez: cada etapa terá um objetivo, uma explicação e uma forma de confirmar que funcionou.

## 1. Objetivo do projeto

Construir uma plataforma de sessões de cinema em que:

- Um **organizador** consulta filmes no TMDb e publica sessões.
- Um **cliente** encontra sessões, seleciona um assento, faz um pagamento simulado e recebe um ingresso com QR Code.
- A **portaria** lê o QR Code ou digita o código do ingresso para validá-lo.

O fluxo mais importante é: **criar sessão → escolher assento → reservar → pagar → receber ingresso → validar na entrada**.

## 2. Tecnologias escolhidas

| Camada                | Tecnologia                          | Por quê                                                                  |
| --------------------- | ----------------------------------- | ------------------------------------------------------------------------ |
| Front-end             | Next.js + TypeScript                | React com estrutura pronta para telas, rotas e deploy na Vercel.         |
| Estilos               | Tailwind CSS + componentes próprios | Agilidade sem abrir mão de uma identidade visual autoral.                |
| Back-end              | Node.js + Express + TypeScript      | API REST simples, tipada e adequada ao prazo.                            |
| Banco de dados        | PostgreSQL                          | Banco relacional ideal para reservas e prevenção de assentos duplicados. |
| ORM                   | Prisma                              | Facilita modelagem, migrations, seed e acesso tipado ao banco.           |
| Catálogo externo      | TMDb                                | Fornece filmes, sinopses e imagens para o organizador.                   |
| Autenticação          | JWT + bcrypt                        | Login por e-mail/senha e controle dos papéis exigidos.                   |
| Desenvolvimento local | Docker Compose                      | Sobe o PostgreSQL com configuração reproduzível.                         |
| Deploy                | Vercel + Render + Neon              | Web na Vercel, API no Render e banco hospedado no Neon.                  |
| Testes                | Vitest/Supertest e Playwright       | Testes das regras críticas e de um fluxo completo de compra.             |

## 3. Estrutura do repositório

Usaremos um monorepo com npm workspaces:

```text
ticket-shop/
├── apps/
│   ├── web/                 # Next.js: interface do cliente, organizador e portaria
│   └── api/                 # Express: API, regras de negócio e Prisma
├── packages/
│   └── shared/              # Tipos e constantes compartilhados, se necessário
├── docker-compose.yml       # PostgreSQL local
├── package.json             # Comandos unificados do monorepo
├── README.md                # Como instalar, executar e avaliar o projeto
└── PD.md                    # Este roteiro
```

## 4. Papéis e permissões

| Papel        | Pode fazer                                                        |
| ------------ | ----------------------------------------------------------------- |
| `ORGANIZER`  | Pesquisar filmes no TMDb; criar, editar e consultar suas sessões. |
| `CUSTOMER`   | Buscar sessões; reservar assentos; pagar; acessar seus ingressos. |
| `GATEKEEPER` | Validar ingressos para a entrada de uma sessão.                   |

O front-end pode ocultar ações inadequadas, mas a API será a autoridade: toda rota protegida verificará o JWT e o papel do usuário.

## 5. Modelo de dados inicial

- **User**: nome, e-mail, senha criptografada e papel.
- **Event**: sessão criada pelo organizador; armazena filme TMDb, data/hora, local, preço e capacidade.
- **Seat**: assento de uma sessão, identificado por fila e número.
- **Reservation**: bloqueio temporário de um assento para um cliente, com data de expiração e status.
- **Payment**: resultado simulado do checkout ligado a uma reserva.
- **Ticket**: ingresso emitido após pagamento aprovado; possui código único, token de QR, link de compartilhamento e status de uso.
- **TicketValidation**: registro da validação, com data, portaria e resultado.

### Regra mais importante: não vender o mesmo assento duas vezes

Um assento só poderá ter uma reserva ativa ou um ingresso confirmado. A API criará a reserva dentro de uma transação no PostgreSQL e terá uma restrição única para a combinação sessão + assento. Assim, mesmo que duas pessoas tentem comprar ao mesmo tempo, apenas uma reserva será confirmada.

## 6. Fluxos funcionais

### 6.1 Organizador cria uma sessão

1. O organizador faz login.
2. Pesquisa um filme no TMDb.
3. Seleciona um resultado e informa data, horário, local, preço e capacidade/layout.
4. A API cria a sessão e seus assentos.
5. A sessão passa a aparecer na listagem pública.

### 6.2 Cliente compra um ingresso

1. O cliente acessa a lista e busca uma sessão.
2. Abre os detalhes e vê o mapa de assentos.
3. Seleciona um assento livre.
4. A API bloqueia o assento por **10 minutos**.
5. O cliente preenche o checkout simulado.
6. Pagamento aprovado: a API confirma a reserva, gera o ingresso e libera o QR Code.
7. Pagamento recusado ou prazo expirado: a reserva é cancelada e o assento volta a ficar disponível.

Para tornar a demonstração previsível, o README documentará dois cartões de teste: um sempre aprovado e outro sempre recusado. Não haverá transação financeira real.

### 6.3 Ingresso e compartilhamento

- A área **Meus ingressos** mostra o filme, sessão, assento, QR Code e código manual.
- O QR Code conterá um token aleatório opaco; dados pessoais não serão colocados no código.
- A API valida o token e sua assinatura no servidor, impedindo a criação de códigos falsos.
- O usuário poderá gerar um link público somente para visualização. O link não transfere a titularidade do ingresso nem valida a entrada.

### 6.4 Validação pela portaria

1. A portaria faz login e escolhe a sessão que está atendendo.
2. Lê o QR Code pela câmera ou digita o código manualmente.
3. A API responde com uma das situações: **válido**, **inválido**, **já utilizado** ou **evento errado**.
4. Quando válido, a API marca o ingresso como usado em uma operação atômica e registra a validação.

## 7. Endpoints REST previstos

Os detalhes finais serão definidos ao implementarmos cada parte, mas esta é a divisão inicial:

- `POST /auth/register` e `POST /auth/login`
- `GET /movies/search` para busca no TMDb
- `GET /events`, `GET /events/:id`
- `POST /events`, `PATCH /events/:id` para organizadores
- `POST /events/:id/reservations` e `DELETE /reservations/:id`
- `POST /payments` para o pagamento simulado
- `GET /tickets/me`, `GET /tickets/share/:token`
- `POST /gate/tickets/validate`

## 8. Plano de implementação guiado

Cada etapa só começa depois que a anterior estiver funcionando. Ao terminar uma etapa, faremos uma pequena verificação e um commit com mensagem descritiva.

1. **Preparação:** iniciar Git, configurar o monorepo, Next.js, Express, TypeScript e Docker/PostgreSQL.
2. **Banco e autenticação:** criar Prisma, schema inicial, migration, seed e login com os três papéis.
3. **Catálogo e eventos:** integrar TMDb; permitir criação e listagem de sessões.
4. **Mapa e reserva:** criar o mapa de assentos; implementar bloqueio de 10 minutos e impedir duplicidade.
5. **Checkout e ingressos:** simular pagamento, emitir ingresso e gerar QR Code.
6. **Portaria:** implementar leitor de QR pela câmera, campo manual e validação atômica.
7. **Qualidade e entrega:** testes críticos, README, dados de demonstração, deploy e registro do uso de IA.

## 9. Testes essenciais

- Um cliente não acessa rotas de organizador ou portaria.
- Duas tentativas simultâneas não confirmam o mesmo assento.
- Reserva expirada ou pagamento recusado libera o assento.
- Pagamento aprovado gera exatamente um ingresso.
- Um ingresso válido é aceito uma única vez.
- Um ingresso de outra sessão retorna “evento errado”.
- Teste E2E: login do cliente → escolha de assento → pagamento aprovado → ingresso exibido.

## 10. Dados para avaliação

O seed criará pelo menos:

- 1 organizador;
- 2 clientes;
- 1 usuário de portaria;
- 1 sessão publicada com assentos disponíveis.

As credenciais serão simples, apenas para demonstração, e ficarão no README. Nunca usaremos essas senhas em um sistema real.

## 11. Limites do MVP

Não fazem parte da primeira versão: nota fiscal, revenda de ingressos, aplicativo nativo, recuperação de senha, envio por e-mail, pagamento real ou transferência de titularidade.

Depois do fluxo completo, poderemos adicionar filtros, painel do organizador, cancelamento com devolução ao estoque e atualização em tempo real do mapa de assentos.

## 12. Como vamos trabalhar

Você fará as criações e alterações manualmente. Antes de cada etapa, qualquer duvida eu explicarei:

1. o que vamos construir e por quê;
2. quais comandos executar;
3. quais arquivos criar ou alterar;
4. como conferir se deu certo;
5. o que fazer se ocorrer um erro comum.

Quando uma etapa estiver concluída, você me envia o resultado ou qualquer erro exibido. Eu reviso com você e só então seguimos para a próxima.
