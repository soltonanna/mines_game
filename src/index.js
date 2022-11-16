const welcomeBlock = document.querySelector('#welcome');
const startButton = document.querySelector('#start_game');

const gameArea = document.querySelector('#game_area');
const gameMines = document.querySelector('#game_area__mines');
const overlay = document.querySelector('#game_area__overlay');

const gameOver = document.querySelector('#game_over');
const gameOverInfo = document.querySelector('#game_over__finish_text');
const startAgain = document.querySelector('#game_over__start_again');

const gameAreaMenu = document.querySelector('#game_area__menu');
// const gameAreaTimer = document.querySelector('#game_area__menu__timer');
// const gameAreaFlags = document.querySelector('#game_area__menu__flags');
const changeOptButton = document.querySelector('#game_area__menu__change_opt');

const seRowsDefault = document.getElementById('row');
const setColumnsDefault = document.getElementById('column');
const setMinesDefault = document.getElementById('mines_count');

const hidden = 0;
const opened = 1;
const unknown = 2;
const checked = 3;

let matrix = null;
let elements = null;
let states = null;
let firstClicked = false;

let openedCount = 0;
const mine = 9;
const empty = 0;

let win = 0;
let loose = 0;

const options = {
  minesCount: null,
  rows: null,
  cols: null,
};

const defaultValuesHTML = {
  rows: 10,
  column: 10,
  miniesDef(rowsDef, columnDef) {
    return Math.floor((this.rows * this.column) / 4);
  },
  miniesMax(rowsDef, columnDef) {
    return Math.floor((this.rows * this.column) - 9);
  },
  miniesMin(rowsDef, columnDef) {
    return Math.floor((this.rows * this.column) / 12);
  },
};

/* Generate random number in range [0, n) */
const rand = (n) => Math.trunc(Math.random() * n);

const setAttributes = (el, attrs) => {
  for (const key in attrs) {
    el.setAttribute(key, attrs[key]);
  }
};

const showFlagsCount = (i, j) => {
  // TODO
};
/** Set the flag or question symbols */
const setFlag = (i, j) => {
  if (!firstClicked) return;
  if (states[i][j] === hidden) {
    states[i][j] = checked;
    elements[i][j].classList.add('checked');
    elements[i][j].classList.remove('unknown');
    elements[i][j].innerHTML = '⚑';
    showFlagsCount(i, j);
  } else if (states[i][j] === checked) {
    states[i][j] = unknown;
    elements[i][j].classList.remove('checked');
    elements[i][j].classList.add('unknown');
    elements[i][j].innerHTML = '?';
  } else {
    states[i][j] = hidden;
    elements[i][j].innerHTML = '.';
    elements[i][j].classList.remove('unknown');
  }
};

/** Right click for set Flag or Question symbols */
const rightClickHandler = (i, j) => (event) => {
  event.preventDefault();
  setFlag(i, j);
  return false;
};

const aroundOf = (m, i, j, callback) => {
  if (i > 0) {
    if (j > 0) {
      callback(m[i - 1][j - 1], i - 1, j - 1, m);
    }
    callback(m[i - 1][j], i - 1, j, m);
    if (j < m[i].length - 1) {
      callback(m[i - 1][j + 1], i - 1, j + 1, m);
    }
  }
  if (j < m[i].length - 1) {
    callback(m[i][j + 1], i, j + 1, m);
  }
  if (i < m.length - 1) {
    if (j < m[i].length - 1) {
      callback(m[i + 1][j + 1], i + 1, j + 1, m);
    }
    callback(m[i + 1][j], i + 1, j, m);
    if (j > 0) {
      callback(m[i + 1][j - 1], i + 1, j - 1, m);
    }
  }
  if (j > 0) {
    callback(m[i][j - 1], i, j - 1, m);
  }
};

const initMines = (i, j) => {
  let c = 0;
  while (c < options.minesCount) {
    const x = rand(options.cols);
    const y = rand(options.rows);
    if (matrix[i][j] === mine || (y < i + 2 && y > i - 2 && x < j + 2 && x > j - 2)) {
      continue;
    }
    c++;
    matrix[y][x] = mine;
  }
};

const countMines = (i, j) => {
  let count = 0;
  aroundOf(matrix, i, j, (v) => {
    if (v === mine) {
      count++;
    }
  });
  return count;
};

const countFlags = (i, j) => {
  let count = 0;
  aroundOf(states, i, j, (v) => {
    if (v === checked) {
      count++;
    }
  });
  return count;
};

const initializeMinesCounts = () => {
  for (let i = 0; i < matrix.length; ++i) {
    for (let j = 0; j < matrix[i].length; ++j) {
      if (matrix[i][j] !== mine) {
        matrix[i][j] = countMines(i, j);
      }
    }
  }
};

const initializeMatrix = (i, j) => {
  initMines(i, j);
  initializeMinesCounts();
  // console.log(matrix);
};

const gameOverOrWin = () => {
  gameOver.classList.remove('hidden');
  overlay.classList.remove('hidden');
  gameAreaMenu.classList.add('hidden');
  if (loose === 1) {
    gameOverInfo.innerHTML = 'Game Over 😒';
  }
  if (win === 1) {
    gameOverInfo.innerHTML = 'Wow! You Win 🤩';
  }
};

/** Set symbols for mine or the numbers */
const getSymbol = (v) => (v === mine ? '*' : v);

const clickOnMine = (i, j) => {
  for (let i = 0; i < matrix.length; ++i) {
    for (let j = 0; j < matrix[i].length; ++j) {
      if (matrix[i][j] === mine) {
        elements[i][j].innerHTML = getSymbol(matrix[i][j]);
        states[i][j] = opened;
        elements[i][j].classList.add('open');
      }
      if (states[i][j] === checked) {
        if (matrix[i][j] === mine) {
          continue;
        } else {
          elements[i][j].classList.add('find_mine');
        }
      }
    }
  }

  loose = 1;
  win = 0;
};

const open = (i, j) => {
  if (states[i][j] !== opened) {
    states[i][j] = opened;
    elements[i][j].classList.add('open');
    /** Open around items of click item if there are not a mine */
    if (matrix[i][j] === empty) {
      openedCount++;
      aroundOf(matrix, i, j, (v, cI, cJ) => {
        if (states[cI][cJ] === hidden) {
          open(cI, cJ);
        }
      });
    }
    if (matrix[i][j] >= 1 && matrix[i][j] <= 8) {
      openedCount++;
      elements[i][j].classList.add(`color_${matrix[i][j]}`);
      elements[i][j].innerHTML = getSymbol(matrix[i][j]);
    }
    /** If find the mine, show all the mines of matrix and end the game */
    if (matrix[i][j] === mine) {
      elements[i][j].classList.add('find_mine');
      clickOnMine(i, j);
      gameOverOrWin();
    }
  } else if (states[i][j] === opened && matrix[i][j] === countFlags(i, j)) {
    aroundOf(matrix, i, j, (v, cI, cJ) => {
      if (states[cI][cJ] === hidden) {
        open(cI, cJ);
      }
    });
  }
  if (openedCount === options.rows * options.cols - options.minesCount) {
    win = 1; loose = 0;
    gameOverOrWin();
  }
};

/** Left click for open the items of matrix */
const clickHandler = (i, j) => function (event) {
  event.preventDefault();
  if (!firstClicked) {
    firstClicked = true;
    initializeMatrix(i, j);
  }
  open(i, j);
};

/** Draw the matrix on game area */
const drawMatrix = (mat) => {
  // const space = ' ';
  elements = [];
  for (let i = 0; i < mat.length; ++i) {
    const singleRow = document.createElement('div');
    singleRow.classList.add(`row_${[i]}`);
    const elementsRow = [];
    for (let j = 0; j < mat[i].length; ++j) {
      const singleItem = document.createElement('div');
      singleItem.classList.add(`single_item_${[j]}`);
      singleRow.append(singleItem);

      singleItem.addEventListener('click', clickHandler(i, j));
      singleItem.addEventListener('contextmenu', rightClickHandler(i, j), false);

      elementsRow.push(singleItem);
    }
    elements.push(elementsRow);
    gameMines.append(singleRow);
  }
};

/** Generate the simple matrix */
const createInitialMatrixWithValues = (row, column, defaultValue) => {
  const mat = [];
  for (let i = 0; i < row; ++i) {
    const row = [];
    for (let j = 0; j < column; ++j) {
      row.push(defaultValue);
    }
    mat.push(row);
  }
  return mat;
};

/** Add the default and min values to option page's inputs */
const setDefaultValues = () => {
  setAttributes(setMinesDefault, {
    value: defaultValuesHTML.miniesDef(),
    max: defaultValuesHTML.miniesMax(),
    min: defaultValuesHTML.miniesMin(),
  });
  seRowsDefault.setAttribute('value', defaultValuesHTML.rows);
  setColumnsDefault.setAttribute('value', defaultValuesHTML.column);
};

/** Start game after click on 'Start game' button of main page */
const start = (e) => {
  e.preventDefault();
  openedCount = 0;
  welcomeBlock.classList.add('hidden');
  gameArea.classList.remove('hidden');

  options.rows = parseInt(document.getElementById('row').value, 10);
  options.cols = parseInt(document.getElementById('column').value, 10);
  options.minesCount = parseInt(document.getElementById('mines_count').value, 10);

  matrix = createInitialMatrixWithValues(options.rows, options.cols, 0);
  states = createInitialMatrixWithValues(options.rows, options.cols, hidden);
  drawMatrix(matrix);
};

/** Back to the main page after click on 'Change Options' button */
const openOptions = (e) => {
  e.preventDefault();
  openedCount = 0;
  firstClicked = false;
  gameArea.classList.add('hidden');
  gameOver.classList.add('hidden');
  overlay.classList.add('hidden');
  gameAreaMenu.classList.remove('hidden');
  welcomeBlock.classList.remove('hidden');
  gameMines.innerHTML = '';
};

function main() {
  setDefaultValues();
  startButton.addEventListener('click', start);
  startAgain.addEventListener('click', openOptions);
  changeOptButton.addEventListener('click', openOptions);
}

main();
