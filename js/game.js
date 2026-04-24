// ============================================
// GLOBAL STATE
// ============================================
const STATE = {
  mode: null,               // 1 = you vs AI, 2 = AI guesses
  selectedChar: null,       // player's character id
  selectedColor: 'blue',
  selectedAlgo: null,
  gameActive: false,

  // Mode 1 specific
  playerCandidates: [],
  aiCandidates: [],
  playerHistory: [],
  aiHistory: [],
  currentTurn: 'ai',        // 'ai' or 'player'
  guessMode: false,
  aiSelectedChar: null,     // AI's hidden character (object)

  // Mode 2 specific
  algoState: null,
  autoRunInterval: null,

  // Metrics
  metrics: {
    startTime: 0,
    questions: 0,
    nodes: 0
  }
};

// ============================================
// UTILITIES
// ============================================
function charAvatarHTML(char, size = 'normal') {
  const sizeClass = size === 'large' ? 'avatar-large' : 'avatar-normal';
  return `
    <div class="char-avatar-wrap ${sizeClass}">
      <img src="${char.image}" alt="${char.name}" class="char-img"
           onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
      <span class="char-emoji-fallback" style="display:none">${char.emoji}</span>
    </div>
  `;
}

function goToPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

function openModal(id) {
  const m = document.getElementById(id);
  m.classList.add('open');
  gsap.fromTo(m.querySelector('.modal-box'),
    { scale: 0.85, opacity: 0 },
    { scale: 1, opacity: 1, duration: 0.3 }
  );
}

function closeModal(id) {
  const m = document.getElementById(id);
  gsap.to(m.querySelector('.modal-box'), {
    scale: 0.9,
    opacity: 0,
    duration: 0.2,
    onComplete: () => m.classList.remove('open')
  });
}

function confirmQuit() {
  openModal('quitModal');
}

function doQuit() {
  STATE.gameActive = false;
  if (STATE.autoRunInterval) clearInterval(STATE.autoRunInterval);
  closeModal('quitModal');
  goToPage('page-home');
}

function playAgain() {
  closeModal('resultModal');
  goToSelectMode(STATE.mode);
}

// ============================================
// MODE SELECTION & CHARACTER SELECTION
// ============================================
function goToSelectMode(mode) {
  STATE.mode = mode;
  STATE.selectedChar = null;
  STATE.selectedAlgo = null;
  STATE.selectedColor = 'blue';
  buildSelectionGrid();
  goToPage('page-select');
}

function buildSelectionGrid() {
  const grid = document.getElementById('selectionGrid');
  grid.innerHTML = '';
  CHARACTERS.forEach(char => {
    const card = document.createElement('div');
    card.className = 'char-card';
    card.id = `sel-card-${char.id}`;
    card.innerHTML = `
      <div class="char-avatar" style="background:${charBgColor(char)}">
        ${charAvatarHTML(char)}
      </div>
      <div class="char-name">${char.name}</div>
    `;
    card.onclick = () => selectCharacter(char.id);
    grid.appendChild(card);
  });

  const algoSection = document.getElementById('algoSection');
  algoSection.style.display = STATE.mode === 2 ? 'block' : 'none';
  if (STATE.mode === 2) buildAlgoSelector();

  const startBtn = document.getElementById('startGameBtn');
  startBtn.disabled = true;
  startBtn.style.opacity = '0.4';

  // Reset color buttons
  document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
  const blueBtn = document.querySelector('.color-btn.blue');
  if (blueBtn) blueBtn.classList.add('active');
}

function buildAlgoSelector() {
  const container = document.getElementById('algoSelector');
  container.innerHTML = '';
  ALGORITHMS.forEach(algo => {
    const btn = document.createElement('button');
    btn.className = 'algo-btn';
    btn.dataset.id = algo.id;
    btn.innerHTML = `<span style="color:${algo.color}">●</span> ${algo.name}`;
    btn.onclick = () => {
      document.querySelectorAll('.algo-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      STATE.selectedAlgo = algo.id;
      checkSelectionReady();
    };
    container.appendChild(btn);
  });
}

function selectColor(color) {
  STATE.selectedColor = color;
  document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
  const activeBtn = document.querySelector(`.color-btn.${color}`);
  if (activeBtn) activeBtn.classList.add('active');

  // Re-apply selection highlight with new color
  if (STATE.selectedChar) {
    document.querySelectorAll('.char-card').forEach(c => {
      c.classList.remove('selected-blue', 'selected-red');
    });
    const card = document.getElementById(`sel-card-${STATE.selectedChar}`);
    if (card) card.classList.add(`selected-${color}`);
  }
}

function selectCharacter(id) {
  document.querySelectorAll('.char-card').forEach(c => {
    c.classList.remove('selected-blue', 'selected-red');
  });
  STATE.selectedChar = id;
  const card = document.getElementById(`sel-card-${id}`);
  card.classList.add(`selected-${STATE.selectedColor}`);
  checkSelectionReady();
}

function checkSelectionReady() {
  const ready = STATE.selectedChar !== null && (STATE.mode === 1 || STATE.selectedAlgo !== null);
  const btn = document.getElementById('startGameBtn');
  btn.disabled = !ready;
  btn.style.opacity = ready ? '1' : '0.4';
}

function startGame() {
  if (!STATE.selectedChar) return;
  STATE.gameActive = true;
  if (STATE.mode === 1) {
    initMode1();
    goToPage('page-game1');
  } else {
    initMode2();
    goToPage('page-game2');
  }
}

// ============================================
// MODE 1 : YOU VS AI
// ============================================
function initMode1() {
  // Reset state
  STATE.playerCandidates = [...CHARACTERS];
  STATE.aiCandidates = [...CHARACTERS];
  STATE.playerHistory = [];
  STATE.aiHistory = [];
  STATE.currentTurn = 'ai';
  STATE.guessMode = false;
  STATE.metrics = {
    startTime: Date.now(),
    questions: 0,
    nodes: 0
  };

  // AI picks a random character (different from player)
  const pool = CHARACTERS.filter(c => c.id !== STATE.selectedChar);
  STATE.aiSelectedChar = pool[Math.floor(Math.random() * pool.length)];

  const playerChar = getCharacterById(STATE.selectedChar);
  const playerCardDiv = document.getElementById('playerCharCard');
  playerCardDiv.innerHTML = `
    ${charAvatarHTML(playerChar, 'large')}
    <div class="sc-name">${playerChar.name}</div>
  `;
  playerCardDiv.style.borderColor = STATE.selectedColor === 'blue' ? '#3498db' : '#e74c3c';

  // Build grids (AI board face-down, player board face-up)
  buildBoardGrid('aiBoardGrid', true);
  buildBoardGrid('playerBoardGrid', false);

  // Reset history and counts
  document.getElementById('aiHistory').innerHTML = '';
  document.getElementById('playerHistory').innerHTML = '';
  updateCandidateCounts1();

  // Reset guess mode badge
  const badge = document.getElementById('guessModeBadge');
  badge.textContent = 'GUESS MODE: OFF';
  badge.className = 'turn-badge';
  badge.style.color = '';
  badge.style.borderColor = '';
  badge.style.background = '';

  setTurn('ai');

  // Small delay then AI asks first question
  setTimeout(() => aiAskQuestion(), 800);
}

function buildBoardGrid(gridId, faceDown) {
  const grid = document.getElementById(gridId);
  grid.innerHTML = '';
  CHARACTERS.forEach(char => {
    const card = document.createElement('div');
    card.className = 'game-char-card' + (faceDown ? ' face-down' : '');
    card.id = `${gridId}-card-${char.id}`;
    card.innerHTML = `
      <div class="card-front" style="background:linear-gradient(160deg, ${charBgColor(char)} 0%, #0a1628 100%)">
        ${charAvatarHTML(char)}
        <div class="gc-name">${char.name}</div>
      </div>
      <div class="card-back">🎴</div>
    `;
    if (!faceDown) {
      // Player board: click to eliminate (normal) or guess (guess mode)
      card.onclick = () => handlePlayerCardClick(char.id);
    }
    grid.appendChild(card);
  });
}

function setTurn(turn) {
  STATE.currentTurn = turn;
  const isAI = (turn === 'ai');

  const turnBadge = document.getElementById('turnBadge1');
  turnBadge.textContent = isAI ? '🔴 AI\'S TURN' : '🟢 YOUR TURN';
  turnBadge.className = `turn-badge ${isAI ? 'ai-turn' : 'player-turn'}`;

  const playerTurnBadge = document.getElementById('playerTurnBadge1');
  playerTurnBadge.textContent = isAI ? '⏳ WAIT...' : '🔵 YOUR TURN';
  playerTurnBadge.className = `turn-badge ${isAI ? '' : 'player-turn'}`;
  if (isAI) {
    playerTurnBadge.style.cssText = 'background:rgba(0,0,0,0.2);border-color:rgba(255,255,255,0.1);color:var(--text-secondary)';
  } else {
    playerTurnBadge.style.cssText = '';
  }

  // YES/NO buttons only active during AI's turn
  document.getElementById('btnYes').disabled = !isAI;
  document.getElementById('btnNo').disabled = !isAI;

  // Question form only active during player's turn
  document.getElementById('qCategory').disabled = isAI;
  document.getElementById('qValue').disabled = isAI;
  document.getElementById('askBtn').disabled = isAI;

  // Guess button is always active — player can make a guess at any time
  const guessModeBtn = document.querySelector('#page-game1 .btn-gold[onclick="toggleGuessMode()"]');
  if (guessModeBtn) {
    guessModeBtn.disabled = false;
    guessModeBtn.style.opacity = '1';
  }
}

function aiAskQuestion() {
  if (!STATE.gameActive) return;
  if (STATE.currentTurn !== 'ai') return;
  if (STATE.aiCandidates.length === 0) return;
  if (STATE.aiCandidates.length === 1) {
    aiMakeGuess(STATE.aiCandidates[0]);
    return;
  }

  // AI uses best-first to choose best question
  const q = chooseBestQuestion(STATE.aiCandidates);
  STATE.algoState = q;
  const qBox = document.getElementById('aiCurrentQuestion');
  qBox.textContent = q.text;
  gsap.fromTo(qBox, { opacity: 0, x: -8 }, { opacity: 1, x: 0, duration: 0.4 });
}

function chooseBestQuestion(candidates) {
  let best = null;
  let bestScore = -1;
  const categories = [
    { attr: 'gender',    values: ['male', 'female'] },
    { attr: 'glasses',   values: [true, false] },
    { attr: 'beard',     values: [true, false] },
    { attr: 'mustache',  values: [true, false] },
    { attr: 'hairColor', values: ['brown', 'black', 'blonde', 'red', 'white'] },
    { attr: 'hat',       values: [true, false] }
  ];
  for (const { attr, values } of categories) {
    for (const val of values) {
      const yes = candidates.filter(c => c[attr] === val).length;
      const no  = candidates.length - yes;
      if (yes === 0 || no === 0) continue;
      const score = Math.min(yes, no);
      if (score > bestScore) {
        bestScore = score;
        let text = '';
        if (attr === 'gender') text = `Is the character ${val}?`;
        else if (attr === 'hairColor') text = `Does this character have ${val} hair?`;
        else if (attr === 'glasses') text = val ? 'Does this character wear glasses?' : 'Does this character NOT wear glasses?';
        else if (attr === 'beard') text = val ? 'Does this character have a beard?' : 'Does this character have no beard?';
        else if (attr === 'mustache') text = val ? 'Does this character have a mustache?' : 'No mustache on this character?';
        else if (attr === 'hat') text = val ? 'Does this character wear a hat?' : 'Is this character not wearing a hat?';
        else text = `${attr} = ${val}?`;
        best = { attr, value: val, text };
      }
    }
  }
  if (!best) {
    best = { attr: 'gender', value: 'male', text: 'Is the character male?' };
  }
  return best;
}

function answerAI(answer) {
  if (!STATE.gameActive) return;
  if (STATE.currentTurn !== 'ai') return;
  const q = STATE.algoState;
  if (!q) return;

  // Disable buttons immediately to prevent double-click
  document.getElementById('btnYes').disabled = true;
  document.getElementById('btnNo').disabled = true;

  const playerChar = getCharacterById(STATE.selectedChar);
  const correctAnswer = (playerChar[q.attr] === q.value);

  // Filter AI candidates based on the truth (not player's click)
  STATE.aiCandidates = STATE.aiCandidates.filter(c => (c[q.attr] === q.value) === correctAnswer);

  addHistory('aiHistory', q.text, correctAnswer ? 'YES ✓' : 'NO ✗');
  updateCandidateCounts1();

  // Animate eliminated cards on AI board
  CHARACTERS.forEach(char => {
    if (!STATE.aiCandidates.find(c => c.id === char.id)) {
      const el = document.getElementById(`aiBoardGrid-card-${char.id}`);
      if (el && !el.classList.contains('eliminated')) {
        el.classList.add('eliminated');
        gsap.to(el, {
          rotateY: 180,
          duration: 0.45,
          onComplete: () => el.classList.add('face-down')
        });
      }
    }
  });

  if (STATE.aiCandidates.length === 1) {
    setTimeout(() => aiMakeGuess(STATE.aiCandidates[0]), 900);
    return;
  }

  setTurn('player');
  document.getElementById('aiCurrentQuestion').textContent = 'Waiting for your question…';
}

function aiMakeGuess(char) {
  addHistory('aiHistory', `FINAL GUESS: ${char.name}`, '🎯');
  const correct = (char.id === STATE.selectedChar);
  // AI wins if it guessed correctly → player loses
  setTimeout(() => showResult(!correct, STATE.aiSelectedChar), 1100);
}

function handlePlayerCardClick(charId) {
  if (!STATE.gameActive) return;

  // GUESS MODE: make final guess — always allowed regardless of whose turn it is
  if (STATE.guessMode) {
    const card = document.getElementById(`playerBoardGrid-card-${charId}`);
    // Don't allow guessing an already-eliminated card
    if (card && card.classList.contains('eliminated')) return;
    const correct = (charId === STATE.aiSelectedChar.id);

    // Visual feedback on the clicked card
    if (card) {
      gsap.to(card, {
        scale: 1.15,
        duration: 0.2,
        yoyo: true,
        repeat: 1,
        onComplete: () => {
          gsap.to(card, {
            boxShadow: correct
              ? '0 0 24px rgba(39,174,96,0.8), 0 0 48px rgba(39,174,96,0.4)'
              : '0 0 24px rgba(231,76,60,0.8), 0 0 48px rgba(231,76,60,0.4)',
            borderColor: correct ? '#27ae60' : '#e74c3c',
            duration: 0.3
          });
        }
      });
    }

    // Stop everything and resolve the game
    STATE.gameActive = false;
    STATE.guessMode = false;
    const badge = document.getElementById('guessModeBadge');
    badge.textContent = 'GUESS MODE: OFF';
    badge.className = 'turn-badge';
    badge.style.color = '';
    badge.style.borderColor = '';
    badge.style.background = '';

    // Remove guess-mode cursor from all player cards
    document.querySelectorAll('#playerBoardGrid .game-char-card').forEach(c => {
      c.classList.remove('guess-highlight');
    });

    // Reveal the AI's hidden character on the board
    const aiHiddenCard = document.getElementById('aiHiddenCard');
    if (aiHiddenCard && STATE.aiSelectedChar) {
      aiHiddenCard.innerHTML = `
        ${charAvatarHTML(STATE.aiSelectedChar, 'large')}
        <div class="sc-name">${STATE.aiSelectedChar.name}</div>
      `;
      aiHiddenCard.style.borderColor = correct ? '#27ae60' : '#e74c3c';
      gsap.fromTo(aiHiddenCard, { scale: 0.8, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.5 });
    }

    setTimeout(() => showResult(correct, STATE.aiSelectedChar), 900);
    return;
  }

  // NORMAL MODE: eliminate a character (only during player's turn)
  if (STATE.currentTurn !== 'player') {
    // Flash a hint that it's not their turn
    const badge = document.getElementById('playerTurnBadge1');
    gsap.fromTo(badge, { x: -4 }, { x: 4, duration: 0.06, repeat: 5, yoyo: true });
    return;
  }

  const cardEl = document.getElementById(`playerBoardGrid-card-${charId}`);
  if (!cardEl || cardEl.classList.contains('eliminated')) return;

  // Remove from playerCandidates
  STATE.playerCandidates = STATE.playerCandidates.filter(c => c.id !== charId);
  cardEl.classList.add('eliminated');
  gsap.to(cardEl, { opacity: 0.18, duration: 0.35 });
  updateCandidateCounts1();
}

function playerAskQuestion() {
  if (!STATE.gameActive) return;
  if (STATE.currentTurn !== 'player') return;

  const cat = document.getElementById('qCategory').value;
  const val = document.getElementById('qValue').value;
  if (!cat || !val) return;

  const parsedVal = (val === 'true') ? true : (val === 'false') ? false : val;
  const aiChar = STATE.aiSelectedChar;
  const answer = (aiChar[cat] === parsedVal);
  const questionText = document.getElementById('questionPreview').textContent || `${cat} = ${val}?`;

  // Filter player candidates based on the AI's hidden character
  STATE.playerCandidates = STATE.playerCandidates.filter(c => (c[cat] === parsedVal) === answer);
  addHistory('playerHistory', questionText, answer ? 'YES ✓' : 'NO ✗');
  updateCandidateCounts1();

  // Animate eliminated cards on player board
  CHARACTERS.forEach(char => {
    if (!STATE.playerCandidates.find(c => c.id === char.id)) {
      const el = document.getElementById(`playerBoardGrid-card-${char.id}`);
      if (el && !el.classList.contains('eliminated')) {
        el.classList.add('eliminated');
        gsap.to(el, { opacity: 0.18, duration: 0.35 });
      }
    }
  });

  // Reset question form
  document.getElementById('qCategory').value = '';
  document.getElementById('qValue').innerHTML = '<option value="">— Select Value —</option>';
  document.getElementById('questionPreview').textContent = '';

  // If player narrowed down to 1 candidate, they can guess right away
  if (STATE.playerCandidates.length === 1) {
    addHistory('playerHistory', `Only 1 candidate left: ${STATE.playerCandidates[0].name}`, '💡');
  }

  // Switch turn to AI
  setTurn('ai');
  setTimeout(() => aiAskQuestion(), 1000);
}

// ============================================
// GUESS MODE TOGGLE
// ============================================
function toggleGuessMode() {
  if (!STATE.gameActive) return;

  STATE.guessMode = !STATE.guessMode;
  const badge = document.getElementById('guessModeBadge');

  if (STATE.guessMode) {
    badge.textContent = '🎯 CLICK A CHARACTER TO GUESS!';
    badge.className = 'turn-badge guess-active';
    badge.style.color = 'var(--gold)';
    badge.style.borderColor = 'var(--gold)';
    badge.style.background = 'rgba(232,200,74,0.12)';

    // Highlight all non-eliminated cards on player board
    document.querySelectorAll('#playerBoardGrid .game-char-card:not(.eliminated):not(.face-down)').forEach(c => {
      c.classList.add('guess-highlight');
    });

    // Pulse animation on badge
    gsap.fromTo(badge, { scale: 0.95 }, { scale: 1.03, duration: 0.3, yoyo: true, repeat: 3 });

    // Show a toast hint
    showToast('🎯 Click any character to make your final guess!');
  } else {
    badge.textContent = 'GUESS MODE: OFF';
    badge.className = 'turn-badge';
    badge.style.color = '';
    badge.style.borderColor = '';
    badge.style.background = '';

    // Remove highlight from player board cards
    document.querySelectorAll('#playerBoardGrid .game-char-card').forEach(c => {
      c.classList.remove('guess-highlight');
    });
  }
}

// ============================================
// TOAST NOTIFICATION
// ============================================
function showToast(message) {
  let toast = document.getElementById('gameToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'gameToast';
    toast.style.cssText = `
      position: fixed;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%) translateY(60px);
      background: linear-gradient(135deg, #0f2040, #1a3060);
      border: 1px solid var(--gold);
      color: var(--gold);
      font-family: 'Orbitron', monospace;
      font-size: 11px;
      letter-spacing: 1px;
      padding: 10px 22px;
      border-radius: 6px;
      z-index: 9999;
      box-shadow: 0 0 18px rgba(232,200,74,0.3);
      pointer-events: none;
      opacity: 0;
    `;
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  gsap.killTweensOf(toast);
  gsap.to(toast, { opacity: 1, y: 0, duration: 0.3, ease: 'back.out(1.4)',
    onComplete: () => {
      gsap.to(toast, { opacity: 0, y: 20, duration: 0.4, delay: 2.2 });
    }
  });
}

// ============================================
// QUESTION PREVIEW
// ============================================
function updateQuestionPreview() {
  const cat = document.getElementById('qCategory').value;
  const valSel = document.getElementById('qValue');
  valSel.innerHTML = '<option value="">— Select Value —</option>';
  document.getElementById('questionPreview').textContent = '';

  const options = {
    gender:    ['male', 'female'],
    glasses:   ['true', 'false'],
    beard:     ['true', 'false'],
    mustache:  ['true', 'false'],
    hairColor: ['brown', 'black', 'blonde', 'red', 'white'],
    hat:       ['true', 'false']
  };
  if (cat && options[cat]) {
    options[cat].forEach(v => {
      const opt = document.createElement('option');
      opt.value = v;
      let display = v;
      if (v === 'true') display = 'Yes';
      else if (v === 'false') display = 'No';
      else display = v.charAt(0).toUpperCase() + v.slice(1);
      opt.textContent = display;
      valSel.appendChild(opt);
    });
  }

  valSel.onchange = () => {
    const v = valSel.value;
    if (!cat || !v) {
      document.getElementById('questionPreview').textContent = '';
      return;
    }
    const labels = {
      gender:    `Is the character ${v}?`,
      glasses:   v === 'true' ? 'Does the character wear glasses?' : 'Does the character NOT wear glasses?',
      beard:     v === 'true' ? 'Does the character have a beard?' : 'Does the character have no beard?',
      mustache:  v === 'true' ? 'Does the character have a mustache?' : 'No mustache?',
      hairColor: `Does the character have ${v} hair?`,
      hat:       v === 'true' ? 'Does the character wear a hat?' : 'No hat?'
    };
    document.getElementById('questionPreview').textContent = labels[cat] || '';
  };
}

function addHistory(listId, question, answer) {
  const container = document.getElementById(listId);
  const item = document.createElement('div');
  item.className = 'history-item';
  item.innerHTML = `<span class="h-q">${question}</span> → <span class="h-a">${answer}</span>`;
  container.insertBefore(item, container.firstChild);
}

function updateCandidateCounts1() {
  document.getElementById('aiCandidates1').textContent = STATE.aiCandidates.length;
  document.getElementById('playerCandidates1').textContent = STATE.playerCandidates.length;
}

// ============================================
// MODE 2 : AI GUESSES
// ============================================
function initMode2() {
  STATE.playerCandidates = [...CHARACTERS];
  STATE.aiCandidates = [...CHARACTERS];
  STATE.metrics = {
    startTime: Date.now(),
    questions: 0,
    nodes: 0
  };
  STATE.autoRunInterval = null;

  const playerChar = getCharacterById(STATE.selectedChar);
  const secretCard = document.getElementById('playerSecretCard');
  secretCard.innerHTML = `
    ${charAvatarHTML(playerChar, 'large')}
    <div class="sc-name">${playerChar.name}</div>
  `;

  const algo = ALGORITHMS.find(a => a.id === STATE.selectedAlgo);
  document.getElementById('algoNameDisplay').textContent = algo?.name || '—';
  document.getElementById('algoNameDisplay').style.color = algo?.color || 'var(--gold)';

  // Reset buttons
  document.getElementById('autoRunBtn').textContent = '⚡ AUTO RUN';
  document.getElementById('mode2Question').textContent = 'Press RUN STEP to begin';

  buildMode2Board();
  updateMetrics2();

  STATE.algoState = initAlgorithm(STATE.selectedAlgo, [...CHARACTERS]);
  logEntry('highlight', `▶ ${algo?.name} initialized`);
  logEntry('highlight', `Searching among ${CHARACTERS.length} characters…`);
}

function buildMode2Board() {
  const grid = document.getElementById('mode2BoardGrid');
  grid.innerHTML = '';
  CHARACTERS.forEach(char => {
    const card = document.createElement('div');
    card.className = 'game-char-card';
    card.id = `m2-card-${char.id}`;
    card.innerHTML = `
      <div class="card-front" style="background:linear-gradient(160deg, ${charBgColor(char)} 0%, #0a1628 100%)">
        ${charAvatarHTML(char)}
        <div class="gc-name">${char.name}</div>
      </div>
      <div class="card-back">🎴</div>
    `;
    grid.appendChild(card);
  });
}

function logEntry(type, text) {
  const logDiv = document.getElementById('reasoningLog');
  const entry = document.createElement('div');
  entry.className = `log-entry ${type}`;
  entry.textContent = `> ${text}`;
  logDiv.insertBefore(entry, logDiv.firstChild);
}

function updateMetrics2() {
  const elapsed = Date.now() - STATE.metrics.startTime;
  document.getElementById('metricTime').textContent = elapsed;
  document.getElementById('metricQuestions').textContent = STATE.metrics.questions;
  document.getElementById('metricNodes').textContent = STATE.metrics.nodes;
  document.getElementById('aiCandidates2').textContent = STATE.aiCandidates.length;
  const efficiency = STATE.metrics.questions > 0
    ? Math.round((1 - STATE.metrics.questions / 24) * 100) + '%'
    : '—';
  document.getElementById('metricScore').textContent = efficiency;
  document.getElementById('aiTimer2').textContent = (elapsed / 1000).toFixed(3);
}

function runNextStep() {
  if (!STATE.gameActive) return;
  if (STATE.aiCandidates.length === 0) return;
  if (STATE.aiCandidates.length === 1) {
    finalGuess(STATE.aiCandidates[0]);
    return;
  }

  const step = algorithmStep(STATE.selectedAlgo, STATE.algoState, STATE.aiCandidates);
  if (!step) return;

  STATE.metrics.questions++;
  STATE.metrics.nodes += step.nodesExplored || 1;

  document.getElementById('mode2Question').textContent = step.question;
  gsap.fromTo('#mode2Question', { opacity: 0 }, { opacity: 1, duration: 0.4 });

  logEntry('question', `Q${STATE.metrics.questions}: ${step.question}`);
  if (step.note) logEntry('highlight', step.note);

  const playerChar = getCharacterById(STATE.selectedChar);
  const answer = (playerChar[step.attr] === step.value);
  logEntry('answer', `Answer: ${answer ? 'YES ✓' : 'NO ✗'}`);

  const before = STATE.aiCandidates.length;
  STATE.aiCandidates = STATE.aiCandidates.filter(c => (c[step.attr] === step.value) === answer);
  const eliminated = before - STATE.aiCandidates.length;
  logEntry('eliminate', `Eliminated ${eliminated} | Remaining: ${STATE.aiCandidates.length}`);

  // Animate eliminated cards
  CHARACTERS.forEach(char => {
    if (!STATE.aiCandidates.find(c => c.id === char.id)) {
      const el = document.getElementById(`m2-card-${char.id}`);
      if (el && !el.classList.contains('eliminated')) {
        el.classList.add('eliminated');
        gsap.to(el, {
          rotateY: 180,
          duration: 0.45,
          onComplete: () => el.classList.add('face-down')
        });
      }
    }
  });

  updateMetrics2();

  if (STATE.aiCandidates.length === 1) {
    stopAutoRun();
    setTimeout(() => finalGuess(STATE.aiCandidates[0]), 700);
  }
}

function finalGuess(char) {
  if (!STATE.gameActive) return;
  STATE.gameActive = false;
  logEntry('found', `🎯 FOUND: ${char.name}!`);
  updateMetrics2();

  // Highlight the guessed character
  const el = document.getElementById(`m2-card-${char.id}`);
  if (el) {
    gsap.to(el, {
      scale: 1.2,
      boxShadow: '0 0 28px rgba(232,200,74,0.8)',
      borderColor: 'var(--gold)',
      duration: 0.4
    });
  }

  const correct = (char.id === STATE.selectedChar);
  const algo = ALGORITHMS.find(a => a.id === STATE.selectedAlgo);
  const elapsed = Date.now() - STATE.metrics.startTime;
  setTimeout(() => showResultMode2(correct, char, algo?.name || 'AI', elapsed), 900);
}

function toggleAutoRun() {
  if (STATE.autoRunInterval) {
    stopAutoRun();
  } else {
    document.getElementById('autoRunBtn').textContent = '⏹ STOP AUTO';
    STATE.autoRunInterval = setInterval(() => {
      if (STATE.aiCandidates.length <= 1 || !STATE.gameActive) {
        stopAutoRun();
        return;
      }
      runNextStep();
    }, 850);
  }
}

function stopAutoRun() {
  if (STATE.autoRunInterval) {
    clearInterval(STATE.autoRunInterval);
    STATE.autoRunInterval = null;
  }
  const btn = document.getElementById('autoRunBtn');
  if (btn) btn.textContent = '⚡ AUTO RUN';
}

// ============================================
// RESULT SCREENS
// ============================================
function showResult(playerWon, aiChar) {
  STATE.gameActive = false;
  stopAutoRun();
  document.getElementById('resultMetrics').style.display = 'none';

  const icon = document.getElementById('resultIcon');
  const titleEl = document.getElementById('resultTitle');
  const descEl = document.getElementById('resultDesc');

  if (playerWon) {
    icon.textContent = '🏆';
    titleEl.textContent = 'YOU WIN!';
    titleEl.className = 'win';
    descEl.innerHTML = `🎉 <strong>Brilliant deduction!</strong> You correctly identified the AI's character — <strong>${aiChar ? aiChar.name : 'the hidden one'}</strong>!`;
  } else {
    icon.textContent = '💀';
    titleEl.textContent = 'GAME OVER';
    titleEl.className = 'lose';
    descEl.innerHTML = `The AI identified your character first. Better luck next time!`;
  }

  populateResultChar(aiChar);
  openModal('resultModal');
}

function showResultMode2(correct, guessedChar, algoName, elapsed) {
  document.getElementById('resultIcon').textContent = correct ? '🤖' : '🎉';
  const titleEl = document.getElementById('resultTitle');
  titleEl.textContent = correct ? 'AI WINS!' : 'YOU WIN!';
  titleEl.className = correct ? 'lose' : 'win';
  document.getElementById('resultDesc').textContent = correct
    ? `The ${algoName} algorithm correctly identified your character!`
    : 'The AI guessed incorrectly!';
  populateResultChar(guessedChar);

  const metricsDiv = document.getElementById('resultMetrics');
  const metricsGrid = document.getElementById('resultMetricsGrid');
  metricsDiv.style.display = 'block';
  metricsGrid.innerHTML = `
    <div class="metric-box"><div class="m-val" style="font-size:13px">${algoName}</div><div class="m-label">ALGORITHM</div></div>
    <div class="metric-box"><div class="m-val">${elapsed}ms</div><div class="m-label">TIME</div></div>
    <div class="metric-box"><div class="m-val">${STATE.metrics.questions}</div><div class="m-label">QUESTIONS</div></div>
    <div class="metric-box"><div class="m-val">${STATE.metrics.nodes}</div><div class="m-label">NODES</div></div>
  `;
  openModal('resultModal');
}

function populateResultChar(char) {
  const avatarDiv = document.getElementById('resultCharAvatar');
  avatarDiv.innerHTML = charAvatarHTML(char, 'large');
  document.getElementById('resultCharName').textContent = char.name;

  const traitsDiv = document.getElementById('resultCharTraits');
  traitsDiv.innerHTML = '';
  const traits = [
    char.gender,
    char.glasses ? 'Glasses' : null,
    char.beard ? 'Beard' : null,
    char.mustache ? 'Mustache' : null,
    char.hat ? 'Hat' : null,
    char.hairColor + ' hair'
  ];
  traits.filter(Boolean).forEach(t => {
    const tag = document.createElement('span');
    tag.className = 'info-tag';
    tag.textContent = t;
    traitsDiv.appendChild(tag);
  });
}

// ============================================
// LANDING ANIMATION
// ============================================
function initLanding() {
  const grid = document.getElementById('miniCardsGrid');
  if (grid) {
    CHARACTERS.slice(0, 24).forEach(char => {
      const mini = document.createElement('div');
      mini.className = 'mini-card';
      mini.style.background = charBgColor(char);
      mini.textContent = char.emoji;
      grid.appendChild(mini);
    });
  }
  gsap.to('#landingContent', {
    opacity: 1,
    y: 0,
    duration: 1,
    ease: 'power3.out',
    delay: 0.3
  });
  gsap.fromTo('.mini-card',
    { opacity: 0, scale: 0.5 },
    { opacity: 1, scale: 1, duration: 0.4, stagger: 0.04, ease: 'back.out(1.2)', delay: 0.6 }
  );
}