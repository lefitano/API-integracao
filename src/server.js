import express from 'express';
import pool from './config/db.js';


const app = express();

const PORT = 3001;

const respostaServidor = [
    {nome : "Leonardo", instituição : "Unifor"} ,
    { nome : "Saulo", instituição : "Unifor"}
];

app.get('/', (req, res) => {
    res.send("Nosso servidor ta rodando", respostaServidor);
})





    try{
        await pool.query('SELECT 1');
        console.log("Conectado ao MYSQL");
    } catch(err){
        console.error("Deu erro ao conectar com MYSQL", err.message);
    }

app.listen(PORT, () =>  console.log(`Servidor rodando na porta ${PORT}`));