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
