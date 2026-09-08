import pool from '../config/db.js';

const STATUS_VALIDOS = ['confirmado', 'enviado', 'entregue', 'cancelado'];

const SELECT_PEDIDO = `
    SELECT
        p.id,
        p.cliente_id,
        p.produto_id,
        p.quantidade,
        p.valor_total,
        p.data_pedido,
        p.status,
        c.nome  AS cliente_nome,
        c.email AS cliente_email,
        c.cidade AS cliente_cidade,
        pr.nome  AS produto_nome,
        pr.preco AS produto_preco,
        pr.marca AS produto_marca
    FROM pedidos p
    JOIN clientes c  ON c.id  = p.cliente_id
    JOIN produtos pr ON pr.id = p.produto_id
`;

function validarPedido(body, { exigirRelacionamentos = true } = {}) {
    const erros = [];

    if (exigirRelacionamentos) {
        if (!body.cliente_id) {
            erros.push("O campo 'cliente_id' é obrigatório");
        } else if (!Number.isInteger(Number(body.cliente_id)) || Number(body.cliente_id) <= 0) {
            erros.push("O campo 'cliente_id' deve ser um id válido");
        }

        if (!body.produto_id) {
            erros.push("O campo 'produto_id' é obrigatório");
        } else if (!Number.isInteger(Number(body.produto_id)) || Number(body.produto_id) <= 0) {
            erros.push("O campo 'produto_id' deve ser um id válido");
        }
    }

    if (body.quantidade === undefined || body.quantidade === null || body.quantidade === '') {
        erros.push("O campo 'quantidade' é obrigatório");
    } else if (!Number.isInteger(Number(body.quantidade)) || Number(body.quantidade) <= 0) {
        erros.push("O campo 'quantidade' deve ser um número inteiro maior que zero");
    }

    if (body.status !== undefined && !STATUS_VALIDOS.includes(body.status)) {
        erros.push(`O campo 'status' deve ser um destes: ${STATUS_VALIDOS.join(', ')}`);
    }

    return erros;
}

export async function listarPedidos(req, res, next) {
    try {
        const { status, cliente_id, produto_id } = req.query;

        let sql = SELECT_PEDIDO;
        const params = [];
        const filtros = [];

        if (status) {
            filtros.push('p.status = ?');
            params.push(status);
        }
        if (cliente_id) {
            filtros.push('p.cliente_id = ?');
            params.push(cliente_id);
        }
        if (produto_id) {
            filtros.push('p.produto_id = ?');
            params.push(produto_id);
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

export async function detalharPedido(req, res, next) {
    try {
        const [linhas] = await pool.query(`${SELECT_PEDIDO} WHERE p.id = ?`, [req.params.id]);

        if (linhas.length === 0) {
            return res.status(404).json({ erro: 'Pedido não encontrado' });
        }

        res.json(linhas[0]);
    } catch (err) {
        next(err);
    }
}

export async function criarPedido(req, res, next) {
    const erros = validarPedido(req.body);
    if (erros.length > 0) {
        return res.status(400).json({ erros });
    }

    const { cliente_id, produto_id, quantidade, status } = req.body;
    const conexao = await pool.getConnection();

    try {
        await conexao.beginTransaction();

        const [clientes] = await conexao.query('SELECT id FROM clientes WHERE id = ?', [cliente_id]);

        if (clientes.length === 0) {
            await conexao.rollback();
            return res.status(404).json({ erro: 'Cliente não encontrado' });
        }

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

        const valorTotal = (Number(produto.preco) * Number(quantidade)).toFixed(2);

        const [resultado] = await conexao.query(
            `INSERT INTO pedidos (cliente_id, produto_id, quantidade, valor_total, status)
             VALUES (?, ?, ?, ?, ?)`,
            [cliente_id, produto_id, quantidade, valorTotal, status || 'confirmado']
        );

        await conexao.query(
            'UPDATE produtos SET estoque = estoque - ? WHERE id = ?',
            [quantidade, produto_id]
        );

        await conexao.commit();

        const [criado] = await pool.query(`${SELECT_PEDIDO} WHERE p.id = ?`, [resultado.insertId]);
        res.status(201).json(criado[0]);
    } catch (err) {
        await conexao.rollback();
        next(err);
    } finally {
        conexao.release();
    }
}

export async function atualizarPedido(req, res, next) {
    const erros = validarPedido(req.body, { exigirRelacionamentos: false });
    if (erros.length > 0) {
        return res.status(400).json({ erros });
    }

    const { quantidade, status } = req.body;
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

        const valorTotal = (Number(produto.preco) * Number(quantidade)).toFixed(2);

        await conexao.query(
            'UPDATE pedidos SET quantidade = ?, valor_total = ?, status = ? WHERE id = ?',
            [quantidade, valorTotal, novoStatus, req.params.id]
        );

        await conexao.commit();

        const [atualizado] = await pool.query(`${SELECT_PEDIDO} WHERE p.id = ?`, [req.params.id]);
        res.json(atualizado[0]);
    } catch (err) {
        await conexao.rollback();
        next(err);
    } finally {
        conexao.release();
    }
}

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
