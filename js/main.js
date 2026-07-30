import { createDefaultState, normalizeImportedConfig, pruneForExport } from './state.js';
import { parseYAML } from './yamlParser.js';
import { stringifyConfig } from './yamlStringify.js';
import { validateConfig } from './validate.js';
import { renderForm, renderValidation, updateCategoryDatalist } from './render.js';

let state = createDefaultState();

function currentYaml() {
  return stringifyConfig(pruneForExport(state));
}

function refreshPreview() {
  document.getElementById('yaml-preview').textContent = currentYaml();
  renderValidation(validateConfig(state));
}

function rebuildForm() {
  updateCategoryDatalist(state.profiles);
  renderForm(state, {
    onChange: refreshPreview,
    onStructuralChange: rebuildForm,
  });
  refreshPreview();
}

function showImportError(message) {
  const el = document.getElementById('import-error');
  el.textContent = message;
  el.hidden = !message;
}

function importYamlText(text, sourceLabel) {
  try {
    const parsed = parseYAML(text);
    state = normalizeImportedConfig(parsed);
    showImportError('');
    rebuildForm();
    return true;
  } catch (err) {
    showImportError(`Impossibile leggere ${sourceLabel}: ${err.message}`);
    return false;
  }
}

document.getElementById('file-import').addEventListener('change', (event) => {
  const file = event.target.files[0];
  event.target.value = '';
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => importYamlText(String(reader.result), 'il file');
  reader.onerror = () => showImportError('Impossibile leggere il file selezionato.');
  reader.readAsText(file);
});

const pastePanel = document.getElementById('paste-import-panel');
const pasteTextarea = document.getElementById('paste-import-textarea');

document.getElementById('btn-paste-toggle').addEventListener('click', () => {
  pastePanel.hidden = false;
  pasteTextarea.focus();
});

document.getElementById('btn-paste-cancel').addEventListener('click', () => {
  pastePanel.hidden = true;
  pasteTextarea.value = '';
  showImportError('');
});

document.getElementById('btn-paste-confirm').addEventListener('click', () => {
  if (!pasteTextarea.value.trim()) {
    showImportError('Incolla del testo YAML prima di importare.');
    return;
  }
  const ok = importYamlText(pasteTextarea.value, 'il testo incollato');
  if (ok) {
    pastePanel.hidden = true;
    pasteTextarea.value = '';
  }
});

document.getElementById('btn-download').addEventListener('click', () => {
  const blob = new Blob([currentYaml()], { type: 'text/yaml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'config.yaml';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
});

document.getElementById('btn-copy').addEventListener('click', async () => {
  const btn = document.getElementById('btn-copy');
  try {
    await navigator.clipboard.writeText(currentYaml());
    const original = btn.textContent;
    btn.textContent = 'Copiato';
    setTimeout(() => { btn.textContent = original; }, 1500);
  } catch {
    showImportError('Copia negli appunti non riuscita: seleziona e copia manualmente il testo a destra.');
  }
});

document.getElementById('btn-reset').addEventListener('click', () => {
  const confirmed = window.confirm('Ricominciare da un quiz vuoto? Le modifiche non salvate andranno perse.');
  if (!confirmed) return;
  state = createDefaultState();
  showImportError('');
  rebuildForm();
});

rebuildForm();
