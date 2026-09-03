import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './config/db.js';
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
        recursos: ['/produtos', '/pedidos'],
        health: '/health'
    });
});

app.use('/produtos', produtosRoutes);
app.use('/pedidos', pedidosRoutes);

try {
    await pool.query('SELECT 1');
    console.log('Conectado ao MySQL');
} catch (err) {
    console.error('Deu erro ao conectar com MySQL:', err.message);
}

app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
