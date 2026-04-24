// ============================================
// ALGORITHMS LIST & CORE LOGIC FOR MODE 2
// ============================================

const ALGORITHMS = [
  { id: 'csp',        name: 'CSP',            label: 'Constraint Satisfaction', color: '#e8c84a' },
  { id: 'backtrack',  name: 'Backtracking',   label: 'Depth-First Backtrack',   color: '#e74c3c' },
  { id: 'minimax',    name: 'Minimax',        label: 'Game Tree Minimax',        color: '#9b59b6' },
  { id: 'alphabeta',  name: 'Alpha-Beta',     label: 'Pruned Minimax',           color: '#3498db' },
  { id: 'bestfirst',  name: 'Best-First',     label: 'Greedy Info-Gain',         color: '#1abc9c' },
  { id: 'heuristic',  name: 'Heuristic',      label: 'Domain Knowledge',         color: '#f39c12' },
  { id: 'local',      name: 'Local Search',   label: 'Hill-Climbing',            color: '#e67e22' },
  { id: 'genetic',    name: 'Genetic',        label: 'Evolutionary Search',      color: '#27ae60' },
  { id: 'bioinspired',name: 'Bio-Inspired',   label: 'Ant Colony Opt.',          color: '#c0392b' },
  { id: 'uninformed', name: 'Uninformed BFS', label: 'Blind BFS',                color: '#7f8c8d' }
];

// All possible attributes and their values
const ALL_ATTRS = [
  { attr: 'gender',    values: ['male', 'female'] },
  { attr: 'glasses',   values: [true, false] },
  { attr: 'beard',     values: [true, false] },
  { attr: 'mustache',  values: [true, false] },
  { attr: 'hat',       values: [true, false] },
  { attr: 'hairColor', values: ['brown', 'black', 'blonde', 'red', 'white'] }
];

// Get all (attr, value) pairs that split the current candidate set
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

// Build human-readable question text
function buildQuestionText(attr, value) {
  const map = {
    gender: {
      male:   'Is this character male?',
      female: 'Is this character female?'
    },
    glasses: {
      true:  'Does this character wear glasses?',
      false: 'Does this character NOT wear glasses?'
    },
    beard: {
      true:  'Does this character have a beard?',
      false: 'Does this character have no beard?'
    },
    mustache: {
      true:  'Does this character have a mustache?',
      false: 'No mustache on this character?'
    },
    hat: {
      true:  'Does this character wear a hat?',
      false: 'Is this character not wearing a hat?'
    },
    hairColor: {
      brown:  'Does this character have brown hair?',
      black:  'Does this character have black hair?',
      blonde: 'Does this character have blonde hair?',
      red:    'Does this character have red hair?',
      white:  'Does this character have white or grey hair?'
    }
  };
  return map[attr]?.[String(value)] || `Does the character have ${attr} = ${value}?`;
}

// Create a step object
function makeStep(attr, value, nodesExplored, note = '') {
  return {
    attr,
    value,
    question: buildQuestionText(attr, value),
    nodesExplored: nodesExplored || 1,
    note
  };
}

// Initialize algorithm state (called when starting Mode 2)
function initAlgorithm(algoId, candidates) {
  const base = { candidates: [...candidates] };
  if (algoId === 'csp') {
    base.domains = {};
  }
  if (algoId === 'backtrack') {
    base.attrOrder = ['gender', 'glasses', 'beard', 'mustache', 'hat', 'hairColor'];
    base.pointer = 0;
    base.stack = [];
  }
  if (algoId === 'uninformed') {
    base.frontier = [];
    for (const { attr, values } of ALL_ATTRS) {
      for (const val of values) {
        base.frontier.push({ attr, value: val });
      }
    }
    base.visited = new Set();
  }
  if (algoId === 'local') {
    base.current = null;
  }
  if (algoId === 'genetic') {
    base.population = null;
    base.generation = 0;
  }
  if (algoId === 'bioinspired') {
    base.pheromones = {};
    for (const { attr, values } of ALL_ATTRS) {
      base.pheromones[attr] = {};
      for (const v of values) {
        base.pheromones[attr][String(v)] = 1.0;
      }
    }
  }
  return base;
}

// Main dispatcher: run one step of the chosen algorithm
function algorithmStep(algoId, state, candidates) {
  const pairs = getAllCandidatePairs(candidates);
  if (!pairs.length) return null;

  // ----- Best-First, Minimax, Alpha-Beta, Heuristic (scoring-based) -----
  if (algoId === 'bestfirst' || algoId === 'minimax' || algoId === 'alphabeta' || algoId === 'heuristic') {
    const scored = pairs.map(p => {
      let score = Math.min(p.yes, p.no) / candidates.length;
      if (algoId === 'minimax') score = Math.max(p.yes, p.no);        // worst case
      if (algoId === 'alphabeta') score = Math.min(p.yes, p.no) / candidates.length;
      if (algoId === 'heuristic') {
        const weights = { gender: 1.0, glasses: 0.95, beard: 0.85, hat: 0.8, mustache: 0.75, hairColor: 0.65 };
        score *= (weights[p.attr] || 0.5);
      }
      return { ...p, score };
    });
    scored.sort((a, b) => (algoId === 'minimax' ? a.score - b.score : b.score - a.score));
    const best = scored[0];
    return makeStep(best.attr, best.value, pairs.length, `[${ALGORITHMS.find(a => a.id === algoId).name}] selected`);
  }

  // ----- CSP : arc-consistency / most constrained -----
  if (algoId === 'csp') {
    // reduce domains
    for (const { attr, values } of ALL_ATTRS) {
      state.domains[attr] = values.filter(v => candidates.some(c => c[attr] === v));
    }
    let bestAttr = null, bestVal = null;
    for (const attr of Object.keys(state.domains)) {
      if (state.domains[attr].length >= 2) {
        for (const val of state.domains[attr]) {
          const yes = candidates.filter(c => c[attr] === val).length;
          if (yes > 0 && candidates.length - yes > 0) {
            bestAttr = attr;
            bestVal = val;
            break;
          }
        }
        if (bestAttr) break;
      }
    }
    if (!bestAttr) return makeStep(pairs[0].attr, pairs[0].value, 1, 'CSP fallback');
    return makeStep(bestAttr, bestVal, 5, `[CSP] most constrained: ${bestAttr}`);
  }

  // ----- Backtracking: fixed order with stack -----
  if (algoId === 'backtrack') {
    while (state.pointer < state.attrOrder.length) {
      const attr = state.attrOrder[state.pointer];
      const uniqueVals = [...new Set(candidates.map(c => c[attr]))];
      if (uniqueVals.length < 2) {
        state.pointer++;
        continue;
      }
      for (const val of uniqueVals) {
        const yes = candidates.filter(c => c[attr] === val).length;
        if (yes > 0 && candidates.length - yes > 0) {
          state.stack.push({ attr, val });
          return makeStep(attr, val, 1, `[Backtrack] depth ${state.stack.length}`);
        }
      }
      state.pointer++;
    }
    // backtrack
    if (state.stack.length) {
      const last = state.stack.pop();
      state.pointer = Math.max(0, state.pointer - 1);
      return makeStep(last.attr, last.val, 1, `[Backtrack] backtracked`);
    }
    return makeStep(pairs[0].attr, pairs[0].value, 1, 'Backtrack fallback');
  }

  // ----- Local Search (hill climbing with random restart) -----
  if (algoId === 'local') {
    if (!state.current || Math.random() < 0.1) {
      state.current = pairs[Math.floor(Math.random() * pairs.length)];
      return makeStep(state.current.attr, state.current.value, pairs.length, `[Local] random restart`);
    }
    const neighbours = pairs.filter(p => p.attr === state.current.attr && String(p.value) !== String(state.current.value));
    if (neighbours.length) {
      const best = neighbours.reduce((a, b) => (Math.min(a.yes, a.no) > Math.min(b.yes, b.no) ? a : b), state.current);
      state.current = best;
      return makeStep(best.attr, best.value, neighbours.length, `[Local] climbed`);
    }
    return makeStep(state.current.attr, state.current.value, 1, `[Local] stuck`);
  }

  // ----- Genetic Algorithm (simple population) -----
  if (algoId === 'genetic') {
    if (!state.population) {
      state.population = pairs.slice(0, 8);
      state.generation = 0;
    }
    state.generation++;
    const fitness = g => Math.min(g.yes, g.no) / candidates.length;
    state.population.forEach(g => { g.f = fitness(g); });
    state.population.sort((a, b) => b.f - a.f);
    // crossover / mutation (keep top half + one child)
    const child = { ...state.population[0] };
    if (Math.random() < 0.3) {
      const randomGene = pairs[Math.floor(Math.random() * pairs.length)];
      child.value = randomGene.value;
    }
    state.population.push(child);
    state.population = state.population.slice(0, 8);
    const bestGene = state.population[0];
    return makeStep(bestGene.attr, bestGene.value, state.population.length, `[Genetic] gen ${state.generation}`);
  }

  // ----- Bio-Inspired (Ant Colony Optimization) -----
  if (algoId === 'bioinspired') {
    const scored = pairs.map(p => {
      const tau = state.pheromones[p.attr]?.[String(p.value)] || 0.5;
      const eta = Math.min(p.yes, p.no) / candidates.length;
      return { ...p, aco: tau * (eta + 0.1) };
    });
    const total = scored.reduce((s, p) => s + p.aco, 0);
    let rand = Math.random() * total;
    let chosen = scored[0];
    for (const p of scored) {
      rand -= p.aco;
      if (rand <= 0) {
        chosen = p;
        break;
      }
    }
    const quality = Math.min(chosen.yes, chosen.no) / candidates.length;
    if (!state.pheromones[chosen.attr]) state.pheromones[chosen.attr] = {};
    state.pheromones[chosen.attr][String(chosen.value)] = (state.pheromones[chosen.attr][String(chosen.value)] || 0.5) + quality * 0.5;
    // evaporation
    for (const attr in state.pheromones) {
      for (const v in state.pheromones[attr]) {
        state.pheromones[attr][v] *= 0.95;
      }
    }
    return makeStep(chosen.attr, chosen.value, scored.length, `[ACO] pheromone guided`);
  }

  // ----- Uninformed BFS (no heuristic) -----
  if (algoId === 'uninformed') {
    while (state.frontier.length) {
      const next = state.frontier.shift();
      const key = `${next.attr}:${next.value}`;
      if (state.visited.has(key)) continue;
      state.visited.add(key);
      const yes = candidates.filter(c => c[next.attr] === next.value).length;
      if (yes === 0 || candidates.length - yes === 0) continue;
      return makeStep(next.attr, next.value, state.visited.size, `[BFS] exploring`);
    }
    return makeStep(pairs[0].attr, pairs[0].value, 1, 'BFS fallback');
  }

  // default fallback: best-first
  return makeStep(pairs[0].attr, pairs[0].value, 1, 'Default step');
}