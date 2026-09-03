import pool from '../config/db.js';

const CAMPOS = ['nome', 'descricao', 'preco', 'categoria', 'estoque', 'marca'];

function validarProduto(body) {
    const erros = [];

    for (const campo of CAMPOS) {
        if (body[campo] === undefined || body[campo] === null || body[campo] === '') {
            erros.push(`O campo '${campo}' é obrigatório`);
        }
    }

    if (body.preco !== undefined && (isNaN(body.preco) || Number(body.preco) < 0)) {
        erros.push("O campo 'preco' deve ser um número maior ou igual a zero");
    }

    if (body.estoque !== undefined && (!Number.isInteger(Number(body.estoque)) || Number(body.estoque) < 0)) {
        erros.push("O campo 'estoque' deve ser um número inteiro maior ou igual a zero");
    }

    return erros;
}

// GET /produtos
export async function listarProdutos(req, res, next) {
    try {
        const { categoria, marca } = req.query;

        let sql = 'SELECT * FROM produtos';
        const params = [];

        if (categoria) {
            params.push(categoria);
            sql += params.length === 1 ? ' WHERE categoria = ?' : ' AND categoria = ?';
        }
        if (marca) {
            params.push(marca);
            sql += params.length === 1 ? ' WHERE marca = ?' : ' AND marca = ?';
        }

        sql += ' ORDER BY id';

        const [produtos] = await pool.query(sql, params);
        res.json(produtos);
    } catch (err) {
        next(err);
    }
}

// GET /produtos/:id
export async function detalharProduto(req, res, next) {
    try {
        const [linhas] = await pool.query('SELECT * FROM produtos WHERE id = ?', [req.params.id]);

        if (linhas.length === 0) {
            return res.status(404).json({ erro: 'Produto não encontrado' });
        }

        res.json(linhas[0]);
    } catch (err) {
        next(err);
    }
}

// POST /produtos
export async function criarProduto(req, res, next) {
    try {
        const erros = validarProduto(req.body);
        if (erros.length > 0) {
            return res.status(400).json({ erros });
        }

        const { nome, descricao, preco, categoria, estoque, marca } = req.body;

        const [resultado] = await pool.query(
            'INSERT INTO produtos (nome, descricao, preco, categoria, estoque, marca) VALUES (?, ?, ?, ?, ?, ?)',
            [nome, descricao, preco, categoria, estoque, marca]
        );

        const [criado] = await pool.query('SELECT * FROM produtos WHERE id = ?', [resultado.insertId]);
        res.status(201).json(criado[0]);
    } catch (err) {
        next(err);
    }
}

// PUT /produtos/:id
export async function atualizarProduto(req, res, next) {
    try {
        const erros = validarProduto(req.body);
        if (erros.length > 0) {
            return res.status(400).json({ erros });
        }

        const { nome, descricao, preco, categoria, estoque, marca } = req.body;

        const [resultado] = await pool.query(
            'UPDATE produtos SET nome = ?, descricao = ?, preco = ?, categoria = ?, estoque = ?, marca = ? WHERE id = ?',
            [nome, descricao, preco, categoria, estoque, marca, req.params.id]
        );

        if (resultado.affectedRows === 0) {
            return res.status(404).json({ erro: 'Produto não encontrado' });
        }

        const [atualizado] = await pool.query('SELECT * FROM produtos WHERE id = ?', [req.params.id]);
        res.json(atualizado[0]);
    } catch (err) {
        next(err);
    }
}

// DELETE /produtos/:id
export async function removerProduto(req, res, next) {
    try {
        const [pedidos] = await pool.query(
            'SELECT COUNT(*) AS total FROM pedidos WHERE produto_id = ?',
            [req.params.id]
        );

        if (pedidos[0].total > 0) {
            return res.status(409).json({
                erro: 'Não é possível remover: existem pedidos vinculados a este produto'
            });
        }

        const [resultado] = await pool.query('DELETE FROM produtos WHERE id = ?', [req.params.id]);

        if (resultado.affectedRows === 0) {
            return res.status(404).json({ erro: 'Produto não encontrado' });
        }

        res.status(204).send();
    } catch (err) {
        next(err);
    }
}
