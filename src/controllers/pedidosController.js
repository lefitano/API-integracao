import pool from '../config/db.js';

const STATUS_VALIDOS = ['confirmado', 'enviado', 'entregue', 'cancelado'];

function validarPedido(body, { exigirProduto = true } = {}) {
    const erros = [];

    if (exigirProduto && !body.produto_id) {
        erros.push("O campo 'produto_id' é obrigatório");
    }

    if (body.quantidade === undefined || body.quantidade === null || body.quantidade === '') {
        erros.push("O campo 'quantidade' é obrigatório");
    } else if (!Number.isInteger(Number(body.quantidade)) || Number(body.quantidade) <= 0) {
        erros.push("O campo 'quantidade' deve ser um número inteiro maior que zero");
    }

    if (!body.cliente_nome) {
        erros.push("O campo 'cliente_nome' é obrigatório");
    }

    if (!body.cliente_email) {
        erros.push("O campo 'cliente_email' é obrigatório");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.cliente_email)) {
        erros.push("O campo 'cliente_email' deve ser um e-mail válido");
    }

    if (body.status !== undefined && !STATUS_VALIDOS.includes(body.status)) {
        erros.push(`O campo 'status' deve ser um destes: ${STATUS_VALIDOS.join(', ')}`);
    }

    return erros;
}

// GET /pedidos
export async function listarPedidos(req, res, next) {
    try {
        const { status, cliente_email } = req.query;

        let sql = `
            SELECT p.*, pr.nome AS produto_nome, pr.preco AS produto_preco
            FROM pedidos p
            JOIN produtos pr ON pr.id = p.produto_id
        `;
        const params = [];
        const filtros = [];

        if (status) {
            filtros.push('p.status = ?');
            params.push(status);
        }
        if (cliente_email) {
            filtros.push('p.cliente_email = ?');
            params.push(cliente_email);
        }

        if (filtros.length > 0) {
            sql += ` WHERE ${filtros.join(' AND ')}`;
        }

        sql += ' ORDER BY p.id';

        const [pedidos] = await pool.query(sql, params);
        res.json(pedidos);
    } catch (err) {
        next(err);
    }
}

// GET /pedidos/:id
export async function detalharPedido(req, res, next) {
    try {
        const [linhas] = await pool.query(
            `SELECT p.*, pr.nome AS produto_nome, pr.preco AS produto_preco
             FROM pedidos p
             JOIN produtos pr ON pr.id = p.produto_id
             WHERE p.id = ?`,
            [req.params.id]
        );

        if (linhas.length === 0) {
            return res.status(404).json({ erro: 'Pedido não encontrado' });
        }

        res.json(linhas[0]);
    } catch (err) {
        next(err);
    }
}

// POST /pedidos  -> valida e decrementa o estoque
export async function criarPedido(req, res, next) {
    const erros = validarPedido(req.body);
    if (erros.length > 0) {
        return res.status(400).json({ erros });
    }

    const { produto_id, quantidade, cliente_nome, cliente_email, status } = req.body;
    const conexao = await pool.getConnection();

    try {
        await conexao.beginTransaction();

        // FOR UPDATE trava a linha do produto até o commit, evitando venda duplicada do mesmo estoque
        const [produtos] = await conexao.query(
            'SELECT * FROM produtos WHERE id = ? FOR UPDATE',
            [produto_id]
        );

        if (produtos.length === 0) {
            await conexao.rollback();
            return res.status(404).json({ erro: 'Produto não encontrado' });
        }

        const produto = produtos[0];

        if (produto.estoque < Number(quantidade)) {
            await conexao.rollback();
            return res.status(409).json({
                erro: 'Estoque insuficiente',
                estoque_disponivel: produto.estoque,
                quantidade_solicitada: Number(quantidade)
            });
        }

        const [resultado] = await conexao.query(
            `INSERT INTO pedidos (produto_id, quantidade, cliente_nome, cliente_email, status)
             VALUES (?, ?, ?, ?, ?)`,
            [produto_id, quantidade, cliente_nome, cliente_email, status || 'confirmado']
        );

        await conexao.query(
            'UPDATE produtos SET estoque = estoque - ? WHERE id = ?',
            [quantidade, produto_id]
        );

        await conexao.commit();

        const [criado] = await pool.query('SELECT * FROM pedidos WHERE id = ?', [resultado.insertId]);
        res.status(201).json(criado[0]);
    } catch (err) {
        await conexao.rollback();
        next(err);
    } finally {
        conexao.release();
    }
}

// PUT /pedidos/:id  -> ajusta o estoque conforme a diferença de quantidade
export async function atualizarPedido(req, res, next) {
    const erros = validarPedido(req.body, { exigirProduto: false });
    if (erros.length > 0) {
        return res.status(400).json({ erros });
    }

    const { quantidade, cliente_nome, cliente_email, status } = req.body;
    const conexao = await pool.getConnection();

    try {
        await conexao.beginTransaction();

        const [pedidos] = await conexao.query('SELECT * FROM pedidos WHERE id = ? FOR UPDATE', [req.params.id]);

        if (pedidos.length === 0) {
            await conexao.rollback();
            return res.status(404).json({ erro: 'Pedido não encontrado' });
        }

        const pedido = pedidos[0];
        const novoStatus = status || pedido.status;

        const [produtos] = await conexao.query(
            'SELECT * FROM produtos WHERE id = ? FOR UPDATE',
            [pedido.produto_id]
        );
        const produto = produtos[0];

        // Quanto do estoque este pedido reserva hoje, e quanto vai reservar depois.
        const reservadoAntes = pedido.status === 'cancelado' ? 0 : pedido.quantidade;
        const reservadoDepois = novoStatus === 'cancelado' ? 0 : Number(quantidade);
        const diferenca = reservadoDepois - reservadoAntes;

        if (diferenca > produto.estoque) {
            await conexao.rollback();
            return res.status(409).json({
                erro: 'Estoque insuficiente para atualizar o pedido',
                estoque_disponivel: produto.estoque,
                quantidade_adicional_necessaria: diferenca
            });
        }

        if (diferenca !== 0) {
            await conexao.query(
                'UPDATE produtos SET estoque = estoque - ? WHERE id = ?',
                [diferenca, produto.id]
            );
        }

        await conexao.query(
            `UPDATE pedidos SET quantidade = ?, cliente_nome = ?, cliente_email = ?, status = ?
             WHERE id = ?`,
            [quantidade, cliente_nome, cliente_email, novoStatus, req.params.id]
        );

        await conexao.commit();

        const [atualizado] = await pool.query('SELECT * FROM pedidos WHERE id = ?', [req.params.id]);
        res.json(atualizado[0]);
    } catch (err) {
        await conexao.rollback();
        next(err);
    } finally {
        conexao.release();
    }
}

// DELETE /pedidos/:id -> remove o pedido e devolve o estoque
export async function removerPedido(req, res, next) {
    const conexao = await pool.getConnection();

    try {
        await conexao.beginTransaction();

        const [pedidos] = await conexao.query('SELECT * FROM pedidos WHERE id = ? FOR UPDATE', [req.params.id]);

        if (pedidos.length === 0) {
            await conexao.rollback();
            return res.status(404).json({ erro: 'Pedido não encontrado' });
        }

        const pedido = pedidos[0];

        // Só devolve estoque se o pedido ainda estava reservando (não cancelado)
        if (pedido.status !== 'cancelado') {
            await conexao.query(
                'UPDATE produtos SET estoque = estoque + ? WHERE id = ?',
                [pedido.quantidade, pedido.produto_id]
            );
        }

        await conexao.query('DELETE FROM pedidos WHERE id = ?', [req.params.id]);
        await conexao.commit();

        res.status(204).send();
    } catch (err) {
        await conexao.rollback();
        next(err);
    } finally {
        conexao.release();
    }
}
