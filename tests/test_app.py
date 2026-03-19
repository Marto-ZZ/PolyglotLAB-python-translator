#tests para app.py
#ejecutar con: pytest /tests -v
import pytest
from unittest.mock import patch
from app import app, resolve_lang

# Fixture principal

# cliente de prueba que simula requests HTTP sin levantar el servidor real
@pytest.fixture
def client():
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client


# TESTS DE resolve_lang
# funcion que convierte nombres de idioma a codigos ISO

class TestResolveLang:

    def test_idiomas_validos(self):
        # todos los idiomas del mapa tienen que devolver su codigo correcto
        assert resolve_lang("Spanish")    == "es"
        assert resolve_lang("English")    == "en"
        assert resolve_lang("French")     == "fr"
        assert resolve_lang("Portuguese") == "pt"
        assert resolve_lang("German")     == "de"
        assert resolve_lang("Italian")    == "it"
        assert resolve_lang("Japanese")   == "ja"
        assert resolve_lang("Chinese")    == "zh-CN"
        assert resolve_lang("Arabic")     == "ar"

    def test_auto_se_mapea_a_auto(self):
        # auto es un caso especial, tiene que pasar tal cual
        assert resolve_lang("auto") == "auto"

    def test_idioma_desconocido_lanza_error(self):
        # si mandan un idioma que no existe tiene que explotar con ValueError
        with pytest.raises(ValueError) as exc:
            resolve_lang("Klingon")
        assert "Klingon" in str(exc.value)

    def test_string_vacio_lanza_error(self):
        # string vacio tampoco es valido
        with pytest.raises(ValueError):
            resolve_lang("")

    def test_case_sensitive(self):
        # el mapa es case-sensitive, "spanish" en minuscula no es valido
        with pytest.raises(ValueError):
            resolve_lang("spanish")


# TESTS DEL ENDPOINT / health (devuelve el estado del servicio en JSON)

class TestHealth:

    def test_health_responde_ok(self, client):
        res = client.get("/health")
        assert res.status_code == 200

    def test_health_devuelve_json_correcto(self, client):
        res = client.get("/health")
        data = res.get_json()
        assert data["status"] == "ok"
        assert data["service"] == "PolyglotLAB API"


# TESTS DEL ENDPOINT (ruta raiz que devuelve el html)

class TestIndex:

    def test_index_carga_sin_error(self, client):
        # la ruta raiz tiene que devolver 200 con el html
        res = client.get("/")
        assert res.status_code == 200

# TESTS DEL ENDPOINT / translate (validaciones del payload)
# estos no llaman a google, solo prueban que app.py valida bien el payload

class TestTranslateValidaciones:

    def test_sin_body_devuelve_400(self, client):
        # mandar request sin JSON tiene que fallar con 400
        res = client.post("/translate")
        assert res.status_code == 400

    def test_body_no_json_devuelve_400(self, client):
        # mandar texto plano en vez de JSON tambien tiene que fallar
        res = client.post("/translate", data="hola", content_type="text/plain")
        assert res.status_code == 400

    def test_texto_vacio_devuelve_400(self, client):
        res = client.post("/translate", json={
            "text": "",
            "src_lang": "Spanish",
            "tgt_lang": "English"
        })
        assert res.status_code == 400
        assert "vacío" in res.get_json()["error"]

    def test_texto_solo_espacios_devuelve_400(self, client):
        # el .strip() del backend tiene que atrapar esto
        res = client.post("/translate", json={
            "text": "     ",
            "src_lang": "Spanish",
            "tgt_lang": "English"
        })
        assert res.status_code == 400

    def test_texto_demasiado_largo_devuelve_400(self, client):
        # 5001 caracteres tiene que superar el limite
        res = client.post("/translate", json={
            "text": "a" * 5001,
            "src_lang": "Spanish",
            "tgt_lang": "English"
        })
        assert res.status_code == 400
        assert "5 000" in res.get_json()["error"]

    def test_texto_en_el_limite_exacto_pasa(self, client):
        # 5000 caracteres exactos tienen que pasar la validacion
        with patch("app.GoogleTranslator") as mock_translator:
            mock_translator.return_value.translate.return_value = "a" * 5000
            res = client.post("/translate", json={
                "text": "a" * 5000,
                "src_lang": "Spanish",
                "tgt_lang": "English"
            })
        assert res.status_code == 200

    def test_idioma_origen_invalido_devuelve_400(self, client):
        res = client.post("/translate", json={
            "text": "hola",
            "src_lang": "Klingon",
            "tgt_lang": "English"
        })
        assert res.status_code == 400
        assert "Klingon" in res.get_json()["error"]

    def test_idioma_destino_invalido_devuelve_400(self, client):
        res = client.post("/translate", json={
            "text": "hola",
            "src_lang": "Spanish",
            "tgt_lang": "Martiano"
        })
        assert res.status_code == 400
        assert "Martiano" in res.get_json()["error"]

    def test_get_en_translate_devuelve_405(self, client):
        # /translate solo acepta POST
        res = client.get("/translate")
        assert res.status_code == 405

# TESTS DEL ENDPOINT /translate - traduccion exitosa (con mock)
# Aca mock srive para no depender de internet ni de la API de google

class TestTranslateExitoso:

    def test_traduccion_basica(self, client):
        with patch("app.GoogleTranslator") as mock_translator:
            mock_translator.return_value.translate.return_value = "Hello"
            res = client.post("/translate", json={
                "text": "Hola",
                "src_lang": "Spanish",
                "tgt_lang": "English"
            })
        assert res.status_code == 200
        assert res.get_json()["translation"] == "Hello"

    def test_autodetectar_idioma(self, client):
        # auto tiene que pasarse como source sin problema
        with patch("app.GoogleTranslator") as mock_translator:
            mock_translator.return_value.translate.return_value = "Good morning"
            res = client.post("/translate", json={
                "text": "Buenos dias",
                "src_lang": "auto",
                "tgt_lang": "English"
            })
        assert res.status_code == 200
        assert "translation" in res.get_json()

    def test_se_llama_con_los_codigos_correctos(self, client):
        # verificar que resolve_lang esta siendo aplicado antes de llamar al traductor
        with patch("app.GoogleTranslator") as mock_translator:
            mock_translator.return_value.translate.return_value = "Bonjour"
            client.post("/translate", json={
                "text": "Hola",
                "src_lang": "Spanish",
                "tgt_lang": "French"
            })
        # tiene que haberse llamado con "es" y "fr", no con "Spanish" y "French"
        mock_translator.assert_called_once_with(source="es", target="fr")

    def test_src_lang_por_defecto_es_auto(self, client):
        # si no se manda src_lang, el backend usa "auto" por defecto
        with patch("app.GoogleTranslator") as mock_translator:
            mock_translator.return_value.translate.return_value = "Hello"
            res = client.post("/translate", json={
                "text": "Hola",
                "tgt_lang": "English"
            })
        assert res.status_code == 200

    def test_tgt_lang_por_defecto_es_english(self, client):
        # si no se manda tgt_lang, el backend usa "English" por defecto
        with patch("app.GoogleTranslator") as mock_translator:
            mock_translator.return_value.translate.return_value = "Hello"
            res = client.post("/translate", json={
                "text": "Hola"
            })
        assert res.status_code == 200
