/**
 * ==========================================
 * ALGORITHMS — GUESS WHO AI BOARD GAME
 * ==========================================
 */

'use strict';

// ==========================================
// SECTION A — ALGORITHM REGISTRY (Mode 2)
// ==========================================

const ALGORITHMS = [
  { id: 'csp',         name: 'CSP',           label: 'Constraint Satisfaction', color: '#e8c84a' },
  { id: 'backtrack',   name: 'Backtracking',  label: 'Depth-First Backtrack',   color: '#e74c3c' },
  { id: 'minimax',     name: 'Minimax',       label: 'Game Tree Minimax',       color: '#9b59b6' },
  { id: 'alphabeta',   name: 'Alpha-Beta',    label: 'Pruned Minimax',          color: '#3498db' },
  { id: 'bestfirst',   name: 'Best-First',    label: 'Greedy Info-Gain',        color: '#1abc9c' },
  { id: 'heuristic',   name: 'Heuristic',     label: 'Domain Knowledge',        color: '#f39c12' },
  { id: 'local',       name: 'Local Search',  label: 'Hill-Climbing',           color: '#e67e22' },
  { id: 'genetic',     name: 'Genetic',       label: 'Evolutionary Search',     color: '#27ae60' },
  { id: 'bioinspired', name: 'Bio-Inspired',  label: 'Ant Colony Opt.',         color: '#c0392b' },
  { id: 'uninformed',  name: 'Uninformed BFS',label: 'Blind BFS',               color: '#7f8c8d' }
];

// ==========================================
// SECTION B — SHARED UTILITIES
// ==========================================

const ALL_ATTRS = [
  { attr: 'gender',    values: ['male', 'female'] },
  { attr: 'glasses',   values: [true, false] },
  { attr: 'beard',     values: [true, false] },
  { attr: 'mustache',  values: [true, false] },
  { attr: 'hat',       values: [true, false] },
  { attr: 'hairColor', values: ['brown', 'black', 'blonde', 'red', 'white'] }
];

/**
 * @param {object[]} candidates
 * @returns {{ attr, value, yes, no }[]}
 */
function getAllCandidatePairs(candidates) {
  const result = [];
  for (const { attr, values } of ALL_ATTRS) {
    for (const val of values) {
      const yes = candidates.filter(c => c[attr] === val).length;
      const no  = candidates.length - yes;
      if (yes > 0 && no > 0) {
        result.push({ attr, value: val, yes, no });
      }
    }
  }
  return result;
}


function buildQuestionText(attr, value) {
  const map = {
    gender:    { male: 'Is the character male?',                  female: 'Is the character female?' },
    glasses:   { true: 'Does the character wear glasses?',         false: 'Does the character NOT wear glasses?' },
    beard:     { true: 'Does the character have a beard?',         false: 'Does the character have no beard?' },
    mustache:  { true: 'Does the character have a mustache?',      false: 'Does the character have no mustache?' },
    hat:       { true: 'Does the character wear a hat?',           false: 'Is the character not wearing a hat?' },
    hairColor: {
      brown:  'Does the character have brown hair?',
      black:  'Does the character have black hair?',
      blonde: 'Does the character have blonde hair?',
      red:    'Does the character have red hair?',
      white:  'Does the character have white or grey hair?'
    }
  };
  return map[attr]?.[String(value)] || `Is the character's ${attr} equal to ${value}?`;
}


function makeStep(attr, value, nodesExplored, note = '') {
  return {
    attr,
    value,
    question: buildQuestionText(attr, value),
    nodesExplored: nodesExplored || 1,
    note
  };
}

// ==========================================
// SECTION C — INFORMATION-THEORETIC HELPERS
// ==========================================

function calculateInformationGain(candidates, attr, value) {
  const total = candidates.length;
  if (total <= 1) return 0;

  const yes = candidates.filter(c => c[attr] === value).length;
  const no  = total - yes;
  if (yes === 0 || no === 0) return 0;

  const entropy = n => (n > 0 ? -(n / total) * Math.log2(n / total) : 0);

  const hCurrent = Math.log2(total);

  const hAfter =
    (yes / total) * (yes  > 1 ? Math.log2(yes)  : 0) +
    (no  / total) * (no   > 1 ? Math.log2(no)   : 0);

  return hCurrent - hAfter;
}

// ==========================================
// SECTION D — DIFFICULTY HELPERS (Mode 1)
// ==========================================

let currentDifficulty = 'medium'; 

function setDifficulty(level) {
  currentDifficulty = level;
  document.querySelectorAll('.difficulty-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.diff === level);
  });
  const msgs = {
    easy:   '🐣 EASY: AI is slow and makes random choices. Easy to win!',
    medium: '⚖️ MEDIUM: Fair competition! AI uses Best-First algorithm.',
    hard:   '🔥 HARD: AI is super fast and uses Information Gain (A*)!'
  };
  showToast(msgs[level] || '');
}

function getEasyAIQuestion(candidates) {
  const pairs = getAllCandidatePairs(candidates);
  if (!pairs.length) return null;

  if (Math.random() < 0.70) {
    const q = pairs[Math.floor(Math.random() * pairs.length)];
    return { attr: q.attr, value: q.value, text: buildQuestionText(q.attr, q.value), type: 'random' };
  }

  pairs.sort((a, b) => Math.max(b.yes, b.no) - Math.max(a.yes, a.no));
  const q = pairs[0];
  return { attr: q.attr, value: q.value, text: buildQuestionText(q.attr, q.value), type: 'suboptimal' };
}

function getMediumAIQuestion(candidates) {
  const pairs = getAllCandidatePairs(candidates);
  if (!pairs.length) return null;

  if (Math.random() < 0.10 && pairs.length > 1) {
    const q = pairs[Math.floor(Math.random() * pairs.length)];
    return { attr: q.attr, value: q.value, text: buildQuestionText(q.attr, q.value), type: 'random_mistake' };
  }

  let best = null, bestScore = -1;
  for (const p of pairs) {
    const score = Math.min(p.yes, p.no);
    if (score > bestScore) { bestScore = score; best = p; }
  }

  return best
    ? { attr: best.attr, value: best.value, text: buildQuestionText(best.attr, best.value), type: 'best-first' }
    : null;
}

function getHardAIQuestion(candidates) {
  const pairs = getAllCandidatePairs(candidates);
  if (!pairs.length) return null;

  if (candidates.length <= 2) {
    const char = candidates[0];
    return {
      attr: 'name', value: char.name,
      text: `Is it ${char.name}?`,
      isDirect: true, targetChar: char, type: 'direct-guess'
    };
  }

  let best = null, bestGain = -1;
  for (const p of pairs) {
    const gain = calculateInformationGain(candidates, p.attr, p.value);
    if (gain > bestGain) { bestGain = gain; best = p; }
  }

  return best
    ? { attr: best.attr, value: best.value, text: buildQuestionText(best.attr, best.value), gain: bestGain, type: 'info-gain' }
    : null;
}

function getAIQuestionByDifficulty(candidates) {
  if (currentDifficulty === 'easy') return getEasyAIQuestion(candidates);
  if (currentDifficulty === 'hard') return getHardAIQuestion(candidates);
  return getMediumAIQuestion(candidates);
}

function getAIDelay() {
  if (currentDifficulty === 'easy')   return 2000 + Math.random() * 1500; 
  if (currentDifficulty === 'hard')   return  150 + Math.random() *  150; 
  return 700 + Math.random() * 500;                                        
}

// ==========================================
// SECTION E — MODE 2 ALGORITHM STATES
// ==========================================

let algorithmStates = {};

function initAlgorithmState(algoId) {
  algorithmStates = {};  // always start clean
  switch (algoId) {
    case 'backtrack':
      algorithmStates.backtrack = { stack: [] };
      break;
    case 'local':
      algorithmStates.local = { current: null };
      break;
    case 'genetic':
      algorithmStates.genetic = { generation: 0 };
      break;
    case 'bioinspired':
      algorithmStates.bioinspired = { pheromones: null };
      break;
    default:

    break;
  }
}

// ==========================================
// SECTION F — THE 10 ALGORITHMS (Mode 2)
// ==========================================

// ── 1. CSP — Constraint Satisfaction Problem ────────────────────────────────

function cspSolve(candidates) {
  const pairs = getAllCandidatePairs(candidates);
  if (!pairs.length) return null;

  let bestAttr  = null;
  let bestVal   = null;
  let bestSplit = Infinity;   
  let nodes     = 0;

  for (const { attr, values } of ALL_ATTRS) {

    const domain = [...new Set(candidates.map(c => String(c[attr])))];
    for (const rawVal of domain) {

      const val = rawVal === 'true' ? true : rawVal === 'false' ? false : rawVal;
      nodes++;
      const yes = candidates.filter(c => c[attr] === val).length;
      const no  = candidates.length - yes;
      if (yes === 0 || no === 0) continue;
      const maxGroup = Math.max(yes, no);
      if (maxGroup < bestSplit) {
        bestSplit = maxGroup;
        bestAttr  = attr;
        bestVal   = val;
      }
    }
  }

  if (bestAttr === null) {

    const p = pairs[0];
    return makeStep(p.attr, p.value, nodes, '[CSP] Fallback — no MRV candidate found');
  }

  return makeStep(bestAttr, bestVal, nodes,
    `[CSP] MRV: ${bestAttr} → max-group=${bestSplit} (most constraining)`);
}

// ── 2. Backtracking — Depth-First with Fixed Order ──────────────────────────

function backtrackingSolve(candidates) {
  const st = algorithmStates.backtrack;

  if (!st.stack || st.stack.length === 0) {
    st.stack = [];
    for (const { attr, values } of ALL_ATTRS) {
      for (const val of values) {
        st.stack.push({ attr, value: val });
      }
    }
  }

  let nodes = 0;
  while (st.stack.length > 0) {
    nodes++;
    const next = st.stack.shift();                   
    const yes  = candidates.filter(c => c[next.attr] === next.value).length;
    const no   = candidates.length - yes;
    if (yes > 0 && no > 0) {
      return makeStep(next.attr, next.value, nodes,
        `[Backtracking] DFS step #${nodes} → split ${yes}/${no}`);
    }

  }

  const pairs = getAllCandidatePairs(candidates);
  if (!pairs.length) return null;
  pairs.sort((a, b) => Math.min(b.yes, b.no) - Math.min(a.yes, a.no));
  return makeStep(pairs[0].attr, pairs[0].value, nodes, '[Backtracking] Stack exhausted — using best-first fallback');
}

// ── 3. Minimax — Game-Tree Search ───────────────────────────────────────────

const MINIMAX_DEPTH = 3;

function _minimaxRecurse(candidates, depth, isMaximizing) {
  if (candidates.length <= 1 || depth >= MINIMAX_DEPTH) {
    const score = candidates.length === 1 ? 100 : Math.round(100 / Math.max(candidates.length, 1));
    return { value: score, step: null };
  }

  const pairs = getAllCandidatePairs(candidates);
  if (!pairs.length) return { value: 0, step: null };

  const branch = [...pairs]
    .sort((a, b) => Math.min(b.yes, b.no) - Math.min(a.yes, a.no))
    .slice(0, 6);

  if (isMaximizing) {
    let maxVal = -Infinity, bestStep = branch[0];
    for (const p of branch) {
      const yesCands = candidates.filter(c => c[p.attr] === p.value);
      const noCands  = candidates.filter(c => c[p.attr] !== p.value);

      const val = Math.min(
        _minimaxRecurse(yesCands, depth + 1, false).value,
        _minimaxRecurse(noCands,  depth + 1, false).value
      );
      if (val > maxVal) { maxVal = val; bestStep = p; }
    }
    return { value: maxVal, step: bestStep };
  } else {

    let minVal = Infinity, bestStep = branch[0];
    for (const p of branch) {
      const yesCands = candidates.filter(c => c[p.attr] === p.value);
      const noCands  = candidates.filter(c => c[p.attr] !== p.value);
      const val = Math.max(
        _minimaxRecurse(yesCands, depth + 1, true).value,
        _minimaxRecurse(noCands,  depth + 1, true).value
      );
      if (val < minVal) { minVal = val; bestStep = p; }
    }
    return { value: minVal, step: bestStep };
  }
}

function minimaxSolve(candidates) {
  const result = _minimaxRecurse(candidates, 0, true);
  if (!result.step) {
    const pairs = getAllCandidatePairs(candidates);
    if (!pairs.length) return null;
    const p = pairs[0];
    return makeStep(p.attr, p.value, 1, '[Minimax] Fallback — single step');
  }
  return makeStep(
    result.step.attr,
    result.step.value,
    Math.pow(6, MINIMAX_DEPTH),     
    `[Minimax] Best worst-case score: ${result.value}`
  );
}

// ── 4. Alpha-Beta Pruning ────────────────────────────────────────────────────

const ALPHABETA_DEPTH = 3;

function _alphaBetaRecurse(candidates, depth, alpha, beta, isMaximizing) {
  if (candidates.length <= 1 || depth >= ALPHABETA_DEPTH) {
    const score = candidates.length === 1 ? 100 : Math.round(100 / Math.max(candidates.length, 1));
    return { value: score, step: null, pruned: 0 };
  }

  const pairs = getAllCandidatePairs(candidates);
  if (!pairs.length) return { value: 0, step: null, pruned: 0 };

  const branch = [...pairs]
    .sort((a, b) => Math.min(b.yes, b.no) - Math.min(a.yes, a.no))
    .slice(0, 6);

  let totalPruned = 0;

  if (isMaximizing) {
    let maxVal = -Infinity, bestStep = branch[0];
    for (const p of branch) {
      const yesCands = candidates.filter(c => c[p.attr] === p.value);
      const noCands  = candidates.filter(c => c[p.attr] !== p.value);
      const val = Math.min(
        _alphaBetaRecurse(yesCands, depth + 1, alpha, beta, false).value,
        _alphaBetaRecurse(noCands,  depth + 1, alpha, beta, false).value
      );
      if (val > maxVal) { maxVal = val; bestStep = p; }
      alpha = Math.max(alpha, val);
      if (beta <= alpha) { totalPruned++; break; }  // β cut-off
    }
    return { value: maxVal, step: bestStep, pruned: totalPruned };
  } else {
    let minVal = Infinity, bestStep = branch[0];
    for (const p of branch) {
      const yesCands = candidates.filter(c => c[p.attr] === p.value);
      const noCands  = candidates.filter(c => c[p.attr] !== p.value);
      const val = Math.max(
        _alphaBetaRecurse(yesCands, depth + 1, alpha, beta, true).value,
        _alphaBetaRecurse(noCands,  depth + 1, alpha, beta, true).value
      );
      if (val < minVal) { minVal = val; bestStep = p; }
      beta = Math.min(beta, val);
      if (beta <= alpha) { totalPruned++; break; }  // α cut-off
    }
    return { value: minVal, step: bestStep, pruned: totalPruned };
  }
}

function alphaBetaSolve(candidates) {
  const result = _alphaBetaRecurse(candidates, 0, -Infinity, Infinity, true);
  if (!result.step) {
    const pairs = getAllCandidatePairs(candidates);
    if (!pairs.length) return null;
    const p = pairs[0];
    return makeStep(p.attr, p.value, 1, '[Alpha-Beta] Fallback — single step');
  }
  return makeStep(
    result.step.attr,
    result.step.value,
    Math.pow(6, ALPHABETA_DEPTH) - result.pruned,
    `[Alpha-Beta] Best score: ${result.value} | branches pruned: ${result.pruned}`
  );
}

// ── 5. Best-First (Greedy) ───────────────────────────────────────────────────

function bestFirstSolve(candidates) {
  const pairs = getAllCandidatePairs(candidates);
  if (!pairs.length) return null;

  pairs.sort((a, b) => Math.min(b.yes, b.no) - Math.min(a.yes, a.no));
  const best = pairs[0];
  return makeStep(best.attr, best.value, pairs.length,
    `[Best-First] Greedy split: ${best.yes}/${best.no}`);
}

// ── 6. Heuristic (Domain Knowledge) ────────────────────────────────────────

function heuristicSolve(candidates) {
  const pairs = getAllCandidatePairs(candidates);
  if (!pairs.length) return null;

  const weights = {
    gender:    1.20,
    glasses:   1.00,
    beard:     0.90,
    hat:       0.85,
    mustache:  0.80,
    hairColor: 0.70
  };

  const scored = pairs.map(p => ({
    ...p,
    score: (Math.min(p.yes, p.no) / candidates.length) * (weights[p.attr] || 0.50)
  }));
  scored.sort((a, b) => b.score - a.score);

  const best = scored[0];
  return makeStep(best.attr, best.value, pairs.length,
    `[Heuristic] Weighted score: ${best.score.toFixed(4)} (attr weight: ${weights[best.attr]})`);
}

// ── 7. Local Search — Hill Climbing with Random Restarts ────────────────────

function localSearchSolve(candidates) {
  const st     = algorithmStates.local;
  const pairs  = getAllCandidatePairs(candidates);
  if (!pairs.length) return null;

  const score = p => Math.min(p.yes, p.no);

  if (!st.current || !pairs.find(p => p.attr === st.current.attr && String(p.value) === String(st.current.value))) {
    st.current = pairs[Math.floor(Math.random() * pairs.length)];
    return makeStep(st.current.attr, st.current.value, pairs.length,
      '[Local Search] Random restart / initialisation');
  }

  const currentScore = score(st.current);

  let bestNeighbour = null, bestNScore = currentScore;
  for (const p of pairs) {
    if (p.attr === st.current.attr && String(p.value) === String(st.current.value)) continue;
    const s = score(p);
    if (s > bestNScore) { bestNScore = s; bestNeighbour = p; }
  }

  if (bestNeighbour) {
    st.current = bestNeighbour;
    return makeStep(bestNeighbour.attr, bestNeighbour.value, pairs.length,
      `[Local Search] Hill-climb: score ${currentScore} → ${bestNScore}`);
  }

  const result = makeStep(st.current.attr, st.current.value, pairs.length,
    `[Local Search] Local optimum (score=${currentScore}) — will restart next step`);
  st.current = null;  // force restart on next invocation
  return result;
}

// ── 8. Genetic Algorithm ─────────────────────────────────────────────────────

const GA_POP_SIZE  = 8;
const GA_CROSSOVER = 0.60;   // crossover probability
const GA_MUTATION_ATTR  = 0.20;   // probability of mutating the attr gene
const GA_MUTATION_VAL   = 0.30;   // probability of mutating the value gene

function geneticSolve(candidates) {
  const st    = algorithmStates.genetic;
  const pairs = getAllCandidatePairs(candidates);
  if (!pairs.length) return null;

  st.generation = (st.generation || 0) + 1;

  const fitness = p => Math.min(p.yes, p.no) / candidates.length;

  let population = pairs
    .slice()
    .sort(() => Math.random() - 0.5)   // shuffle
    .slice(0, GA_POP_SIZE)
    .map(p => ({ ...p, fitness: fitness(p) }));

  population.sort((a, b) => b.fitness - a.fitness);
  const elites   = population.slice(0, Math.max(2, Math.ceil(population.length / 2)));
  const children = [];

  while (children.length < population.length) {
    const p1 = elites[Math.floor(Math.random() * elites.length)];
    const p2 = elites[Math.floor(Math.random() * elites.length)];

    let childAttr = (Math.random() < GA_CROSSOVER) ? p1.attr  : p2.attr;
    let childVal  = (Math.random() < GA_CROSSOVER) ? p2.value : p1.value;

    if (Math.random() < GA_MUTATION_ATTR) {
      const randPair = pairs[Math.floor(Math.random() * pairs.length)];
      childAttr = randPair.attr;
    }

    if (Math.random() < GA_MUTATION_VAL) {
      const randPair = pairs[Math.floor(Math.random() * pairs.length)];
      childVal = randPair.value;
    }

    const yes = candidates.filter(c => c[childAttr] === childVal).length;
    const no  = candidates.length - yes;
    if (yes > 0 && no > 0) {
      children.push({ attr: childAttr, value: childVal,
        yes, no, fitness: Math.min(yes, no) / candidates.length });
    }
  }

  const nextGen = [...elites, ...children];
  nextGen.sort((a, b) => b.fitness - a.fitness);
  const champion = nextGen[0];

  return makeStep(champion.attr, champion.value, population.length,
    `[Genetic] Gen ${st.generation} | fitness: ${champion.fitness.toFixed(3)} | pop: ${nextGen.length}`);
}

// ── 9. Bio-Inspired — Ant Colony Optimisation (ACO) ─────────────────────────

const ACO_EVAPORATION = 0.95;
const ACO_DEPOSIT     = 0.80;

function _initPheromones() {
  const ph = {};
  for (const { attr, values } of ALL_ATTRS) {
    ph[attr] = {};
    for (const v of values) {
      ph[attr][String(v)] = 1.0;
    }
  }
  return ph;
}

function bioInspiredSolve(candidates) {
  const st = algorithmStates.bioinspired;

  if (!st.pheromones) {
    st.pheromones = _initPheromones();
  }
  const ph = st.pheromones;

  const pairs = getAllCandidatePairs(candidates);
  if (!pairs.length) return null;

  const scored = pairs.map(p => {
    const tau = ph[p.attr]?.[String(p.value)] || 1.0;
    const eta = Math.min(p.yes, p.no) / candidates.length;  // heuristic
    return { ...p, prob: tau * Math.pow(eta + 0.01, 2) };
  });

  const totalProb = scored.reduce((s, p) => s + p.prob, 0);
  let rand = Math.random() * totalProb;
  let chosen = scored[0];
  for (const p of scored) {
    rand -= p.prob;
    if (rand <= 0) { chosen = p; break; }
  }

  for (const attr in ph) {
    for (const v in ph[attr]) {
      ph[attr][v] *= ACO_EVAPORATION;
      if (ph[attr][v] < 0.001) ph[attr][v] = 0.001;  
    }
  }

  const quality = Math.min(chosen.yes, chosen.no) / candidates.length;
  ph[chosen.attr][String(chosen.value)] += ACO_DEPOSIT * quality;

  return makeStep(chosen.attr, chosen.value, scored.length,
    `[ACO] Ant selected (τ=${(ph[chosen.attr][String(chosen.value)]).toFixed(3)}, quality=${quality.toFixed(3)})`);
}

// ── 10. Uninformed BFS ───────────────────────────────────────────────────────

function uninformedBFSSolve(candidates) {
  let nodes = 0;
  for (const { attr, values } of ALL_ATTRS) {
    for (const val of values) {
      nodes++;
      const yes = candidates.filter(c => c[attr] === val).length;
      const no  = candidates.length - yes;
      if (yes > 0 && no > 0) {
        return makeStep(attr, val, nodes,
          `[BFS] First valid question found at node #${nodes}`);
      }
    }
  }
  return null;  
}

// ==========================================
// SECTION G — MAIN DISPATCHER (Mode 2)
// ==========================================

/**
 * @param {string}   algoId     One of the ALGORITHMS[*].id values.
 * @param {object[]} candidates Current remaining character list.
 * @returns {object|null} A step object or null.
 */
function algorithmStep(algoId, candidates) {
  if (!candidates || candidates.length === 0) return null;

  if (candidates.length === 1) return null;

  switch (algoId) {
    case 'csp':         return cspSolve(candidates);
    case 'backtrack':   return backtrackingSolve(candidates);
    case 'minimax':     return minimaxSolve(candidates);
    case 'alphabeta':   return alphaBetaSolve(candidates);
    case 'bestfirst':   return bestFirstSolve(candidates);
    case 'heuristic':   return heuristicSolve(candidates);
    case 'local':       return localSearchSolve(candidates);
    case 'genetic':     return geneticSolve(candidates);
    case 'bioinspired': return bioInspiredSolve(candidates);
    case 'uninformed':  return uninformedBFSSolve(candidates);
    default: {

      const pairs = getAllCandidatePairs(candidates);
      if (!pairs.length) return null;
      pairs.sort((a, b) => Math.min(b.yes, b.no) - Math.min(a.yes, a.no));
      return makeStep(pairs[0].attr, pairs[0].value, pairs.length,
        `[Default] Unknown algo "${algoId}" — using Best-First fallback`);
    }
  }
}