import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Alguns provedores de MySQL na nuvem (Aiven, PlanetScale, Clever Cloud) exigem SSL.
// Basta setar DB_SSL=true nas variáveis de ambiente do deploy.
const ssl = process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined;

// O plugin MySQL do Railway injeta as variáveis com os nomes MYSQL*.
// Aceitamos os dois formatos para o mesmo código rodar local e no deploy.
const pool = mysql.createPool({
    host: process.env.DB_HOST || process.env.MYSQLHOST,
    port: process.env.DB_PORT || process.env.MYSQLPORT,
    user: process.env.DB_USER || process.env.MYSQLUSER,
    password: process.env.DB_PASSWORD || process.env.MYSQLPASSWORD,
    database: process.env.DB_NAME || process.env.MYSQLDATABASE,
    ssl,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    decimalNumbers: true
});

export default pool;
