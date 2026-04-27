/**
 * ==========================================
 * GAME LOGIC — GUESS WHO AI BOARD GAME
 * ==========================================
 */

'use strict';

// ==========================================
// 1. GLOBAL STATE
// ==========================================

const STATE = {
  mode:          null,    
  selectedChar:  null,    
  selectedColor: 'blue',  
  selectedAlgo:  null,    
  gameActive:    false,

  // ── Mode 1 ──
  playerCandidates: [],   
  aiCandidates:     [],   
  playerHistory:    [],   
  aiHistory:        [],
  currentTurn:      'ai', 
  guessMode:        false,
  aiSelectedChar:   null, 

  // ── Timer ──
  timerInterval:  null,
  timeRemaining:  30,

  // ── Scoring ──
  playerScore:  0,
  guessesLeft:  3,

  // ── Mode 2 ──
  autoRunInterval: null,

  metrics: {
    startTime: 0,
    questions:  0,
    nodes:      0
  }
};

// ==========================================
// 2. SAVE / LOAD
// ==========================================

function saveGame() {
  if (!STATE.gameActive) {
    showToast('⚠️ No active game to save!');
    return;
  }
  const saveData = {
    mode:              STATE.mode,
    selectedChar:      STATE.selectedChar,
    selectedColor:     STATE.selectedColor,
    selectedAlgo:      STATE.selectedAlgo,
    playerCandidates:  STATE.playerCandidates.map(c => c.id),
    aiCandidates:      STATE.aiCandidates.map(c => c.id),
    playerHistory:     STATE.playerHistory,
    aiHistory:         STATE.aiHistory,
    currentTurn:       STATE.currentTurn,
    playerScore:       STATE.playerScore,
    guessesLeft:       STATE.guessesLeft,
    metrics:           STATE.metrics,
    aiSelectedCharId:  STATE.aiSelectedChar ? STATE.aiSelectedChar.id : null,
    difficulty:        currentDifficulty
  };
  try {
    localStorage.setItem('guessWhoSave', JSON.stringify(saveData));
    showToast('💾 Game saved successfully!');
  } catch (_) {
    showToast('❌ Could not save game (storage full?).');
  }
}

function loadGame() {
  let data;
  try {
    const raw = localStorage.getItem('guessWhoSave');
    if (!raw) { showToast('📂 No saved game found!'); return; }
    data = JSON.parse(raw);
  } catch (_) {
    showToast('❌ Save data is corrupt.');
    return;
  }

  if (data.difficulty) setDifficulty(data.difficulty);

  STATE.mode             = data.mode;
  STATE.selectedChar     = data.selectedChar;
  STATE.selectedColor    = data.selectedColor;
  STATE.selectedAlgo     = data.selectedAlgo;
  STATE.playerCandidates = data.playerCandidates.map(id => getCharacterById(id)).filter(Boolean);
  STATE.aiCandidates     = data.aiCandidates.map(id => getCharacterById(id)).filter(Boolean);
  STATE.playerHistory    = data.playerHistory   || [];
  STATE.aiHistory        = data.aiHistory       || [];
  STATE.currentTurn      = data.currentTurn     || 'ai';
  STATE.playerScore      = data.playerScore     || 0;
  STATE.guessesLeft      = data.guessesLeft     || 3;
  STATE.metrics          = data.metrics         || { startTime: Date.now(), questions: 0, nodes: 0 };
  STATE.aiSelectedChar   = data.aiSelectedCharId ? getCharacterById(data.aiSelectedCharId) : null;
  STATE.gameActive       = true;

  if (STATE.mode === 1) {
    goToPage('page-game1');
    buildBoardGrid('aiBoardGrid',    true);
    buildBoardGrid('playerBoardGrid', false);

    const playerIds = new Set(STATE.playerCandidates.map(c => c.id));
    CHARACTERS.forEach(char => {
      if (!playerIds.has(char.id)) {
        const el = document.getElementById(`playerBoardGrid-card-${char.id}`);
        if (el) { el.classList.add('eliminated'); el.style.opacity = '0.15'; }
      }
    });

    updateAIBoardFiltered();

    const playerChar = getCharacterById(STATE.selectedChar);
    if (playerChar) {
      document.getElementById('playerCharCard').innerHTML =
        `${charAvatar(playerChar, true)}<div class="sc-name">${playerChar.name}</div>`;
    }

    STATE.aiHistory.forEach(h => _addHistoryItem('aiHistory', h.question, h.answer));
    STATE.playerHistory.forEach(h => _addHistoryItem('playerHistory', h.question, h.answer));

    updateCandidateCounts1();
    updateScoreDisplay();
    resetGuessBadge();
    applyColorTheme(STATE.selectedColor);
    setTurn(STATE.currentTurn);

    showToast('📂 Game loaded!');
  } else {
    showToast('📂 Mode 2 save cannot be resumed — please start a new game.');
    STATE.gameActive = false;
  }
}

// ==========================================
// 3. NAVIGATION
// ==========================================

function goToPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const page = document.getElementById(id);
  if (page) page.classList.add('active');
}

function openModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return;
  modal.classList.add('open');
  const box = modal.querySelector('.modal-box');
  if (box && typeof gsap !== 'undefined') {
    gsap.fromTo(box, { scale: 0.85, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.28 });
  }
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return;
  const box = modal.querySelector('.modal-box');
  if (box && typeof gsap !== 'undefined') {
    gsap.to(box, { scale: 0.9, opacity: 0, duration: 0.18,
      onComplete: () => modal.classList.remove('open') });
  } else {
    modal.classList.remove('open');
  }
}

function confirmQuit() {
  stopTimer();
  stopAutoRun();
  openModal('quitModal');
}

function doQuit() {
  STATE.gameActive = false;
  stopTimer();
  stopAutoRun();
  closeModal('quitModal');
  setTimeout(() => goToPage('page-home'), 250);
}

function playAgain() {
  closeModal('resultModal');
  goToSelectMode(STATE.mode);
}

function showToast(message) {
  const toast = document.getElementById('gameToast');
  if (!toast) return;
  toast.textContent = message;
  toast.style.display = 'block';
  if (typeof gsap !== 'undefined') {
    gsap.killTweensOf(toast);
    gsap.fromTo(toast, { opacity: 0, y: 20 }, {
      opacity: 1, y: 0, duration: 0.3, ease: 'back.out(1.4)',
      onComplete: () => {
        gsap.to(toast, { opacity: 0, y: 20, duration: 0.4, delay: 2.5,
          onComplete: () => { toast.style.display = 'none'; }
        });
      }
    });
  } else {

    toast.style.opacity = '1';
    setTimeout(() => { toast.style.opacity = '0'; }, 3000);
  }
}

// ==========================================
// 4. SELECTION SCREEN
// ==========================================

function goToSelectMode(mode) {
  STATE.mode          = mode;
  STATE.selectedChar  = null;
  STATE.selectedAlgo  = null;
  STATE.selectedColor = 'blue';
  buildSelectionGrid();
  goToPage('page-select');
}

function buildSelectionGrid() {
  const grid = document.getElementById('selectionGrid');
  if (!grid) return;
  grid.innerHTML = '';

  CHARACTERS.forEach(char => {
    const card = document.createElement('div');
    card.className = 'char-card';
    card.id = `sel-card-${char.id}`;
    card.innerHTML = `${charAvatar(char, false)}<div class="char-name">${char.name}</div>`;
    card.onclick = () => selectCharacter(char.id);
    grid.appendChild(card);
  });

  const algoSection = document.getElementById('algoSection');
  if (algoSection) {
    algoSection.style.display = (STATE.mode === 2) ? 'block' : 'none';
    if (STATE.mode === 2) buildAlgoSelector();
  }

  const startBtn = document.getElementById('startGameBtn');
  if (startBtn) { startBtn.disabled = true; startBtn.style.opacity = '0.4'; }

  document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
  const blueBtn = document.querySelector('.color-btn.blue');
  if (blueBtn) blueBtn.classList.add('active');
}

function buildAlgoSelector() {
  const container = document.getElementById('algoSelector');
  if (!container) return;
  container.innerHTML = '';

  ALGORITHMS.forEach(algo => {
    const btn = document.createElement('button');
    btn.className = 'algo-btn';
    btn.innerHTML = `<span style="color:${algo.color}">●</span> ${algo.name}`;
    btn.title = algo.label;
    btn.onclick = () => {
      document.querySelectorAll('.algo-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      STATE.selectedAlgo = algo.id;
      initAlgorithmState(algo.id);
      checkSelectionReady();
    };
    container.appendChild(btn);
  });
}

function selectColor(color) {
  STATE.selectedColor = color;
  document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
  const btn = document.querySelector(`.color-btn.${color}`);
  if (btn) btn.classList.add('active');

  if (STATE.selectedChar !== null) {
    document.querySelectorAll('.char-card').forEach(c =>
      c.classList.remove('selected-blue', 'selected-red'));
    const card = document.getElementById(`sel-card-${STATE.selectedChar}`);
    if (card) card.classList.add(`selected-${color}`);
  }
}

function selectCharacter(id) {
  document.querySelectorAll('.char-card').forEach(c =>
    c.classList.remove('selected-blue', 'selected-red'));
  STATE.selectedChar = id;
  const card = document.getElementById(`sel-card-${id}`);
  if (card) card.classList.add(`selected-${STATE.selectedColor}`);
  checkSelectionReady();
}

function checkSelectionReady() {
  const ready = STATE.mode === 1
    ? STATE.selectedChar !== null
    : STATE.selectedChar !== null && STATE.selectedAlgo !== null;

  const btn = document.getElementById('startGameBtn');
  if (btn) { btn.disabled = !ready; btn.style.opacity = ready ? '1' : '0.4'; }
}

// ==========================================
// 5. GAME START
// ==========================================

function startGame() {
  if (STATE.mode === 1 && STATE.selectedChar === null) return;
  if (STATE.mode === 2 && (STATE.selectedChar === null || STATE.selectedAlgo === null)) return;

  STATE.gameActive  = true;
  STATE.playerScore = 0;
  STATE.guessesLeft = 3;
  STATE.metrics     = { startTime: Date.now(), questions: 0, nodes: 0 };

  if (STATE.mode === 1) {
    initMode1();
    goToPage('page-game1');
  } else {
    initMode2();
    goToPage('page-game2');
  }
}

// ==========================================
// 6. TIMER
// ==========================================

function startPlayerTimer() {
  stopTimer();
  STATE.timeRemaining = 30;
  _updateTimerDisplay();

  STATE.timerInterval = setInterval(() => {
    if (!STATE.gameActive || STATE.currentTurn !== 'player') {
      stopTimer();
      return;
    }
    STATE.timeRemaining--;
    _updateTimerDisplay();

    if (STATE.timeRemaining <= 0) {
      stopTimer();
      showToast("⏰ Time's up! Turn passes to AI.");
      setTurn('ai');
      setTimeout(() => aiAskQuestion(), 600);
    }
  }, 1000);
}

function stopTimer() {
  if (STATE.timerInterval) {
    clearInterval(STATE.timerInterval);
    STATE.timerInterval = null;
  }
}

function _updateTimerDisplay() {
  const el = document.getElementById('playerTimer');
  if (!el) return;
  const s = STATE.timeRemaining;
  el.textContent = `⏱️ 00:${String(s).padStart(2, '0')}`;
  el.classList.toggle('warning', s <= 10);
}

// ==========================================
// 7. MODE 1 — YOU VS AI
// ==========================================

function initMode1() {
  STATE.playerCandidates = [...CHARACTERS];
  STATE.aiCandidates     = [...CHARACTERS];
  STATE.playerHistory    = [];
  STATE.aiHistory        = [];
  STATE.currentTurn      = 'ai';
  STATE.guessMode        = false;

  const pool = CHARACTERS.filter(c => c.id !== STATE.selectedChar);
  STATE.aiSelectedChar = pool[Math.floor(Math.random() * pool.length)];

  const playerChar = getCharacterById(STATE.selectedChar);
  document.getElementById('playerCharCard').innerHTML =
    `${charAvatar(playerChar, true)}<div class="sc-name">${playerChar.name}</div>`;

  document.getElementById('aiHiddenCard').innerHTML =
    `<div class="hidden-emoji">🎭</div><div class="sc-name">HIDDEN</div>`;

  buildBoardGrid('aiBoardGrid',    true);  
  buildBoardGrid('playerBoardGrid', false);  

  document.getElementById('aiHistory').innerHTML     = '';
  document.getElementById('playerHistory').innerHTML = '';

  updateCandidateCounts1();
  updateScoreDisplay();
  resetGuessBadge();
  applyColorTheme(STATE.selectedColor);
  setTurn('ai');

  setTimeout(() => aiAskQuestion(), 900);
}

// ── Board building ────────────────

function buildBoardGrid(gridId, faceDown) {
  const grid = document.getElementById(gridId);
  if (!grid) return;
  grid.innerHTML = '';

  CHARACTERS.forEach(char => {
    const card = document.createElement('div');
    card.className = 'game-char-card' + (faceDown ? ' face-down' : '');
    card.id = `${gridId}-card-${char.id}`;
    card.innerHTML = `
      <div class="card-front" style="background:linear-gradient(160deg,${charBgColor(char)} 0%,#0a1628 100%)">
        ${charAvatar(char, false)}
        <div class="gc-name">${char.name}</div>
      </div>
      <div class="card-back">🎴</div>`;
    if (!faceDown) {
      card.onclick = () => handlePlayerCardClick(char.id);
    }
    grid.appendChild(card);
  });
}

// ── Turn management ─────────────────────────

function setTurn(turn) {
  STATE.currentTurn = turn;
  const isAI = (turn === 'ai');

  const turnBadge = document.getElementById('turnBadge1');
  if (turnBadge) turnBadge.textContent = isAI ? "🤖 AI'S TURN" : '👤 YOUR TURN';

  const playerBadge = document.getElementById('playerTurnBadge1');
  if (playerBadge) playerBadge.textContent = isAI ? '⏳ WAIT…' : '🎮 YOUR TURN';

  const btnYes = document.getElementById('btnYes');
  const btnNo  = document.getElementById('btnNo');
  if (btnYes) btnYes.disabled = !isAI;
  if (btnNo)  btnNo.disabled  = !isAI;

  ['qCategory', 'qValue', 'askBtn'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.disabled = isAI;
  });

  if (!isAI) {
    startPlayerTimer();
  } else {
    stopTimer();
    const timerEl = document.getElementById('playerTimer');
    if (timerEl) timerEl.classList.remove('warning');
  }
}

// ── AI question cycle ───────────────────────────────

function aiAskQuestion() {
  if (!STATE.gameActive || STATE.currentTurn !== 'ai') return;
  if (STATE.aiCandidates.length === 0) return;

  if (STATE.aiCandidates.length === 1) {
    document.getElementById('aiCurrentQuestion').textContent =
      'I think I know it… make your guess first!';
    setTurn('player');
    return;
  }

  const qBox = document.getElementById('aiCurrentQuestion');
  const thinkingMsgs = ['🤔 Thinking…', '🧠 Analysing data…', '📊 Calculating best question…'];
  qBox.textContent = thinkingMsgs[Math.floor(Math.random() * thinkingMsgs.length)];

  const delay = getAIDelay();
  setTimeout(() => {
    if (!STATE.gameActive || STATE.currentTurn !== 'ai') return;

    const q = getAIQuestionByDifficulty(STATE.aiCandidates);
    if (!q) {
      setTurn('player');
      return;
    }

    if (q.isDirect) {
      qBox.textContent = q.text;
      return; 
    }

    qBox.textContent = q.text;

    STATE._pendingAIQuestion = q;

    const btnYes = document.getElementById('btnYes');
    const btnNo  = document.getElementById('btnNo');
    if (btnYes) btnYes.disabled = false;
    if (btnNo)  btnNo.disabled  = false;
  }, delay);
}

/**
 * @param {boolean} answer  true = YES, false = NO
 */
function answerAI(answer) {
  if (!STATE.gameActive || STATE.currentTurn !== 'ai') return;

  const q = STATE._pendingAIQuestion;
  if (!q) return;

  document.getElementById('btnYes').disabled = true;
  document.getElementById('btnNo').disabled  = true;
  STATE._pendingAIQuestion = null;

  const playerChar   = getCharacterById(STATE.selectedChar);
  const correctAnswer = (playerChar[q.attr] === q.value);

  const usedAnswer = answer; 

  STATE.aiCandidates = STATE.aiCandidates.filter(
    c => (c[q.attr] === q.value) === usedAnswer
  );

  const histEntry = { question: q.text, answer: usedAnswer ? 'YES ✓' : 'NO ✗' };
  STATE.aiHistory.push(histEntry);
  _addHistoryItem('aiHistory', histEntry.question, histEntry.answer);
  updateCandidateCounts1();
  updateAIBoardFiltered();

  if (STATE.aiCandidates.length === 1) {
    document.getElementById('aiCurrentQuestion').textContent =
      'I think I know it… make your guess first!';
    setTurn('player');
  } else if (STATE.aiCandidates.length === 0) {

    STATE.aiCandidates = [...CHARACTERS];
    showToast('⚠️ Something went wrong. AI candidates reset.');
    setTurn('player');
  } else {
    setTurn('player');
  }
}

// ── AI board display ───────────────────────────────────────

function updateAIBoardFiltered() {
  const candidateIds = new Set(STATE.aiCandidates.map(c => c.id));

  CHARACTERS.forEach(char => {
    const el = document.getElementById(`aiBoardGrid-card-${char.id}`);
    if (!el) return;
    if (candidateIds.has(char.id)) {
      el.style.display = 'flex';
      if (el.classList.contains('face-down')) {
        el.classList.remove('face-down', 'eliminated');
        if (typeof gsap !== 'undefined') {
          gsap.fromTo(el, { rotateY: 180 }, { rotateY: 0, duration: 0.45 });
        }
      }
    } else {
      el.style.display = 'none';
    }
  });
}

// ── Player card click handler ──────────────────────────────────

function handlePlayerCardClick(charId) {
  if (!STATE.gameActive) return;

  if (STATE.guessMode) {
    const card = document.getElementById(`playerBoardGrid-card-${charId}`);
    if (card && card.classList.contains('face-down')) return; 
    if (card && card.classList.contains('eliminated')) return;

    const correct = (charId === STATE.aiSelectedChar.id);

    if (card && typeof gsap !== 'undefined') {
      gsap.to(card, {
        scale: 1.18, duration: 0.18, yoyo: true, repeat: 1,
        onComplete: () => {
          gsap.to(card, {
            boxShadow: correct
              ? '0 0 28px rgba(39,174,96,0.9)'
              : '0 0 28px rgba(231,76,60,0.9)',
            borderColor: correct ? '#27ae60' : '#e74c3c',
            duration: 0.3
          });
        }
      });
    }

    STATE.guessMode = false;
    resetGuessBadge();
    document.querySelectorAll('#playerBoardGrid .game-char-card')
      .forEach(c => c.classList.remove('guess-highlight'));

    const aiHidden = document.getElementById('aiHiddenCard');
    if (aiHidden && STATE.aiSelectedChar) {
      aiHidden.innerHTML =
        `${charAvatar(STATE.aiSelectedChar, true)}<div class="sc-name">${STATE.aiSelectedChar.name}</div>`;
      aiHidden.style.borderColor = correct ? '#27ae60' : '#e74c3c';
      if (typeof gsap !== 'undefined') {
        gsap.fromTo(aiHidden, { scale: 0.8, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.45 });
      }
    }

    if (correct) {
      // ── WIN ──
      STATE.gameActive = false;
      stopTimer();
      const scoreEarned = Math.max(100 - STATE.metrics.questions * 5, 10);
      STATE.playerScore += scoreEarned;
      addWin(scoreEarned, Date.now() - STATE.metrics.startTime);
      showToast(`🎉 Correct! +${scoreEarned} points!`);
      setTimeout(() => showResult(true, STATE.aiSelectedChar, scoreEarned), 900);
    } else {
      STATE.guessesLeft--;
      updateScoreDisplay();
      if (STATE.guessesLeft > 0) {
        // ── WRONG GUESS but still has guesses left ──
        showToast(`❌ Wrong! ${STATE.guessesLeft} guess${STATE.guessesLeft > 1 ? 'es' : ''} remaining.`);
        STATE.gameActive = true; // keep playing
        setTurn('ai');
        setTimeout(() => {
          // check if AI can immediately guess
          if (STATE.aiCandidates.length === 1) {
            aiMakeGuess(STATE.aiCandidates[0]);
          } else {
            aiAskQuestion();
          }
        }, 1500);
      } else {
        // ── WRONG GUESS and no guesses left → LOSE ──
        STATE.gameActive = false;
        stopTimer();
        addLoss();
        showToast('❌ No guesses left! Game over.');
        setTimeout(() => showResult(false, STATE.aiSelectedChar, 0), 900);
      }
    }
    return;
  }

  // ── NORMAL MODE: click to eliminate on player's turn only ──
  if (STATE.currentTurn !== 'player') {
    const badge = document.getElementById('playerTurnBadge1');
    if (badge && typeof gsap !== 'undefined') {
      gsap.fromTo(badge, { x: -4 }, { x: 4, duration: 0.06, repeat: 5, yoyo: true });
    }
    showToast("⛔ It's not your turn!");
    return;
  }

  const cardEl = document.getElementById(`playerBoardGrid-card-${charId}`);
  if (!cardEl || cardEl.classList.contains('eliminated')) return;

  // Remove from player candidates (player manually eliminates)
  STATE.playerCandidates = STATE.playerCandidates.filter(c => c.id !== charId);
  cardEl.classList.add('eliminated');
  if (typeof gsap !== 'undefined') {
    gsap.to(cardEl, { opacity: 0.15, duration: 0.35 });
  } else {
    cardEl.style.opacity = '0.15';
  }
  updateCandidateCounts1();
}

// ── Player asks a question ──────────────────────────────────────────────────

function playerAskQuestion() {
  if (!STATE.gameActive || STATE.currentTurn !== 'player') return;

  const cat = document.getElementById('qCategory').value;
  const val = document.getElementById('qValue').value;
  if (!cat || !val) { showToast('⚠️ Select a category and value first!'); return; }

  // Parse value to correct type
  const parsedVal = val === 'true' ? true : val === 'false' ? false : val;

  // Answer based on AI's hidden character
  const answer       = (STATE.aiSelectedChar[cat] === parsedVal);
  const questionText = document.getElementById('questionPreview').textContent
    || buildQuestionText(cat, parsedVal);

  // Filter player's candidate list
  STATE.playerCandidates = STATE.playerCandidates.filter(
    c => (c[cat] === parsedVal) === answer
  );

  // Update visual eliminations on player's board
  const playerIds = new Set(STATE.playerCandidates.map(c => c.id));
  CHARACTERS.forEach(char => {
    if (!playerIds.has(char.id)) {
      const el = document.getElementById(`playerBoardGrid-card-${char.id}`);
      if (el && !el.classList.contains('eliminated')) {
        el.classList.add('eliminated');
        if (typeof gsap !== 'undefined') {
          gsap.to(el, { opacity: 0.15, duration: 0.35 });
        } else {
          el.style.opacity = '0.15';
        }
      }
    }
  });

  const histEntry = { question: questionText, answer: answer ? 'YES ✓' : 'NO ✗' };
  STATE.playerHistory.push(histEntry);
  _addHistoryItem('playerHistory', histEntry.question, histEntry.answer);
  updateCandidateCounts1();
  STATE.metrics.questions++;

  // Reset question form
  document.getElementById('qCategory').value = '';
  document.getElementById('qValue').innerHTML = '<option value="">— Select Value —</option>';
  document.getElementById('questionPreview').textContent = '';

  stopTimer();
  setTurn('ai');

  // AI's turn: either guess or ask another question
  setTimeout(() => {
    if (!STATE.gameActive) return;
    if (STATE.aiCandidates.length === 1) {
      aiMakeGuess(STATE.aiCandidates[0]);
    } else {
      aiAskQuestion();
    }
  }, 800);
}

// ── AI makes a final guess ──────────────────────────────────────────────────

function aiMakeGuess(char) {
  if (!STATE.gameActive) return;
  STATE.gameActive = false;
  stopTimer();

  const histEntry = { question: `FINAL GUESS: ${char.name}`, answer: '🎯' };
  STATE.aiHistory.push(histEntry);
  _addHistoryItem('aiHistory', histEntry.question, histEntry.answer);

  const correct = (char.id === STATE.selectedChar);

  if (correct) {
    addLoss();
    showToast(`🤖 AI guessed "${char.name}" — AI wins! You lose.`);
  } else {
    addWin(50, Date.now() - STATE.metrics.startTime);
    showToast(`🤖 AI guessed "${char.name}" — WRONG! You win!`);
  }

  // Reveal AI's card
  const aiHidden = document.getElementById('aiHiddenCard');
  if (aiHidden && STATE.aiSelectedChar) {
    aiHidden.innerHTML =
      `${charAvatar(STATE.aiSelectedChar, true)}<div class="sc-name">${STATE.aiSelectedChar.name}</div>`;
    aiHidden.style.borderColor = correct ? '#e74c3c' : '#27ae60';
  }

  setTimeout(() => showResult(!correct, STATE.aiSelectedChar, correct ? 0 : 50), 1100);
}

// ── UI helpers ──────────────────────────────────────────────────────────────

/** Add one entry to a history list (prepend so newest is on top). */
function _addHistoryItem(listId, question, answer) {
  const container = document.getElementById(listId);
  if (!container) return;
  const item = document.createElement('div');
  item.className = 'history-item';
  item.innerHTML = `<span class="h-q">${question}</span> → <span class="h-a">${answer}</span>`;
  container.insertBefore(item, container.firstChild);
}

/** Sync the displayed candidate counts with current STATE. */
function updateCandidateCounts1() {
  const aiEl = document.getElementById('aiCandidates1');
  const plEl = document.getElementById('playerCandidates1');
  if (aiEl) aiEl.textContent = STATE.aiCandidates.length;
  if (plEl) plEl.textContent = STATE.playerCandidates.length;
}

function updateScoreDisplay() {
  const scoreEl   = document.getElementById('playerScore');
  const guessesEl = document.getElementById('guessesLeft');
  if (scoreEl)   scoreEl.textContent   = STATE.playerScore;
  if (guessesEl) guessesEl.textContent = STATE.guessesLeft;
}

/** Update the "Value" dropdown when player changes category. */
function updateQuestionPreview() {
  const cat    = document.getElementById('qCategory').value;
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
      opt.textContent = v === 'true' ? 'Yes' : v === 'false' ? 'No'
        : v.charAt(0).toUpperCase() + v.slice(1);
      valSel.appendChild(opt);
    });

    valSel.onchange = () => {
      const v = valSel.value;
      if (!v) { document.getElementById('questionPreview').textContent = ''; return; }
      const parsedVal = v === 'true' ? true : v === 'false' ? false : v;
      document.getElementById('questionPreview').textContent =
        buildQuestionText(cat, parsedVal);
    };
  }
}

// ── Guess mode ──────────────────────────────────────────────────────────────

function toggleGuessMode() {
  if (!STATE.gameActive) return;
  STATE.guessMode = !STATE.guessMode;
  const badge = document.getElementById('guessModeBadge');

  if (STATE.guessMode) {
    if (badge) { badge.textContent = '🎯 CLICK A CHARACTER TO GUESS!'; badge.classList.add('guess-active'); }
    document.querySelectorAll('#playerBoardGrid .game-char-card:not(.face-down):not(.eliminated)')
      .forEach(c => c.classList.add('guess-highlight'));
    showToast('🎯 GUESS MODE ON — click any character!');
  } else {
    resetGuessBadge();
    document.querySelectorAll('#playerBoardGrid .game-char-card')
      .forEach(c => c.classList.remove('guess-highlight'));
  }
}

function resetGuessBadge() {
  const badge = document.getElementById('guessModeBadge');
  if (badge) { badge.textContent = '🎯 GUESS MODE: OFF'; badge.classList.remove('guess-active'); }
}

// ==========================================
// 8. MODE 2 — AI GUESSES
// ==========================================

function initMode2() {
  STATE.aiCandidates   = [...CHARACTERS];
  STATE.metrics        = { startTime: Date.now(), questions: 0, nodes: 0 };
  STATE.autoRunInterval = null;

  // Show player's secret card
  const playerChar   = getCharacterById(STATE.selectedChar);
  const secretCard   = document.getElementById('playerSecretCard');
  if (secretCard) secretCard.innerHTML =
    `${charAvatar(playerChar, true)}<div class="sc-name">${playerChar.name}</div>`;

  // Display algorithm name
  const algo = ALGORITHMS.find(a => a.id === STATE.selectedAlgo);
  const algoNameEl = document.getElementById('algoNameDisplay');
  if (algoNameEl) {
    algoNameEl.textContent = algo ? algo.name : '—';
    algoNameEl.style.color = algo ? algo.color : 'var(--gold)';
  }

  // Reset controls
  const autoRunBtn = document.getElementById('autoRunBtn');
  const runBtn     = document.getElementById('runAlgoBtn');
  if (autoRunBtn) { autoRunBtn.textContent = '⚡ AUTO RUN'; autoRunBtn.disabled = false; }
  if (runBtn)     runBtn.disabled = false;

  const q2 = document.getElementById('mode2Question');
  if (q2) q2.textContent = 'Press RUN STEP to begin…';

  buildMode2Board();
  updateMetrics2();
  initAlgorithmState(STATE.selectedAlgo);

  const log = document.getElementById('reasoningLog');
  if (log) log.innerHTML = '';
  logEntry('highlight', `▶ ${algo ? algo.name : '?'} initialised`);
  logEntry('highlight', `Searching among ${CHARACTERS.length} characters…`);
}

function buildMode2Board() {
  const grid = document.getElementById('mode2BoardGrid');
  if (!grid) return;
  grid.innerHTML = '';

  CHARACTERS.forEach(char => {
    const card = document.createElement('div');
    card.className = 'game-char-card';
    card.id = `m2-card-${char.id}`;
    card.innerHTML = `
      <div class="card-front" style="background:linear-gradient(160deg,${charBgColor(char)} 0%,#0a1628 100%)">
        ${charAvatar(char, false)}
        <div class="gc-name">${char.name}</div>
      </div>
      <div class="card-back">🎴</div>`;
    grid.appendChild(card);
  });
}

function logEntry(type, text) {
  const log = document.getElementById('reasoningLog');
  if (!log) return;
  const entry = document.createElement('div');
  entry.className = `log-entry ${type}`;
  entry.textContent = `> ${text}`;
  log.insertBefore(entry, log.firstChild);
}

function updateMetrics2() {
  const elapsed = Date.now() - STATE.metrics.startTime;
  const setEl = (id, val) => { const e = document.getElementById(id); if (e) e.textContent = val; };

  setEl('metricTime',      elapsed);
  setEl('metricQuestions', STATE.metrics.questions);
  setEl('metricNodes',     STATE.metrics.nodes);
  setEl('aiCandidates2',   STATE.aiCandidates.length);
  setEl('aiTimer2',        (elapsed / 1000).toFixed(3));

  const efficiency = STATE.metrics.questions > 0
    ? Math.round((1 - STATE.metrics.questions / CHARACTERS.length) * 100) + '%'
    : '—';
  setEl('metricScore', efficiency);
}

function runNextStep() {
  if (!STATE.gameActive) return;

  if (STATE.aiCandidates.length === 0) {
    stopAutoRun();
    logEntry('eliminate', 'ERROR: no candidates remain — game cannot continue');
    return;
  }

  if (STATE.aiCandidates.length === 1) {
    stopAutoRun();
    finalGuess(STATE.aiCandidates[0]);
    return;
  }

  let step;
  try {
    step = algorithmStep(STATE.selectedAlgo, STATE.aiCandidates);
  } catch (err) {
    logEntry('eliminate', `Algorithm error: ${err.message}`);
    stopAutoRun();
    return;
  }

  if (!step) {
    const pairs = getAllCandidatePairs(STATE.aiCandidates);
    if (!pairs.length) {
      stopAutoRun();
      finalGuess(STATE.aiCandidates[0]);
      return;
    }
    pairs.sort((a, b) => Math.min(b.yes, b.no) - Math.min(a.yes, a.no));
    step = makeStep(pairs[0].attr, pairs[0].value, pairs.length, 'Fallback best-first');
  }

  STATE.metrics.questions++;
  STATE.metrics.nodes += step.nodesExplored || 1;

  const q2El = document.getElementById('mode2Question');
  if (q2El) q2El.textContent = step.question;
  logEntry('question', `Q${STATE.metrics.questions}: ${step.question}`);
  if (step.note) logEntry('highlight', step.note);


  const playerChar = getCharacterById(STATE.selectedChar);
  const answer = (playerChar[step.attr] === step.value);
  logEntry('answer', `Answer: ${answer ? 'YES ✓' : 'NO ✗'}`);

  const before = STATE.aiCandidates.length;
  STATE.aiCandidates = STATE.aiCandidates.filter(c => (c[step.attr] === step.value) === answer);
  logEntry('eliminate',
    `Eliminated ${before - STATE.aiCandidates.length} | Remaining: ${STATE.aiCandidates.length}`);


    const remainingIds = new Set(STATE.aiCandidates.map(c => c.id));
  CHARACTERS.forEach(char => {
    if (!remainingIds.has(char.id)) {
      const el = document.getElementById(`m2-card-${char.id}`);
      if (el && !el.classList.contains('eliminated')) {
        el.classList.add('eliminated');
        if (typeof gsap !== 'undefined') {
          gsap.to(el, { rotateY: 180, duration: 0.45,
            onComplete: () => el.classList.add('face-down') });
        } else {
          el.classList.add('face-down');
        }
      }
    }
  });

  updateMetrics2();

  if (STATE.aiCandidates.length === 1) {
    stopAutoRun();
    setTimeout(() => finalGuess(STATE.aiCandidates[0]), 700);
  } else if (STATE.aiCandidates.length === 0) {
    stopAutoRun();
    logEntry('eliminate', 'ERROR: all candidates eliminated — cannot guess');
  }
}

function finalGuess(char) {
  if (!STATE.gameActive) return;
  STATE.gameActive = false;
  logEntry('found', `🎯 AI GUESSES: ${char.name}!`);
  updateMetrics2();

  const el = document.getElementById(`m2-card-${char.id}`);
  if (el) {
    el.classList.remove('face-down', 'eliminated');
    el.style.transform = 'none';
    if (typeof gsap !== 'undefined') {
      gsap.to(el, {
        scale: 1.22,
        boxShadow: '0 0 32px rgba(232,200,74,0.9)',
        borderColor: 'var(--gold)',
        duration: 0.4
      });
    }
  }

  const correct = (char.id === STATE.selectedChar);
  const algo    = ALGORITHMS.find(a => a.id === STATE.selectedAlgo);
  const elapsed = Date.now() - STATE.metrics.startTime;

  if (correct) {
    addLoss();   
  } else {
    addWin(100, elapsed);  
  }

  setTimeout(() => showResultMode2(correct, char, algo ? algo.name : 'AI', elapsed), 900);
}

// ── Auto run ─────────────────────────────────────────

function toggleAutoRun() {
  if (STATE.autoRunInterval) {
    stopAutoRun();
  } else {
    if (!STATE.gameActive) return;
    const btn = document.getElementById('autoRunBtn');
    if (btn) btn.textContent = '⏹ STOP AUTO';
    STATE.autoRunInterval = setInterval(() => {
      if (!STATE.gameActive || STATE.aiCandidates.length <= 1) {
        stopAutoRun();
        return;
      }
      runNextStep();
    }, 900);
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