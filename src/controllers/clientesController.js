import pool from '../config/db.js';

const CAMPOS = ['nome', 'email', 'telefone', 'cpf', 'cidade'];
const regex_text = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validarCliente(body){
    const erros = [];
    for(const campo of CAMPOS){
        if(body[campo] === undefined || body[campo] === null|| body[campo] === ''){
            erros.push(`O campo ${campo} é obrigatório`);
        }
    }
    if(body.email !== undefined && body.email !== null && body.email !== '' && !regex_text.test(body.email)) {
        erros.push(`O formato de email ${body.email} não é válido`);
    }
    return erros;
}
export async function listarClientes(req, res, next){
    

    try{
        const [clientes] = await pool.query('SELECT * FROM clientes ORDER BY id')
        res.json(clientes);
    } catch(err){
        next(err);
    }
}

export async function detalharCliente(req, res, next){
    try{
        const [linhas] = await pool.query('SELECT * FROM clientes WHERE id = ?', [req.params.id])
        if(linhas.length === 0){
            return res.status(404).json({erro : "Cliente não encontrado" });
        }
        res.json(linhas[0]);
    }catch(err){
        next(err);
    }
}

export async function listarPedidosDoCliente(req, res, next){
    try{
        const [clientes] = await pool.query('SELECT id FROM clientes WHERE id = ?', [req.params.id]);

        if(clientes.length === 0){
            return res.status(404).json({ erro: 'Cliente não encontrado' });
        }

        const [pedidos] = await pool.query(
            `SELECT p.*, pr.nome AS produto_nome, pr.preco AS produto_preco
             FROM pedidos p
             JOIN produtos pr ON pr.id = p.produto_id
             WHERE p.cliente_id = ?
             ORDER BY p.id`,
            [req.params.id]
        );

        res.json(pedidos);
    }catch(err){
        next(err);
    }
}

export async function criarCliente(req, res, next){
    try{
        const erros = validarCliente(req.body);
        if(erros.length > 0){
           return res.status(400).json({erros});
        }
        const {nome, email, telefone, cpf, cidade} = req.body;
        const [resultado] = await pool.query(
            'INSERT INTO clientes (nome, email, telefone, cpf, cidade) VALUES(?, ?, ? , ?, ?)',
            [nome, email, telefone, cpf, cidade]
        );
        const [criado] = await pool.query('SELECT * FROM clientes WHERE id = ?', [resultado.insertId]);
        res.status(201).json(criado[0]);
    }catch(err){
        if(err.code === 'ER_DUP_ENTRY'){
            return res.status(409).json({erro : 'Já existe um cliente cadastrado com esse email ou cpf'})
        }
        next(err);
    }
}

export async function atualizarCliente(req, res, next){
    try{
        const erros = validarCliente(req.body);
        if(erros.length > 0){
            return res.status(400).json({erros});
        }

        const [existentes] = await pool.query('SELECT id FROM clientes WHERE id = ?', [req.params.id]);
        if(existentes.length === 0){
            return res.status(404).json({erro : "Cliente não encontrado"});
        }

        const {nome, email, telefone, cpf, cidade} = req.body;
        await pool.query(
            'UPDATE clientes SET nome = ?, email = ?, telefone = ?, cpf = ?, cidade = ? WHERE id = ?',
            [nome, email, telefone, cpf, cidade, req.params.id]
        );
        const [atualizado] = await pool.query('SELECT * FROM clientes WHERE id = ?', [req.params.id]);
        res.json(atualizado[0]);
    }catch(err){
        if(err.code === 'ER_DUP_ENTRY'){
            return res.status(409).json({erro : "Já existe outro cliente cadastrado com esse email ou cpf"})
        }
        next(err);
    }
}

export async function removerCliente(req, res, next){

    const conexao = await pool.getConnection();

    try{
        await conexao.beginTransaction();

        const [clientes] = await conexao.query('SELECT id FROM clientes WHERE id = ? FOR UPDATE', [req.params.id]);
        if(clientes.length === 0){
            await conexao.rollback();
            return res.status(404).json({ erro: "Cliente não encontrado" });
        }

        const [pedidos] = await conexao.query(
            'SELECT COUNT(*) AS total FROM pedidos WHERE cliente_id = ?',
            [req.params.id]
        );
        if(pedidos[0].total > 0){
            await conexao.rollback();
            return res.status(409).json({
                erro: "Não foi possível remover o cliente pois existem pedidos vinculados"
            });
        }

        await conexao.query('DELETE FROM clientes WHERE id = ?', [req.params.id]);
        await conexao.commit();

        res.status(204).send();
    }catch(err){
        await conexao.rollback();
        next(err);
    } finally {
        conexao.release();
    }
}