from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
import os
from datetime import datetime

# ============================================================
# CONFIGURAÇÃO
# ============================================================

# Caminhos das fontes (ajuste conforme seu sistema)
FONT_PATH = "C:/Windows/Fonts/arial.ttf"
FONT_BOLD_PATH = "C:/Windows/Fonts/arialbd.ttf"

# Cores institucionais (tons sóbrios)
COR_VERMELHO_ESCURO = colors.HexColor('#8B0000')
COR_CINZA_ESCURO = colors.HexColor('#333333')
COR_CINZA_MEDIO = colors.HexColor('#666666')
COR_CINZA_CLARO = colors.HexColor('#999999')

# ============================================================
# FUNÇÕES AUXILIARES DE FONTE
# ============================================================

def registrar_fontes():
    """Registra as fontes Arial (fallback para Helvetica)"""
    try:
        if os.path.exists(FONT_PATH):
            pdfmetrics.registerFont(TTFont('Arial', FONT_PATH))
        if os.path.exists(FONT_BOLD_PATH):
            pdfmetrics.registerFont(TTFont('Arial-Bold', FONT_BOLD_PATH))
        return 'Arial', 'Arial-Bold'
    except:
        return 'Helvetica', 'Helvetica-Bold'

# ============================================================
# FUNÇÃO PRINCIPAL
# ============================================================

def gerar_pdf_laudo(dados, nome_arquivo=None):
    """
    Gera um laudo médico profissional em PDF.
    Utiliza apenas os campos existentes no sistema.

    Parâmetros esperados no dicionário 'dados':
    - paciente (str): Nome do paciente
    - cpf (str): CPF do paciente
    - sexo (str): Sexo do paciente
    - data_nascimento (str): Data de nascimento
    - medico (str): Nome do médico
    - crm (str): CRM do médico
    - especialidade (str): Especialidade do médico
    - tipo_exame (str): Tipo do exame
    - statusc (str): Status do exame (Pendente, Em andamento, Finalizado)
    - data_exame (str): Data do exame
    - resultado_texto (str): Resultado do exame (texto livre)
    - suspeita_leucemia (str): Suspeita de leucemia
    - tipo_leucemia (str): Tipo de leucemia identificado
    - data_resultado (str): Data do resultado
    """
    
    # Criar pasta 'pdfs' se não existir
    pasta_pdf = os.path.join(os.path.dirname(__file__), 'pdfs')
    os.makedirs(pasta_pdf, exist_ok=True)
    
    if nome_arquivo is None:
        nome_arquivo = f"laudo_{dados.get('paciente', 'exame').replace(' ', '_')}_{datetime.now().strftime('%Y%m%d')}.pdf"
        nome_arquivo = os.path.join(pasta_pdf, nome_arquivo)
    
    # Registrar fontes
    fonte_normal, fonte_bold = registrar_fontes()
    
    # Criar documento
    doc = SimpleDocTemplate(
        nome_arquivo,
        pagesize=A4,
        rightMargin=2.2*cm,
        leftMargin=2.2*cm,
        topMargin=2.2*cm,
        bottomMargin=2.2*cm
    )
    
    # Estilos
    styles = getSampleStyleSheet()
    
    estilo_titulo_principal = ParagraphStyle(
        'TituloPrincipal',
        parent=styles['Normal'],
        fontName=fonte_bold,
        fontSize=16,
        textColor=COR_CINZA_ESCURO,
        alignment=TA_LEFT,
        spaceAfter=2,
        leading=18
    )
    
    estilo_subtitulo = ParagraphStyle(
        'Subtitulo',
        parent=styles['Normal'],
        fontName=fonte_normal,
        fontSize=10,
        textColor=COR_CINZA_MEDIO,
        alignment=TA_LEFT,
        spaceAfter=8,
        leading=12
    )
    
    estilo_data = ParagraphStyle(
        'Data',
        parent=styles['Normal'],
        fontName=fonte_normal,
        fontSize=9,
        textColor=COR_CINZA_ESCURO,
        alignment=TA_RIGHT,
        spaceAfter=2,
        leading=11
    )
    
    estilo_secao_titulo = ParagraphStyle(
        'SecaoTitulo',
        parent=styles['Normal'],
        fontName=fonte_bold,
        fontSize=12,
        textColor=COR_CINZA_ESCURO,
        alignment=TA_LEFT,
        spaceAfter=6,
        spaceBefore=14,
        leading=14
    )
    
    estilo_valor = ParagraphStyle(
        'Valor',
        parent=styles['Normal'],
        fontName=fonte_normal,
        fontSize=10,
        textColor=COR_CINZA_ESCURO,
        alignment=TA_LEFT,
        spaceAfter=4,
        leading=14
    )
    
    estilo_resultado = ParagraphStyle(
        'Resultado',
        parent=styles['Normal'],
        fontName=fonte_normal,
        fontSize=10.5,
        textColor=COR_CINZA_ESCURO,
        alignment=TA_JUSTIFY,
        spaceAfter=8,
        leading=16,
        leftIndent=0,
        rightIndent=0
    )
    
    estilo_diagnostico = ParagraphStyle(
        'Diagnostico',
        parent=styles['Normal'],
        fontName=fonte_normal,
        fontSize=10,
        textColor=COR_CINZA_ESCURO,
        alignment=TA_LEFT,
        spaceAfter=4,
        leading=14
    )
    
    estilo_linha_fina = ParagraphStyle(
        'LinhaFina',
        parent=styles['Normal'],
        fontName=fonte_normal,
        fontSize=1,
        textColor=COR_CINZA_CLARO,
        alignment=TA_LEFT,
        spaceAfter=0,
        spaceBefore=0
    )
    
    estilo_rodape = ParagraphStyle(
        'Rodape',
        parent=styles['Normal'],
        fontName=fonte_normal,
        fontSize=8,
        textColor=COR_CINZA_MEDIO,
        alignment=TA_CENTER,
        spaceBefore=8,
        leading=10
    )
    
    # Lista de elementos
    elementos = []
    
    # ==========================================================
    # 1. CABEÇALHO
    # ==========================================================
    
    # Espaço para logotipo (será inserido posteriormente)
    # elementos.append(Image('logo.png', width=2*cm, height=1*cm))
    
    # Título e subtítulo (à esquerda)
    cabecalho_esquerdo = [
        Paragraph("<b>HEMATOAI</b>", estilo_titulo_principal),
        Paragraph("Sistema Inteligente de Apoio ao Diagnóstico Hematológico", estilo_subtitulo)
    ]
    
    # Data de emissão (à direita)
    data_emissao = datetime.now().strftime('%d/%m/%Y às %H:%M')
    cabecalho_direito = Paragraph(f"Data de emissão: {data_emissao}", estilo_data)
    
    # Tabela para alinhar cabeçalho (sem bordas)
    cabecalho = Table([
        [cabecalho_esquerdo[0], cabecalho_direito],
        [cabecalho_esquerdo[1], '']
    ], colWidths=[14*cm, 4*cm])
    cabecalho.setStyle(TableStyle([
        ('ALIGN', (0, 0), (0, 1), 'LEFT'),
        ('ALIGN', (1, 0), (1, 0), 'RIGHT'),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (-1, -1), 0),
        ('TOPPADDING', (0, 0), (-1, -1), 0),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 1),
    ]))
    elementos.append(cabecalho)
    elementos.append(Spacer(1, 0.1*cm))
    
    # Linha horizontal fina
    elementos.append(Paragraph("_"*100, estilo_linha_fina))
    elementos.append(Spacer(1, 0.6*cm))
    
    # ==========================================================
    # 2. IDENTIFICAÇÃO DO PACIENTE
    # ==========================================================
    
    elementos.append(Paragraph("IDENTIFICAÇÃO DO PACIENTE", estilo_secao_titulo))
    
    paciente_nome = dados.get('paciente', 'Não informado')
    paciente_cpf = dados.get('cpf', 'Não informado')
    paciente_sexo = dados.get('sexo', 'Não informado')
    paciente_data_nasc = dados.get('data_nascimento', 'Não informado')
    
    elementos.append(Paragraph(
        f"<b>Nome:</b> {paciente_nome}",
        estilo_valor
    ))
    elementos.append(Paragraph(
        f"<b>CPF:</b> {paciente_cpf}",
        estilo_valor
    ))
    elementos.append(Paragraph(
        f"<b>Sexo:</b> {paciente_sexo}",
        estilo_valor
    ))
    elementos.append(Paragraph(
        f"<b>Data de nascimento:</b> {paciente_data_nasc}",
        estilo_valor
    ))
    elementos.append(Spacer(1, 0.4*cm))
    
    # ==========================================================
    # 3. MÉDICO RESPONSÁVEL
    # ==========================================================
    
    elementos.append(Paragraph("MÉDICO RESPONSÁVEL", estilo_secao_titulo))
    
    medico_nome = dados.get('medico', 'Não informado')
    medico_crm = dados.get('crm', 'Não informado')
    medico_especialidade = dados.get('especialidade', 'Não informado')
    
    elementos.append(Paragraph(
        f"<b>Nome:</b> {medico_nome}",
        estilo_valor
    ))
    elementos.append(Paragraph(
        f"<b>CRM:</b> {medico_crm}",
        estilo_valor
    ))
    elementos.append(Paragraph(
        f"<b>Especialidade:</b> {medico_especialidade}",
        estilo_valor
    ))
    elementos.append(Spacer(1, 0.4*cm))
    
    # ==========================================================
    # 4. DADOS DO EXAME
    # ==========================================================
    
    elementos.append(Paragraph("DADOS DO EXAME", estilo_secao_titulo))
    
    tipo_exame = dados.get('tipo_exame', 'Não informado')
    status_exame = dados.get('statusc', 'Não informado')
    data_exame = dados.get('data_exame', 'Não informado')
    data_resultado = dados.get('data_resultado', 'Não informado')
    
    elementos.append(Paragraph(
        f"<b>Tipo do exame:</b> {tipo_exame}",
        estilo_valor
    ))
    elementos.append(Paragraph(
        f"<b>Status:</b> {status_exame}",
        estilo_valor
    ))
    elementos.append(Paragraph(
        f"<b>Data do exame:</b> {data_exame}",
        estilo_valor
    ))
    elementos.append(Paragraph(
        f"<b>Data do resultado:</b> {data_resultado}",
        estilo_valor
    ))
    elementos.append(Spacer(1, 0.6*cm))
    
    # ==========================================================
    # 5. RESULTADO DO EXAME
    # ==========================================================
    
    elementos.append(Paragraph("RESULTADO DO EXAME", estilo_secao_titulo))
    
    resultado_texto = dados.get('resultado_texto', 'Resultado não informado.')
    # Substituir quebras de linha por <br/> para manter no PDF
    resultado_texto = resultado_texto.replace('\n', '<br/>')
    elementos.append(Paragraph(resultado_texto, estilo_resultado))
    elementos.append(Spacer(1, 0.6*cm))
    
    # ==========================================================
    # 6. DIAGNÓSTICO
    # ==========================================================
    
    elementos.append(Paragraph("DIAGNÓSTICO", estilo_secao_titulo))
    
    suspeita = dados.get('suspeita_leucemia', 'Não informado')
    tipo_leucemia = dados.get('tipo_leucemia', 'Não identificado')
    
    elementos.append(Paragraph(
        f"<b>Suspeita de leucemia:</b> {suspeita}",
        estilo_diagnostico
    ))
    elementos.append(Paragraph(
        f"<b>Tipo de leucemia:</b> {tipo_leucemia}",
        estilo_diagnostico
    ))
    elementos.append(Spacer(1, 1*cm))
    
    # ==========================================================
    # 7. RODAPÉ
    # ==========================================================
    
    elementos.append(Paragraph("_"*100, estilo_linha_fina))
    elementos.append(Spacer(1, 0.3*cm))
    
    elementos.append(Paragraph(
        "Documento emitido eletronicamente pelo HematoAI.",
        estilo_rodape
    ))
    elementos.append(Paragraph(
        f"Gerado em {datetime.now().strftime('%d/%m/%Y às %H:%M')}",
        estilo_rodape
    ))
    elementos.append(Paragraph(
        "Este documento possui caráter informativo e deve ser interpretado por profissional habilitado.",
        estilo_rodape
    ))
    
    # ==========================================================
    # GERAÇÃO DO PDF
    # ==========================================================
    
    doc.build(elementos)
    print(f"✅ Laudo médico gerado com sucesso: {nome_arquivo}")
    return nome_arquivo


# ============================================================
# EXEMPLO DE USO
# ============================================================

if __name__ == "__main__":
    dados_exemplo = {
        'paciente': 'Lucas Pereira',
        'cpf': '123.456.789-00',
        'sexo': 'Masculino',
        'data_nascimento': '12/03/2006',
        'medico': 'Dr. Carlos Eduardo Mendes',
        'crm': '12345-SP',
        'especialidade': 'Hematologia',
        'tipo_exame': 'Hemograma Completo + Mielograma',
        'statusc': 'Finalizado',
        'data_exame': '10/07/2026',
        'resultado_texto': 'Hemoglobina: 13,2 g/dL (normal)\nLeucócitos: 18.500/mm³ (elevado)\nPlaquetas: 210.000/mm³ (normal)\nNeutrófilos: 75% (elevado)\nLinfócitos: 18% (normal)\nPresença de células blásticas atípicas (8%).',
        'suspeita_leucemia': 'Alta',
        'tipo_leucemia': 'Leucemia Mieloide Aguda (LMA)',
        'data_resultado': '12/07/2026'
    }
    
    gerar_pdf_laudo(dados_exemplo)