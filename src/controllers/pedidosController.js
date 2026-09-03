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
