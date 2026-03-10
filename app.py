"""
PolyglotLAB — app.py
Backend Flask con deep-translator.

Instalación de dependencias:
    pip install flask deep-translator flask-cors

Ejecutar:
    python app.py
"""

from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
from deep_translator import GoogleTranslator
from deep_translator.exceptions import (
    LanguageNotSupportedException,
    TranslationNotFound,
    RequestError,
)

# Crea la aplicación Flask
app = Flask(__name__)


# Ruta del html
@app.route("/")
def index():
    return render_template("index.html")


# Permite peticiones desde el frontend (index.html abierto en el navegador)
CORS(app)

# Mapa: nombre de idioma (enviado desde JS) -> código ISO 639-1
LANG_MAP: dict[str, str] = {
    "auto":       "auto",
    "Spanish":    "es",
    "English":    "en",
    "French":     "fr",
    "Portuguese": "pt",
    "German":     "de",
    "Italian":    "it",
    "Japanese":   "ja",
    "Chinese":    "zh-CN",
    "Arabic":     "ar",
}


def resolve_lang(name: str) -> str:
    """
    Convierte el nombre de idioma recibido desde el frontend al código ISO
    que acepta GoogleTranslator. Lanza ValueError si el idioma no es conocido.
    """
    code = LANG_MAP.get(name)
    if code is None:
        raise ValueError(f"Idioma no soportado: '{name}'")
    return code


# Endpoint principal
@app.route("/translate", methods=["POST"])
def translate():
    """
    Recibe un JSON con:
        {
          "text":     "Texto a traducir",
          "src_lang": "Spanish" | "auto" | ...,
          "tgt_lang": "English" | ...
        }

    Devuelve:
        { "translation": "Translated text" }
    o en caso de error:
        { "error": "Descripción del error" }  (con status 4xx/5xx)
    """
    data = request.get_json(silent=True)

    # Validación básica del payload
    if not data:
        return jsonify({"error": "El cuerpo de la petición debe ser JSON válido."}), 400

    text = data.get("text", "").strip()
    src_name = data.get("src_lang", "auto")
    tgt_name = data.get("tgt_lang", "English")

    if not text:
        return jsonify({"error": "El campo 'text' está vacío."}), 400

    if len(text) > 5000:
        return jsonify({"error": "El texto supera el límite de 5 000 caracteres."}), 400

    # Resolver códigos de idioma
    try:
        src_code = resolve_lang(src_name)
        tgt_code = resolve_lang(tgt_name)
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

    # Traducción con deep-translator (GoogleTranslator)
    try:
        translator = GoogleTranslator(source=src_code, target=tgt_code)
        translation = translator.translate(text)

        if not translation:
            return jsonify({"error": "El servicio de traducción devolvió un resultado vacío."}), 502

        return jsonify({"translation": translation})

    except LanguageNotSupportedException as e:
        return jsonify({"error": f"Idioma no soportado por Google Translate: {e}"}), 400

    except TranslationNotFound as e:
        return jsonify({"error": f"No se encontró traducción: {e}"}), 404

    except RequestError as e:
        return jsonify({"error": f"Error de red al contactar Google Translate: {e}"}), 502

    except Exception as e:
        # Error inesperado — no exponer detalles internos en producción
        app.logger.exception("Error inesperado al traducir")
        return jsonify({"error": "Error interno del servidor."}), 500


# Endpoint de salud (opcional, útil para verificar que el servidor corre)
@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "service": "PolyglotLAB API"})


# Manejador global de errores 405
@app.errorhandler(405)
def method_not_allowed(e):
    return jsonify({"error": "Método HTTP no permitido en esta ruta."}), 405


if __name__ == "__main__":
    # debug=True recarga automáticamente al guardar cambios

    app.run(host="127.0.0.1", port=5000, debug=True)
