# Conexão com o banco de dados

## Finalidade

A API se conecta ao MySQL local através de um único pool criado em
`tcc2026/api/app.js`, repassado a todas as rotas. Esse pool usa o driver
`mysql2`, que fala tanto `mysql_native_password` quanto `caching_sha2_password`
— o plugin de autenticação padrão desde o MySQL 8. O pacote antigo `mysql`
(usado até setembro de 2026) só falava `mysql_native_password`; contra um
MySQL Server 8.4 com usuário criado no padrão atual, a conexão falhava antes
de qualquer consulta rodar, com `ER_NOT_SUPPORTED_AUTH_MODE`.

A configuração de host, porta, usuário, senha e nome do banco vem de variáveis
de ambiente, lidas de `tcc2026/.env` (nunca versionado — ver `.gitignore`). Não
existe usuário ou senha escritos no código: a aplicação usa um usuário próprio
(não `root`), e o `root` fica reservado para administração manual pelo MySQL
Workbench.

## Variáveis de ambiente

| Variável | Uso | Exemplo |
| --- | --- | --- |
| `DB_HOST` | Endereço do MySQL | `127.0.0.1` |
| `DB_PORT` | Porta do MySQL | `3306` |
| `DB_USER` | Usuário da aplicação (não `root`) | `Todeschini` |
| `DB_PASSWORD` | Senha desse usuário no MySQL local | — |
| `DB_NAME` | Banco do projeto | `tccof` |

`DB_HOST`/`DB_PORT`/`DB_NAME` têm valor padrão no código caso a variável não
esteja definida (`127.0.0.1`, `3306`, `tccof`). `DB_USER` é obrigatório: sem
ele, a API para na inicialização com uma mensagem apontando para
`tcc2026/.env.example`. `DB_PASSWORD` não tem padrão — se o usuário do MySQL
tiver senha, ela precisa estar em `tcc2026/.env`.

Para configurar: copiar `tcc2026/.env.example` para `tcc2026/.env` e preencher
os valores reais (o `.env.example` também lista `JWT_SECRET`, `EMAIL_USER`,
`EMAIL_PASS` e `OPENAI_API_KEY`, já usados em outros pontos da API).

## Se o login parar de funcionar por causa do banco

O tradutor de erros (`api/utils/tratamentoErros.js`, ver
[tratamento-de-erros.md](tratamento-de-erros.md)) separa três situações, com
mensagens diferentes na tela e a orientação exata no terminal da API:

- **"Banco de dados indisponível: o MySQL não está respondendo"** — o MySQL
  está desligado ou `DB_HOST`/`DB_PORT` apontam para o lugar errado
  (`ECONNREFUSED`, `ETIMEDOUT`, …).
- **"Acesso ao banco de dados recusado"** — o MySQL está de pé, mas recusou o
  usuário/senha de `tcc2026/.env` (`ER_ACCESS_DENIED_ERROR`). É o que aparece
  enquanto `DB_PASSWORD` ainda tem o valor de exemplo do `.env.example`.
- **"Banco de dados não encontrado"** — o banco `DB_NAME` não existe nesse
  servidor (`ER_BAD_DB_ERROR`).

A tela nunca mostra usuário, senha ou nome de variável; o terminal mostra
qual usuário foi recusado e quais variáveis conferir, sem o valor da senha.

Se o usuário configurado em `DB_USER` não tiver privilégio sobre o banco do
projeto, conceder acesso só a esse banco (nunca `GRANT ALL ON *.*`), pelo
MySQL Workbench, logado como `root`:

```sql
GRANT ALL PRIVILEGES ON tccof.* TO 'Todeschini'@'localhost';
FLUSH PRIVILEGES;
```

Não é necessário (e não deve ser feito) alterar o plugin de autenticação do
MySQL para `mysql_native_password`: o `mysql2` já suporta o padrão atual do
servidor.

## Banco criado antes de 24/09/2026: falta a coluna `login.statusu`

A tabela `login` só ganhou a coluna `statusu` (ativo/desativado, usada pelo
login e por toda requisição autenticada — ver `LoginDAO`, `MedicosDAO`,
`LoginService`, `JwtMiddleware`) em 24/09/2026. Um banco `tccof` criado antes
disso a partir de `api/database/banco.sql` não tem essa coluna, e qualquer
login (mesmo com usuário/senha certos) falha com **"Erro interno ao consultar
o banco de dados"** (`BANCO_ESTRUTURA`, `ER_BAD_FIELD_ERROR` no terminal da
API). Corrigir sem apagar dados, pelo MySQL Workbench:

```sql
ALTER TABLE login ADD COLUMN statusu ENUM('Ativo','Desativado') NOT NULL DEFAULT 'Ativo';
```

O `DEFAULT 'Ativo'` garante que todo usuário já cadastrado continue
conseguindo logar depois do `ALTER TABLE`.
