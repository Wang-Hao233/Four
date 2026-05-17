class MinesweeperWeb {
  constructor() {
    this.difficulties = {
      easy: { label: "简单", rows: 9, cols: 9, mines: 10 },
      medium: { label: "中等", rows: 16, cols: 16, mines: 40 },
      hard: { label: "困难", rows: 16, cols: 30, mines: 99 },
    };

    this.boardEl = document.querySelector("#board");
    this.difficultyEl = document.querySelector("#difficulty");
    this.mineLeftEl = document.querySelector("#mineLeft");
    this.timerEl = document.querySelector("#timer");
    this.bestTimeEl = document.querySelector("#bestTime");
    this.statusEl = document.querySelector("#status");
    this.helpDialog = document.querySelector("#helpDialog");

    document.querySelector("#newGame").addEventListener("click", () => this.reset());
    document.querySelector("#newGameHero").addEventListener("click", () => this.reset());
    document.querySelector("#difficulty").addEventListener("change", () => this.reset());
    document.querySelector("#hint").addEventListener("click", () => this.openHelp());
    document.querySelector("#closeHelp").addEventListener("click", () => this.helpDialog.close());

    this.reset();
  }

  reset() {
    const config = this.difficulties[this.difficultyEl.value];
    this.rows = config.rows;
    this.cols = config.cols;
    this.mineCount = config.mines;
    this.flags = 0;
    this.revealedCount = 0;
    this.started = false;
    this.gameOver = false;
    this.startTime = 0;
    this.elapsed = 0;
    this.firstClick = true;
    clearInterval(this.timerId);

    this.mines = Array.from({ length: this.rows }, () => Array(this.cols).fill(false));
    this.counts = Array.from({ length: this.rows }, () => Array(this.cols).fill(0));
    this.revealed = Array.from({ length: this.rows }, () => Array(this.cols).fill(false));
    this.flagged = Array.from({ length: this.rows }, () => Array(this.cols).fill(false));

    this.renderBoard();
    this.updateInfo();
    this.statusEl.textContent = "点击任意格子开始游戏";
  }

  renderBoard() {
    this.boardEl.innerHTML = "";
    this.boardEl.style.gridTemplateColumns = `repeat(${this.cols}, 34px)`;

    const fragment = document.createDocumentFragment();
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const cell = document.createElement("button");
        cell.className = "cell";
        cell.type = "button";
        cell.setAttribute("aria-label", `第 ${r + 1} 行第 ${c + 1} 列`);
        cell.dataset.row = r;
        cell.dataset.col = c;
        cell.addEventListener("click", () => this.leftClick(r, c));
        cell.addEventListener("contextmenu", (event) => {
          event.preventDefault();
          this.toggleFlag(r, c);
        });

        let longPressTimer = null;
        cell.addEventListener("touchstart", () => {
          longPressTimer = setTimeout(() => this.toggleFlag(r, c), 450);
        }, { passive: true });
        cell.addEventListener("touchend", () => clearTimeout(longPressTimer));
        cell.addEventListener("touchmove", () => clearTimeout(longPressTimer));
        fragment.appendChild(cell);
      }
    }
    this.boardEl.appendChild(fragment);
  }

  startTimer() {
    if (this.started) return;
    this.started = true;
    this.startTime = Date.now();
    this.timerId = setInterval(() => {
      this.elapsed = Math.floor((Date.now() - this.startTime) / 1000);
      this.timerEl.textContent = this.formatTime(this.elapsed);
    }, 1000);
  }

  placeMines(safeRow, safeCol) {
    const forbidden = new Set();
    for (const [r, c] of this.neighbors(safeRow, safeCol, true)) {
      forbidden.add(`${r},${c}`);
    }

    let placed = 0;
    while (placed < this.mineCount) {
      const r = Math.floor(Math.random() * this.rows);
      const c = Math.floor(Math.random() * this.cols);
      const key = `${r},${c}`;
      if (!this.mines[r][c] && !forbidden.has(key)) {
        this.mines[r][c] = true;
        placed += 1;
      }
    }
    this.calculateCounts();
  }

  calculateCounts() {
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (this.mines[r][c]) continue;
        this.counts[r][c] = this.neighbors(r, c)
          .filter(([nr, nc]) => this.mines[nr][nc])
          .length;
      }
    }
  }

  neighbors(row, col, includeSelf = false) {
    const cells = [];
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (!includeSelf && dr === 0 && dc === 0) continue;
        const r = row + dr;
        const c = col + dc;
        if (r >= 0 && r < this.rows && c >= 0 && c < this.cols) {
          cells.push([r, c]);
        }
      }
    }
    return cells;
  }

  leftClick(row, col) {
    if (this.gameOver || this.flagged[row][col] || this.revealed[row][col]) return;

    if (this.firstClick) {
      this.placeMines(row, col);
      this.firstClick = false;
      this.startTimer();
    }

    if (this.mines[row][col]) {
      this.endGame(false);
      return;
    }

    this.reveal(row, col);
    this.checkWin();
  }

  toggleFlag(row, col) {
    if (this.gameOver || this.revealed[row][col]) return;

    if (!this.flagged[row][col] && this.flags >= this.mineCount) {
      this.statusEl.textContent = "旗子数量已经达到地雷总数";
      return;
    }

    this.flagged[row][col] = !this.flagged[row][col];
    this.flags += this.flagged[row][col] ? 1 : -1;

    const cell = this.getCell(row, col);
    cell.classList.toggle("flagged", this.flagged[row][col]);
    cell.textContent = this.flagged[row][col] ? "🚩" : "";
    this.updateInfo();
  }

  reveal(row, col) {
    if (this.revealed[row][col] || this.flagged[row][col]) return;

    const queue = [[row, col]];
    while (queue.length > 0) {
      const [r, c] = queue.shift();
      if (this.revealed[r][c] || this.flagged[r][c]) continue;

      this.revealed[r][c] = true;
      this.revealedCount += 1;
      const cell = this.getCell(r, c);
      cell.classList.add("opened");
      cell.disabled = true;

      const count = this.counts[r][c];
      if (count > 0) {
        cell.textContent = String(count);
        cell.classList.add(`n${count}`);
      } else {
        for (const [nr, nc] of this.neighbors(r, c)) {
          if (!this.revealed[nr][nc] && !this.flagged[nr][nc] && !this.mines[nr][nc]) {
            queue.push([nr, nc]);
          }
        }
      }
    }
  }

  checkWin() {
    const safeTotal = this.rows * this.cols - this.mineCount;
    if (this.revealedCount === safeTotal) {
      this.endGame(true);
    }
  }

  endGame(win) {
    this.gameOver = true;
    clearInterval(this.timerId);
    this.elapsed = this.started ? Math.floor((Date.now() - this.startTime) / 1000) : this.elapsed;

    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const cell = this.getCell(r, c);
        if (this.mines[r][c]) {
          cell.textContent = "💣";
          cell.classList.add("mine");
        }
        if (this.flagged[r][c] && !this.mines[r][c]) {
          cell.classList.add("wrong-flag");
        }
        cell.disabled = true;
      }
    }

    if (win) {
      this.saveBestTime();
      this.statusEl.textContent = `🎉 胜利！用时 ${this.formatTime(this.elapsed)}`;
    } else {
      this.statusEl.textContent = "💥 游戏失败，踩到地雷了";
    }
    this.updateInfo();
  }

  saveBestTime() {
    const key = `minesweeper-best-${this.difficultyEl.value}`;
    const previous = Number(localStorage.getItem(key));
    if (!previous || this.elapsed < previous) {
      localStorage.setItem(key, String(this.elapsed));
    }
  }

  updateInfo() {
    this.mineLeftEl.textContent = String(this.mineCount - this.flags);
    this.timerEl.textContent = this.formatTime(this.elapsed);
    const key = `minesweeper-best-${this.difficultyEl.value}`;
    const best = Number(localStorage.getItem(key));
    this.bestTimeEl.textContent = best ? this.formatTime(best) : "--:--";
  }

  formatTime(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  getCell(row, col) {
    return this.boardEl.querySelector(`[data-row="${row}"][data-col="${col}"]`);
  }

  openHelp() {
    if (typeof this.helpDialog.showModal === "function") {
      this.helpDialog.showModal();
    } else {
      alert("左键/点击翻开，右键/长按插旗。第一次点击不会踩雷。");
    }
  }
}

window.addEventListener("DOMContentLoaded", () => new MinesweeperWeb());
