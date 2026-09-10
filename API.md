# Como usar a API da Loja

Guia rápido pra quem vai **consumir** a API (mandar requisições pra ela). Pra rodar o projeto localmente ou ver detalhes de implementação, veja o [README.md](README.md).

## URL base

| Ambiente | URL |
|---|---|
| Local | `http://localhost:3001` |
| Produção | ver [README.md](README.md#deploy) |

Todas as rotas abaixo são relativas a essa URL. Ex: `GET /clientes` = `GET http://localhost:3001/clientes`.

## Regras gerais

- Todo corpo de requisição (`POST`/`PUT`) é **JSON**. Manda o header `Content-Type: application/json`.
- Não precisa de login nem token — a API é aberta.
- Toda resposta também é JSON.

### Formato dos erros

| Situação | Formato da resposta |
|---|---|
| Campo obrigatório faltando ou inválido (`400`) | `{ "erros": ["O campo 'x' é obrigatório", "..."] }` (lista, pode ter mais de um) |
| Qualquer outro erro (`404`, `409`, `500`...) | `{ "erro": "mensagem explicando o problema" }` (uma string só) |

## Os 3 recursos

A API gira em torno de 3 "coisas" (recursos), e um pedido liga as outras duas:

```
clientes ──< pedidos >── produtos
```

Um **cliente** faz vários **pedidos**, cada pedido é de um **produto**. Ao criar um pedido, você só informa **quem** (`cliente_id`) e **o quê** (`produto_id`) — a API busca o resto (nome do cliente, preço do produto) sozinha.

---

## 👤 Clientes

| Método | Rota | Pra que serve |
|---|---|---|
| GET | `/clientes` | Lista todos os clientes |
| GET | `/clientes/:id` | Detalha um cliente específico |
| GET | `/clientes/:id/pedidos` | Lista os pedidos feitos por um cliente |
| POST | `/clientes` | Cadastra um cliente novo |
| PUT | `/clientes/:id` | Atualiza os dados de um cliente |
| DELETE | `/clientes/:id` | Remove um cliente (só se ele não tiver pedido registrado) |

**Campos:** `nome`, `email` (único), `telefone`, `cpf` (único), `cidade` — todos obrigatórios.

Exemplo — cadastrar um cliente:
```bash
curl -X POST http://localhost:3001/clientes \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Ana Carolina",
    "email": "ana.carolina@email.com",
    "telefone": "85991110003",
    "cpf": "333.444.555-66",
    "cidade": "Fortaleza"
  }'
```

---

## 📦 Produtos

| Método | Rota | Pra que serve |
|---|---|---|
| GET | `/produtos` | Lista todos os produtos |
| GET | `/produtos?categoria=X&marca=Y` | Lista filtrando por categoria e/ou marca |
| GET | `/produtos/:id` | Detalha um produto específico |
| POST | `/produtos` | Cadastra um produto novo |
| PUT | `/produtos/:id` | Atualiza um produto |
| DELETE | `/produtos/:id` | Remove um produto (só se ele não tiver pedido vinculado) |

**Campos:** `nome`, `descricao`, `preco`, `categoria`, `estoque`, `marca` — todos obrigatórios.

Exemplo — cadastrar um produto:
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

---

## 🧾 Pedidos

| Método | Rota | Pra que serve |
|---|---|---|
| GET | `/pedidos` | Lista todos os pedidos |
| GET | `/pedidos?status=X&cliente_id=Y&produto_id=Z` | Lista filtrando por status, cliente e/ou produto |
| GET | `/pedidos/:id` | Detalha um pedido específico |
| POST | `/pedidos` | Cria um pedido (verifica e reserva estoque) |
| PUT | `/pedidos/:id` | Atualiza quantidade e/ou status de um pedido |
| DELETE | `/pedidos/:id` | Cancela/remove um pedido e devolve o estoque |

**Campos pra criar (`POST`):** `cliente_id`, `produto_id`, `quantidade` (e opcionalmente `status`, padrão `confirmado`).

Você **não** manda nome/e-mail do cliente nem preço do produto — a API busca isso pelo relacionamento e calcula o `valor_total` sozinha (`preco do produto × quantidade`).

Status possíveis: `confirmado`, `enviado`, `entregue`, `cancelado`.

Exemplo — criar um pedido:
```bash
curl -X POST http://localhost:3001/pedidos \
  -H "Content-Type: application/json" \
  -d '{
    "cliente_id": 1,
    "produto_id": 2,
    "quantidade": 3
  }'
```

Resposta (`201`):
```json
{
  "id": 4,
  "cliente_id": 1,
  "produto_id": 2,
  "quantidade": 3,
  "valor_total": 449.70,
  "status": "confirmado",
  "cliente_nome": "Maria Souza",
  "produto_nome": "Mouse Gamer M2",
  "produto_preco": 149.90
}
```

**Regra de estoque:** se não houver produto suficiente, o pedido é recusado com `409`:
```json
{
  "erro": "Estoque insuficiente",
  "estoque_disponivel": 3,
  "quantidade_solicitada": 10
}
```

---

## Códigos de status usados

| Código | Significado |
|---|---|
| `200` | Deu certo (consulta ou atualização) |
| `201` | Recurso criado com sucesso |
| `204` | Removido com sucesso (resposta sem corpo) |
| `400` | Dado inválido ou campo obrigatório faltando |
| `404` | O recurso pedido (cliente/produto/pedido) não existe |
| `409` | Conflito — ex: e-mail/CPF já cadastrado, estoque insuficiente, ou tentativa de apagar algo com vínculo |
| `500` | Erro inesperado do servidor |

## Um fluxo completo, do zero

```bash
# 1. Cadastra um cliente
curl -X POST http://localhost:3001/clientes -H "Content-Type: application/json" \
  -d '{"nome":"Ana","email":"ana@email.com","telefone":"85999998888","cpf":"111.111.111-11","cidade":"Fortaleza"}'
# -> devolve o cliente criado com um "id" (ex: 5)

# 2. Cadastra um produto
curl -X POST http://localhost:3001/produtos -H "Content-Type: application/json" \
  -d '{"nome":"Mouse Pad","descricao":"Mouse pad grande","preco":39.90,"categoria":"perifericos","estoque":50,"marca":"Redragon"}'
# -> devolve o produto criado com um "id" (ex: 7)

# 3. Cria um pedido ligando os dois
curl -X POST http://localhost:3001/pedidos -H "Content-Type: application/json" \
  -d '{"cliente_id":5,"produto_id":7,"quantidade":2}'

# 4. Confere os pedidos desse cliente
curl http://localhost:3001/clientes/5/pedidos
```
