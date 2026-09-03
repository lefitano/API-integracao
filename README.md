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

**produtos** (7 campos): `id`, `nome`, `descricao`, `preco`, `categoria`, `estoque`, `marca`

**pedidos** (7 campos): `id`, `produto_id`, `quantidade`, `cliente_nome`, `cliente_email`, `data_pedido`, `status`

Status válidos de um pedido: `confirmado`, `enviado`, `entregue`, `cancelado`.

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
- `GET /pedidos?status=confirmado&cliente_email=maria.souza@email.com`

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

Criar pedido:
```bash
curl -X POST http://localhost:3001/pedidos \
  -H "Content-Type: application/json" \
  -d '{
    "produto_id": 1,
    "quantidade": 2,
    "cliente_nome": "Maria Souza",
    "cliente_email": "maria.souza@email.com"
  }'
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

## Deploy

Hospedado no **Railway** (API + banco MySQL no mesmo projeto). A configuração do serviço está
em `railway.json` e o passo a passo completo em [DEPLOY.md](DEPLOY.md).

A API lê a porta de `process.env.PORT` e as credenciais do banco das variáveis de ambiente
(aceita tanto `DB_*` quanto as `MYSQL*` injetadas pelo Railway), então roda em qualquer
plataforma sem alteração de código.

**URL do deploy:** _(preencher depois de publicar)_

## Equipe

- Leonardo Monteiro
- Saulo
