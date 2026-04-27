/**
 * ==========================================
 * MAIN — GUESS WHO AI BOARD GAME
 * ==========================================
 */

'use strict';

// ==========================================
// 1. RESULT SCREENS
// ==========================================

/**
 * @param {boolean} playerWon   true if player correctly guessed.
 * @param {object}  aiChar      The AI's hidden character object.
 * @param {number}  scoreEarned Points earned this round.
 */
function showResult(playerWon, aiChar, scoreEarned) {
  // Safety: stop everything
  STATE.gameActive = false;
  stopTimer();
  stopAutoRun();

  const timeElapsed = Date.now() - STATE.metrics.startTime;
  const timeSec     = (timeElapsed / 1000).toFixed(1);

  // Populate common fields
  document.getElementById('resultTime').textContent       = `${timeSec}s`;
  document.getElementById('resultScoreGained').textContent = scoreEarned;
  document.getElementById('resultStats').style.display    = 'block';
  document.getElementById('resultMetrics').style.display  = 'none';

  const icon    = document.getElementById('resultIcon');
  const titleEl = document.getElementById('resultTitle');
  const descEl  = document.getElementById('resultDesc');
  const area    = document.getElementById('resultCharArea');

  if (playerWon) {
    icon.textContent    = '🏆';
    titleEl.textContent = 'YOU WIN!';
    titleEl.className   = 'win';
    descEl.innerHTML    = `🎉 You correctly identified the AI's character!<br>Score earned: <strong>+${scoreEarned}</strong>`;
    area.innerHTML = `
      <div style="display:flex;align-items:center;gap:12px;justify-content:center">
        ${charAvatar(aiChar, true)}
        <div>
          <div style="font-family:'Orbitron',monospace;color:var(--gold);font-size:13px;margin-bottom:5px">${aiChar.name}</div>
          <div>${charTraitTags(aiChar)}</div>
        </div>
      </div>`;
  } else {
    const playerChar = getCharacterById(STATE.selectedChar);
    icon.textContent    = '💀';
    titleEl.textContent = 'GAME OVER';
    titleEl.className   = 'lose';
    descEl.textContent  = 'The AI identified your character first. Better luck next time!';
    area.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:12px">
        <div style="display:flex;align-items:center;gap:12px;background:rgba(231,76,60,.1);
          border:1px solid rgba(231,76,60,.3);border-radius:8px;padding:10px">
          ${charAvatar(playerChar, true)}
          <div>
            <div style="font-family:'Orbitron',monospace;font-size:9px;color:#e74c3c;
              letter-spacing:2px;margin-bottom:3px">YOUR CHARACTER</div>
            <div style="font-family:'Orbitron',monospace;color:var(--text-primary);
              font-size:13px;margin-bottom:4px">${playerChar.name}</div>
            <div>${charTraitTags(playerChar)}</div>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:12px;background:rgba(232,200,74,.06);
          border:1px solid rgba(232,200,74,.25);border-radius:8px;padding:10px">
          ${charAvatar(aiChar, true)}
          <div>
            <div style="font-family:'Orbitron',monospace;font-size:9px;color:var(--gold);
              letter-spacing:2px;margin-bottom:3px">AI'S CHARACTER</div>
            <div style="font-family:'Orbitron',monospace;color:var(--text-primary);
              font-size:13px;margin-bottom:4px">${aiChar.name}</div>
            <div>${charTraitTags(aiChar)}</div>
          </div>
        </div>
      </div>`;
  }

  openModal('resultModal');
}

/**
 * @param {boolean} aiWon        true if the AI correctly identified the player's character.
 * @param {object}  guessedChar  The character the AI guessed.
 * @param {string}  algoName     Display name of the algorithm used.
 * @param {number}  elapsed      Milliseconds elapsed during the game.
 */
function showResultMode2(aiWon, guessedChar, algoName, elapsed) {
  const playerChar  = getCharacterById(STATE.selectedChar);
  const playerWon   = !aiWon;
  const scoreEarned = playerWon ? 100 : 0;

  document.getElementById('resultIcon').textContent       = aiWon ? '🤖' : '🎉';
  document.getElementById('resultStats').style.display    = 'block';
  document.getElementById('resultTime').textContent       = `${(elapsed / 1000).toFixed(1)}s`;
  document.getElementById('resultScoreGained').textContent = scoreEarned;

  const titleEl = document.getElementById('resultTitle');
  titleEl.textContent = aiWon ? 'AI WINS!' : 'YOU WIN!';
  titleEl.className   = aiWon ? 'lose'     : 'win';

  document.getElementById('resultDesc').textContent = aiWon
    ? `The ${algoName} algorithm correctly identified your character in ${STATE.metrics.questions} question${STATE.metrics.questions !== 1 ? 's' : ''}!`
    : `The AI guessed incorrectly — you stumped the machine! 🎊`;

  // Character reveal area
  const area = document.getElementById('resultCharArea');
  if (aiWon) {
    // Show both: player's secret + AI's (correct) guess side by side
    area.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:12px">
        <div style="display:flex;align-items:center;gap:12px;background:rgba(231,76,60,.1);
          border:1px solid rgba(231,76,60,.3);border-radius:8px;padding:10px">
          ${charAvatar(playerChar, true)}
          <div>
            <div style="font-family:'Orbitron',monospace;font-size:9px;color:#e74c3c;
              letter-spacing:2px;margin-bottom:3px">YOUR SECRET CHARACTER</div>
            <div style="font-family:'Orbitron',monospace;color:var(--text-primary);
              font-size:13px;margin-bottom:4px">${playerChar.name}</div>
            <div>${charTraitTags(playerChar)}</div>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:12px;background:rgba(232,200,74,.06);
          border:1px solid rgba(232,200,74,.25);border-radius:8px;padding:10px">
          ${charAvatar(guessedChar, true)}
          <div>
            <div style="font-family:'Orbitron',monospace;font-size:9px;color:var(--gold);
              letter-spacing:2px;margin-bottom:3px">AI GUESSED CORRECTLY ✓</div>
            <div style="font-family:'Orbitron',monospace;color:var(--text-primary);
              font-size:13px;margin-bottom:4px">${guessedChar.name}</div>
            <div>${charTraitTags(guessedChar)}</div>
          </div>
        </div>
      </div>`;
  } else {
    // Player wins — show what the AI guessed (wrong) vs actual
    area.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:12px">
        <div style="display:flex;align-items:center;gap:12px;background:rgba(39,174,96,.1);
          border:1px solid rgba(39,174,96,.3);border-radius:8px;padding:10px">
          ${charAvatar(playerChar, true)}
          <div>
            <div style="font-family:'Orbitron',monospace;font-size:9px;color:#27ae60;
              letter-spacing:2px;margin-bottom:3px">YOUR SECRET CHARACTER</div>
            <div style="font-family:'Orbitron',monospace;color:var(--text-primary);
              font-size:13px;margin-bottom:4px">${playerChar.name}</div>
            <div>${charTraitTags(playerChar)}</div>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:12px;background:rgba(231,76,60,.1);
          border:1px solid rgba(231,76,60,.3);border-radius:8px;padding:10px">
          ${charAvatar(guessedChar, true)}
          <div>
            <div style="font-family:'Orbitron',monospace;font-size:9px;color:#e74c3c;
              letter-spacing:2px;margin-bottom:3px">AI GUESSED WRONG ✗</div>
            <div style="font-family:'Orbitron',monospace;color:var(--text-primary);
              font-size:13px;margin-bottom:4px">${guessedChar.name}</div>
            <div>${charTraitTags(guessedChar)}</div>
          </div>
        </div>
      </div>`;
  }

  // Algorithm performance metrics panel
  const metricsDiv = document.getElementById('resultMetrics');
  metricsDiv.style.display = 'block';
  document.getElementById('resultMetricsGrid').innerHTML = `
    <div class="metric-box">
      <div class="m-val" style="font-size:12px">${algoName}</div>
      <div class="m-label">ALGORITHM</div>
    </div>
    <div class="metric-box">
      <div class="m-val">${elapsed}ms</div>
      <div class="m-label">TIME</div>
    </div>
    <div class="metric-box">
      <div class="m-val">${STATE.metrics.questions}</div>
      <div class="m-label">QUESTIONS</div>
    </div>
    <div class="metric-box">
      <div class="m-val">${STATE.metrics.nodes}</div>
      <div class="m-label">NODES</div>
    </div>`;

  openModal('resultModal');
}

// ==========================================
// 2. LANDING PAGE ANIMATION
// ==========================================

function initLanding() {
  const grid = document.getElementById('miniCardsGrid');
  if (grid) {
    CHARACTERS.forEach(char => {
      const mini = document.createElement('div');
      mini.className = 'mini-card';
      mini.style.background = charBgColor(char);
      mini.textContent = char.emoji;
      grid.appendChild(mini);
    });
  }

  const content = document.getElementById('landingContent');
  if (typeof gsap !== 'undefined') {
    gsap.to(content, { opacity: 1, y: 0, duration: 1, ease: 'power3.out', delay: 0.3 });
    gsap.fromTo('.mini-card',
      { opacity: 0, scale: 0.5 },
      { opacity: 1, scale: 1, duration: 0.4, stagger: 0.04, ease: 'back.out(1.2)', delay: 0.6 }
    );
  } else if (content) {
    content.style.opacity   = '1';
    content.style.transform = 'none';
  }
}

// ==========================================
// 3. BOOTSTRAP
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
  initLanding();
  loadStats();
});