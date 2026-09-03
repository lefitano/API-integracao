-- Schema do banco de dados: Loja (Produtos + Pedidos)
-- Rodar dentro do banco `loja_api`

DROP TABLE IF EXISTS pedidos;
DROP TABLE IF EXISTS produtos;

CREATE TABLE produtos (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    nome        VARCHAR(120) NOT NULL,
    descricao   VARCHAR(120) NOT NULL,
    preco       DECIMAL(10, 2) NOT NULL,
    categoria   VARCHAR(50) NOT NULL,
    estoque     INT NOT NULL DEFAULT 0,
    marca       VARCHAR(50) NOT NULL
);

CREATE TABLE pedidos (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    produto_id      INT NOT NULL,
    quantidade      INT NOT NULL,
    cliente_nome    VARCHAR(120) NOT NULL,
    cliente_email   VARCHAR(160) NOT NULL,
    data_pedido     DATETIME DEFAULT CURRENT_TIMESTAMP,
    status          VARCHAR(20) NOT NULL DEFAULT 'confirmado',
    FOREIGN KEY (produto_id) REFERENCES produtos(id)
);