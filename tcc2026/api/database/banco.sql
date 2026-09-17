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


INSERT INTO login (email, senha, tipo) VALUES
('admin@hematoai.com', '123456', 'Administrador'),

('joao.silva@gmail.com', 'e10adc3949ba59abbe56e057f20f883e', 'Médico'),
('ana.costa@gmail.com', 'e10adc3949ba59abbe56e057f20f883e', 'Médico'),
('carlos.oliveira@outlook.com', 'e10adc3949ba59abbe56e057f20f883e', 'Médico'),
('mariana.santos@gmail.com', 'e10adc3949ba59abbe56e057f20f883e', 'Médico'),
('ricardo.almeida@hotmail.com', 'e10adc3949ba59abbe56e057f20f883e', 'Médico'),
('fernanda.rocha@gmail.com', 'e10adc3949ba59abbe56e057f20f883e', 'Médico'),
('lucas.martins@outlook.com', 'e10adc3949ba59abbe56e057f20f883e', 'Médico'),
('patricia.lima@gmail.com', 'e10adc3949ba59abbe56e057f20f883e', 'Médico'),
('gabriel.ferreira@gmail.com', 'e10adc3949ba59abbe56e057f20f883e', 'Médico'),
('juliana.ribeiro@hotmail.com', 'e10adc3949ba59abbe56e057f20f883e', 'Médico'),
('andre.carvalho@gmail.com', 'e10adc3949ba59abbe56e057f20f883e', 'Médico'),
('camila.gomes@outlook.com', 'e10adc3949ba59abbe56e057f20f883e', 'Médico'),
('bruno.mendes@gmail.com', 'e10adc3949ba59abbe56e057f20f883e', 'Médico'),
('aline.barros@gmail.com', 'e10adc3949ba59abbe56e057f20f883e', 'Médico'),
('rafael.teixeira@hotmail.com', 'e10adc3949ba59abbe56e057f20f883e', 'Médico'),

('lucas.pereira@gmail.com', 'e10adc3949ba59abbe56e057f20f883e', 'Paciente'),
('beatriz.souza@gmail.com', 'e10adc3949ba59abbe56e057f20f883e', 'Paciente'),
('miguel.araujo@outlook.com', 'e10adc3949ba59abbe56e057f20f883e', 'Paciente'),
('isabela.nunes@gmail.com', 'e10adc3949ba59abbe56e057f20f883e', 'Paciente'),
('matheus.cardoso@hotmail.com', 'e10adc3949ba59abbe56e057f20f883e', 'Paciente'),
('larissa.moura@gmail.com', 'e10adc3949ba59abbe56e057f20f883e', 'Paciente'),
('pedro.monteiro@outlook.com', 'e10adc3949ba59abbe56e057f20f883e', 'Paciente'),
('manuela.freitas@gmail.com', 'e10adc3949ba59abbe56e057f20f883e', 'Paciente'),
('thiago.barbosa@gmail.com', 'e10adc3949ba59abbe56e057f20f883e', 'Paciente'),
('sofia.dias@hotmail.com', 'e10adc3949ba59abbe56e057f20f883e', 'Paciente'),
('enzo.teixeira@gmail.com', 'e10adc3949ba59abbe56e057f20f883e', 'Paciente'),
('valentina.campos@outlook.com', 'e10adc3949ba59abbe56e057f20f883e', 'Paciente'),
('henrique.machado@gmail.com', 'e10adc3949ba59abbe56e057f20f883e', 'Paciente'),
('laura.rezende@gmail.com', 'e10adc3949ba59abbe56e057f20f883e', 'Paciente'),
('arthur.vieira@hotmail.com', 'e10adc3949ba59abbe56e057f20f883e', 'Paciente');

INSERT INTO enderecos (rua, numero, bairro, cidade, estado, cep) VALUES

('Rua das Flores', 120, 'Centro', 'São José dos Campos', 'São Paulo', '12210-000'),
('Avenida Brasil', 450, 'Jardim América', 'São José dos Campos', 'São Paulo', '12230-000'),
('Rua José Bonifácio', 87, 'Vila Ema', 'São José dos Campos', 'São Paulo', '12243-000'),
('Rua XV de Novembro', 210, 'Centro', 'São José dos Campos', 'São Paulo', '12210-010'),
('Avenida Cassiano Ricardo', 780, 'Urbanova', 'São José dos Campos', 'São Paulo', '12244-000'),
('Rua Paraibuna', 340, 'Jardim São Dimas', 'São José dos Campos', 'São Paulo', '12245-000'),
('Rua Euclides Miragaia', 155, 'Centro', 'São José dos Campos', 'São Paulo', '12210-000'),
('Avenida Andrômeda', 920, 'Jardim Satélite', 'São José dos Campos', 'São Paulo', '12230-000'),
('Rua Bacabal', 63, 'Jardim Satélite', 'São José dos Campos', 'São Paulo', '12230-000'),
('Rua Serra do Roncador', 410, 'Bosque dos Eucaliptos', 'São José dos Campos', 'São Paulo', '12232-000'),
('Rua dos Lírios', 275, 'Jardim Aquarius', 'São José dos Campos', 'São Paulo', '12246-000'),
('Avenida Salmão', 510, 'Jardim Aquarius', 'São José dos Campos', 'São Paulo', '12246-000'),
('Rua das Acácias', 95, 'Jardim Esplanada', 'São José dos Campos', 'São Paulo', '12242-000'),
('Rua Santa Clara', 330, 'Vila Adyana', 'São José dos Campos', 'São Paulo', '12243-000'),
('Avenida Heitor Villa Lobos', 680, 'Vila Ema', 'São José dos Campos', 'São Paulo', '12243-000'),

('Rua das Palmeiras', 101, 'Centro', 'São José dos Campos', 'São Paulo', '12210-020'),
('Rua São Bento', 215, 'Centro', 'São José dos Campos', 'São Paulo', '12210-030'),
('Avenida Cidade Jardim', 430, 'Jardim Satélite', 'São José dos Campos', 'São Paulo', '12231-000'),
('Rua Madre Paula', 75, 'Vila Ema', 'São José dos Campos', 'São Paulo', '12243-010'),
('Rua José de Alencar', 290, 'Centro', 'São José dos Campos', 'São Paulo', '12210-040'),
('Rua Machado de Assis', 145, 'Jardim Paulista', 'São José dos Campos', 'São Paulo', '12216-000'),
('Rua Monteiro Lobato', 510, 'Vila Industrial', 'São José dos Campos', 'São Paulo', '12220-000'),
('Avenida Cidade Jardim', 875, 'Bosque dos Eucaliptos', 'São José dos Campos', 'São Paulo', '12232-010'),
('Rua Cecília Meireles', 60, 'Jardim Aquarius', 'São José dos Campos', 'São Paulo', '12246-010'),
('Rua Castro Alves', 320, 'Vila Adyana', 'São José dos Campos', 'São Paulo', '12243-020'),
('Rua Olavo Bilac', 180, 'Jardim Esplanada', 'São José dos Campos', 'São Paulo', '12242-010'),
('Rua Gonçalves Dias', 410, 'Jardim América', 'São José dos Campos', 'São Paulo', '12230-010'),
('Rua Álvares de Azevedo', 225, 'Vila Ema', 'São José dos Campos', 'São Paulo', '12243-030'),
('Rua Fernando Pessoa', 350, 'Urbanova', 'São José dos Campos', 'São Paulo', '12244-010'),
('Rua Carlos Drummond', 125, 'Jardim Satélite', 'São José dos Campos', 'São Paulo', '12230-020'),
('Rua Vinicius de Moraes', 490, 'Bosque dos Eucaliptos', 'São José dos Campos', 'São Paulo', '12232-020');


INSERT INTO medicos
(crm, nome, email, cpf, telefone, especialidade, id_usuario, id_endereco)
VALUES

('123456-SP', 'João Henrique Silva', 'joao.silva@gmail.com',
 '52998224725', '(12) 99111-1111', 'Hematologia', 2, 1),

('234567-SP', 'Ana Carolina Costa', 'ana.costa@gmail.com',
 '11144477735', '(12) 99222-2222', 'Hematologia', 3, 2),

('345678-SP', 'Carlos Eduardo Oliveira', 'carlos.oliveira@outlook.com',
 '15350946056', '(12) 99333-3333', 'Hematologia', 4, 3),

('456789-SP', 'Mariana Santos', 'mariana.santos@gmail.com',
 '98765432029', '(12) 99444-4444', 'Hematologia', 5, 4),

('567890-SP', 'Ricardo Almeida', 'ricardo.almeida@hotmail.com',
 '24681357928', '(12) 99555-5555', 'Hematologia', 6, 5),

('678901-SP', 'Fernanda Rocha', 'fernanda.rocha@gmail.com',
 '31415926590', '(12) 99666-6666', 'Hematologia', 7, 6),

('789012-SP', 'Lucas Martins', 'lucas.martins@outlook.com',
 '27182818205', '(12) 99777-7777', 'Hematologia', 8, 7),

('890123-SP', 'Patrícia Lima', 'patricia.lima@gmail.com',
 '12345678909', '(12) 99888-8888', 'Hematologia', 9, 8),

('901234-SP', 'Gabriel Ferreira', 'gabriel.ferreira@gmail.com',
 '45678901249', '(12) 99911-1111', 'Hematologia', 10, 9),

('112233-SP', 'Juliana Ribeiro', 'juliana.ribeiro@hotmail.com',
 '13579246828', '(12) 99122-2222', 'Hematologia', 11, 10),

('223344-SP', 'André Carvalho', 'andre.carvalho@gmail.com',
 '86420975310', '(12) 99233-3333', 'Hematologia', 12, 11),

('334455-SP', 'Camila Gomes', 'camila.gomes@outlook.com',
 '97531864282', '(12) 99344-4444', 'Hematologia', 13, 12),

('445566-SP', 'Bruno Mendes', 'bruno.mendes@gmail.com',
 '19283746546', '(12) 99455-5555', 'Hematologia', 14, 13),

('556677-SP', 'Aline Barros', 'aline.barros@gmail.com',
 '56473829164', '(12) 99566-6666', 'Hematologia', 15, 14),

('667788-SP', 'Rafael Teixeira', 'rafael.teixeira@hotmail.com',
 '91827364564', '(12) 99677-7777', 'Hematologia', 16, 15);

INSERT INTO pacientes
(cpf, nome, data_nasc, sexo, email, telefone, id_usuario, id_endereco)
VALUES

('11122233344', 'Lucas Pereira', '2002-04-15', 'Masculino',
 'lucas.pereira@gmail.com', '(12) 99101-0101', 17, 16),

('22233344455', 'Beatriz Souza', '1998-07-21', 'Feminino',
 'beatriz.souza@gmail.com', '(12) 99202-0202', 18, 17),

('33344455566', 'Miguel Araújo', '2000-11-03', 'Masculino',
 'miguel.araujo@outlook.com', '(12) 99303-0303', 19, 18),

('44455566677', 'Isabela Nunes', '1995-02-18', 'Feminino',
 'isabela.nunes@gmail.com', '(12) 99404-0404', 20, 19),

('55566677788', 'Matheus Cardoso', '2001-09-10', 'Masculino',
 'matheus.cardoso@hotmail.com', '(12) 99505-0505', 21, 20),

('66677788899', 'Larissa Moura', '1999-12-27', 'Feminino',
 'larissa.moura@gmail.com', '(12) 99606-0606', 22, 21),

('77788899900', 'Pedro Monteiro', '1997-05-14', 'Masculino',
 'pedro.monteiro@outlook.com', '(12) 99707-0707', 23, 22),

('88899900011', 'Manuela Freitas', '2003-03-30', 'Feminino',
 'manuela.freitas@gmail.com', '(12) 99808-0808', 24, 23),

('99900011122', 'Thiago Barbosa', '1994-08-09', 'Masculino',
 'thiago.barbosa@gmail.com', '(12) 99909-0909', 25, 24),

('00011122233', 'Sofia Dias', '2002-10-25', 'Feminino',
 'sofia.dias@hotmail.com', '(12) 99110-1010', 26, 25),

('12312312312', 'Enzo Teixeira', '1996-01-17', 'Masculino',
 'enzo.teixeira@gmail.com', '(12) 99211-1111', 27, 26),

('23423423423', 'Valentina Campos', '2004-06-12', 'Feminino',
 'valentina.campos@outlook.com', '(12) 99312-1212', 28, 27),

('34534534534', 'Henrique Machado', '1993-11-28', 'Masculino',
 'henrique.machado@gmail.com', '(12) 99413-1313', 29, 28),

('45645645645', 'Laura Rezende', '1998-04-06', 'Feminino',
 'laura.rezende@gmail.com', '(12) 99514-1414', 30, 29),

('56756756756', 'Arthur Vieira', '2001-07-19', 'Masculino',
 'arthur.vieira@hotmail.com', '(12) 99615-1515', 31, 30);

INSERT INTO consultas
(cpf, crm, data_consulta, tipo_consulta, statusc)
VALUES

('11122233344', '123456-SP', '2026-09-10 09:00:00', 'Consulta inicial', 'Finalizado'),
('22233344455', '234567-SP', '2026-09-12 10:00:00', 'Retorno', 'Finalizado'),
('33344455566', '345678-SP', '2026-09-15 14:00:00', 'Consulta inicial', 'Finalizado'),
('44455566677', '456789-SP', '2026-09-18 09:30:00', 'Retorno', 'Pendente'),
('55566677788', '567890-SP', '2026-09-20 11:00:00', 'Consulta inicial', 'Pendente'),
('66677788899', '678901-SP', '2026-09-22 15:00:00', 'Retorno', 'Pendente'),
('77788899900', '789012-SP', '2026-09-25 08:30:00', 'Consulta inicial', 'Pendente'),
('88899900011', '890123-SP', '2026-09-28 13:00:00', 'Retorno', 'Pendente'),
('99900011122', '901234-SP', '2026-10-02 10:30:00', 'Consulta inicial', 'Pendente'),
('00011122233', '112233-SP', '2026-10-05 14:30:00', 'Retorno', 'Pendente'),

('12312312312', '223344-SP', '2026-10-08 09:00:00', 'Consulta inicial', 'Pendente'),
('23423423423', '334455-SP', '2026-10-10 11:30:00', 'Retorno', 'Pendente'),
('34534534534', '445566-SP', '2026-10-12 16:00:00', 'Consulta inicial', 'Pendente'),
('45645645645', '556677-SP', '2026-10-15 10:00:00', 'Retorno', 'Pendente'),
('56756756756', '667788-SP', '2026-10-18 15:30:00', 'Consulta inicial', 'Pendente'),

('11122233344', '123456-SP', '2026-08-15 10:00:00', 'Retorno', 'Finalizado'),
('22233344455', '234567-SP', '2026-08-20 14:00:00', 'Retorno', 'Finalizado'),
('33344455566', '345678-SP', '2026-08-25 09:30:00', 'Retorno', 'Finalizado'),
('44455566677', '456789-SP', '2026-08-30 11:00:00', 'Consulta inicial', 'Finalizado'),
('55566677788', '567890-SP', '2026-09-01 13:30:00', 'Retorno', 'Finalizado');

INSERT INTO exames
(id_consulta, tipo_exame, data_exame, statusc)
VALUES

(1, 'Hemograma', '2026-09-10 10:00:00', 'Finalizado'),
(2, 'Mielograma', '2026-09-12 11:00:00', 'Finalizado'),
(3, 'Hemograma', '2026-09-15 15:00:00', 'Finalizado'),
(16, 'Mielograma', '2026-08-15 11:00:00', 'Finalizado'),
(17, 'Hemograma', '2026-08-20 15:00:00', 'Finalizado'),
(18, 'Hemograma', '2026-08-25 10:30:00', 'Finalizado'),
(19, 'Mielograma', '2026-08-30 12:00:00', 'Finalizado'),
(20, 'Hemograma', '2026-09-01 14:30:00', 'Finalizado'),

(4, 'Hemograma', '2026-09-18 10:30:00', 'Pendente'),
(5, 'Mielograma', '2026-09-20 12:00:00', 'Pendente'),
(6, 'Hemograma', '2026-09-22 16:00:00', 'Pendente'),
(7, 'Mielograma', '2026-09-25 09:30:00', 'Pendente'),
(8, 'Hemograma', '2026-09-28 14:00:00', 'Pendente'),
(9, 'Hemograma', '2026-10-02 11:30:00', 'Pendente'),
(10, 'Mielograma', '2026-10-05 15:30:00', 'Pendente'),
(11, 'Hemograma', '2026-10-08 10:00:00', 'Pendente'),
(12, 'Mielograma', '2026-10-10 12:30:00', 'Pendente'),
(13, 'Hemograma', '2026-10-12 17:00:00', 'Pendente'),
(14, 'Hemograma', '2026-10-15 11:00:00', 'Pendente'),
(15, 'Mielograma', '2026-10-18 16:30:00', 'Pendente');

INSERT INTO resultados_exame
(id_exame, resultado_texto, suspeita_leucemia, tipo_leucemia, data_resultado)
VALUES

(1,
 'Hemograma dentro dos parâmetros esperados, sem alterações hematológicas significativas.',
 'Sem suspeita',
 'Não identificado',
 '2026-09-11'),

(2,
 'Presença de células hematológicas com alterações compatíveis com investigação de leucemia.',
 'Moderada',
 'LLA',
 '2026-09-13'),

(3,
 'Alterações no hemograma com presença de células imaturas. Recomenda-se avaliação hematológica.',
 'Alta',
 'LMA',
 '2026-09-16'),

(4,
 'Mielograma com alterações celulares que necessitam de acompanhamento hematológico.',
 'Baixa',
 'Não identificado',
 '2026-08-16'),

(5,
 'Hemograma sem alterações relevantes nos parâmetros avaliados.',
 'Sem suspeita',
 'Não identificado',
 '2026-08-21'),

(6,
 'Contagem diferencial com alterações leves, sem evidências conclusivas de doença hematológica.',
 'Baixa',
 'Não identificado',
 '2026-08-26'),

(7,
 'Mielograma apresenta alterações celulares sugestivas de investigação complementar.',
 'Moderada',
 'LMC',
 '2026-08-31'),

(8,
 'Exame hematológico com alterações significativas que requerem avaliação médica.',
 'Alta',
 'LLC',
 '2026-09-02');


INSERT INTO anamnese
(cpf, crm, id_consulta, sintomas, comorbidades)
VALUES

('11122233344', '123456-SP', 1,
 'Cansaço frequente e episódios ocasionais de palidez.',
 'Sem comorbidades relatadas.'),

('22233344455', '234567-SP', 2,
 'Fadiga e dores de cabeça ocasionais.',
 'Hipotireoidismo controlado.'),

('33344455566', '345678-SP', 3,
 'Fraqueza, febre baixa e perda de disposição.',
 'Sem comorbidades relatadas.'),

('44455566677', '456789-SP', 4,
 'Cansaço durante atividades físicas.',
 'Anemia prévia.'),

('55566677788', '567890-SP', 5,
 'Palidez e indisposição.',
 'Sem comorbidades relatadas.'),

('66677788899', '678901-SP', 6,
 'Fadiga e episódios de tontura.',
 'Hipertensão arterial.'),

('77788899900', '789012-SP', 7,
 'Cansaço persistente.',
 'Sem comorbidades relatadas.'),

('88899900011', '890123-SP', 8,
 'Fraqueza e episódios de febre.',
 'Sem comorbidades relatadas.'),

('99900011122', '901234-SP', 9,
 'Cansaço ocasional.',
 'Diabetes tipo 2 controlado.'),

('00011122233', '112233-SP', 10,
 'Palidez e indisposição.',
 'Sem comorbidades relatadas.'),

('12312312312', '223344-SP', 11,
 'Fadiga após atividades físicas.',
 'Sem comorbidades relatadas.'),

('23423423423', '334455-SP', 12,
 'Cansaço e dor de cabeça.',
 'Asma controlada.'),

('34534534534', '445566-SP', 13,
 'Fraqueza e indisposição.',
 'Sem comorbidades relatadas.'),

('45645645645', '556677-SP', 14,
 'Fadiga persistente.',
 'Hipotireoidismo.'),

('56756756756', '667788-SP', 15,
 'Palidez e cansaço.',
 'Sem comorbidades relatadas.'),

('11122233344', '123456-SP', 16,
 'Retorno para acompanhamento dos exames.',
 'Sem comorbidades relatadas.'),

('22233344455', '234567-SP', 17,
 'Retorno para avaliação hematológica.',
 'Hipotireoidismo controlado.'),

('33344455566', '345678-SP', 18,
 'Acompanhamento dos resultados laboratoriais.',
 'Sem comorbidades relatadas.'),

('44455566677', '456789-SP', 19,
 'Retorno após investigação hematológica.',
 'Anemia prévia.'),

('55566677788', '567890-SP', 20,
 'Acompanhamento clínico.',
 'Sem comorbidades relatadas.');
 

 
 