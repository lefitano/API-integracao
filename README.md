# Loja API -> TRABALHO INTEGRAÇÃO DE SISTEMAS

API REST para gerenciamento de produtos e pedidos de uma loja, com controle automático de estoque.

## TEC
- Node.js + Express.js
- MySQL (via `mysql2`)

## Importante
```
schema.sql                # script de criação das tabelas
.env.example              # modelo de variáveis de ambiente
```
1. npm install

2. Criar o banco de dados no MySQL:
```sql
CREATE DATABASE loja_api;
```

3. Roda o script de criação das tabelas que ta no (`schema.sql`) dentro do banco `loja_api`.

4. Copia o arquivo de exemplo de variáveis de ambiente com suas credenciais:
```bash
cp .env.example .env
```

5. Roda o servidor
```bash
npm run dev
```

## Nossa Regra de negócio:

Ao criar um pedido, o sistema verifica se há estoque suficiente do produto solicitado. Se houver, o pedido é criado e o estoque é decrementado. Caso contrário, o pedido é recusado.

## Endpoints para fazer, quando for fazendo vai confirmando com o ✅

| Método | Rota | Descrição | Status |
|---|---|---|---|
| GET | /produtos | Lista todos os produtos | ⏳ |
| GET | /produtos/:id | Detalha um produto | ⏳ |
| POST | /produtos | Cria um produto | ⏳ |
| PUT | /produtos/:id | Atualiza um produto | ⏳ |
| DELETE | /produtos/:id | Remove um produto | ⏳ |
| GET | /pedidos | Lista todos os pedidos | ⏳ |
| POST | /pedidos | Cria um pedido (valida estoque) | ⏳ |
| PUT | /pedidos/:id | Atualiza um pedido | ⏳ |
| DELETE | /pedidos/:id | Cancela um pedido | ⏳ |

## Deploy

Vamos decidir depois

## Equipe

- Leonardo Monteiro
- Saulo