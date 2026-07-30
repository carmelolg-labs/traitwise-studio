/**
 * In-memory config state + mutation helpers. Ids are generated here and
 * never exposed as editable fields in the UI — one less thing a
 * non-technical editor can get wrong (duplicate/mistyped ids).
 *
 * Options carry both "category" and "points", profiles both "category"
 * and "score_range" — only the pair relevant to settings.result_mode is
 * rendered/exported, but keeping both means switching modes back and
 * forth in the UI doesn't silently discard what was already typed.
 */

let counter = 0;

function makeId(prefix) {
  counter += 1;
  return `${prefix}_${Date.now().toString(36)}${counter}`;
}

export function createDefaultState() {
  return {
    meta: {
      title: 'Il mio quiz',
      subtitle: '',
      logo: null,
      intro_paragraphs: ['Scrivi qui una breve introduzione al quiz.'],
      start_button_label: 'Inizia il quiz',
      restart_button_label: 'Rifai il quiz',
    },
    settings: {
      result_mode: 'profile',
      tie_break_strategy: 'priority-order',
      category_priority: ['A', 'B'],
      tie_message: '',
      no_match_message: '',
    },
    questions: [
      {
        id: makeId('q'),
        text: 'Scrivi qui la prima domanda?',
        options: [
          { id: makeId('opt'), label: 'Prima risposta', category: 'A', points: '' },
          { id: makeId('opt'), label: 'Seconda risposta', category: 'B', points: '' },
        ],
      },
    ],
    profiles: [
      {
        category: 'A',
        score_range: null,
        title: 'Profilo A',
        subtitle: '',
        image: null,
        description_paragraphs: ['Descrivi qui il profilo A.'],
        tips: [],
        song: '',
        activity: '',
        accent_color: '#ff6b6b',
      },
      {
        category: 'B',
        score_range: null,
        title: 'Profilo B',
        subtitle: '',
        image: null,
        description_paragraphs: ['Descrivi qui il profilo B.'],
        tips: [],
        song: '',
        activity: '',
        accent_color: '#3a6ea5',
      },
    ],
  };
}

export function normalizeImportedConfig(parsed) {
  const src = parsed && typeof parsed === 'object' ? parsed : {};
  const meta = src.meta || {};
  const settings = src.settings || {};

  return {
    meta: {
      title: meta.title || '',
      subtitle: meta.subtitle || '',
      logo: meta.logo
        ? { path: meta.logo.path || '', alt: meta.logo.alt || '', width: meta.logo.width || '' }
        : null,
      intro_paragraphs: Array.isArray(meta.intro_paragraphs) ? meta.intro_paragraphs.slice() : [],
      start_button_label: meta.start_button_label || '',
      restart_button_label: meta.restart_button_label || '',
    },
    settings: {
      result_mode: settings.result_mode === 'score' ? 'score' : 'profile',
      tie_break_strategy: settings.tie_break_strategy || 'priority-order',
      category_priority: Array.isArray(settings.category_priority) ? settings.category_priority.slice() : [],
      tie_message: settings.tie_message || '',
      no_match_message: settings.no_match_message || '',
    },
    questions: Array.isArray(src.questions)
      ? src.questions.map((q) => ({
          id: q.id || makeId('q'),
          text: q.text || '',
          options: Array.isArray(q.options)
            ? q.options.map((o) => ({
                id: o.id || makeId('opt'),
                label: o.label || '',
                category: o.category || '',
                points: o.points === undefined || o.points === null ? '' : o.points,
              }))
            : [],
        }))
      : [],
    profiles: Array.isArray(src.profiles)
      ? src.profiles.map((p) => ({
          category: p.category || '',
          score_range: p.score_range
            ? { min: p.score_range.min, max: p.score_range.max }
            : null,
          title: p.title || '',
          subtitle: p.subtitle || '',
          image: p.image ? { path: p.image.path || '', alt: p.image.alt || '' } : null,
          description_paragraphs: Array.isArray(p.description_paragraphs) ? p.description_paragraphs.slice() : [],
          tips: Array.isArray(p.tips) ? p.tips.slice() : [],
          song: p.song || '',
          activity: p.activity || '',
          accent_color: p.accent_color || '#ff6b6b',
        }))
      : [],
  };
}

/**
 * State keeps both category/points and category/score_range fields around
 * (see module comment above) so toggling result_mode doesn't lose data.
 * The exported YAML should NOT carry the irrelevant half of that pair —
 * this builds a clean, mode-appropriate copy for stringifyConfig().
 */
export function pruneForExport(state) {
  const isScore = state.settings.result_mode === 'score';

  const settings = { result_mode: state.settings.result_mode };
  if (isScore) {
    settings.no_match_message = state.settings.no_match_message;
  } else {
    settings.tie_break_strategy = state.settings.tie_break_strategy;
    settings.category_priority = state.settings.category_priority;
    settings.tie_message = state.settings.tie_message;
  }

  const questions = state.questions.map((q) => ({
    id: q.id,
    text: q.text,
    options: q.options.map((o) =>
      isScore
        ? { id: o.id, label: o.label, points: o.points }
        : { id: o.id, label: o.label, category: o.category }
    ),
  }));

  const profiles = state.profiles.map((p) => {
    const shared = {
      title: p.title,
      subtitle: p.subtitle,
      image: p.image,
      description_paragraphs: p.description_paragraphs,
      tips: p.tips,
      song: p.song,
      activity: p.activity,
      accent_color: p.accent_color,
    };
    return isScore ? { score_range: p.score_range, ...shared } : { category: p.category, ...shared };
  });

  return { meta: state.meta, settings, questions, profiles };
}

export function move(array, index, direction) {
  const newIndex = index + direction;
  if (newIndex < 0 || newIndex >= array.length) return;
  const [item] = array.splice(index, 1);
  array.splice(newIndex, 0, item);
}

export function addQuestion(state) {
  const isScore = state.settings.result_mode === 'score';
  const fallbackCategoryA = state.profiles[0] ? state.profiles[0].category : 'A';
  const fallbackCategoryB = state.profiles[1] ? state.profiles[1].category : 'B';
  state.questions.push({
    id: makeId('q'),
    text: '',
    options: [
      { id: makeId('opt'), label: '', category: fallbackCategoryA, points: isScore ? 1 : '' },
      { id: makeId('opt'), label: '', category: fallbackCategoryB, points: isScore ? 0 : '' },
    ],
  });
}

export function addOption(state, question) {
  const isScore = state.settings.result_mode === 'score';
  question.options.push({
    id: makeId('opt'),
    label: '',
    category: isScore ? '' : (state.profiles[0] ? state.profiles[0].category : ''),
    points: isScore ? 0 : '',
  });
}

export function addProfile(state) {
  const isScore = state.settings.result_mode === 'score';
  state.profiles.push({
    category: isScore ? '' : '',
    score_range: isScore ? { min: 0, max: 0 } : null,
    title: '',
    subtitle: '',
    image: null,
    description_paragraphs: [''],
    tips: [],
    song: '',
    activity: '',
    accent_color: '#ff6b6b',
  });
}
