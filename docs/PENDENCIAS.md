# Pendências do projeto

## Abertas

- **P-001** · 2026-10-18 · Validar a classificação por IA em conjunto independente de pacientes/esfregaços, com referência diagnóstica revisada por hematopatologista. `tcc2026/amostras` tem 249 arquivos, mas apenas 8 conteúdos SHA-256 distintos; a origem e a confirmação dos rótulos não estão documentadas. O usuário confirmou que `ALM` significa LMA. Essa coleção não sustenta estimativa de acurácia próxima de 100% por classe.
- **P-002** · 2026-10-18 · Executar comparação real antes/depois e avaliação exploratória das amostras após corrigir a credencial local `OPENAI_API_KEY` em `tcc2026/.env`. A chamada real de referência retornou `AuthenticationError`, HTTP 401; nenhuma classificação foi obtida. O usuário autorizou continuar e deixar esse teste pendente. O script `tcc2026/backend/avaliar_amostras.py --executar-api` está preparado para avaliar o prompt revisado, com cobrança da API; não substitui a validação independente P-001.

## Resolvidas

- **P-003** · aberta em 2026-10-18 · resolvida em 2026-10-18 · `api/utils/analiseIA.js` aceitava listas de alternativas ou campos técnicos conflitantes e gravava o primeiro diagnóstico/nível → parser exige um valor completo e uma ocorrência por campo; três testes reproduziram falha antes e passaram após correção; apresentação das seis classes e suíte Node passaram.
- **P-004** · aberta em 2026-10-18 · resolvida em 2026-10-18 · O novo leitor Python inicialmente aceitava texto junto com bloco de recusa → rejeição explícita de `refusal`, com teste falhando antes e passando depois; respostas incompletas e vazias também são rejeitadas antes do PDF.
- **P-005** · aberta em 2026-10-18 · resolvida em 2026-10-18 · O avaliador exploratório inicialmente verificava apenas a classe e poderia contar resposta sem nível como acerto, embora a aplicação a recusasse → reutiliza o parser Node real `extrairCamposTecnicos`; teste cobre nível ausente, conflitos, alternativas e resposta válida, aprovado.
