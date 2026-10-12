import os
import re
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from reportlab.lib.units import mm
from datetime import datetime
from reportlab.lib.utils import simpleSplit


def quebrar_linhas(texto, fonte, tamanho, largura):
    """Quebra o texto pela largura real da fonte (pt), nunca além de `largura`.

    Antes, títulos eram desenhados numa linha só e o corpo era quebrado por
    número de caracteres: um título longo como "LAUDO DE HEMATOLOGIA - ANÁLISE
    MORFOLÓGICA DE ESFREGAÇO DE SANGUE PERIFÉRICO" passava da margem direita.
    """
    return simpleSplit(str(texto), fonte, tamanho, largura) or ['']

def gerar_laudo_pdf(texto_ai, dados_paciente, nome_saida):
    """
    Gera um laudo médico profissional em PDF.
    Ajustado para salvar na pasta raiz /laudos_gerados a partir da subpasta /python.
    """
    try:
        # AJUSTE DE CAMINHO: 
        # Como este script roda dentro da pasta 'python/', precisamos subir um nível '../'
        # para encontrar a pasta 'laudos_gerados' que o Node.js gerencia.
        base_dir = os.path.dirname(os.path.abspath(__file__))
        pasta_destino = os.path.join(base_dir,'laudos_gerados')
        
        if not os.path.exists(pasta_destino):
            os.makedirs(pasta_destino)

        caminho_completo = os.path.normpath(os.path.join(pasta_destino, nome_saida))
        
        # Configurações da página
        c = canvas.Canvas(caminho_completo, pagesize=A4)
        largura, altura = A4
        
        # Margens
        margem_esq = 70
        margem_dir = largura - 70
        margem_top = altura - 70
        largura_util = margem_dir - margem_esq
        y_position = margem_top
        
        # ==================== CABEÇALHO ====================
        c.setStrokeColor(colors.HexColor('#2c2c2c'))
        c.setLineWidth(0.5)
        c.line(margem_esq, y_position + 15, margem_dir, y_position + 15)
        
        c.setFont("Helvetica", 8)
        c.setFillColor(colors.HexColor('#666666'))
        c.drawString(margem_esq, y_position + 5, "ANÁLISE PRELIMINAR POR IA - APOIO AO PRÉ-DIAGNÓSTICO")
        
        data_emissao = datetime.now().strftime("%d/%m/%Y")
        c.drawRightString(margem_dir, y_position + 5, f"Emissão: {data_emissao}")
        
        y_position -= 25
        c.setStrokeColor(colors.HexColor('#cccccc'))
        c.setLineWidth(0.3)
        c.line(margem_esq, y_position + 5, margem_dir, y_position + 5)
        
        y_position -= 20
        
        # ==================== DADOS DO PACIENTE ====================
        c.setFont("Helvetica-Bold", 10)
        c.setFillColor(colors.HexColor('#1a1a1a'))
        c.drawString(margem_esq, y_position, "IDENTIFICAÇÃO DO PACIENTE")
        
        y_position -= 18
        c.setStrokeColor(colors.HexColor('#e0e0e0'))
        c.line(margem_esq, y_position + 3, margem_esq + 80, y_position + 3)
        
        y_position -= 12
        c.setFont("Helvetica", 9)
        c.setFillColor(colors.HexColor('#444444'))
        
        idade = dados_paciente.get('idade', 'N/I')
        sexo = dados_paciente.get('sexo', 'N/I')
        c.drawString(margem_esq, y_position, f"Idade: {idade} anos")
        c.drawString(margem_esq + 120, y_position, f"Sexo: {sexo}")
        
        y_position -= 18
        c.setFont("Helvetica-Bold", 8)
        c.drawString(margem_esq, y_position, "HISTÓRICO E SINTOMAS")
        
        y_position -= 14
        c.setFont("Helvetica", 9)
        historia = f"Histórico: {dados_paciente.get('historia', 'N/I')} | Sintomas: {dados_paciente.get('sintomas', 'N/I')}"
        historia_lines = quebrar_linhas(historia, "Helvetica", 9, largura_util)
        for line in historia_lines[:3]:
            c.drawString(margem_esq, y_position, line)
            y_position -= 14
        
        y_position -= 15
        c.setStrokeColor(colors.HexColor('#eeeeee'))
        c.line(margem_esq, y_position, margem_dir, y_position)
        y_position -= 25
        
        # ==================== LAUDO (CONTEÚDO) ====================
        linhas_laudo = texto_ai.split('\n')
        
        # Regex para identificar linhas que são apenas sequências repetidas de caracteres de separação
        separador_pattern = re.compile(r'^[=\-_*#]{4,}\s*$')
        
        for linha in linhas_laudo:
            linha = linha.strip()
            if not linha:
                y_position -= 8
                continue
            
            # Ignora linhas que sejam apenas repetições de caracteres como "=====", "-----", etc.
            if separador_pattern.match(linha):
                continue
            
            linha_limpa = linha.replace('##', '').replace('**', '').replace('*', '').strip()

            # Título de seção é a linha inteiramente em caixa alta (ex.:
            # "ACHADOS MORFOLÓGICOS"). Procurar a palavra dentro da linha
            # transformava conteúdo em título — "Série vermelha: ..." virava
            # uma linha toda maiúscula e sem quebra.
            is_title = (
                linha_limpa == linha_limpa.upper()
                and len(linha_limpa) <= 80
                and any(caractere.isalpha() for caractere in linha_limpa)
            )

            if y_position < 100:
                c.showPage()
                y_position = margem_top
            
            if is_title:
                c.setFont("Helvetica-Bold", 10)
                c.setFillColor(colors.HexColor('#1a1a1a'))
                linhas_titulo = quebrar_linhas(linha_limpa.upper(), "Helvetica-Bold", 10, largura_util)
                for k, parte in enumerate(linhas_titulo):
                    if y_position < 80:
                        c.showPage()
                        y_position = margem_top
                        c.setFont("Helvetica-Bold", 10)
                        c.setFillColor(colors.HexColor('#1a1a1a'))
                    c.drawString(margem_esq, y_position, parte)
                    y_position -= 18 if k == len(linhas_titulo) - 1 else 13
            else:
                c.setFont("Helvetica", 9)
                c.setFillColor(colors.HexColor('#333333'))
                wrapped_lines = quebrar_linhas(linha_limpa, "Helvetica", 9, largura_util)
                for wl in wrapped_lines:
                    if y_position < 80:
                        c.showPage()
                        y_position = margem_top
                        c.setFont("Helvetica", 9)
                        c.setFillColor(colors.HexColor('#333333'))
                    c.drawString(margem_esq, y_position, wl)
                    y_position -= 14
        
        # ==================== RODAPÉ ====================
        c.setStrokeColor(colors.HexColor('#cccccc'))
        c.line(margem_esq, 50, margem_dir, 50)
        c.setFont("Helvetica-Oblique", 7)
        c.setFillColor(colors.HexColor('#888888'))
        c.drawCentredString(largura/2, 40, "Análise preliminar gerada por IA para apoio ao pré-diagnóstico. Deve ser validada por um profissional.")
        c.drawCentredString(largura/2, 30, f"Protocolo: {datetime.now().strftime('%Y%m%d%H%M%S')}")
        
        c.save()
        return caminho_completo

    except Exception as e:
        raise RuntimeError(f"Erro ao gerar PDF: {e}") from e