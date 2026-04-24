# Guess Who — AI Board Game
## Project Structure

```
guess-who/
│
├── index.html                  ← Entry point (all pages/modals in one file)
│
├── css/
│   └── style.css               ← All styles (scaled for laptop screens)
│
├── js/
│   ├── characters.js           ← Character data (24 characters + image paths)
│   ├── algorithms.js           ← All 10 AI algorithm implementations
│   └── game.js                 ← Game state, UI logic, Mode 1 & 2 gameplay
│
└── assets/
    └── images/
        ├── characters/         ← ★ DROP CHARACTER PORTRAITS HERE (see below)
        ├── backgrounds/        ← ★ DROP BACKGROUND IMAGES HERE (see below)
        └── ui/                 ← ★ DROP UI PREVIEW IMAGES HERE (see below)
```

---

## Where to Put Your Images

### Character Portraits  →  `assets/images/characters/`
Name each file exactly as shown. Recommended: 120×160 px PNG with transparency.

| File name       | Character |
|-----------------|-----------|
| alex.png        | Alex      |
| maria.png       | Maria     |
| tom.png         | Tom       |
| sara.png        | Sara      |
| dave.png        | Dave      |
| lisa.png        | Lisa      |
| max.png         | Max       |
| nina.png        | Nina      |
| paul.png        | Paul      |
| zoe.png         | Zoe       |
| jack.png        | Jack      |
| eve.png         | Eve       |
| ray.png         | Ray       |
| amy.png         | Amy       |
| bob.png         | Bob       |
| mia.png         | Mia       |
| leo.png         | Leo       |
| ivy.png         | Ivy       |
| sam.png         | Sam       |
| kay.png         | Kay       |
| finn.png        | Finn      |
| rosa.png        | Rosa      |
| cole.png        | Cole      |
| jade.png        | Jade      |

> **Fallback**: Until images are added, each character shows their emoji automatically.

---

### Background Images  →  `assets/images/backgrounds/`
Three pages have image placeholder comments in `index.html` and `css/style.css`:

| File name         | Used on             | Recommended size |
|-------------------|---------------------|------------------|
| landing-bg.jpg    | Landing / Start screen | 1920×1080 px  |
| home-bg.jpg       | Home / Mode select  | 1920×1080 px     |
| select-bg.jpg     | Character selection | 1920×1080 px     |

To activate, find the comments in `css/style.css` like:
```css
/* ── BACKGROUND IMAGE PLACEHOLDER ──
   Replace the gradient below with your image:
   background: url('../assets/images/backgrounds/landing-bg.jpg') center/cover no-repeat;
*/
```
Uncomment that line and remove (or keep) the gradient overlay as desired.

---

### UI Preview Images  →  `assets/images/ui/`
The two mode cards on the Home screen have image placeholders:

| File name           | Used in         |
|---------------------|-----------------|
| mode1-preview.png   | "You vs AI" card |
| mode2-preview.png   | "AI Guesses" card |

To activate, find the comments in `index.html`:
```html
<!--
  MODE 1 PREVIEW IMAGE PLACEHOLDER
  Replace with:
  <img src="assets/images/ui/mode1-preview.png" ...>
-->
```

---

## Algorithm Approaches (summary)

| Algorithm       | Core Method                                               |
|-----------------|-----------------------------------------------------------|
| CSP             | Arc-consistency; most-constrained variable selection      |
| Backtracking    | Depth-first with fixed order; stack-based backtracking    |
| Minimax         | Game-tree; minimise worst-case remaining pool             |
| Alpha-Beta      | Minimax + α/β pruning; fewer nodes explored               |
| Best-First      | Shannon entropy priority queue; maximum info gain         |
| Heuristic       | Domain-expert attribute weights + balance scoring         |
| Local Search    | Hill-climbing + random restarts on the question landscape |
| Genetic         | Population of question genes; selection/crossover/mutate  |
| Bio-Inspired    | Ant Colony Optimisation; pheromone trails + evaporation   |
| Uninformed BFS  | Blind breadth-first; no scoring whatsoever                |

---

## Quick Start
Just open `index.html` in any modern browser — no server required.
