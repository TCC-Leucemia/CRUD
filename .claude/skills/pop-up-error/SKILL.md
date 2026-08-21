---
name: pop-up-error
description: Cria e padroniza o pop-up de erro tratado do sistema (web, desktop e mobile). Use ao criar, revisar ou padronizar o modal/pop-up de erro exibido ao usuário, ou ao adicionar tratamento de erro em uma tela/fluxo que ainda não usa o pop-up padrão.
---

# Pop-up de erro padronizado

Todo erro do sistema — de qualquer tela, desktop ou mobile — é mostrado ao usuário através de um único componente de pop-up padronizado, nunca por um alert nativo, stack trace ou código de erro cru.

## 1. Analisar o sistema antes de mexer

Antes de criar ou alterar o pop-up, varrer o projeto:

- Levantar todos os pontos onde erros são capturados hoje (try/catch, handlers de API, validações) e conferir se cada um trata o erro (mensagem amigável) em vez de deixar vazar stack trace, status HTTP cru ou mensagem técnica da exceção para o usuário.
- Ler os arquivos de estilo/tema já existentes (CSS, variáveis de cor, tipografia, componentes de UI já usados) para extrair a paleta e o tom visual reais do sistema — não inventar cores. Se o sistema já é mais tecnológico/sóbrio, o pop-up segue nessa linha; se for mais lúdico, idem.

## 2. Componente único, reutilizado em todo lugar

Existe um único componente de pop-up de erro (não um por tela). Toda tela/fluxo que hoje trata erro de outra forma (alert nativo, toast solto, texto inline) deve migrar para ele.

- Conteúdo: só a mensagem de erro já tratada (texto amigável explicando o que houve), nunca o erro técnico bruto.
- O mais enxuto possível: só cresce em altura/largura se a mensagem realmente exigir mais espaço.

## 3. Posição e tamanho por plataforma

| Plataforma | Posição na tela |
|---|---|
| Aplicação desktop | Canto inferior direito |
| App mobile | Canto inferior direito |
| Site/web | Topo da tela |

- Largura de referência: ~600px numa viewport de 1366px de largura (ajustar proporcionalmente a outras larguras).
- Altura de referência: ~300px numa viewport de 768px de altura (ajustar proporcionalmente; cresce só se o texto exigir).

## 4. Escopo

Vale a partir de agora para qualquer erro tratado do sistema, em qualquer tela — não é preciso pedir de novo a cada tela nova; ao criar uma tela/fluxo com possibilidade de erro, já usar este componente.
