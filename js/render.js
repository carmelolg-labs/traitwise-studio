import { move, addQuestion, addOption, addProfile } from './state.js';

function el(tag, props = {}, children = []) {
  const node = document.createElement(tag);
  Object.entries(props).forEach(([key, value]) => {
    if (key === 'className') node.className = value;
    else if (key === 'text') node.textContent = value;
    else node.setAttribute(key, value);
  });
  children.forEach((child) => node.appendChild(child));
  return node;
}

function iconButton(label, title, onClick) {
  const btn = el('button', { type: 'button', className: 'btn-icon-sm', title, 'aria-label': title, text: label });
  btn.addEventListener('click', onClick);
  return btn;
}

function textField(label, value, placeholder, onInput) {
  const wrap = el('div', { className: 'field' });
  wrap.appendChild(el('label', { className: 'field-label', text: label }));
  const input = el('input', { type: 'text', value, placeholder: placeholder || '' });
  input.value = value || '';
  input.addEventListener('input', () => onInput(input.value));
  wrap.appendChild(input);
  return wrap;
}

function textareaField(label, value, placeholder, onInput) {
  const wrap = el('div', { className: 'field' });
  wrap.appendChild(el('label', { className: 'field-label', text: label }));
  const textarea = el('textarea', { rows: 2, placeholder: placeholder || '' });
  textarea.value = value || '';
  textarea.addEventListener('input', () => onInput(textarea.value));
  wrap.appendChild(textarea);
  return wrap;
}

function numberField(label, value, onInput) {
  const wrap = el('div', { className: 'field' });
  wrap.appendChild(el('label', { className: 'field-label', text: label }));
  const input = el('input', { type: 'number', min: '0' });
  input.value = value === '' || value === null || value === undefined ? '' : value;
  input.addEventListener('input', () => onInput(input.value === '' ? '' : Number(input.value)));
  wrap.appendChild(input);
  return wrap;
}

function numberRangeField(label, range, onChange) {
  const wrap = el('div', { className: 'field' });
  wrap.appendChild(el('label', { className: 'field-label', text: label }));
  const row = el('div', { className: 'field-range-row' });
  const min = el('input', { type: 'number' });
  min.value = range.min === undefined || range.min === null ? '' : range.min;
  min.placeholder = 'min';
  min.addEventListener('input', () => { range.min = min.value === '' ? '' : Number(min.value); onChange(); });
  const sep = el('span', { className: 'field-range-sep', text: '–' });
  const max = el('input', { type: 'number' });
  max.value = range.max === undefined || range.max === null ? '' : range.max;
  max.placeholder = 'max';
  max.addEventListener('input', () => { range.max = max.value === '' ? '' : Number(max.value); onChange(); });
  row.appendChild(min);
  row.appendChild(sep);
  row.appendChild(max);
  wrap.appendChild(row);
  return wrap;
}

function colorField(label, value, onInput) {
  const wrap = el('div', { className: 'field field-color' });
  wrap.appendChild(el('label', { className: 'field-label', text: label }));
  const row = el('div', { className: 'field-color-row' });
  const swatch = el('input', { type: 'color' });
  swatch.value = /^#[0-9a-fA-F]{6}$/.test(value) ? value : '#ff6b6b';
  const text = el('input', { type: 'text', placeholder: '#ff6b6b' });
  text.value = value || '';
  swatch.addEventListener('input', () => {
    text.value = swatch.value;
    onInput(swatch.value);
  });
  text.addEventListener('input', () => {
    if (/^#[0-9a-fA-F]{6}$/.test(text.value)) swatch.value = text.value;
    onInput(text.value);
  });
  row.appendChild(swatch);
  row.appendChild(text);
  wrap.appendChild(row);
  return wrap;
}

function categoryField(label, value, onInput) {
  const wrap = el('div', { className: 'field' });
  wrap.appendChild(el('label', { className: 'field-label', text: label }));
  const input = el('input', { type: 'text', list: 'category-options', placeholder: 'es. A' });
  input.value = value || '';
  input.addEventListener('input', () => onInput(input.value));
  wrap.appendChild(input);
  return wrap;
}

function checkboxToggle(label, checked, onToggle) {
  const wrap = el('label', { className: 'toggle-row' });
  const input = el('input', { type: 'checkbox' });
  input.checked = checked;
  input.addEventListener('change', () => onToggle(input.checked));
  wrap.appendChild(input);
  wrap.appendChild(el('span', { text: label }));
  return wrap;
}

function stringListEditor(list, { addLabel, placeholder }, onStructural, onChange) {
  const wrap = el('div', { className: 'list-editor' });
  list.forEach((value, index) => {
    const row = el('div', { className: 'list-editor-row' });
    const input = el('input', { type: 'text', placeholder: placeholder || '' });
    input.value = value;
    input.addEventListener('input', () => {
      list[index] = input.value;
      onChange();
    });
    row.appendChild(input);
    row.appendChild(iconButton('▲', 'Sposta su', () => { move(list, index, -1); onStructural(); }));
    row.appendChild(iconButton('▼', 'Sposta giù', () => { move(list, index, 1); onStructural(); }));
    row.appendChild(iconButton('✕', 'Rimuovi', () => { list.splice(index, 1); onStructural(); }));
    wrap.appendChild(row);
  });
  const addBtn = el('button', { type: 'button', className: 'btn btn-add', text: addLabel || '+ Aggiungi' });
  addBtn.addEventListener('click', () => { list.push(''); onStructural(); });
  wrap.appendChild(addBtn);
  return wrap;
}

function sectionCard(title, description) {
  const card = el('section', { className: 'form-card' });
  card.appendChild(el('h2', { className: 'form-card-title', text: title }));
  if (description) card.appendChild(el('p', { className: 'form-card-desc', text: description }));
  return card;
}

function itemHeader(title, onUp, onDown, onRemove) {
  const header = el('div', { className: 'item-header' });
  header.appendChild(el('span', { className: 'item-title', text: title }));
  const actions = el('div', { className: 'item-actions' });
  actions.appendChild(iconButton('▲', 'Sposta su', onUp));
  actions.appendChild(iconButton('▼', 'Sposta giù', onDown));
  actions.appendChild(iconButton('✕', 'Rimuovi', onRemove));
  header.appendChild(actions);
  return header;
}

function renderMetaSection(state, handlers) {
  const card = sectionCard('Informazioni generali', 'Titolo, introduzione e logo facoltativo mostrato in alto nella pagina.');
  const { meta } = state;

  card.appendChild(textField('Titolo del quiz', meta.title, 'es. Qual è il tuo profilo?', (v) => { meta.title = v; handlers.onChange(); }));
  card.appendChild(textField('Sottotitolo', meta.subtitle, '', (v) => { meta.subtitle = v; handlers.onChange(); }));

  card.appendChild(checkboxToggle('Mostra un logo', Boolean(meta.logo), (checked) => {
    meta.logo = checked ? { path: '', alt: '', width: '' } : null;
    handlers.onStructuralChange();
  }));
  if (meta.logo) {
    const logoWrap = el('div', { className: 'sub-fields' });
    logoWrap.appendChild(textField('Percorso file logo', meta.logo.path, 'assets/logo/logo.svg', (v) => { meta.logo.path = v; handlers.onChange(); }));
    logoWrap.appendChild(textField('Nome del brand (alt)', meta.logo.alt, 'es. Nome azienda', (v) => { meta.logo.alt = v; handlers.onChange(); }));
    logoWrap.appendChild(numberField('Larghezza in px (facoltativo)', meta.logo.width, (v) => { meta.logo.width = v; handlers.onChange(); }));
    card.appendChild(logoWrap);
  }

  card.appendChild(el('label', { className: 'field-label', text: 'Paragrafi introduttivi' }));
  card.appendChild(stringListEditor(meta.intro_paragraphs, { addLabel: '+ Aggiungi paragrafo', placeholder: 'Testo del paragrafo' }, handlers.onStructuralChange, handlers.onChange));

  card.appendChild(textField('Testo pulsante "inizia"', meta.start_button_label, 'es. Inizia il quiz', (v) => { meta.start_button_label = v; handlers.onChange(); }));
  card.appendChild(textField('Testo pulsante "rifai il quiz"', meta.restart_button_label, 'es. Rifai il quiz', (v) => { meta.restart_button_label = v; handlers.onChange(); }));

  return card;
}

function renderSettingsSection(state, handlers) {
  const card = sectionCard('Tipo di quiz', 'Quiz di personalità (vince la categoria più scelta) o quiz con risposta corretta (vince in base al punteggio).');
  const { settings } = state;

  const modeWrap = el('div', { className: 'field' });
  modeWrap.appendChild(el('label', { className: 'field-label', text: 'Modalità' }));
  const modeSelect = el('select', {});
  [
    ['profile', 'Quiz di personalità — profilo per categoria più scelta'],
    ['score', 'Quiz con risposta corretta — profilo per punteggio'],
  ].forEach(([value, labelText]) => {
    const option = el('option', { value, text: labelText });
    if (settings.result_mode === value) option.setAttribute('selected', 'selected');
    modeSelect.appendChild(option);
  });
  modeSelect.addEventListener('change', () => {
    settings.result_mode = modeSelect.value;
    handlers.onStructuralChange();
  });
  modeWrap.appendChild(modeSelect);
  card.appendChild(modeWrap);

  if (settings.result_mode === 'score') {
    card.appendChild(textareaField(
      'Messaggio se nessun profilo copre il punteggio (facoltativo)',
      settings.no_match_message,
      'Testo mostrato se le fasce dei profili non coprono il punteggio ottenuto',
      (v) => { settings.no_match_message = v; handlers.onChange(); }
    ));
    return card;
  }

  card.appendChild(el('h3', { className: 'form-card-subtitle', text: 'Gestione dei pareggi' }));
  card.appendChild(el('p', { className: 'form-card-desc', text: 'Cosa succede se due o più profili ottengono lo stesso punteggio.' }));

  const wrap = el('div', { className: 'field' });
  wrap.appendChild(el('label', { className: 'field-label', text: 'Strategia' }));
  const select = el('select', {});
  [
    ['priority-order', 'priority-order — vince la categoria con più priorità'],
    ['first-defined', 'first-defined — vince il primo profilo definito'],
    ['tie-message', 'tie-message — mostra un messaggio dedicato'],
  ].forEach(([value, labelText]) => {
    const option = el('option', { value, text: labelText });
    if (settings.tie_break_strategy === value) option.setAttribute('selected', 'selected');
    select.appendChild(option);
  });
  select.addEventListener('change', () => {
    settings.tie_break_strategy = select.value;
    handlers.onStructuralChange();
  });
  wrap.appendChild(select);
  card.appendChild(wrap);

  if (settings.tie_break_strategy === 'priority-order') {
    card.appendChild(el('label', { className: 'field-label', text: 'Ordine di priorità delle categorie' }));
    card.appendChild(stringListEditor(settings.category_priority, { addLabel: '+ Aggiungi categoria', placeholder: 'es. A' }, handlers.onStructuralChange, handlers.onChange));
  }

  if (settings.tie_break_strategy === 'tie-message') {
    card.appendChild(textareaField('Messaggio di pareggio', settings.tie_message, 'Testo mostrato quando non c\'è un vincitore netto', (v) => { settings.tie_message = v; handlers.onChange(); }));
  }

  return card;
}

function renderQuestionsSection(state, handlers) {
  const isScore = state.settings.result_mode === 'score';
  const card = sectionCard(
    'Domande',
    isScore
      ? 'Ogni domanda ha almeno 2 risposte; ogni risposta vale dei punti (1 per quella giusta, 0 per le altre).'
      : 'Ogni domanda ha almeno 2 risposte; ogni risposta contribuisce a una categoria.'
  );

  state.questions.forEach((question, qIndex) => {
    const item = el('div', { className: 'item-card' });
    item.appendChild(itemHeader(
      `Domanda ${qIndex + 1}`,
      () => { move(state.questions, qIndex, -1); handlers.onStructuralChange(); },
      () => { move(state.questions, qIndex, 1); handlers.onStructuralChange(); },
      () => { state.questions.splice(qIndex, 1); handlers.onStructuralChange(); }
    ));

    item.appendChild(textField('Testo della domanda', question.text, 'Scrivi qui la domanda', (v) => { question.text = v; handlers.onChange(); }));

    item.appendChild(el('label', { className: 'field-label', text: 'Risposte' }));
    const optionsWrap = el('div', { className: 'options-editor' });
    question.options.forEach((option, oIndex) => {
      const row = el('div', { className: 'option-editor-row' });
      row.appendChild(textField('Testo risposta', option.label, 'Testo visibile', (v) => { option.label = v; handlers.onChange(); }));
      if (isScore) {
        row.appendChild(numberField('Punti', option.points, (v) => { option.points = v; handlers.onChange(); }));
      } else {
        row.appendChild(categoryField('Categoria', option.category, (v) => { option.category = v; handlers.onChange(); }));
      }
      const rowActions = el('div', { className: 'item-actions' });
      rowActions.appendChild(iconButton('▲', 'Sposta su', () => { move(question.options, oIndex, -1); handlers.onStructuralChange(); }));
      rowActions.appendChild(iconButton('▼', 'Sposta giù', () => { move(question.options, oIndex, 1); handlers.onStructuralChange(); }));
      rowActions.appendChild(iconButton('✕', 'Rimuovi', () => { question.options.splice(oIndex, 1); handlers.onStructuralChange(); }));
      row.appendChild(rowActions);
      optionsWrap.appendChild(row);
    });
    item.appendChild(optionsWrap);

    const addOptionBtn = el('button', { type: 'button', className: 'btn btn-add', text: '+ Aggiungi risposta' });
    addOptionBtn.addEventListener('click', () => {
      addOption(state, question);
      handlers.onStructuralChange();
    });
    item.appendChild(addOptionBtn);

    card.appendChild(item);
  });

  const addQuestionBtn = el('button', { type: 'button', className: 'btn btn-add-primary', text: '+ Aggiungi domanda' });
  addQuestionBtn.addEventListener('click', () => { addQuestion(state); handlers.onStructuralChange(); });
  card.appendChild(addQuestionBtn);

  return card;
}

function renderProfilesSection(state, handlers) {
  const isScore = state.settings.result_mode === 'score';
  const card = sectionCard(
    'Profili',
    isScore
      ? 'Il risultato finale mostra il profilo la cui fascia di punteggio contiene il totale ottenuto.'
      : 'Il risultato finale mostra il profilo la cui categoria ha ricevuto più risposte.'
  );

  state.profiles.forEach((profile, pIndex) => {
    const item = el('div', { className: 'item-card' });
    item.appendChild(itemHeader(
      profile.title || `Profilo ${pIndex + 1}`,
      () => { move(state.profiles, pIndex, -1); handlers.onStructuralChange(); },
      () => { move(state.profiles, pIndex, 1); handlers.onStructuralChange(); },
      () => { state.profiles.splice(pIndex, 1); handlers.onStructuralChange(); }
    ));

    if (isScore) {
      if (!profile.score_range) profile.score_range = { min: 0, max: 0 };
      item.appendChild(numberRangeField('Fascia di punteggio (min–max)', profile.score_range, handlers.onChange));
    } else {
      item.appendChild(textField('Categoria', profile.category, 'es. A', (v) => { profile.category = v; handlers.onChange(); }));
    }
    item.appendChild(textField('Titolo del profilo', profile.title, '', (v) => { profile.title = v; handlers.onChange(); }));
    item.appendChild(textField('Sottotitolo', profile.subtitle, '', (v) => { profile.subtitle = v; handlers.onChange(); }));

    item.appendChild(checkboxToggle('Mostra un\'immagine per questo profilo', Boolean(profile.image), (checked) => {
      profile.image = checked ? { path: '', alt: '' } : null;
      handlers.onStructuralChange();
    }));
    if (profile.image) {
      const imgWrap = el('div', { className: 'sub-fields' });
      imgWrap.appendChild(textField('Percorso immagine', profile.image.path, 'assets/profiles/nome.svg', (v) => { profile.image.path = v; handlers.onChange(); }));
      imgWrap.appendChild(textField('Descrizione immagine (alt)', profile.image.alt, '', (v) => { profile.image.alt = v; handlers.onChange(); }));
      item.appendChild(imgWrap);
    }

    item.appendChild(el('label', { className: 'field-label', text: 'Descrizione (uno o più paragrafi)' }));
    item.appendChild(stringListEditor(profile.description_paragraphs, { addLabel: '+ Aggiungi paragrafo', placeholder: 'Testo del paragrafo' }, handlers.onStructuralChange, handlers.onChange));

    item.appendChild(el('label', { className: 'field-label', text: 'Consigli' }));
    item.appendChild(stringListEditor(profile.tips, { addLabel: '+ Aggiungi consiglio', placeholder: 'Un consiglio simpatico' }, handlers.onStructuralChange, handlers.onChange));

    item.appendChild(textField('Colonna sonora (facoltativo)', profile.song, '', (v) => { profile.song = v; handlers.onChange(); }));
    item.appendChild(textField('Attività consigliata (facoltativo)', profile.activity, '', (v) => { profile.activity = v; handlers.onChange(); }));
    item.appendChild(colorField('Colore di accento (facoltativo)', profile.accent_color, (v) => { profile.accent_color = v; handlers.onChange(); }));

    card.appendChild(item);
  });

  const addProfileBtn = el('button', { type: 'button', className: 'btn btn-add-primary', text: '+ Aggiungi profilo' });
  addProfileBtn.addEventListener('click', () => { addProfile(state); handlers.onStructuralChange(); });
  card.appendChild(addProfileBtn);

  return card;
}

export function renderForm(state, handlers) {
  const root = document.getElementById('form-root');
  root.innerHTML = '';
  root.appendChild(renderMetaSection(state, handlers));
  root.appendChild(renderSettingsSection(state, handlers));
  root.appendChild(renderQuestionsSection(state, handlers));
  root.appendChild(renderProfilesSection(state, handlers));
}

export function updateCategoryDatalist(profiles) {
  const datalist = document.getElementById('category-options');
  datalist.innerHTML = '';
  profiles.forEach((p) => {
    if (!p.category) return;
    datalist.appendChild(el('option', { value: p.category }));
  });
}

export function renderValidation(problems) {
  const list = document.getElementById('validation-list');
  const banner = document.getElementById('validation-banner');
  list.innerHTML = '';
  if (problems.length === 0) {
    banner.hidden = false;
    banner.className = 'validation-banner is-ok';
    banner.textContent = 'Configurazione valida.';
    return;
  }
  banner.hidden = false;
  banner.className = 'validation-banner is-warning';
  banner.textContent = `${problems.length} cosa da sistemare:`;
  problems.forEach((problem) => {
    list.appendChild(el('li', { text: problem }));
  });
}
