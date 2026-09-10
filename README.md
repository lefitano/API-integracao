# Loja API -> TRABALHO INTEGRAÇÃO DE SISTEMAS

API REST para gerenciamento de produtos e pedidos de uma loja, com controle automático de estoque.

## TEC
- Node.js + Express.js
- MySQL (via `mysql2`)

## Estrutura
```
schema.sql                     # script de criação das tabelas + dados iniciais
.env.example                   # modelo de variáveis de ambiente
src/server.js                  # configuração do Express e registro das rotas
src/config/db.js               # pool de conexões MySQL
src/routes/clientes.js         # rotas do recurso clientes (controller pendente)
src/routes/produtos.js         # rotas do recurso produtos
src/routes/pedidos.js          # rotas do recurso pedidos
src/controllers/produtosController.js
src/controllers/pedidosController.js
```

## Como rodar localmente

1. `npm install`

2. Criar o banco de dados no MySQL:
```sql
CREATE DATABASE loja_api;
```

3. Rodar o script de criação das tabelas (`schema.sql`) dentro do banco `loja_api`:
```bash
mysql -u root -p loja_api < schema.sql
```

4. Copiar o arquivo de exemplo de variáveis de ambiente e preencher com suas credenciais:
```bash
cp .env.example .env
```

5. Rodar o servidor
```bash
npm run dev
```

## Recursos e campos

**clientes** (7 campos): `id`, `nome`, `email`, `telefone`, `cpf`, `cidade`, `data_cadastro`

**produtos** (7 campos): `id`, `nome`, `descricao`, `preco`, `categoria`, `estoque`, `marca`

**pedidos** (7 campos): `id`, `cliente_id`, `produto_id`, `quantidade`, `valor_total`, `data_pedido`, `status`

Status válidos de um pedido: `confirmado`, `enviado`, `entregue`, `cancelado`.

## Relacionamentos

O banco é relacional: `pedidos` é a tabela que liga as outras duas.

```
clientes (1) ──< pedidos >── (1) produtos
```

- Um **cliente** tem vários pedidos (`pedidos.cliente_id` → `clientes.id`)
- Um **produto** aparece em vários pedidos (`pedidos.produto_id` → `produtos.id`)
- Ambas as chaves estrangeiras usam `ON DELETE RESTRICT`: não é possível apagar um cliente ou um produto que já tenha pedido registrado

Por causa disso, `POST /pedidos` recebe apenas `cliente_id`, `produto_id`, `quantidade` e opcionalmente `status`. Os dados do cliente e do produto não são copiados no corpo da requisição — vêm do banco pelo relacionamento, e a resposta já devolve os dois lados via `JOIN`:

```json
{
  "id": 4,
  "cliente_id": 1,
  "produto_id": 2,
  "quantidade": 3,
  "valor_total": 449.70,
  "data_pedido": "2026-09-07T14:20:00.000Z",
  "status": "confirmado",
  "cliente_nome": "Maria Souza",
  "cliente_email": "maria.souza@email.com",
  "cliente_cidade": "Fortaleza",
  "produto_nome": "Mouse Gamer M2",
  "produto_preco": 149.90,
  "produto_marca": "Logitech"
}
```

O `valor_total` também é derivado do relacionamento: a API busca o `preco` do produto e multiplica pela quantidade, em vez de confiar em um valor enviado pelo cliente da API.

## Nossa regra de negócio

Ao criar um pedido, o sistema verifica se há estoque suficiente do produto solicitado. Se houver, o pedido é criado e o estoque é decrementado. Caso contrário, o pedido é recusado com `409`.

Tudo isso roda dentro de uma transação com `SELECT ... FOR UPDATE`, então dois pedidos simultâneos não conseguem vender o mesmo item duas vezes.

Complementos da regra:
- `PUT /pedidos/:id` ajusta o estoque pela diferença de quantidade (aumentar a quantidade consome mais estoque; mudar o status para `cancelado` devolve o estoque).
- `DELETE /pedidos/:id` devolve o estoque ao produto (a não ser que o pedido já estivesse cancelado).
- `DELETE /produtos/:id` é bloqueado com `409` se existirem pedidos vinculados ao produto.

## Endpoints

| Método | Rota | Descrição | Status |
|---|---|---|---|
| GET | /health | Checagem de saúde da API e do banco | ✅ |
| GET | /clientes | Lista todos os clientes | ✅ |
| GET | /clientes/:id | Detalha um cliente | ✅ |
| GET | /clientes/:id/pedidos | Lista os pedidos de um cliente | ✅ |
| POST | /clientes | Cria um cliente | ✅ |
| PUT | /clientes/:id | Atualiza um cliente | ✅ |
| DELETE | /clientes/:id | Remove um cliente | ✅ |
| GET | /produtos | Lista todos os produtos | ✅ |
| GET | /produtos/:id | Detalha um produto | ✅ |
| POST | /produtos | Cria um produto | ✅ |
| PUT | /produtos/:id | Atualiza um produto | ✅ |
| DELETE | /produtos/:id | Remove um produto | ✅ |
| GET | /pedidos | Lista todos os pedidos | ✅ |
| GET | /pedidos/:id | Detalha um pedido | ✅ |
| POST | /pedidos | Cria um pedido (valida estoque) | ✅ |
| PUT | /pedidos/:id | Atualiza um pedido | ✅ |
| DELETE | /pedidos/:id | Cancela/remove um pedido | ✅ |

### Filtros opcionais (query string)
- `GET /produtos?categoria=perifericos&marca=Logitech`
- `GET /pedidos?status=confirmado&cliente_id=1&produto_id=3`

### Exemplos

Criar produto:
```bash
curl -X POST http://localhost:3001/produtos \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Webcam W100",
    "descricao": "Webcam Full HD 1080p com microfone",
    "preco": 199.90,
    "categoria": "perifericos",
    "estoque": 12,
    "marca": "Logitech"
  }'
```

Criar pedido (informando só os ids das entidades relacionadas):
```bash
curl -X POST http://localhost:3001/pedidos \
  -H "Content-Type: application/json" \
  -d '{
    "cliente_id": 1,
    "produto_id": 2,
    "quantidade": 3
  }'
```

Resposta quando o cliente informado não existe (`404`):
```json
{ "erro": "Cliente não encontrado" }
```

Resposta quando falta estoque (`409`):
```json
{
  "erro": "Estoque insuficiente",
  "estoque_disponivel": 3,
  "quantidade_solicitada": 10
}
```

### Códigos de status usados
| Código | Quando |
|---|---|
| 200 | Requisição OK |
| 201 | Recurso criado |
| 204 | Recurso removido (sem corpo) |
| 400 | Corpo inválido / campo obrigatório faltando |
| 404 | Recurso não encontrado |
| 409 | Conflito (estoque insuficiente, produto com pedidos vinculados) |
| 500 | Erro interno |
| 501 | Endpoint de clientes ainda não implementado |

## Deploy

Hospedado no **Railway** (API + banco MySQL no mesmo projeto). A configuração do serviço está
em `railway.json` e o passo a passo completo em [DEPLOY.md](DEPLOY.md).

A API lê a porta de `process.env.PORT` e as credenciais do banco das variáveis de ambiente
(aceita tanto `DB_*` quanto as `MYSQL*` injetadas pelo Railway), então roda em qualquer
plataforma sem alteração de código.

**URL do deploy:** https://loja-api-integracao.onrender.com

## Equipe

- Leonardo Monteiro
- Saulo
