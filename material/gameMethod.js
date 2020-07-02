module.exports = {
  animateArray: [],
  play: function (player, row, col) {
    this.animateArray = [];
    this.queue = [];
    this.set = this.generateEmptySet();
    if (this.gameMatrix[row][col].player !== player) {
      throw new Error('Invalid move');
    }
    if (!this.valid(row, col)) {
      throw new Error('Invalid location');
    }
    if (player !== this.phase) {
      throw new Error('Not your turn');
    }
    this.gameMatrix[row][col].dot += 1;
    // console.log(this.gameMatrix[row][col]);
    if (this.gameMatrix[row][col].dot >= 4) {
      this.explode([{ row, col }], player);
    }
    this.calculateStatus();
    let status = this.status;
    status.forEach((s) => {
      let index = this.remainPlayers.indexOf(s.player);
      if (index >= 0 && s.dots === 0) this.remainPlayers.splice(index, 1);
    });
    if (this.remainPlayers.length === 1) {
      console.log('When rpl = 1: ', this.remainPlayers[0]);
      return { winner: this.remainPlayers[0] };
    }
    console.log('Remain: ', this.remainPlayers);
    this.phase = (this.phase + 1) % this.players;
    if (this.phase == 0) {
      this.turn++;
    }
    while (this.remainPlayers.indexOf(this.phase) < 0) {
      this.phase = (this.phase + 1) % this.players;
      if (this.phase == 0) {
        this.turn++;
      }
    }
    return { winner: null };
  },
  createSquareMatrix: function () {
    let defaultMap = [];
    for (let i = 0; i < 10; i++) {
      let row = [];
      for (let j = 0; j < 10; j++) {
        row.push({ dot: 0, player: null });
      }
      defaultMap.push(row);
    }
    defaultMap[2][2] = { dot: 3, player: 0 };
    defaultMap[2][7] = { dot: 3, player: 1 };
    defaultMap[7][2] = { dot: 3, player: 2 };
    defaultMap[7][7] = { dot: 3, player: 3 };

    //Test exploding
    // defaultMap[3][4] = { dot: 3, player: 0 };
    // defaultMap[4][4] = { dot: 3, player: 1 };
    // for (let i = 5; i < 9; i++) {
    //   for (let j = 2; j < 6; j++) {
    //     defaultMap[i][j] = { dot: 3, player: 1 };
    //   }
    // }
    // defaultMap[2][1] = { dot: 1, player: 2 };
    // defaultMap[1][9] = { dot: 1, player: 3 };
    //Test winner
    // defaultMap[5][6] = { dot: 1, player: 2 };
    // defaultMap[4][5] = { dot: 1, player: 3 };
    return defaultMap;
  },
  valid: function (row, col) {
    if (!this.gameMatrix) return false;
    let height = this.gameMatrix.length;
    let width = this.gameMatrix[0].length;
    if (
      0 <= row &&
      row < height &&
      0 <= col &&
      col < width &&
      this.gameMatrix[row][col].dot >= 0
    ) {
      return true;
    }
    return false;
  },
  explode: function (arr, player) {
    let location = arr;
    this.set = this.generateEmptySet();
    for (let el of arr) {
      let row = el.row;
      let col = el.col;
      if (this.gameMatrix[row][col].dot >= 4) {
        this.gameMatrix[row][col].dot -= 4;
        if (this.gameMatrix[row][col].dot == 0) {
          this.gameMatrix[row][col].player = null;
        }
        if (this.gameMatrix[row][col].dot >= 4) {
          if (!this.set[row * 10 + col]) {
            this.queue.unshift({ row, col });
            this.set[row * 10 + col] = true;
          }
        }
      }
    }
    for (let el of arr) {
      let row = el.row;
      let col = el.col;
      for (let r = row - 1; r < row + 2; r += 2) {
        if (this.valid(r, col)) {
          this.gameMatrix[r][col].dot += 1;
          this.gameMatrix[r][col].player = player;
          if (this.gameMatrix[r][col].dot >= 4) {
            if (!this.set[r * 10 + col]) {
              this.queue.unshift({ row: r, col });
              this.set[r * 10 + col] = true;
            }
          }
        }
      }
      for (let c = col - 1; c < col + 2; c += 2) {
        if (this.valid(row, c)) {
          this.gameMatrix[row][c].dot += 1;
          this.gameMatrix[row][c].player = player;
          if (this.gameMatrix[row][c].dot >= 4) {
            if (!this.set[row * 10 + c]) {
              this.queue.unshift({ row, col: c });
              this.set[row * 10 + c] = true;
            }
          }
        }
      }
    }
    let result = {
      gameMatrix: JSON.parse(JSON.stringify(this.gameMatrix)),
      width: this.width,
      height: this.height,
    };
    this.animateArray.push({ location, result });
    while (this.queue.length > 0) {
      let currQueue = [...this.queue];
      this.queue = [];
      this.explode(currQueue, player);
    }
  },
  calculateStatus: function () {
    this.status = [];
    for (let p = 0; p < this.players; p++) {
      this.status.push({
        player: p,
        dots: 0,
        pieces: 0,
      });
    }
    for (let i = 0; i < this.height; i++) {
      for (let j = 0; j < this.width; j++) {
        if (this.gameMatrix[i][j].player != null) {
          this.status[this.gameMatrix[i][j].player].pieces += 1;
          this.status[this.gameMatrix[i][j].player].dots += this.gameMatrix[i][
            j
          ].dot;
        }
      }
    }
  },
  generateEmptySet() {
    let set = [];
    for (let i = 0; i < 100; i++) {
      set.push(false);
    }
    return set;
  },
};
