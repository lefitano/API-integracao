# Deploy no Railway

O projeto já está configurado para o Railway (`railway.json`). O código lê `process.env.PORT`
e aceita tanto as variáveis `DB_*` quanto as `MYSQL*` que o Railway injeta sozinho.

## Passo a passo

### 1. Subir o código pro GitHub
```bash
git add .
git commit -m "feat: CRUD completo de produtos e pedidos + config de deploy"
git push origin main
```

### 2. Criar o projeto no Railway
1. Entrar em https://railway.app e logar com o GitHub.
2. **New Project** → **Deploy from GitHub repo** → escolher `lefitano/API-integracao`.
3. O Railway detecta o Node automaticamente e faz o primeiro build.

### 3. Adicionar o banco MySQL
1. Dentro do mesmo projeto: **New** → **Database** → **Add MySQL**.
2. Não precisa copiar credencial nenhuma à mão — o Railway já expõe `MYSQLHOST`,
   `MYSQLPORT`, `MYSQLUSER`, `MYSQLPASSWORD` e `MYSQLDATABASE` para os serviços do projeto,
   e o `src/config/db.js` lê essas variáveis.

> Se o serviço da API não enxergar as variáveis do banco automaticamente, abrir o serviço da API →
> aba **Variables** → **Add Variable Reference** e apontar cada uma para o serviço MySQL.

### 4. Criar as tabelas
Copiar a **Public Network** URL do serviço MySQL (aba *Connect* → *Public Network*) e rodar o schema:

```bash
mysql -h <host> -P <porta> -u <usuario> -p <database> < schema.sql
```

Ou colar o conteúdo do `schema.sql` direto na aba **Data** → **Query** do serviço MySQL no painel.

### 5. Gerar a URL pública da API
No serviço da API: **Settings** → **Networking** → **Generate Domain**.

### 6. Testar
```bash
curl https://SEU-DOMINIO.up.railway.app/health
# esperado: {"status":"ok","banco":"conectado"}

curl https://SEU-DOMINIO.up.railway.app/produtos
# esperado: os 4 produtos do schema.sql
```

Depois de funcionar, colar a URL na seção **Deploy** do `README.md`.

## Se der erro

| Sintoma | Causa provável |
|---|---|
| `/health` retorna 503 com "Access denied" | Variáveis do banco não chegaram no serviço da API — usar Variable Reference (passo 3) |
| `/produtos` retorna 500 mas `/health` está ok | O `schema.sql` não foi rodado no banco (passo 4) |
| Build falha | Conferir se `package-lock.json` foi commitado junto |
