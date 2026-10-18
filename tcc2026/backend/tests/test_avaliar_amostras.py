from pathlib import Path
import sys
import tempfile
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from avaliar_amostras import inventariar, resumir, validar_classificacao


class AvaliacaoExploratoriaTest(unittest.TestCase):
    def test_copias_exatas_nao_inflam_numero_de_casos(self):
        with tempfile.TemporaryDirectory(dir=Path(__file__).parent) as pasta:
            raiz = Path(pasta)
            (raiz / "ALL.Jpeg").write_bytes(b"mesma imagem")
            (raiz / "123-ALL.Jpeg").write_bytes(b"mesma imagem")
            (raiz / "ALM.Jpeg").write_bytes(b"outra imagem")
            casos = inventariar(raiz)
        self.assertEqual(len(casos), 2)
        self.assertEqual(sum(c["quantidade_arquivos"] for c in casos), 3)
        self.assertEqual({c["rotulo_do_nome"] for c in casos}, {"LLA", "LMA"})
        self.assertTrue(all(not c["referencia_clinica_validada"] for c in casos))

    def test_rotulos_conflitantes_no_mesmo_conteudo_nao_viram_referencia(self):
        with tempfile.TemporaryDirectory(dir=Path(__file__).parent) as pasta:
            raiz = Path(pasta)
            (raiz / "ALL.Jpeg").write_bytes(b"mesma imagem")
            (raiz / "CLL.Jpeg").write_bytes(b"mesma imagem")
            self.assertIsNone(inventariar(raiz)[0]["rotulo_do_nome"])

    def test_indeterminados_e_erros_entram_no_denominador(self):
        resumo = resumir([
            {"referencia": "LMA", "predicao": "LMA"},
            {"referencia": "LMA", "predicao": "INDETERMINADO"},
            {"referencia": "LMA", "predicao": "ERRO"},
        ])
        self.assertEqual(resumo["por_classe"]["LMA"], {"acertos_rotulo_nome": 1, "avaliados": 3})
        self.assertEqual(resumo["matriz_rotulo_do_nome_vs_predicao"]["LMA"]["ERRO"], 1)

    def test_avaliador_usa_o_mesmo_contrato_da_api(self):
        self.assertEqual(validar_classificacao(
            "SUSPEITA_PRINCIPAL: NORMAL\nNÍVEL_CONFIANÇA: MODERADO"), "NORMAL")
        for texto in (
            "SUSPEITA_PRINCIPAL: LMC",
            "SUSPEITA_PRINCIPAL: LMA\nNÍVEL_CONFIANÇA: ALTO\nSUSPEITA_PRINCIPAL: LLA",
            "SUSPEITA_PRINCIPAL: LMA | LLA\nNÍVEL_CONFIANÇA: ALTO",
        ):
            with self.subTest(texto=texto), self.assertRaises(ValueError):
                validar_classificacao(texto)


if __name__ == "__main__":
    unittest.main()
