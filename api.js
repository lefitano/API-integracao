import express from 'express';

const app = express();

const PORT = 3001;
const respostaServidor = [
    {nome : "Leonardo", instituição : "Unifor"} ,
    { nome : "Saulo", instituição : "Unifor"}
];

app.get('/', (req, res) => {
    res.send(respostaServidor);
})



app.listen(PORT, () =>  console.log(`Servidor rodando na porta ${PORT}`));