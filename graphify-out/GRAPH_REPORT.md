# Graph Report - amostras  (2026-10-18)

## Corpus Check
- Large corpus: 249 files · ~2,225,078 words. Semantic extraction will be expensive (many Claude tokens). Consider running on a subfolder.

## Summary
- 281 nodes · 278 edges · 10 communities (9 shown, 1 thin omitted)
- Extraction: 87% EXTRACTED · 12% INFERRED · 1% AMBIGUOUS · INFERRED: 33 edges (avg confidence: 0.88)
- Token cost: não disponibilizado pelo ambiente; nenhum consumo zero foi medido.

## Community Hubs (Navigation)
- Conteúdo ALM.Jpeg
- Conteúdo CLL.Jpeg
- Conteúdo ALL.Jpeg
- Conteúdo LMC.jpg
- Conteúdo CML.Jpeg
- Conteúdo saudavel.jpg
- Conteúdo 1777907173332-CLL.Jpeg
- Conteúdo normal.jpg
- Amostras e limitações
- Amostras e limitações

## God Nodes (most connected - your core abstractions)
1. `Imagem de amostra ALM.Jpeg (nome não validado como diagnóstico)` - 59 edges
2. `Campo microscópico nomeado CLL.Jpeg` - 58 edges
3. `Esfregaço LMC.jpg com marca UFG` - 48 edges
4. `Imagem de amostra ALL.Jpeg (nome não validado como diagnóstico)` - 47 edges
5. `Esfregaço com anotações numéricas CML.Jpeg` - 31 edges
6. `Fotomicrografia de esfregaço sanguíneo saudavel.jpg` - 11 edges
7. `Montagem de dois campos nomeada 1777907173332-CLL.Jpeg` - 8 edges
8. `Fotomicrografia de esfregaço sanguíneo normal.jpg` - 6 edges
9. `Painel direito com quatro células de aspecto linfoide maduro` - 3 edges
10. `Padrão sugestivo de população linfoide madura, confirmação pendente` - 3 edges

## Surprising Connections (you probably didn't know these)
- `Esfregaço com anotações numéricas CML.Jpeg` --semantically_similar_to--> `Esfregaço LMC.jpg com marca UFG`  [INFERRED] [semantically similar]
  CML.Jpeg → LMC.jpg
- `Campo microscópico nomeado CLL.Jpeg` --semantically_similar_to--> `Montagem de dois campos nomeada 1777907173332-CLL.Jpeg`  [INFERRED] [semantically similar]
  CLL.Jpeg → 1777907173332-CLL.Jpeg
- `1777225623817-ALL.Jpeg (cópia idêntica)` --shares_data_with--> `Imagem de amostra ALL.Jpeg (nome não validado como diagnóstico)`  [EXTRACTED]
  1777225623817-ALL.Jpeg → ALL.Jpeg
- `1777225827486-ALL.Jpeg (cópia idêntica)` --shares_data_with--> `Imagem de amostra ALL.Jpeg (nome não validado como diagnóstico)`  [EXTRACTED]
  1777225827486-ALL.Jpeg → ALL.Jpeg
- `1777226586049-1777225623817-ALL.Jpeg (cópia idêntica)` --shares_data_with--> `Imagem de amostra ALL.Jpeg (nome não validado como diagnóstico)`  [EXTRACTED]
  1777226586049-1777225623817-ALL.Jpeg → ALL.Jpeg

## Communities (10 total, 1 thin omitted)

### Community 0 - "Conteúdo ALM.Jpeg"
Cohesion: 0.03
Nodes (58): 1781522306490-ALM.Jpeg (cópia idêntica), 1781522374085-ALM.Jpeg (cópia idêntica), 1781522436571-ALM.Jpeg (cópia idêntica), 1781522480556-ALM.Jpeg (cópia idêntica), 1781523183667-ALM.Jpeg (cópia idêntica), 1781523240971-ALM.Jpeg (cópia idêntica), 1781523305737-ALM.Jpeg (cópia idêntica), 1781533644893-ALM.Jpeg (cópia idêntica) (+50 more)

### Community 1 - "Conteúdo CLL.Jpeg"
Cohesion: 0.04
Nodes (56): 1777219277424-CLL.Jpeg (cópia idêntica), 1777225162592-CLL.Jpeg (cópia idêntica), 1780197302047-1777219277424-CLL.Jpeg (cópia idêntica), 1780197476157-1777219277424-CLL.Jpeg (cópia idêntica), 1781521829539-1777225162592-CLL.Jpeg (cópia idêntica), 1781521906566-1777225162592-CLL.Jpeg (cópia idêntica), 1781521957671-1777225162592-CLL.Jpeg (cópia idêntica), 1781522043798-1777225162592-CLL.Jpeg (cópia idêntica) (+48 more)

### Community 2 - "Conteúdo ALL.Jpeg"
Cohesion: 0.04
Nodes (48): 1777225623817-ALL.Jpeg (cópia idêntica), 1777225827486-ALL.Jpeg (cópia idêntica), 1777226586049-1777225623817-ALL.Jpeg (cópia idêntica), 1777246369785-ALL.Jpeg (cópia idêntica), 1777251036669-1777246369785-ALL.Jpeg (cópia idêntica), 1777251466298-1777251036669-1777246369785-ALL.Jpeg (cópia idêntica), 1777251571999-1777251036669-1777246369785-ALL.Jpeg (cópia idêntica), 1777251979588-1777246369785-ALL.Jpeg (cópia idêntica) (+40 more)

### Community 3 - "Conteúdo LMC.jpg"
Cohesion: 0.04
Nodes (48): 1777226861463-LMC.jpg (cópia idêntica), 1780197619845-1777226861463-LMC.jpg (cópia idêntica), 1781518669526-1780197619845-1777226861463-LMC.jpg (cópia idêntica), 1781519719952-1780197619845-1777226861463-LMC.jpg (cópia idêntica), 1781519914527-1780197619845-1777226861463-LMC.jpg (cópia idêntica), 1781520141400-1780197619845-1777226861463-LMC.jpg (cópia idêntica), 1781520230382-1780197619845-1777226861463-LMC.jpg (cópia idêntica), 1781520775115-1781519914527-1780197619845-1777226861463-LMC.jpg (cópia idêntica) (+40 more)

### Community 4 - "Conteúdo CML.Jpeg"
Cohesion: 0.06
Nodes (30): 1777412535842-CML.Jpeg (cópia idêntica), 1777412888711-CML.Jpeg (cópia idêntica), 1777415500649-CML.Jpeg (cópia idêntica), 1777417463313-CML.Jpeg (cópia idêntica), 1777485143699-CML.Jpeg (cópia idêntica), 1777485644190-CML.Jpeg (cópia idêntica), 1777485987537-CML.Jpeg (cópia idêntica), 1777487448083-CML.Jpeg (cópia idêntica) (+22 more)

### Community 5 - "Conteúdo saudavel.jpg"
Cohesion: 0.17
Nodes (11): 1777225533634-saudavel.jpg (cópia idêntica), 1777252844912-saudavel.jpg (cópia idêntica), 1777253384890-1777252844912-saudavel.jpg (cópia idêntica), 1784656337350-1777252844912-saudavel.jpg (cópia idêntica), 1784815154475-saudavel.jpg (cópia idêntica), 1784815242899-saudavel.jpg (cópia idêntica), 1784815782148-saudavel.jpg (cópia idêntica), 1784815847874-saudavel.jpg (cópia idêntica) (+3 more)

### Community 6 - "Conteúdo 1777907173332-CLL.Jpeg"
Cohesion: 0.18
Nodes (10): 1777416560536-CLL.Jpeg (cópia idêntica), 1777417451554-CLL.Jpeg (cópia idêntica), 1777903906179-CLL.Jpeg (cópia idêntica), 1777906675873-CLL.Jpeg (cópia idêntica), 1777906840815-CLL.Jpeg (cópia idêntica), Padrão sugestivo de população linfoide madura, confirmação pendente, Montagem de dois campos nomeada 1777907173332-CLL.Jpeg, Painel esquerdo panorâmico com células nucleadas e material nuclear borrado (+2 more)

### Community 7 - "Conteúdo normal.jpg"
Cohesion: 0.29
Nodes (6): 1777252951723-normal.jpg (cópia idêntica), 1777253324022-normal.jpg (cópia idêntica), 1777253527618-1777253324022-normal.jpg (cópia idêntica), Fotomicrografia de esfregaço sanguíneo normal.jpg, Uma célula compatível com linfócito maduro, Marca d'água Controllab

### Community 8 - "Amostras e limitações"
Cohesion: 0.50
Nodes (3): Hipótese morfológica linfoide madura, LLC não confirmada, Cromatina predominantemente condensada e citoplasma escasso, Quatro células nucleadas predominantemente linfoides visíveis

## Ambiguous Edges - Review These
- `Cromatina predominantemente condensada e citoplasma escasso` → `Hipótese morfológica linfoide madura, LLC não confirmada`  [AMBIGUOUS]
  CLL.Jpeg · relation: conceptually_related_to
- `Estruturas candidatas a sombras de Gumprecht` → `Padrão sugestivo de população linfoide madura, confirmação pendente`  [AMBIGUOUS]
  1777907173332-CLL.Jpeg · relation: conceptually_related_to
- `Painel direito com quatro células de aspecto linfoide maduro` → `Padrão sugestivo de população linfoide madura, confirmação pendente`  [AMBIGUOUS]
  1777907173332-CLL.Jpeg · relation: conceptually_related_to

## Knowledge Gaps
- **252 isolated node(s):** `Variação de contorno e textura nuclear`, `Célula indicada por seta com núcleo aparentemente multilobulado`, `Hemácias de contorno irregular, seta e marca d'água`, `Hemácias com alinhamentos e sobreposições frequentes`, `Marca d'água sobreposta ao canto inferior direito` (+247 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 260 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Esfregaço LMC.jpg com marca UFG` connect `Conteúdo LMC.jpg` to `Conteúdo CML.Jpeg`?**
  _High betweenness centrality (0.067) - this node is a cross-community bridge._
- **Are the 4 inferred relationships involving `Imagem de amostra ALM.Jpeg (nome não validado como diagnóstico)` (e.g. with `Campo isolado insuficiente para hiato ou exclusão de leucemia` and `Células nucleadas dispersas com contornos variados`) actually correct?**
  _`Imagem de amostra ALM.Jpeg (nome não validado como diagnóstico)` has 4 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Variação de contorno e textura nuclear`, `Célula indicada por seta com núcleo aparentemente multilobulado`, `Hemácias de contorno irregular, seta e marca d'água` to the rest of the system?**
  _252 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Conteúdo ALM.Jpeg` be split into smaller, more focused modules?**
  _Cohesion score 0.03389830508474576 - nodes in this community are weakly interconnected._
- **Why does `Campo microscópico nomeado CLL.Jpeg` connect `Conteúdo CLL.Jpeg` to `Amostras e limitações`, `Conteúdo 1777907173332-CLL.Jpeg`?**
  _High betweenness centrality (0.062) - this node is a cross-community bridge._

### Low-confidence Hints
_AMBIGUOUS edges — the extractor was unsure. Verify before acting on these._

- **What is the exact relationship between `Cromatina predominantemente condensada e citoplasma escasso` and `Hipótese morfológica linfoide madura, LLC não confirmada`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `Estruturas candidatas a sombras de Gumprecht` and `Padrão sugestivo de população linfoide madura, confirmação pendente`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._

## Auditoria deste corpus

249 arquivos, 8 conteúdos SHA-256 distintos; extração visual por conteúdo, cópias vinculadas por hash. Diagnósticos dos nomes não foram validados. Há recorte compartilhado entre as duas imagens nomeadas CLL. Relações morfológicas são inferências, não evidência clínica confirmada. A estimativa de 2.225.078 palavras da detecção corresponde a estimativa para imagens, não texto contado.

Tokens: a ferramenta de subagentes não disponibilizou contagens nesta sessão. O custo real não foi medido e os totais do rastreador excluem esta execução.

graphify-out/ foi escrito na árvore de trabalho e não está ignorado pelo Git. Os três artefatos principais são graph.html, graph.json e GRAPH_REPORT.md.
