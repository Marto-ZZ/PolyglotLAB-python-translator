// Configuracion
const API_URL = '/translate';

// Estado de la app
let srcLang = 'auto';
let tgtLang = 'English';

// Mapa: nombre de idioma → código BCP-47 (para Text-to-Speech)
const LANG_BCP47 = {
  English:    'en-US',
  Spanish:    'es-ES',
  French:     'fr-FR',
  Portuguese: 'pt-PT',
  German:     'de-DE',
  Italian:    'it-IT',
  Japanese:   'ja-JP',
  Chinese:    'zh-CN',
  Arabic:     'ar-SA',
};

// Referencias DOM (elementos de la pagina)
const inputText      = document.getElementById('inputText');
const outputText     = document.getElementById('outputText');
const outputPlaceholder = document.getElementById('outputPlaceholder');
const outputBox      = document.getElementById('outputBox');
const loadingBar     = document.getElementById('loadingBar');
const charCount      = document.getElementById('charCount');
const outputCount    = document.getElementById('outputCount');
const translateBtn   = document.getElementById('translateBtn');
const btnLabel       = document.getElementById('btnLabel');
const clearBtn       = document.getElementById('clearBtn');
const pasteBtn       = document.getElementById('pasteBtn');
const copyBtn        = document.getElementById('copyBtn');
const speakBtn       = document.getElementById('speakBtn');
const swapBtn        = document.getElementById('swapBtn');
const quickPills     = document.getElementById('quickPills');
const toast          = document.getElementById('toast');

// Elementos dropdown
const srcDropdown    = document.getElementById('srcDropdown');
const srcTrigger     = document.getElementById('srcTrigger');
const srcLabel       = document.getElementById('srcLabel');
const srcMenu        = document.getElementById('srcMenu');

const tgtDropdown    = document.getElementById('tgtDropdown');
const tgtTrigger     = document.getElementById('tgtTrigger');
const tgtLabel       = document.getElementById('tgtLabel');
const tgtMenu        = document.getElementById('tgtMenu');

// Alternar tema
const themeToggle    = document.getElementById('themeToggle');



// GESTION DE TEMA (CLARO/OSCURO)


/**
 * Obtener el tema guardado desde el almacenamiento local o las preferencias del sistema
 * @returns {string} 'light' or 'dark'
 */
function getSavedTheme() {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme) {
    return savedTheme;
  }
  
  // Chequea preferencias del sistema si no hay tema guardado
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
    return 'light';
  }
  
  return 'dark';
}

/**
 * Establecer tema
 * @param {string} theme - 'light' o 'dark'
 */
function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
}

/**
 * Alternar entre tema claro y oscuro
 */
function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  setTheme(newTheme);
}

// Inicializa el tema al cargar la pagina
setTheme(getSavedTheme());

// Boton de alternar tema
themeToggle.addEventListener('click', toggleTheme);

// Escucha cambios en las preferencias del sistema (solo si el usuario no ha establecido una preferencia manual)
if (window.matchMedia) {
  window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', (e) => {
    // Solo cambiar el tema si el usuario no ha guardado una preferencia manual
    if (!localStorage.getItem('theme')) {
      setTheme(e.matches ? 'light' : 'dark');
    }
  });
}


// UTILIDADES

/**
 * Muestra un mensaje toast temporal en pantalla
 * @param {string} message  - Texto a mostrar
 * @param {'info'|'error'} type - Tipo de toast
 * @param {number} duration - Duración en ms (default: 2200)
 */
function showToast(message, type = 'info', duration = 2200) {
  toast.textContent = message;
  toast.classList.toggle('toast--error', type === 'error');
  toast.classList.add('toast--visible');
  clearTimeout(toast._timeout);
  toast._timeout = setTimeout(() => {
    toast.classList.remove('toast--visible');
  }, duration);
}

/**
 * Actualiza el contador de caracteres del input
 */
function updateCharCount() {
  charCount.textContent = inputText.value.length;
}

/**
 * Muestra el texto traducido en el panel de salida
 * @param {string} text
 */
function setOutput(text) {
  outputText.textContent = text;
  outputText.classList.toggle('panel__result--visible', !!text);
  outputPlaceholder.style.display = text ? 'none' : 'block';
  outputCount.textContent = text ? `${text.length} caracteres` : '—';
}

/**
 * Pone la UI en estado de carga
 * @param {boolean} loading
 */
function setLoading(loading) {
  translateBtn.disabled = loading;
  translateBtn.classList.toggle('translate-btn--loading', loading);
  btnLabel.textContent = loading ? 'Traduciendo…' : 'Traducir';
  loadingBar.classList.toggle('loading-bar--active', loading);
}


// GESTION DROPDOWN

/**
 * Activar o desactivar el dropdown menu
 * @param {HTMLElement} trigger - Trigger button
 * @param {HTMLElement} menu - Dropdown menu
 */
function toggleDropdown(trigger, menu) {
  const isOpen = menu.classList.contains('dropdown-menu--open');
  
  // Cerrar todos los dropdowns primero
  closeAllDropdowns();
  
  if (!isOpen) {
    menu.classList.add('dropdown-menu--open');
    trigger.setAttribute('aria-expanded', 'true');
  }
}

/**
 * Cierra todos los dropdowns abiertos y restablece los atributos aria
 */
function closeAllDropdowns() {
  document.querySelectorAll('.dropdown-menu').forEach(menu => {
    menu.classList.remove('dropdown-menu--open');
  });
  document.querySelectorAll('.dropdown-trigger').forEach(trigger => {
    trigger.setAttribute('aria-expanded', 'false');
  });
}

/**
 * Selecciona un idioma del dropdown, actualiza el label y el estado seleccionado
 * @param {string} lang - Codigo del idioma
 * @param {string} flag - Emoji bandera
 * @param {HTMLElement} labelElement - Elemento del label a actualizar
 * @param {HTMLElement} menu - Dropdown menu
 */
function selectLanguage(lang, flag, labelElement, menu) {
  labelElement.textContent = `${flag} ${getLanguageName(lang)}`;
  
  // Actualizar estado seleccionado en el dropdown
  menu.querySelectorAll('.dropdown-item').forEach(item => {
    item.classList.toggle('dropdown-item--selected', item.dataset.lang === lang);
  });
  
  closeAllDropdowns();
}

/**
 * Obtiene el nombre legible del idioma a partir de su código
 * @param {string} code
 * @returns {string}
 */
function getLanguageName(code) {
  const names = {
    'auto': 'Detectar idioma',
    'Spanish': 'Español',
    'English': 'Inglés',
    'French': 'Francés',
    'Portuguese': 'Portugués',
    'German': 'Alemán',
    'Italian': 'Italiano',
    'Japanese': 'Japonés',
    'Chinese': 'Chino',
    'Arabic': 'Árabe'
  };
  return names[code] || code;
}

// Source dropdown events
srcTrigger.addEventListener('click', (e) => {
  e.stopPropagation();
  toggleDropdown(srcTrigger, srcMenu);
});

srcMenu.addEventListener('click', (e) => {
  const item = e.target.closest('.dropdown-item');
  if (!item) return;
  
  const lang = item.dataset.lang;
  const flag = item.dataset.flag;
  
  srcLang = lang;
  selectLanguage(lang, flag, srcLabel, srcMenu);
});

// Target dropdown events
tgtTrigger.addEventListener('click', (e) => {
  e.stopPropagation();
  toggleDropdown(tgtTrigger, tgtMenu);
});

tgtMenu.addEventListener('click', (e) => {
  const item = e.target.closest('.dropdown-item');
  if (!item) return;
  
  const lang = item.dataset.lang;
  const flag = item.dataset.flag;
  
  tgtLang = lang;
  selectLanguage(lang, flag, tgtLabel, tgtMenu);
});

// Cierra dropdowns al hacer clic fuera de ellos
document.addEventListener('click', (e) => {
  if (!e.target.closest('.dropdown')) {
    closeAllDropdowns();
  }
});

// Cierra dropdowns al presionar Escape
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeAllDropdowns();
  }
});

// Iniciar estado seleccionado en los dropdowns según srcLang y tgtLang
document.querySelectorAll('.dropdown-item').forEach(item => {
  const lang = item.dataset.lang;
  if (lang === srcLang && item.closest('#srcMenu')) {
    item.classList.add('dropdown-item--selected');
  }
  if (lang === tgtLang && item.closest('#tgtMenu')) {
    item.classList.add('dropdown-item--selected');
  }
});


// BOTON DE INTERCAMBIAR IDIOMAS

swapBtn.addEventListener('click', () => {
  if (srcLang === 'auto') {
    showToast('No se puede intercambiar con «Detectar idioma»', 'error');
    return;
  }

  // Obtener las banderas actuales para srcLang y tgtLang
  const srcFlag = srcMenu.querySelector(`[data-lang="${srcLang}"]`).dataset.flag;
  const tgtFlag = tgtMenu.querySelector(`[data-lang="${tgtLang}"]`).dataset.flag;

  // Intercambiar codigos y labels
  [srcLang, tgtLang] = [tgtLang, srcLang];
  
  // Actualizar labels con banderas intercambiadas
  srcLabel.textContent = `${srcFlag === '🇬🇧' ? tgtFlag : srcFlag} ${getLanguageName(srcLang)}`;
  tgtLabel.textContent = `${tgtFlag === '🇬🇧' ? srcFlag : tgtFlag} ${getLanguageName(tgtLang)}`;
  
  // Actualizar estado seleccionado en los dropdowns
  srcMenu.querySelectorAll('.dropdown-item').forEach(item => {
    item.classList.toggle('dropdown-item--selected', item.dataset.lang === srcLang);
  });
  tgtMenu.querySelectorAll('.dropdown-item').forEach(item => {
    item.classList.toggle('dropdown-item--selected', item.dataset.lang === tgtLang);
  });

  // Intercambiar texto visible
  const prevInput = inputText.value;
  inputText.value = outputText.textContent;
  setOutput(prevInput);
  updateCharCount();
});


// CONTADOR DE CARACTERES

inputText.addEventListener('input', updateCharCount);


// BOTONES DE ACCION (panel izquierdo)


// Borrar
clearBtn.addEventListener('click', () => {
  inputText.value = '';
  setOutput('');
  updateCharCount();
  inputText.focus();
});

// Pegar desde portapapeles
pasteBtn.addEventListener('click', async () => {
  try {
    const text = await navigator.clipboard.readText();
    inputText.value = text;
    updateCharCount();
    inputText.focus();
  } catch {
    showToast('No se pudo acceder al portapapeles', 'error');
  }
});


// BOTONES DE ACCION (panel derecho)


// Copiar traduccion
copyBtn.addEventListener('click', () => {
  const text = outputText.textContent;
  if (!text) {
    showToast('No hay texto para copiar', 'error');
    return;
  }
  navigator.clipboard.writeText(text).then(() => {
    copyBtn.classList.add('icon-btn--success');
    showToast('✓ Copiado al portapapeles');
    setTimeout(() => copyBtn.classList.remove('icon-btn--success'), 1800);
  });
});

// Escuchar (Text-to-Speech)
speakBtn.addEventListener('click', () => {
  const text = outputText.textContent;
  if (!text) {
    showToast('No hay texto para reproducir', 'error');
    return;
  }
  if (!window.speechSynthesis) {
    showToast('Tu navegador no soporta voz', 'error');
    return;
  }
  speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(text);
  utt.lang = LANG_BCP47[tgtLang] || 'en-US';
  speechSynthesis.speak(utt);
});


// FRASES RAPIDAS

quickPills.addEventListener('click', (e) => {
  const pill = e.target.closest('.pill');
  if (!pill) return;
  inputText.value = pill.textContent;
  updateCharCount();
  doTranslate();
});


// ATAJO DE TECLADO: Ctrl + Enter

document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    e.preventDefault();
    doTranslate();
  }
});

// Botón traducir
translateBtn.addEventListener('click', doTranslate);


// FUNCION PRINCIPAL DE TRADUCCION
// Llama al backend Flask/Python (app.py)


/**
 * EnvIa el texto al backend Flask y muestra la traducción
 */
async function doTranslate() {
  const text = inputText.value.trim();

  if (!text) {
    showToast('Escribe algo para traducir', 'error');
    inputText.focus();
    return;
  }

  if (srcLang !== 'auto' && srcLang === tgtLang) {
    showToast('El idioma de origen y destino son iguales', 'error');
    return;
  }

  setLoading(true);
  setOutput('');

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text:     text,
        src_lang: srcLang,   // 'auto' o nombre en inglEs
        tgt_lang: tgtLang,   // nombre en inglEs
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      // El backend devolvio un error HTTP con mensaje
      throw new Error(data.error || `Error del servidor (${response.status})`);
    }

    setOutput(data.translation);

  } catch (err) {
    if (err.name === 'TypeError') {
      // Fallo de red, el servidor no esta corriendo
      showToast('No se pudo conectar con el servidor. ¿Está corriendo app.py?', 'error', 4000);
    } else {
      showToast(`Error: ${err.message}`, 'error', 4000);
    }
    console.error('[PolyglotLAB]', err);
  } finally {
    setLoading(false);
  }

}
