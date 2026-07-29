create database TCCof;
use TCCof;

create table login (
    id_usuario int auto_increment primary key not null,
    email varchar (100) not null,
    senha varchar (255) not null,
    tipo enum ("Médico", "Paciente", "Administrador") not null
);

create table enderecos (
    id_endereco int auto_increment primary key not null,
    rua varchar (255) not null,

    numero int not null,
    bairro varchar (100) not null,
    cidade varchar (100) not null,
    estado varchar (100) not null,
    cep varchar (10)
);


create table pacientes (
    cpf varchar (11) unique primary key not null,
    nome varchar (200) not null,
    data_nasc date,
    sexo enum ("Masculino", "Feminino") not null,
    email varchar (200) not null,
    telefone varchar (20), 
    id_usuario int not null,
    id_endereco int not null,

    foreign key (id_usuario) references login(id_usuario),
    foreign key (id_endereco) references enderecos(id_endereco)
);
create table medicos (
    crm varchar (11) primary key not null,
    nome varchar (200) not null,
    email varchar (200) not null,
    cpf varchar (11) unique not null,
    telefone varchar (20),
    especialidade varchar (50) not null,
    id_usuario int not null,
    id_endereco int not null,
    foreign key (id_usuario) references login(id_usuario),
    foreign key (id_endereco) references enderecos(id_endereco)
);

CREATE TABLE consultas (
    id_consulta int auto_increment primary key not null,
    cpf varchar (11) not null,
    crm varchar (11) not null,
    data_consulta datetime,
    tipo_consulta varchar(50),
    statusc enum ("Pendente", "Em andamento", "Finalizado"),
    foreign key (cpf) references pacientes(cpf),
    foreign key (crm) references medicos(crm)
);

create table exames (
    id_exame int auto_increment primary key,
    id_consulta int not null,
    tipo_exame ENUM("Hemograma","Mielograma") NOT NULL,
    data_exame datetime,
    statusc enum ("Pendente", "Em andamento", "Finalizado"),

    foreign key (id_consulta) references consultas(id_consulta)
);

create table imagens_exame (
    id_imagem int auto_increment primary key,
    id_exame int not null,
    caminho_arquivo varchar(255),
    descricao varchar(255),
    data_upload date,
    foreign key (id_exame) references exames(id_exame)
);

create table resultados_exame (
    id_resultado int auto_increment primary key,
    id_exame int not null,
    resultado_texto text,
    suspeita_leucemia enum("Baixa","Moderada","Alta","Sem suspeita"),
    tipo_leucemia enum("LLA","LMA","LLC","LMC","Não identificado"),
    data_resultado date,

    foreign key (id_exame) references exames(id_exame)
);
create table analise_ia (
    id_analise int auto_increment primary key,
    id_exame int not null,

    resultado_ia text,

    suspeita_ia enum(
        "Baixa",
        "Moderada",
        "Alta",
        "Sem suspeita"
    ),

    tipo_leucemia_ia enum(
        "LLA",
        "LMA",
        "LLC",
        "LMC",
        "Não identificado"
    ),

    confianca decimal(5,2),

    data_analise date,

    statusc enum(
        "Pendente",
        "Em andamento",
        "Finalizado"
    ),

    foreign key (id_exame)
        references exames(id_exame)
);

create table anamnese (
    id_anamnese int auto_increment primary key,
    cpf varchar (11) not null,
    crm varchar (11) not null,
    id_consulta int not null,
    sintomas text,
    comorbidades text,

    foreign key (id_consulta) references consultas (id_consulta),
    foreign key (cpf) references pacientes (cpf),
    foreign key (crm) references medicos (crm)
);

-- ============================================================
-- CARGA INICIAL DE TESTE
-- Todos os logins abaixo utilizam a senha: 1234
-- ============================================================

START TRANSACTION;

-- 10 registros para a tabela login
INSERT INTO login (id_usuario, email, senha, tipo) VALUES
    (1, 'ana.paciente@teste.com', '81dc9bdb52d04dc20036dbd8313ed055', 'Paciente'),
    (2, 'bruno.paciente@teste.com', '81dc9bdb52d04dc20036dbd8313ed055', 'Paciente'),
    (3, 'carla.paciente@teste.com', '81dc9bdb52d04dc20036dbd8313ed055', 'Paciente'),
    (4, 'diego.paciente@teste.com', '81dc9bdb52d04dc20036dbd8313ed055', 'Paciente'),
    (5, 'carlos.medico@teste.com', '81dc9bdb52d04dc20036dbd8313ed055', 'Médico'),
    (6, 'fernanda.medica@teste.com', '81dc9bdb52d04dc20036dbd8313ed055', 'Médico'),
    (7, 'gustavo.medico@teste.com', '81dc9bdb52d04dc20036dbd8313ed055', 'Médico'),
    (8, 'helena.medica@teste.com', '81dc9bdb52d04dc20036dbd8313ed055', 'Médico'),
    (9, 'igor.medico@teste.com', '81dc9bdb52d04dc20036dbd8313ed055', 'Médico'),
    (10, 'admin@hematoai.com', '81dc9bdb52d04dc20036dbd8313ed055', 'Administrador');

-- 10 registros para a tabela enderecos
INSERT INTO enderecos (id_endereco, rua, numero, bairro, cidade, estado, cep) VALUES
    (1, 'Rua das Flores', 120, 'Centro', 'São Paulo', 'São Paulo', '01001-000'),
    (2, 'Avenida Brasil', 450, 'Jardins', 'São Paulo', 'São Paulo', '01430-001'),
    (3, 'Rua da Bahia', 78, 'Funcionários', 'Belo Horizonte', 'Minas Gerais', '30160-011'),
    (4, 'Avenida Atlântica', 900, 'Copacabana', 'Rio de Janeiro', 'Rio de Janeiro', '22010-000'),
    (5, 'Rua XV de Novembro', 315, 'Centro', 'Curitiba', 'Paraná', '80020-310'),
    (6, 'Avenida Ipiranga', 640, 'Centro Histórico', 'Porto Alegre', 'Rio Grande do Sul', '90010-290'),
    (7, 'Rua das Acácias', 55, 'Boa Viagem', 'Recife', 'Pernambuco', '51020-020'),
    (8, 'Avenida Tancredo Neves', 1020, 'Caminho das Árvores', 'Salvador', 'Bahia', '41820-020'),
    (9, 'Rua das Palmeiras', 233, 'Aldeota', 'Fortaleza', 'Ceará', '60150-160'),
    (10, 'Avenida Goiás', 777, 'Setor Central', 'Goiânia', 'Goiás', '74010-010');

-- 10 registros para a tabela pacientes
INSERT INTO pacientes
    (cpf, nome, data_nasc, sexo, email, telefone, id_usuario, id_endereco)
VALUES
    ('11111111101', 'Ana Souza', '1990-03-15', 'Feminino', 'ana.paciente@teste.com', '(11) 99111-1001', 1, 1),
    ('11111111102', 'Bruno Lima', '1985-07-22', 'Masculino', 'bruno.paciente@teste.com', '(11) 99111-1002', 2, 2),
    ('11111111103', 'Carla Mendes', '1998-11-05', 'Feminino', 'carla.paciente@teste.com', '(31) 99111-1003', 3, 3),
    ('11111111104', 'Diego Alves', '1979-01-30', 'Masculino', 'diego.paciente@teste.com', '(21) 99111-1004', 4, 4),
    ('11111111105', 'Elisa Rocha', '2001-06-18', 'Feminino', 'ana.paciente@teste.com', '(41) 99111-1005', 1, 5),
    ('11111111106', 'Fábio Martins', '1993-09-09', 'Masculino', 'bruno.paciente@teste.com', '(51) 99111-1006', 2, 6),
    ('11111111107', 'Gabriela Nunes', '1988-12-12', 'Feminino', 'carla.paciente@teste.com', '(81) 99111-1007', 3, 7),
    ('11111111108', 'Henrique Costa', '1975-04-25', 'Masculino', 'diego.paciente@teste.com', '(71) 99111-1008', 4, 8),
    ('11111111109', 'Isabela Freitas', '1996-08-14', 'Feminino', 'ana.paciente@teste.com', '(85) 99111-1009', 1, 9),
    ('11111111110', 'João Ribeiro', '1982-02-03', 'Masculino', 'bruno.paciente@teste.com', '(62) 99111-1010', 2, 10);

-- 10 registros para a tabela medicos
INSERT INTO medicos
    (crm, nome, email, cpf, telefone, especialidade, id_usuario, id_endereco)
VALUES
    ('SP100001', 'Carlos Henrique', 'carlos.medico@teste.com', '22222222201', '(11) 99222-2001', 'Hematologia', 5, 2),
    ('MG100002', 'Fernanda Lopes', 'fernanda.medica@teste.com', '22222222202', '(31) 99222-2002', 'Hematologia', 6, 3),
    ('RJ100003', 'Gustavo Pereira', 'gustavo.medico@teste.com', '22222222203', '(21) 99222-2003', 'Clínica Médica', 7, 4),
    ('PR100004', 'Helena Castro', 'helena.medica@teste.com', '22222222204', '(41) 99222-2004', 'Oncologia', 8, 5),
    ('RS100005', 'Igor Fernandes', 'igor.medico@teste.com', '22222222205', '(51) 99222-2005', 'Hematologia', 9, 6),
    ('PE100006', 'Juliana Barros', 'carlos.medico@teste.com', '22222222206', '(81) 99222-2006', 'Patologia', 5, 7),
    ('BA100007', 'Leandro Moraes', 'fernanda.medica@teste.com', '22222222207', '(71) 99222-2007', 'Oncologia', 6, 8),
    ('CE100008', 'Mariana Tavares', 'gustavo.medico@teste.com', '22222222208', '(85) 99222-2008', 'Hematologia', 7, 9),
    ('GO100009', 'Nicolas Teixeira', 'helena.medica@teste.com', '22222222209', '(62) 99222-2009', 'Clínica Médica', 8, 10),
    ('SP100010', 'Olívia Cardoso', 'igor.medico@teste.com', '22222222210', '(11) 99222-2010', 'Hematologia Pediátrica', 9, 1);

-- 10 registros para a tabela consultas
INSERT INTO consultas
    (id_consulta, cpf, crm, data_consulta, tipo_consulta, statusc)
VALUES
    (1, '11111111101', 'SP100001', '2026-01-10 08:30:00', 'Primeira consulta', 'Finalizado'),
    (2, '11111111102', 'MG100002', '2026-01-15 09:00:00', 'Retorno', 'Finalizado'),
    (3, '11111111103', 'RJ100003', '2026-02-02 10:30:00', 'Avaliação clínica', 'Finalizado'),
    (4, '11111111104', 'PR100004', '2026-02-18 14:00:00', 'Primeira consulta', 'Em andamento'),
    (5, '11111111105', 'RS100005', '2026-03-05 15:30:00', 'Retorno', 'Finalizado'),
    (6, '11111111106', 'PE100006', '2026-03-20 11:00:00', 'Avaliação de exames', 'Pendente'),
    (7, '11111111107', 'BA100007', '2026-04-08 13:30:00', 'Primeira consulta', 'Em andamento'),
    (8, '11111111108', 'CE100008', '2026-04-25 16:00:00', 'Retorno', 'Finalizado'),
    (9, '11111111109', 'GO100009', '2026-05-12 08:00:00', 'Avaliação clínica', 'Pendente'),
    (10, '11111111110', 'SP100010', '2026-05-29 17:00:00', 'Primeira consulta', 'Finalizado');

-- 10 registros para a tabela exames
INSERT INTO exames
    (id_exame, id_consulta, tipo_exame, data_exame, statusc)
VALUES
    (1, 1, 'Hemograma', '2026-01-10 09:30:00', 'Finalizado'),
    (2, 2, 'Mielograma', '2026-01-15 10:00:00', 'Finalizado'),
    (3, 3, 'Hemograma', '2026-02-02 11:30:00', 'Finalizado'),
    (4, 4, 'Mielograma', '2026-02-18 15:00:00', 'Em andamento'),
    (5, 5, 'Hemograma', '2026-03-05 16:30:00', 'Finalizado'),
    (6, 6, 'Mielograma', '2026-03-20 12:00:00', 'Pendente'),
    (7, 7, 'Hemograma', '2026-04-08 14:30:00', 'Em andamento'),
    (8, 8, 'Mielograma', '2026-04-25 17:00:00', 'Finalizado'),
    (9, 9, 'Hemograma', '2026-05-12 09:00:00', 'Pendente'),
    (10, 10, 'Mielograma', '2026-05-29 18:00:00', 'Finalizado');

-- 10 registros para a tabela imagens_exame
INSERT INTO imagens_exame
    (id_imagem, id_exame, caminho_arquivo, descricao, data_upload)
VALUES
    (1, 1, 'uploads/exames/hemograma_001.jpg', 'Lâmina do hemograma do exame 1', '2026-01-10'),
    (2, 2, 'uploads/exames/mielograma_002.jpg', 'Lâmina do mielograma do exame 2', '2026-01-15'),
    (3, 3, 'uploads/exames/hemograma_003.jpg', 'Lâmina do hemograma do exame 3', '2026-02-02'),
    (4, 4, 'uploads/exames/mielograma_004.jpg', 'Lâmina do mielograma do exame 4', '2026-02-18'),
    (5, 5, 'uploads/exames/hemograma_005.jpg', 'Lâmina do hemograma do exame 5', '2026-03-05'),
    (6, 6, 'uploads/exames/mielograma_006.jpg', 'Lâmina do mielograma do exame 6', '2026-03-20'),
    (7, 7, 'uploads/exames/hemograma_007.jpg', 'Lâmina do hemograma do exame 7', '2026-04-08'),
    (8, 8, 'uploads/exames/mielograma_008.jpg', 'Lâmina do mielograma do exame 8', '2026-04-25'),
    (9, 9, 'uploads/exames/hemograma_009.jpg', 'Lâmina do hemograma do exame 9', '2026-05-12'),
    (10, 10, 'uploads/exames/mielograma_010.jpg', 'Lâmina do mielograma do exame 10', '2026-05-29');

-- 10 registros para a tabela resultados_exame
INSERT INTO resultados_exame
    (id_resultado, id_exame, resultado_texto, suspeita_leucemia, tipo_leucemia, data_resultado)
VALUES
    (1, 1, 'Parâmetros hematológicos dentro da faixa de referência.', 'Sem suspeita', 'Não identificado', '2026-01-11'),
    (2, 2, 'Presença de blastos e alterações compatíveis com investigação complementar.', 'Alta', 'LMA', '2026-01-16'),
    (3, 3, 'Leucocitose discreta sem alterações morfológicas relevantes.', 'Baixa', 'Não identificado', '2026-02-03'),
    (4, 4, 'Amostra em processamento, com achados preliminares inconclusivos.', 'Moderada', 'LLA', '2026-02-19'),
    (5, 5, 'Linfocitose persistente e células maduras em quantidade aumentada.', 'Moderada', 'LLC', '2026-03-06'),
    (6, 6, 'Exame aguardando processamento laboratorial.', 'Sem suspeita', 'Não identificado', '2026-03-21'),
    (7, 7, 'Alteração na contagem de leucócitos; recomenda-se mielograma.', 'Moderada', 'LMC', '2026-04-09'),
    (8, 8, 'Achados celulares compatíveis com leucemia linfoide aguda.', 'Alta', 'LLA', '2026-04-26'),
    (9, 9, 'Amostra coletada, resultado definitivo ainda pendente.', 'Baixa', 'Não identificado', '2026-05-13'),
    (10, 10, 'Mielograma sem evidências de proliferação leucêmica.', 'Sem suspeita', 'Não identificado', '2026-05-30');

-- 10 registros para a tabela analise_ia
INSERT INTO analise_ia
    (id_analise, id_exame, resultado_ia, suspeita_ia, tipo_leucemia_ia, confianca, data_analise, statusc)
VALUES
    (1, 1, 'Padrão celular sem alterações significativas detectadas.', 'Sem suspeita', 'Não identificado', 97.40, '2026-01-11', 'Finalizado'),
    (2, 2, 'Alta concentração de blastos mieloides detectada.', 'Alta', 'LMA', 94.85, '2026-01-16', 'Finalizado'),
    (3, 3, 'Pequenas alterações na série branca, sem padrão conclusivo.', 'Baixa', 'Não identificado', 82.30, '2026-02-03', 'Finalizado'),
    (4, 4, 'Padrão sugestivo de proliferação linfoide aguda.', 'Moderada', 'LLA', 76.90, '2026-02-19', 'Em andamento'),
    (5, 5, 'Predomínio de linfócitos maduros com padrão persistente.', 'Moderada', 'LLC', 88.15, '2026-03-06', 'Finalizado'),
    (6, 6, 'Imagem ainda não processada pelo modelo.', 'Sem suspeita', 'Não identificado', 0.00, '2026-03-21', 'Pendente'),
    (7, 7, 'Distribuição celular sugestiva de processo mieloproliferativo.', 'Moderada', 'LMC', 79.65, '2026-04-09', 'Em andamento'),
    (8, 8, 'Blastos linfoides detectados em proporção elevada.', 'Alta', 'LLA', 96.20, '2026-04-26', 'Finalizado'),
    (9, 9, 'Análise aguardando validação da imagem enviada.', 'Baixa', 'Não identificado', 45.50, '2026-05-13', 'Pendente'),
    (10, 10, 'Nenhum padrão compatível com leucemia foi detectado.', 'Sem suspeita', 'Não identificado', 98.10, '2026-05-30', 'Finalizado');

-- 10 registros para a tabela anamnese
INSERT INTO anamnese
    (id_anamnese, cpf, crm, id_consulta, sintomas, comorbidades)
VALUES
    (1, '11111111101', 'SP100001', 1, 'Cansaço leve e palidez ocasional.', 'Nenhuma comorbidade relatada.'),
    (2, '11111111102', 'MG100002', 2, 'Febre recorrente, fadiga e perda de peso.', 'Hipertensão arterial controlada.'),
    (3, '11111111103', 'RJ100003', 3, 'Fraqueza e tontura há duas semanas.', 'Asma leve.'),
    (4, '11111111104', 'PR100004', 4, 'Sangramento gengival e manchas roxas.', 'Diabetes mellitus tipo 2.'),
    (5, '11111111105', 'RS100005', 5, 'Aumento de gânglios e suor noturno.', 'Nenhuma comorbidade relatada.'),
    (6, '11111111106', 'PE100006', 6, 'Dor óssea e cansaço persistente.', 'Hipotireoidismo.'),
    (7, '11111111107', 'BA100007', 7, 'Palidez, falta de ar e infecções frequentes.', 'Rinite alérgica.'),
    (8, '11111111108', 'CE100008', 8, 'Febre alta, perda de apetite e equimoses.', 'Doença renal crônica em acompanhamento.'),
    (9, '11111111109', 'GO100009', 9, 'Cansaço, cefaleia e indisposição.', 'Nenhuma comorbidade relatada.'),
    (10, '11111111110', 'SP100010', 10, 'Desconforto abdominal e perda de peso recente.', 'Dislipidemia controlada.');

COMMIT;
