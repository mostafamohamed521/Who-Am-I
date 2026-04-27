/**
 * ==========================================
 * CHARACTERS DATA — GUESS WHO AI BOARD GAME
 * ==========================================
 */

'use strict';

// ==========================================
// 1. CHARACTER LIST (24 Characters)
// ==========================================

const CHARACTERS = [
  { id:  1, name: 'Alex',  gender: 'male',   glasses: false, beard: false, mustache: false, hairColor: 'brown',  hat: false, emoji: '👨',      image: 'assets/character/1.png'  },
  { id:  2, name: 'Maria', gender: 'female', glasses: true,  beard: false, mustache: false, hairColor: 'black',  hat: false, emoji: '👩',      image: 'assets/character/2.png'  },
  { id:  3, name: 'Tom',   gender: 'male',   glasses: false, beard: true,  mustache: false, hairColor: 'blonde', hat: false, emoji: '🧔',      image: 'assets/character/3.png'  },
  { id:  4, name: 'Sara',  gender: 'female', glasses: false, beard: false, mustache: false, hairColor: 'red',    hat: true,  emoji: '👒',      image: 'assets/character/4.png'  },
  { id:  5, name: 'Dave',  gender: 'male',   glasses: true,  beard: false, mustache: true,  hairColor: 'black',  hat: false, emoji: '🕵️',      image: 'assets/character/5.png'  },
  { id:  6, name: 'Lisa',  gender: 'female', glasses: false, beard: false, mustache: false, hairColor: 'blonde', hat: false, emoji: '💁',      image: 'assets/character/6.jpg'  },
  { id:  7, name: 'Max',   gender: 'male',   glasses: false, beard: true,  mustache: true,  hairColor: 'brown',  hat: true,  emoji: '🤠',      image: 'assets/character/7.png'  },
  { id:  8, name: 'Nina',  gender: 'female', glasses: true,  beard: false, mustache: false, hairColor: 'brown',  hat: false, emoji: '🤓',      image: 'assets/character/8.png'  },
  { id:  9, name: 'Paul',  gender: 'male',   glasses: false, beard: false, mustache: false, hairColor: 'white',  hat: false, emoji: '👴',      image: 'assets/character/9.png'  },
  { id: 10, name: 'Zoe',   gender: 'female', glasses: false, beard: false, mustache: false, hairColor: 'black',  hat: true,  emoji: '🎩',      image: 'assets/character/10.png' },
  { id: 11, name: 'Jack',  gender: 'male',   glasses: true,  beard: true,  mustache: false, hairColor: 'red',    hat: false, emoji: '🧑',      image: 'assets/character/11.png' },
  { id: 12, name: 'Eve',   gender: 'female', glasses: false, beard: false, mustache: false, hairColor: 'red',    hat: false, emoji: '👱',      image: 'assets/character/12.jpg' },
  { id: 13, name: 'Ray',   gender: 'male',   glasses: false, beard: false, mustache: true,  hairColor: 'black',  hat: false, emoji: '🫅',      image: 'assets/character/13.png' },
  { id: 14, name: 'Amy',   gender: 'female', glasses: true,  beard: false, mustache: false, hairColor: 'red',    hat: false, emoji: '👸',      image: 'assets/character/14.png' },
  { id: 15, name: 'Bob',   gender: 'male',   glasses: false, beard: true,  mustache: false, hairColor: 'blonde', hat: true,  emoji: '🎅',      image: 'assets/character/15.png' },
  { id: 16, name: 'Mia',   gender: 'female', glasses: false, beard: false, mustache: false, hairColor: 'brown',  hat: false, emoji: '🙋',      image: 'assets/character/16.png' },
  { id: 17, name: 'Leo',   gender: 'male',   glasses: true,  beard: false, mustache: false, hairColor: 'brown',  hat: false, emoji: '👓',      image: 'assets/character/17.png' },
  { id: 18, name: 'Ivy',   gender: 'female', glasses: false, beard: false, mustache: false, hairColor: 'black',  hat: false, emoji: '💃',      image: 'assets/character/18.png' },
  { id: 19, name: 'Sam',   gender: 'male',   glasses: false, beard: true,  mustache: true,  hairColor: 'black',  hat: false, emoji: '🧑‍🦱', image: 'assets/character/19.png' },
  { id: 20, name: 'Kay',   gender: 'female', glasses: true,  beard: false, mustache: false, hairColor: 'blonde', hat: true,  emoji: '👰',      image: 'assets/character/20.png' },
  { id: 21, name: 'Finn',  gender: 'male',   glasses: false, beard: false, mustache: false, hairColor: 'red',    hat: false, emoji: '🧑‍🦰', image: 'assets/character/21.png' },
  { id: 22, name: 'Rosa',  gender: 'female', glasses: false, beard: false, mustache: false, hairColor: 'brown',  hat: false, emoji: '💆',      image: 'assets/character/22.png' },
  { id: 23, name: 'Cole',  gender: 'male',   glasses: true,  beard: false, mustache: true,  hairColor: 'white',  hat: false, emoji: '🧓',      image: 'assets/character/23.png' },
  { id: 24, name: 'Jade',  gender: 'female', glasses: false, beard: false, mustache: false, hairColor: 'black',  hat: true,  emoji: '🧕',      image: 'assets/character/24.png' }
];

// ==========================================
// 2. STATISTICS
// ==========================================

let gameStats = {
  wins: 0,
  losses: 0,
  bestTime: null,   
  totalScore: 0
};

function loadStats() {
  try {
    const saved = localStorage.getItem('guessWhoStats');
    if (saved) {
      gameStats = JSON.parse(saved);
    }
  } catch (_) { /* ignore corrupt data */ }
  updateStatsDisplay();
}

function saveStats() {
  try {
    localStorage.setItem('guessWhoStats', JSON.stringify(gameStats));
  } catch (_) {}
  updateStatsDisplay();
}

function updateStatsDisplay() {
  const winsEl     = document.getElementById('winsCount');
  const lossesEl   = document.getElementById('lossesCount');
  const bestTimeEl = document.getElementById('bestTime');

  if (winsEl)     winsEl.textContent   = gameStats.wins;
  if (lossesEl)   lossesEl.textContent = gameStats.losses;
  if (bestTimeEl) bestTimeEl.textContent = gameStats.bestTime
    ? (gameStats.bestTime / 1000).toFixed(1) + 's'
    : '—';
}

/**
 * @param {number} score  Points earned this game.
 * @param {number} timeMs Elapsed milliseconds.
 */
function addWin(score, timeMs) {
  gameStats.wins++;
  gameStats.totalScore += score;
  if (!gameStats.bestTime || timeMs < gameStats.bestTime) {
    gameStats.bestTime = timeMs;
  }
  saveStats();
}

function addLoss() {
  gameStats.losses++;
  saveStats();
}

// ==========================================
// 3. CHARACTER HELPERS
// ==========================================

function getCharacterById(id) {
  return CHARACTERS.find(c => c.id === id);
}

function charBgColor(char) {
  const map = {
    brown:  '#6B3A2A',
    black:  '#1a1a2e',
    blonde: '#8B7536',
    red:    '#6B1A1A',
    white:  '#4a4a6a'
  };
  return map[char.hairColor] || '#0f2040';
}

/**
 * @param {object}  char    Character object.
 * @param {boolean} isLarge Use larger dimensions.
 */
function charAvatar(char, isLarge) {
  const px        = isLarge ? '54px' : '44px';
  const fontSize  = isLarge ? '26px' : '20px';
  const bg        = charBgColor(char);

  return `<div style="width:${px};height:${px};border-radius:50%;background:${bg};
    border:1.5px solid rgba(232,200,74,0.2);display:flex;align-items:center;
    justify-content:center;overflow:hidden;flex-shrink:0">
    <img src="${char.image}" alt="${char.name}"
      style="width:100%;height:100%;object-fit:cover;border-radius:50%"
      onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
    <span style="font-size:${fontSize};display:none;align-items:center;
      justify-content:center;width:100%;height:100%">${char.emoji}</span>
  </div>`;
}

function charTraitTags(char) {
  const traits = [
    char.gender === 'male' ? 'Male' : 'Female',
    char.glasses   ? 'Glasses'   : null,
    char.beard     ? 'Beard'     : null,
    char.mustache  ? 'Mustache'  : null,
    char.hat       ? 'Hat'       : null,
    char.hairColor.charAt(0).toUpperCase() + char.hairColor.slice(1) + ' hair'
  ];
  return traits
    .filter(Boolean)
    .map(t => `<span class="info-tag">${t}</span>`)
    .join('');
}

// ==========================================
// 4. COLOR THEME
// ==========================================
/**
 * @param {'blue'|'red'} color
 */
function applyColorTheme(color) {
  const isBlue = (color === 'blue');

  ['aiBoardSection', 'playerBoardSection'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.toggle('blue-theme', isBlue);
    el.classList.toggle('red-theme',  !isBlue);
  });

  const aiBoardLabel    = document.getElementById('aiBoardLabel');
  const playerBoardLabel= document.getElementById('playerBoardLabel');
  if (aiBoardLabel)     aiBoardLabel.innerHTML    = isBlue ? '🔵 AI BOARD — HIDDEN CHARACTER'    : '🔴 AI BOARD — HIDDEN CHARACTER';
  if (playerBoardLabel) playerBoardLabel.innerHTML = isBlue ? '🔵 YOUR BOARD — CLICK TO ELIMINATE' : '🔴 YOUR BOARD — CLICK TO ELIMINATE';

  const aiHiddenCard   = document.getElementById('aiHiddenCard');
  const playerCharCard = document.getElementById('playerCharCard');
  const borderColor    = isBlue ? '#3498db' : '#e74c3c';
  if (aiHiddenCard)   aiHiddenCard.style.borderColor   = borderColor;
  if (playerCharCard) playerCharCard.style.borderColor = borderColor;

  ['aiPanel', 'playerPanel'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.toggle('blue-panel', isBlue);
    el.classList.toggle('red-panel',  !isBlue);
  });

  const qBox = document.querySelector('.ai-question-box');
  if (qBox) {
    qBox.classList.toggle('blue-theme', isBlue);
    qBox.classList.toggle('red-theme',  !isBlue);
  }

  const turnBadge   = document.getElementById('turnBadge1');
  const playerBadge = document.getElementById('playerTurnBadge1');
  if (turnBadge) {
    turnBadge.classList.toggle('ai-turn',     isBlue);
    turnBadge.classList.toggle('player-turn', !isBlue);
  }
  if (playerBadge) {
    playerBadge.classList.toggle('player-turn', true);
    playerBadge.classList.toggle('ai-turn',     false);
  }
}

// ==========================================
// 5. INITIALISATION
// ==========================================

loadStats();