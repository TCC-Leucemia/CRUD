# Tratamento de erros

## Finalidade

Todo erro da API passa por um único tradutor, `tcc2026/api/utils/tratamentoErros.js`,
registrado como último middleware do Express em `tcc2026/api/app.js`. Ele
transforma qualquer falha (banco de dados, corpo da requisição, upload, regra
de negócio ou erro inesperado) em duas saídas diferentes:

- **a resposta HTTP**, lida pelo usuário na tela: diz *o que* aconteceu, com
  status correto e uma mensagem em português;
- **o registro no terminal** de quem roda a API: diz *como resolver*, com o
  código técnico, o host/porta do banco, qual variável do `.env` conferir e a
  mensagem original do MySQL ou do Node.

A regra de segurança é que a resposta nunca carrega mensagem crua de
biblioteca, SQL, caminho de arquivo, nome de variável de ambiente, senha ou
qualquer dado que ajude a atacar o sistema. Esses detalhes ficam só no
terminal. A senha do banco não aparece nem lá.

Os controllers não respondem erro por conta própria: todo `catch` chama
`next(erro)`, e as regras de negócio lançam `ErrorResponse(status, mensagem)`
com a mensagem já escrita para o usuário final — essas passam intactas.

## Formato da resposta de erro

```json
{
  "status": false,
  "msg": "Texto para o usuário, em português.",
  "detalhes": { "codigo": "BANCO_ACESSO_NEGADO" }
}
```

`detalhes.codigo` é um código estável da aplicação (não o código interno do
MySQL). Em erros de regra de negócio (`ErrorResponse`), `detalhes` é o objeto
que a regra informou.

## Códigos devolvidos

| Situação | Status | `codigo` | O que o terminal registra |
| --- | --- | --- | --- |
| MySQL desligado ou inalcançável (`ECONNREFUSED`, `ETIMEDOUT`, …) | 503 | `BANCO_INDISPONIVEL` | host:porta tentados; conferir se o serviço está rodando e `DB_HOST`/`DB_PORT` |
| MySQL recusou usuário/senha (`ER_ACCESS_DENIED_ERROR`, …) | 503 | `BANCO_ACESSO_NEGADO` | usuário recusado; conferir `DB_USER`/`DB_PASSWORD` e privilégios |
| Banco inexistente (`ER_BAD_DB_ERROR`) | 503 | `BANCO_INEXISTENTE` | rodar `api/database/banco.sql` ou corrigir `DB_NAME` |
| Tabela/coluna inexistente (`ER_NO_SUCH_TABLE`, …) | 500 | `BANCO_ESTRUTURA` | banco desatualizado em relação ao `banco.sql` |
| Registro duplicado (`ER_DUP_ENTRY`) | 409 | `REGISTRO_DUPLICADO` | mensagem do MySQL |
| Exclusão de registro vinculado (`ER_ROW_IS_REFERENCED_2`) | 409 | `REGISTRO_EM_USO` | chave estrangeira que bloqueou |
| Referência a registro inexistente (`ER_NO_REFERENCED_ROW_2`) | 400 | `REFERENCIA_INEXISTENTE` | chave estrangeira sem par |
| Texto maior que a coluna (`ER_DATA_TOO_LONG`) | 400 | `CAMPO_GRANDE_DEMAIS` | coluna afetada |
| Valor nulo/inválido para a coluna (`ER_BAD_NULL_ERROR`, …) | 400 | `VALOR_INVALIDO` | coluna e valor |
| JSON malformado no corpo | 400 | `CORPO_INVALIDO` | erro de parse |
| Corpo acima do limite | 413 | `CORPO_GRANDE_DEMAIS` | limite em bytes |
| Upload recusado (multer) | 400 | `ARQUIVO_INVALIDO` | código do multer |
| Rota inexistente | 404 | `ROTA_INEXISTENTE` | — |
| Erro 4xx de outra biblioteca | o próprio | `REQUISICAO_INVALIDA` | mensagem da biblioteca |
| Qualquer outro erro | 500 | `ERRO_INTERNO` | stack trace completo |

Requisições sem corpo JSON chegam com `req.body = {}` (middleware logo após
`express.json()` em `app.js`). Sem isso, no Express 5 qualquer `req.body.campo`
viraria erro 500 em vez de cair na validação de campo obrigatório (400).

## Sessão (JWT)

`JwtMiddleware` distingue sessão vencida de sessão adulterada, porque isso pode
ser dito ao usuário sem risco: "Sessão expirada. Entre novamente para
continuar." versus "Sessão inválida. …". Token de uma conta que foi removida
depois do login recebe a mesma "Sessão inválida", para não confirmar se a conta
existia. O motivo da falha vem de `MeuTokenJWT.motivoFalha`.

## Mensagens que não podem ser precisas

Alguns erros são genéricos de propósito, porque a precisão ajudaria um atacante:

- **Login:** usuário inexistente e senha errada dão a mesma resposta, "Email ou
  senha inválidos". "Usuário desativado." só aparece para quem acertou a senha.
- **Recuperação de senha:** CPF inexistente, código errado, vencido ou nunca
  pedido têm respostas idênticas. Ver [recuperacao-de-senha.md](recuperacao-de-senha.md).
- **Análise IA:** a tela diz o que falhou (IA sem configuração, credencial
  recusada, limite de uso, instalação incompleta); a orientação técnica
  (caminhos, `OPENAI_API_KEY`, biblioteca Python ausente, saída do Python) vai
  só para o terminal, via `falhaAnalise` em `service/AnaliseIAService.js`.

## Front

`tcc2026/front/JS/erro-popup.js` exibe a mensagem que a API mandou. A lista
`CASOS_CONHECIDOS` só troca categoria e título para situações que merecem
destaque (banco indisponível, acesso ao banco recusado, banco não encontrado,
sessão expirada/inválida); o texto continua sendo o da API. Uma entrada só
define `mensagem` própria quando o texto da API não deve ser mostrado.

## Logs

Os `console.log` que imprimiam dados pessoais ou hash de senha (atualização de
login, corpo do cadastro de paciente, CPF/CRM de consultas e exames) foram
removidos. Erros aparecem no terminal no formato:

```
[ERRO 503] POST /auth -> BANCO_ACESSO_NEGADO
  MySQL em 127.0.0.1:3306 recusou o usuário "Todeschini" (ER_ACCESS_DENIED_ERROR). Confira DB_USER e DB_PASSWORD em tcc2026/.env …
```

Erros de regra de negócio (`ErrorResponse`) não geram registro: são
respostas esperadas, não falhas.

## Testes

`npm test` (na pasta `tcc2026`) roda `api/tests/tratamento-erros.test.js`, que
confere status, código e mensagem de cada situação da tabela acima e falha se
alguma resposta vazar SQL, nome de variável, senha ou caminho de arquivo — ou
se o terminal registrar a senha do banco.
