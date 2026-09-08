-- Schema do banco de dados: Loja (Clientes + Produtos + Pedidos)
-- Rodar dentro do banco `loja_api`

DROP TABLE IF EXISTS pedidos;
DROP TABLE IF EXISTS produtos;
DROP TABLE IF EXISTS clientes;

CREATE TABLE clientes (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    nome            VARCHAR(120) NOT NULL,
    email           VARCHAR(160) NOT NULL UNIQUE,
    telefone        VARCHAR(20)  NOT NULL,
    cpf             VARCHAR(14)  NOT NULL UNIQUE,
    cidade          VARCHAR(80)  NOT NULL,
    data_cadastro   DATETIME DEFAULT CURRENT_TIMESTAMP
);

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
    FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE RESTRICT
);

CREATE INDEX idx_pedidos_produto ON pedidos (produto_id);
CREATE INDEX idx_pedidos_status  ON pedidos (status);

INSERT INTO clientes (nome, email, telefone, cpf, cidade) VALUES
('Maria Souza',   'maria.souza@email.com',   '85991110001', '111.222.333-44', 'Fortaleza'),
('Joao Lima',     'joao.lima@email.com',     '85991110002', '222.333.444-55', 'Caucaia'),
('Ana Carolina',  'ana.carolina@email.com',  '85991110003', '333.444.555-66', 'Fortaleza');

INSERT INTO produtos (nome, descricao, preco, categoria, estoque, marca) VALUES
('Teclado Mecanico K1', 'Teclado mecanico switch blue ABNT2', 289.90, 'perifericos', 15, 'Redragon'),
('Mouse Gamer M2',      'Mouse optico 7 botoes 12000 DPI',   149.90, 'perifericos', 30, 'Logitech'),
('Monitor 24 Full HD',  'Monitor IPS 24 polegadas 75Hz',     899.00, 'monitores',    8, 'LG'),
('Headset HS300',       'Headset com microfone e surround',  219.50, 'audio',       20, 'JBL');

INSERT INTO pedidos (produto_id, quantidade, cliente_nome, cliente_email, status) VALUES
(1, 2, 'Maria Souza', 'maria.souza@email.com', 'confirmado'),
(3, 1, 'Joao Lima',   'joao.lima@email.com',   'enviado');

UPDATE produtos SET estoque = estoque - 2 WHERE id = 1;
UPDATE produtos SET estoque = estoque - 1 WHERE id = 3;
