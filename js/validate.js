import { hasUnsafeQuoteMix } from './yamlStringify.js';

const VALID_STRATEGIES = ['first-defined', 'tie-message', 'priority-order'];

/**
 * Mirrors traitwise/js/configLoader.js's rules (same two modes: "profile"
 * vs "score"), but returns a list of problem strings instead of throwing —
 * the Studio shows these live as advisory warnings while the config is
 * still being built.
 */
export function validateConfig(config) {
  const problems = [];
  const mode = config.settings && config.settings.result_mode === 'score' ? 'score' : 'profile';

  if (!config.meta || !config.meta.title) {
    problems.push('Sezione "meta": manca il titolo del quiz.');
  }
  if (config.meta && config.meta.logo) {
    if (!config.meta.logo.path) problems.push('Logo: manca il percorso del file (path).');
    if (!config.meta.logo.alt) problems.push('Logo: manca il testo alternativo (alt).');
  }

  const settings = config.settings || {};
  if (mode === 'profile') {
    if (!VALID_STRATEGIES.includes(settings.tie_break_strategy)) {
      problems.push(`"Strategia di pareggio" non valida: deve essere una tra ${VALID_STRATEGIES.join(', ')}.`);
    }
    if (settings.tie_break_strategy === 'priority-order' && (!settings.category_priority || settings.category_priority.length === 0)) {
      problems.push('Strategia "priority-order": serve almeno una categoria nell\'ordine di priorità.');
    }
    if (settings.tie_break_strategy === 'tie-message' && !settings.tie_message) {
      problems.push('Strategia "tie-message": manca il messaggio da mostrare in caso di pareggio.');
    }
  }

  if (!Array.isArray(config.questions) || config.questions.length === 0) {
    problems.push('Serve almeno una domanda.');
  } else {
    config.questions.forEach((q, i) => {
      if (!q.text) problems.push(`Domanda #${i + 1}: manca il testo.`);
      if (!Array.isArray(q.options) || q.options.length < 2) {
        problems.push(`Domanda #${i + 1}: servono almeno 2 risposte.`);
      } else {
        q.options.forEach((o, j) => {
          if (!o.label) problems.push(`Domanda #${i + 1}, risposta #${j + 1}: manca il testo.`);
          if (mode === 'profile' && !o.category) {
            problems.push(`Domanda #${i + 1}, risposta #${j + 1}: manca la categoria.`);
          }
          if (mode === 'score' && (o.points === '' || o.points === null || o.points === undefined || Number.isNaN(Number(o.points)))) {
            problems.push(`Domanda #${i + 1}, risposta #${j + 1}: manca il punteggio (points).`);
          }
        });
      }
    });
  }

  const profiles = Array.isArray(config.profiles) ? config.profiles : [];
  if (profiles.length === 0) {
    problems.push('Serve almeno un profilo.');
  } else {
    const seenCategories = new Set();
    profiles.forEach((p, i) => {
      if (!p.title) problems.push(`Profilo #${i + 1}: manca il titolo.`);
      if (p.image) {
        if (!p.image.path) problems.push(`Profilo #${i + 1}: immagine senza percorso (path).`);
        if (!p.image.alt) problems.push(`Profilo #${i + 1}: immagine senza testo alternativo (alt).`);
      }
      if (mode === 'profile') {
        if (!p.category) problems.push(`Profilo #${i + 1}: manca la categoria.`);
        else if (seenCategories.has(p.category)) problems.push(`Profilo #${i + 1}: categoria "${p.category}" già usata da un altro profilo.`);
        else seenCategories.add(p.category);
      }
      if (mode === 'score') {
        if (!p.score_range || typeof p.score_range.min !== 'number' || typeof p.score_range.max !== 'number') {
          problems.push(`Profilo #${i + 1}: manca una fascia di punteggio (min/max) valida.`);
        } else if (p.score_range.min > p.score_range.max) {
          problems.push(`Profilo #${i + 1}: il minimo della fascia è maggiore del massimo.`);
        }
      }
    });

    if (mode === 'profile') {
      const profileCategories = new Set(profiles.map((p) => p.category).filter(Boolean));
      const usedCategories = new Set();
      (config.questions || []).forEach((q) => {
        (q.options || []).forEach((o) => {
          if (o.category) usedCategories.add(o.category);
        });
      });
      usedCategories.forEach((cat) => {
        if (!profileCategories.has(cat)) {
          problems.push(`La categoria "${cat}" è usata in una domanda ma nessun profilo la usa.`);
        }
      });
    }

    if (mode === 'score') {
      const ranges = profiles
        .map((p, i) => ({ i, range: p.score_range }))
        .filter((entry) => entry.range && typeof entry.range.min === 'number' && typeof entry.range.max === 'number')
        .sort((a, b) => a.range.min - b.range.min);
      for (let i = 1; i < ranges.length; i++) {
        const prev = ranges[i - 1];
        const curr = ranges[i];
        if (curr.range.min <= prev.range.max) {
          problems.push(`Profilo #${prev.i + 1} e Profilo #${curr.i + 1}: le fasce di punteggio si sovrappongono.`);
        }
      }
    }
  }

  collectUnsafeQuoteFields(config, '', problems);

  return problems;
}

function collectUnsafeQuoteFields(value, path, problems) {
  if (typeof value === 'string') {
    if (hasUnsafeQuoteMix(value)) {
      problems.push(`Il campo "${path}" contiene sia ' che ": potrebbe non essere generato correttamente nel file YAML.`);
    }
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((v, i) => collectUnsafeQuoteFields(v, `${path}[${i + 1}]`, problems));
    return;
  }
  if (value && typeof value === 'object') {
    for (const [key, v] of Object.entries(value)) {
      collectUnsafeQuoteFields(v, path ? `${path}.${key}` : key, problems);
    }
  }
}
