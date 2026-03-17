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
