# Exportação de listagens e fichas (PDF e Excel)

## Finalidade

Toda listagem do sistema tem dois botões, **PDF** (vermelho) e **Excel** (verde),
que exportam exatamente o que está na tela: a busca, os filtros e a ordenação
aplicados são respeitados, e os filtros ativos aparecem escritos no cabeçalho do
arquivo. Algumas telas também geram a **ficha em PDF** de um único registro.

Tudo é gerado no navegador. A API não participa, então a exportação funciona com
os dados que a página já carregou.

## Onde estão os botões

| Perfil | Tela | O que exporta |
| --- | --- | --- |
| Administrador | `Adm/crudmedico.html` | Lista de médicos |
| Administrador | `Adm/crudpaciente.html` | Lista de pacientes |
| Administrador | `Adm/crudconsulta.html` | Lista de consultas |
| Médico | `Med/crudconsulta_med.html` | Minhas consultas (com coluna "Anamnese") |
| Médico | `Med/crudexame.html` | Lista de exames |
| Médico | `Med/crudresultado.html` | Lista de resultados (texto completo do resultado) |
| Médico | `Med/crudanamnese.html` | Lista de anamneses (sintomas e comorbidades completos) |
| Médico | `Med/crudanaliseia.html` | Lista de análises IA |
| Médico | `Med/calendario.html` | Consultas do **mês exibido**, respeitando status e paciente |
| Paciente | `Paciente/historicoPaciente.html` | Minhas consultas ou Meus exames (conforme a aba) |
| Paciente | `Paciente/resultadosExame.html` | Resultados de exames |

Fichas de um registro (botão de PDF dentro do detalhe):

- `Med/crudanaliseia.html` → **Baixar relatório** da análise IA. Sai no
  formato de **laudo clínico** (ver "Laudo clínico" abaixo), não no visual das
  fichas.
- `Paciente/historicoPaciente.html` → **Exportar PDF** da consulta ou do exame
  selecionado.
- `Paciente/resultadosExame.html` → **Exportar PDF** no modal do exame.

Existem, portanto, **dois PDFs de laudo da IA**, feitos por caminhos diferentes:

| Onde | Quem gera | Quando existe |
| --- | --- | --- |
| `Med/nova_analise_ia.html` → **Baixar PDF do laudo** | API, `backend/hemoPDF.py` (reportlab) | Só logo depois de gerar a análise; a API devolve o arquivo em base64 e ele não é guardado no banco |
| `Med/crudanaliseia.html` → **Baixar relatório** | Navegador, `exportarLaudoPDF` | A qualquer momento, a partir do texto `resultado_ia` gravado no banco |

Os painéis iniciais (Administrador, Médico, Paciente) não têm exportação: são
resumos, e o "Ver todos" de cada card leva à listagem que exporta.

## Módulo `front/JS/exportar.js`

Um único módulo faz o PDF e o Excel. Cada página só descreve **o que** exportar:

```js
HematoExport.criarBotoes(elementoOndeInserir, {
  titulo: 'Lista de Médicos',           // texto ou função
  arquivo: 'medicos',                   // vira hematoai-medicos-AAAA-MM-DD.pdf
  obterLinhas: () => listaExibida,      // os registros que a tela mostra agora
  filtros: [                            // lidos dos campos na hora de exportar
    { rotulo: 'Busca', id: 'searchMedico' },
    { rotulo: 'Status', id: 'filterStatus' }
  ],
  colunas: [                            // array ou função
    { titulo: 'Nome', valor: m => m.nome, destaque: true },
    { titulo: 'CPF', valor: m => formatarCPF(m.cpf) },
    { titulo: 'Status', valor: m => m.status,
      cor: v => v === 'Ativo' ? HematoExport.cores.verde : HematoExport.cores.vermelho }
  ]
});
```

- `colunas[].valor` recebe o registro e devolve texto já formatado. Valor vazio
  sai como `—`.
- Opções de coluna: `destaque` (negrito), `alinhar` (`'center'`/`'right'`),
  `largura` (mm, fixa a coluna no PDF), `cor(valorTexto)` (só no Excel: pinta o
  texto pelo próprio conteúdo da célula — ver `HematoExport.cores` abaixo).
- `filtros` aceita `{ rotulo, id }` (select só aparece se tiver valor; campo de
  texto aparece entre aspas; `type="date"` sai como dd/mm/aaaa) ou
  `{ rotulo, texto: () => string }`.
- Para acompanhar o que a tela mostra, cada página guarda a lista filtrada numa
  variável (`listaExibida` ou a `filtrados` que já existia) no mesmo ponto em
  que chama a renderização da tabela.

Ficha de um registro:

```js
HematoExport.exportarFichaPDF({
  titulo: 'Ficha do Exame',
  arquivo: 'exame-12',
  subtitulo: 'Hemograma · 02 de setembro de 2026',   // texto ou lista de textos
  secoes: [{ titulo: 'Informações do Exame', campos: [['Tipo', 'Hemograma']] }],
  textos: [{ titulo: 'Resultado do Exame', conteudo: textoLongo }]
}, botaoClicado);
```

Laudo clínico (usado pela Análise IA):

```js
HematoExport.exportarLaudoPDF({
  titulo: 'Laudo de Hematologia - Triagem morfológica por IA', // se o texto não trouxer título
  arquivo: 'laudo-analise-ia-12',
  paciente: 'Nome',                        // repetido no topo das páginas 2+
  campos: [['Paciente', 'Nome'], ['Nascimento', '12/03/1959']], // 2 por linha
  omitirSecoes: ['IDENTIFICAÇÃO'],         // seções do texto que repetem o cabeçalho
  tituloAbertura: 'IMPRESSÃO DIAGNÓSTICA', // título das linhas antes da 1ª seção
  impressao: [['Grau de suspeita', 'Moderada']], // usada se o texto não tiver abertura
  medico: { nome: 'João Silva', crm: '123456SP' }, // bloco de assinatura
  texto: resultadoIA
}, botaoClicado);
```

O texto da IA é interpretado assim: o bloco entre os primeiros `=====` vira o
título centralizado (a parte depois de ` - ` vira o subtítulo); linhas inteiras
em caixa alta viram títulos de seção; `Rótulo: valor` sai com o rótulo em
negrito; `- item` vira marcador; o último bloco entre `=====` vira a nota final
em itálico (se não houver, entra o aviso padrão de apoio à decisão). Os campos
técnicos `SUSPEITA_PRINCIPAL` / `NÍVEL_CONFIANÇA` nunca aparecem. Análises
antigas com texto corrido saem com a impressão diagnóstica montada a partir dos
campos gravados e o texto numa seção "RESULTADO".

A listagem `GET /analise-ia` (`AnaliseIADAO.findByCrm`) devolve, além dos dados
da análise, `data_exame`, `crm`, `data_nasc`, `sexo` e `nome_medico`, usados
nesse cabeçalho.

Para adicionar exportação a uma nova listagem: incluir
`<script src="../JS/exportar.js"></script>` depois de `navbar.js`, guardar a
lista filtrada numa variável e chamar `HematoExport.criarBotoes` com as colunas.

## Aparência dos arquivos

**PDF** (A4, retrato até 5 colunas, paisagem acima disso):

- faixa vermelha no topo, selo "H" e o nome **HematoAI**, data/hora de emissão e
  quem emitiu (nome e perfil da sessão);
- caixa bege com barra vermelha: título, total de registros e filtros aplicados;
- tabela com cabeçalho vermelho (`#b91c1c`) e texto branco, linhas alternando
  branco e bege (`#faf5ee`), divisórias bege;
- quando a lista não cabe numa página, a tabela continua na seguinte com o
  **cabeçalho repetido** e a faixa "(continuação)";
- rodapé em todas as páginas com "Página X de Y";
- cada coluna tem largura mínima: o cabeçalho sempre cabe numa linha e valores
  curtos (nome, data, status) não quebram; só colunas de texto longo quebram em
  várias linhas.

**Laudo clínico** (A4 retrato, modelo de laudo impresso de clínica):

- preto e branco; a única cor é a marca HematoAI no canto superior esquerdo;
- "Página: X de Y" em negrito-itálico no canto superior direito de todas as
  páginas; da página 2 em diante, o nome do paciente logo abaixo;
- título centralizado em caixa alta e subtítulo menor;
- bloco de identificação em duas colunas (Paciente, Nascimento, CPF, Idade,
  Sexo, Exame, Médico responsável, Data do exame, CRM, Data da análise), com
  rótulo em negrito, fechado por uma linha;
- seções com título em negrito e texto corrido, sem caixas nem fundos;
- linha de assinatura centralizada com nome e CRM do médico, seguida do aviso
  de apoio à decisão; os dois ficam sempre na mesma página;
- rodapé com linha e "HematoAI · Laudo emitido em … por …";
- título de seção nunca fica sozinho no pé da página.

**Excel** (`.xlsx`):

- linha 1 com o título em faixa vermelha, linhas 2–3 com emissão e filtros em
  fundo bege, com uma linha fina separando esse bloco do cabeçalho da tabela;
- linha 4 de cabeçalho vermelho-escuro (altura 20), congelada e com filtro
  automático;
- linhas alternando branco e bege, larguras ajustadas ao conteúdo;
- texto de uma célula pode sair colorido via `coluna.cor(valor)` — por exemplo,
  na planilha de Médicos, Especialidade e E-mail saem em azul e Status sai em
  verde (Ativo) ou vermelho (Desativado). Sem `cor`, o texto fica na cor padrão;
- impressão configurada para caber na largura da página, repetindo o cabeçalho.

`HematoExport.cores` expõe a paleta pronta para usar em `coluna.cor`: `azul`
(`#1d4ed8`), `verde` (`#15803d`) e `vermelho` (`#b91c1c` — mesmo tom da marca).

## Cores dos botões

Tokens em `front/CSS/navbar.css`, com um tom um pouco mais claro no modo escuro:

| Token | Claro | Escuro |
| --- | --- | --- |
| `--pdf` / `--pdf-hover` | `#d9261c` / `#b81f17` | `#e0342a` / `#c92a21` |
| `--excel` / `--excel-hover` | `#1d6f42` / `#185c37` | `#23804c` / `#1d6d40` |

Classes: `.btn-export` + `.btn-export-pdf` ou `.btn-export-excel`, agrupados em
`.export-group`.

## Dependências e comportamento

- Bibliotecas carregadas do cdnjs **só no primeiro clique**: jsPDF 2.5.1,
  jsPDF-AutoTable 3.8.4 e ExcelJS 4.4.0. As páginas não ficam mais pesadas.
- Sem internet, o clique mostra o pop-up padrão de erro ("O gerador de arquivos
  não pôde ser carregado…"); o próximo clique tenta carregar de novo.
- Enquanto o arquivo é montado o botão fica desabilitado com "Gerando…",
  evitando downloads duplicados.
- Lista vazia não gera arquivo: aparece o aviso "Lista vazia".
- Ao concluir, um toast confirma "PDF gerado" / "Planilha Excel gerada".

## Limitações conhecidas

- A fonte do PDF (Helvetica) só desenha o alfabeto latino do Windows-1252.
  Acentos do português, `ç`, `µ`, `×`, `—` e aspas curvas saem corretos; `≥`,
  `≤`, `→` e `←` são trocados por `>=`, `<=`, `->` e `<-`; emojis e outros
  símbolos fora desse conjunto são removidos. O Excel mantém o texto original.
- As datas no Excel são exportadas como texto já formatado (dd/mm/aaaa hh:mm),
  igual ao que aparece na tela.
