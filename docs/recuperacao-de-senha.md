# Recuperação de senha

## Finalidade

Quem esqueceu a senha recupera o acesso pelo CPF, em três telas de
`tcc2026/front/Senha/`, cada uma ligada a uma rota pública da API
(`api/routes/RotasLogin.js`, lógica em `api/service/LoginService.js`):

| Tela | Rota | O que acontece |
| --- | --- | --- |
| `esqueci_senha.html` | `POST /auth/esqueci-senha` `{ cpf }` | Se houver conta com esse CPF, envia um código de 6 dígitos para o e-mail dela (válido por 10 minutos). |
| `confirmar_codigo.html` | `POST /auth/validar-codigo` `{ cpf, codigo }` | Código certo: devolve um **token de uso único** (válido por 10 minutos) e o código deixa de valer. |
| `nova_senha.html` | `POST /auth/alterar-senha-recuperacao` `{ cpf, token, novaSenha }` | Só troca a senha com o token daquele CPF; o token é descartado após o uso. |

O CPF fica em `localStorage` (`cpfRecuperacao`) entre as telas; o token fica em
`sessionStorage` (`tokenRecuperacao`), que some quando a aba é fechada. Sem
token, a tela de nova senha manda o usuário de volta ao início do fluxo.

## Regras de segurança

Até setembro de 2026, a troca de senha aceitava só o CPF, sem conferir código
nenhum: qualquer pessoa que soubesse um CPF cadastrado trocava a senha daquela
conta, inclusive de administrador. As regras abaixo fecham esse e outros
caminhos:

- **Token obrigatório:** `alterarSenhaRecuperacao` exige o token entregue por
  `validarCodigo` para o mesmo CPF. O servidor guarda só o hash SHA-256 do
  token, compara em tempo constante e apaga o registro depois da troca. Token
  de outro CPF, vencido ou já usado é recusado.
- **Nada revela se o CPF tem conta:** CPF inexistente recebe a mesma resposta
  de CPF cadastrado ("Se o CPF estiver cadastrado, enviaremos um código…").
  Código errado, vencido ou nunca pedido recebem a mesma mensagem ("Código
  inválido ou expirado…"). Falha no envio do e-mail também não muda a
  resposta; ela fica registrada só no terminal da API.
- **Limite de tentativas:** 5 códigos errados invalidam o código; é preciso
  pedir outro. Sem isso, os 900 mil códigos possíveis poderiam ser testados um
  a um.
- **Código imprevisível:** gerado com `crypto.randomInt` (não `Math.random`).
- **Reenvio controlado:** pedir de novo em menos de 1 minuto não dispara outro
  e-mail; o código já enviado continua valendo.
- **Senha nova:** entre 8 e 255 caracteres, a mesma regra da tela. Senha fora
  da regra não consome o token, para o usuário corrigir e reenviar.

Os códigos e tokens ficam em memória no processo da API: reiniciar o servidor
invalida recuperações em andamento.

## Testes

`npm test` (na pasta `tcc2026`) roda `api/tests/recuperacao-senha.test.js`, que
exercita o `LoginControl` real com um banco falso em memória e confere: troca
sem código recusada, resposta igual para CPF cadastrado e inexistente, mesma
mensagem para código errado e nunca pedido, bloqueio após 5 erros, token de
uso único e token de outro CPF recusado. Esses testes falham no código anterior
à correção.
