import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './config/db.js';
import clientesRoutes from './routes/clientes.js';
import produtosRoutes from './routes/produtos.js';
import pedidosRoutes from './routes/pedidos.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.json({
        mensagem: 'Loja API - Trabalho de Integração de Sistemas',
        equipe: [
            { nome: 'Leonardo Monteiro', instituicao: 'Unifor' },
            { nome: 'Saulo', instituicao: 'Unifor' }
        ],
        recursos: ['/clientes', '/produtos', '/pedidos'],
        health: '/health'
    });
});

app.get('/health', async (req, res) => {
    try {
        await pool.query('SELECT 1');
        res.json({ status: 'ok', banco: 'conectado' });
    } catch (err) {
        res.status(503).json({ status: 'erro', banco: 'desconectado', detalhe: err.message });
    }
});

app.use('/clientes', clientesRoutes);
app.use('/produtos', produtosRoutes);
app.use('/pedidos', pedidosRoutes);

app.use((req, res) => {
    res.status(404).json({ erro: `Rota não encontrada: ${req.method} ${req.originalUrl}` });
});

app.use((err, req, res, next) => {
    console.error('Erro na requisição:', err);

    if (err.type === 'entity.parse.failed') {
        return res.status(400).json({ erro: 'JSON inválido no corpo da requisição' });
    }

    res.status(500).json({ erro: 'Erro interno no servidor' });
});

try {
    await pool.query('SELECT 1');
    console.log('Conectado ao MySQL');
} catch (err) {
    console.error('Deu erro ao conectar com MySQL:', err.message);
}

app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
