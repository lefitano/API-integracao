# Requisições prontas — apresentação

URL base (deploy): `https://loja-api-integracao.onrender.com`

Pra cada requisição: copia o **Método + URL** pra barra do Postman, e o **Body** (quando tiver) pra aba Body → raw → JSON.

---

## 👤 Clientes

### 1. Listar clientes
```
GET https://loja-api-integracao.onrender.com/clientes
```
*Mostra: todos os clientes cadastrados no banco.*

### 2. Criar cliente
```
POST https://loja-api-integracao.onrender.com/clientes
```
```json
{
  "nome": "Pedro Henrique",
  "email": "pedro.demo@email.com",
  "telefone": "85999992222",
  "cpf": "444.555.666-77",
  "cidade": "Fortaleza"
}
```
*Mostra: cadastro de cliente com validação de campos. Guarda o `id` que voltar na resposta.*

### 3. Pedidos de um cliente
```
GET https://loja-api-integracao.onrender.com/clientes/1/pedidos
```
*Mostra: endpoint relacional — lista só os pedidos do cliente 1 (Maria Souza, já no banco). Troque o `1` por outro id se quiser.*

---

## 📦 Produtos

### 4. Listar produtos
```
GET https://loja-api-integracao.onrender.com/produtos
```
*Mostra: todos os produtos. Pode incluir filtro: `?categoria=perifericos&marca=Logitech`.*

### 5. Criar produto
```
POST https://loja-api-integracao.onrender.com/produtos
```
```json
{
  "nome": "Webcam W100",
  "descricao": "Webcam Full HD 1080p com microfone",
  "preco": 199.90,
  "categoria": "perifericos",
  "estoque": 12,
  "marca": "Logitech"
}
```
*Mostra: cadastro de produto. Guarda o `id` que voltar na resposta.*

---

## 🧾 Pedidos

### 6. Criar pedido (relacionamento + cálculo automático)
```
POST https://loja-api-integracao.onrender.com/pedidos
```
```json
{
  "cliente_id": 2,
  "produto_id": 2,
  "quantidade": 1
}
```
*Mostra:  manda os ids  e a API busca cliente e produto pelo relacionamento, calcula `valor_total` sozinha (`preço × quantidade`) e já decrementa o estoque. Cliente 2 = Joao Lima, produto 2 = Mouse Gamer M2 (já existem no banco).*

### 7. Estoque insuficiente — regra de negócio (409)
```
POST https://loja-api-integracao.onrender.com/pedidos
```
```json
{
  "cliente_id": 1,
  "produto_id": 3,
  "quantidade": 999
}
```
*Mostra: a regra de negócio principal do projeto. Produto 3 (Monitor) tem pouco estoque — pedir 999 unidades é recusado com `409` e uma mensagem explicando quanto tem disponível.*

### 8. Atualizar status do pedido
```
PUT https://loja-api-integracao.onrender.com/pedidos/1
```
```json
{
  "quantidade": 2,
  "status": "enviado"
}
```
*Mostra: transição de status (`confirmado` → `enviado` → `entregue`/`cancelado`) e ajuste de estoque conforme a diferença de quantidade. Troque o `1` da URL pelo id de um pedido existente.*

### 9. Remover pedido (devolve estoque)
```
DELETE https://loja-api-integracao.onrender.com/pedidos/1
```
*Mostra: cancelamento/remoção do pedido, a resposta vem vazia (`204`), e o estoque do produto volta a ser somado (a não ser que o pedido já estivesse `cancelado`). Troque o `1` pelo id de um pedido que você tenha criado agora na demonstração, pra não apagar dado do seed.*

---

## Dica pra apresentação

Se algum `:id` que você usar aqui não existir mais no banco (por exemplo, se já apagou o cliente 1 em outro teste), roda primeiro a requisição **"Listar clientes"** ou **"Listar produtos"** pra pegar um id válido na hora.
