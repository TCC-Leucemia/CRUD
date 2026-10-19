# Tarefa — reformular o prompt do laudo de leucemia (análise IA)

## Skills e comandos invocados

- `/skills-aura:aura` — não pôde ser carregada pelo Claude (skill com
  `disable-model-invocation`); o usuário precisa digitá-la sozinho para ativá-la.
- Anexo: `C:\Users\Pichau\Downloads\imagens TCC.zip` (imagens de teste).

## O que foi pedido

1. Reformular o prompt atual que gera o laudo (tipos de leucemia ou célula normal).
2. Problemas relatados: LMA acerta; LMC é confundida com LMA; LLC é confundida com LLA;
   LLA "dá erro".
3. O prompt deve identificar pelo menos o tipo (LMA, LLA, LMC, LLC) ou NORMAL nas imagens
   do zip, "com extrema precisão"; o ideal é funcionar também com imagens além dessas.
4. **Não modificar o formato de retorno do laudo** (Parte 1 + Parte 2, mesmos campos).
5. Adicionar ao prompt referências (links) para a API "acessar, estudar e entender" o tema
   — o usuário enviou uma lista de referências como exemplo.
6. Modelo usado: `gpt-6-sol`.

## Objetivo

Prompt novo, no mesmo formato de saída, que classifique corretamente as imagens do zip
e generalize para imagens novas de esfregaço.

## Restrições

- Formato do laudo (Parte 1 e Parte 2) inalterado — o backend faz parse desses campos.
- Manter o caráter de apoio à decisão (revisão por hematologista).

## Checklist

- [x] Ler o prompt atual no código e `docs/analise-ia.md` (o do disco era outro: inglês, escores em %, sem Parte 2)
- [x] Extrair e inspecionar as imagens do zip — 6 imagens rotuladas pelo nome (LLA, LLC, LMA, LMC, normal, saudavel)
- [x] Tirar dúvidas com o usuário — base: só `analise_celular.py`; referências embutidas; suspeita morfológica sem grau Alto; pode testar na API
- [x] Reescrever critérios morfológicos e regra de decisão (critérios por classe + desempate por par confundido)
- [x] Adicionar bloco de referências (embutido; só as de hematologia da lista + WHO 2022, ICC 2022, iwCLL 2018, Bain)
- [x] Conferir que os campos do formato continuam os mesmos — Parte 1 e Parte 2 copiadas do pedido; 8 campos da Parte 2 encontrados; `extrair_relatorio_clinico` e o regex de `SUSPEITA_PRINCIPAL` continuam válidos
- [x] Validar com as imagens do zip na API real — chave fornecida pelo usuário (`/skills-aura:aura`); `gpt-6-sol`; 24/24 com o prompt final (ver Estado)
- [x] Atualizar `docs/analise-ia.md` e `docs/PENDENCIAS.md` (P-008)

## Estado

Prompt reescrito em `tcc2026/backend/analise_celular.py` (único arquivo de código alterado).
Também: `MODELO` lido de `OPENAI_MODEL` (padrão `gpt-4.1`), `max_output_tokens` 2600→6000 e
leitura por `response.output_text` (a antiga `output[0].content[0].text` quebra com
modelos que devolvem item de raciocínio antes do texto).

Verificado: prompt renderiza sem marcador/chave sobrando; laudo de amostra é extraído e
traz os 8 campos; `npm test` 64/64.
Rodadas na API (`gpt-6-sol`): r1 4/6 (LLA e LLC → LMA: célula rompida lida como granulação;
"heterogêneo = LMA") → artefatos + roteiro por citoplasma: r2 5/6, r3 6/6, r4 5/6 (LLC → LLA)
→ distribuição (espalhado × lâmina) e textura da cromatina: r5 6/6, a2 (transformadas) 6/6,
r6 6/6, c1 (cor) 6/6. A rodada a1 tinha erro do próprio teste (recorte tirou os leucócitos;
INDETERMINADO foi a resposta certa). Ponta a ponta pelo CLI gerou PDF. `npm test` 64/64.
Padrão de `OPENAI_MODEL` → `gpt-6-sol`. Concluído; pendências P-011 (conjunto maior) e
P-012 (revogar chave).

Script de teste em
`C:\Users\Pichau\AppData\Local\Temp\claude\C--Users-Pichau-Documents-GitHub-CRUD\de432397-7420-44fe-b490-db48628066cb\scratchpad\testar_prompt.py`
(fora do projeto, a pedido do usuário de não criar arquivos extras).
