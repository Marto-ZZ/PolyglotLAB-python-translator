# 🌐 Polyglot-Lab — Traductor Web

Proyecto portfolio: traductor web estilo Google Translate, con frontend en **HTML/CSS/JS** y backend en **Python/ Flask/deep-translator**.

---

## 📁 Estructura del proyecto

```
polyglotlab/
├── app.py           ← Backend principal en Flask
├── requirements.txt ← Dependencias del proyecto
├── README.md        ← Documentación
├── static/          ← Archivos estáticos servidos automáticamente
│   ├── styles.css   ← Estilos y diseño visual
│   └── script.js    ← Lógica asíncrona del frontend y peticiones a la API
└── templates/       ← Vistas renderizadas por el servidor
    └── index.html   ← Estructura principal de la página
```

---

## Cómo ejecutar

### 1. Instalar dependencias Python

```bash
pip install flask deep-translator flask-cors
```

### 2. Iniciar el backend

**Para desarrollo local**

```bash
python app.py
```

El servidor quedará en `http://127.0.0.1:5000`.

**para entorno de producción (Linux/Mac)**

```bash
gunicorn -w 4 -b 127.0.0.1:5000 app:app
```

### 3. Abrir el frontend

Abrí `index.html` en tu navegador directamente, o usá una extensión como **Live Server** en VS Code.

---

## Endpoint de la API

### `POST /translate`

**Body JSON:**
```json
{
  "text": "Hola, ¿cómo estás?",
  "src_lang": "Spanish",
  "tgt_lang": "English"
}
```

**Respuesta exitosa:**
```json
{
  "translation": "Hello, how are you?"
}
```

**Idiomas soportados:** `auto-detect`, `Spanish`, `English`, `French`, `Portuguese`, `German`, `Italian`, `Japanese`, `Chinese`, `Arabic`

---

## Funcionalidades

- Detección automática de idioma
- Intercambio de idiomas con un clic (⇄)
- Contador de caracteres (límite 5000)
- Frases rápidas predefinidas
- Copiar traducción al portapapeles
- Escuchar traducción (Text-to-Speech del navegador)
- Atajo de teclado `Ctrl + Enter`
- Mensajes de error claros si el servidor no está activo

## Funcionalidades a implementar

- Límite de peticiones por usuario (usando Flask-Limiter)
- Historial de textos previamente traducidos
- Mostrar traducción fonética
- Introducir texto por voz
- Traducción de imágenes

---

## Tecnologías utilizadas

| Capa      | Tecnología                        |
|-----------|-----------------------------------|
| Frontend  | HTML5, CSS3, JavaScript           |
| Backend   | Python 3, Flask, flask-cors       |
| Traducción| deep-translator (GoogleTranslator)|
