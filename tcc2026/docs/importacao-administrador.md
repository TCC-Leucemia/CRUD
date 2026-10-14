# Importação de cadastros pelo administrador

## Finalidade

As telas de gerenciamento de médicos e pacientes permitem que somente um usuário com perfil **Administrador** importe cadastros em lote. Na tela de médicos, a importação fica dentro da janela aberta por **Novo Médico**, no botão **Importar** com ícone de arquivo. Ao passar o mouse sobre ele, o sistema explica que um único arquivo pode cadastrar vários médicos. No Chrome e no Edge, o seletor remove a opção de todos os arquivos e mostra apenas `.csv`, `.xml` e `.pdf`; a API repete essa validação antes de gravar qualquer registro.

O CSV deve ter uma linha de cabeçalho; o separador pode ser vírgula, ponto e vírgula ou tabulação. XML pode conter registros repetidos dentro de qualquer elemento. PDF precisa conter texto selecionável e usar linhas no formato `Campo: valor`; documentos escaneados sem OCR são recusados para evitar leitura inventada. Cada cadastro exige os mesmos dados do formulário, incluindo uma senha inicial, endereço e, para médico, CRM e especialidade.

## Endpoint protegido

### `POST /admin/importar/medicos` e `POST /admin/importar/pacientes`

O arquivo é enviado no campo multipart `arquivo`. A rota exige token JWT com papel `Administrador`, limita o tamanho a 10 MB e a quantidade a 500 registros. A importação é transacional: se qualquer CPF, CRM, e-mail ou campo obrigatório for inválido, nenhum registro do arquivo é mantido. As senhas são armazenadas usando o mesmo hash do cadastro manual.
