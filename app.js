'use strict';

import { boards } from './boards.js';
import { words } from './words.js';

// eating button element
const bite_music = document.createElement('audio');
bite_music.setAttribute(
  'src',
  'music/zapsplat_cartoon_bite_single_crunch_001_29121.mp3'
);

document.addEventListener('DOMContentLoaded', () => {
  const grid = document.querySelector('.grid');
  const scoreDisplay = document.getElementById('score');
  const width = 28; //28 x 28 = 784 squares
  let score = 0;
  let currentLevel = 0;
  let pacmanCurrentIndex = undefined;
  let word = '';
  let ghosts = [];
  let squares = [];
  const word_display = document.getElementById('display-word');
  const playButton = document.getElementById('play-button');
  // 'initial','playing','lost','won'
  let gameState = 'initial';

  // layout of grid and what is in the squares
  // see boards.js for board layouts
  let layout = [];
  let allLevels = [];
  let maxLives = 3;
  let lives = maxLives;
  const livesOnScreen = document.getElementById('lives');
  livesOnScreen.textContent = maxLives;
  let posibleLetterSpaces = [];
  let wordWritten = '';
  const levelNum = document.getElementById('level-number');

  // Create our Ghost template
  class Ghost {
    constructor(className, startIndex, speed) {
      this.className = className;
      this.startIndex = startIndex;
      this.speed = speed;
      this.currentIndex = startIndex;
      this.timerId = NaN;
      this.isScared = false;
      this.justAtTop = false;
      this.justAtBottom = false;
    }
  }

  class Level {
    // first level  level 1 should have levelNumber of 1 and will use boards[0]
    constructor(
      levelNumber,
      boardLayoutNumber,
      levelWord,
      characterPosition,
      fourGhostPositions
    ) {
      this.levelNumber = levelNumber;
      // I split out levelNumber and board to be easier to test different levels but only have 1 level so far
      this.board = boardLayoutNumber;
      this.word = levelWord;
      this.characterPosition = characterPosition;
      // an array of positions, ie [123,124,125,126]
      this.fourGhostPositions = fourGhostPositions;
    }
  }

  setupInitialThings();
  function setupInitialThings() {
    // document.addEventListener('keydown', function (event) {
    //   console.log(event.code);
    // });
    document.addEventListener('keyup', movePacman);
    playButton.addEventListener('click', playButtonClicked);

    planLevels();
    createLevel(1, allLevels[0].word);
    dontAllowPlay();
  }

  // plan out all levels here

  function planLevels() {
    let wordLevel;

    wordLevel = randomLevelWord(1);
    let level1 = new Level(1, 0, wordLevel, 518, [376, 404, 379, 407]);
    allLevels.push(level1);

    wordLevel = randomLevelWord(2);
    let level2 = new Level(2, 1, wordLevel, 518, [349, 377, 352, 380]);
    allLevels.push(level2);

    wordLevel = randomLevelWord(3);
    let level3 = new Level(3, 2, wordLevel, 518, [376, 404, 379, 407]);
    allLevels.push(level3);

    wordLevel = randomLevelWord(4);
    let level4 = new Level(4, 1, wordLevel, 518, [349, 377, 352, 380]);
    allLevels.push(level4);

    // enable 300 more levels before the game breaks
    let tempLevel = 4;
    for (let i = 0; i < 100; i++) {
      let ghostPositionsForBoard0 = [376, 404, 379, 407];
      let ghostPositionsForBoard1 = [349, 377, 352, 380];
      let ghostPositionsForBoard2 = [376, 404, 379, 407];

      let randomList = Math.floor(Math.random() * 4) + 1; // 1, 2, 3, or 4
      wordLevel = randomLevelWord(randomList);
      tempLevel++;
      let newLevelA = new Level(
        tempLevel,
        0,
        wordLevel,
        518,
        ghostPositionsForBoard0
      );

      randomList = Math.floor(Math.random() * 4) + 1; // 1, 2, 3, or 4
      wordLevel = randomLevelWord(randomList);
      tempLevel++;
      let newLevelB = new Level(
        tempLevel,
        1,
        wordLevel,
        518,
        ghostPositionsForBoard1
      );

      randomList = Math.floor(Math.random() * 4) + 1; // 1, 2, 3, or 4
      wordLevel = randomLevelWord(randomList);
      tempLevel++;
      let newLevelC = new Level(
        tempLevel,
        2,
        wordLevel,
        518,
        ghostPositionsForBoard2
      );

      allLevels.push(newLevelA);
      allLevels.push(newLevelB);
      allLevels.push(newLevelC);
    }
  }

  // get random word for specific level

  function randomLevelWord(lvl) {
    let n, word;
    switch (lvl) {
      case 1:
        n = Math.floor(Math.random() * words.wordList.list1.length);
        word = words.wordList.list1[n];
        break;
      case 2:
        n = Math.floor(Math.random() * words.wordList.list2.length);
        word = words.wordList.list2[n];
        break;
      case 3:
        n = Math.floor(Math.random() * words.wordList.list3.length);
        word = words.wordList.list3[n];
        break;
      case 4:
        n = Math.floor(Math.random() * words.wordList.list3.length);
        word = words.wordList.list4[n];
        break;
      default:
        break;
    }
    return word.toUpperCase();
  }

  function playButtonClicked() {
    switch (gameState) {
      case 'initial':
        gameState = 'playing';
        // allow gameplay of first level after load
        allowPlay();
        // hide this button, don't let them click it
        playButton.classList.add('hidden');
        break;
      case 'playing':
        // do nothing: you shouldn't be able to click this while playing
        break;
      case 'lost':
        // you clicked on 'play again', so start game over
        removeAnimations();
        lives = maxLives;
        livesOnScreen.textContent = lives;
        currentLevel = 0;
        letterIndex = 0;
        score = 0;
        scoreDisplay.textContent = score;
        levelNum.textContent = currentLevel + 1;
        createLevel(currentLevel + 1, allLevels[currentLevel].word);

        gameState = 'playing';
        allowPlay();
        //hide playbuttton
        playButton.classList.add('hidden');
        break;
      case 'won':
        // you clicked on 'next level', so load the next level
        removeAnimations();
        currentLevel++;
        ghosts.forEach((ghost) => ghostLevelSpeed(ghost));
        letterIndex = 0;
        createLevel(currentLevel + 1, allLevels[currentLevel].word);
        levelNum.textContent = currentLevel + 1;
        scoreDisplay.textContent = score;
        gameState = 'playing';
        allowPlay();
        //hide button because you'll be playing now
        playButton.classList.add('hidden');
        break;
    }
  }

  // Allow play to start
  // - allow chracter and ghosts to move
  function allowPlay() {
    document.addEventListener('keyup', movePacman);
    tellGhostsToMove();
  }

  // - don't allow chracter or ghosts to move
  function dontAllowPlay() {
    document.removeEventListener('keyup', movePacman);
    ghosts.forEach((ghost) => clearInterval(ghost.timerId));
  }

  // draw the grid and render it
  function createBoard() {
    squares = [];
    posibleLetterSpaces = [];
    for (let i = 0; i < layout.length; i++) {
      const square = document.createElement('div');
      grid.appendChild(square);
      squares.push(square);

      // add layout to the board
      if (layout[i] === 0) {
        squares[i].classList.add('pac-dot');
      } else if (layout[i] === 1) {
        squares[i].classList.add('wall');
      } else if (layout[i] === 2) {
        squares[i].classList.add('ghost-lair');
      } else if (layout[i] === 3) {
        squares[i].classList.add('power-pellet');
      } else if (layout[i] === 5) {
        posibleLetterSpaces.push(i);
      }
    }
  }

  function putLettersOnGrid(wordToSpell) {
    let pastLetterSpaces = [];
    for (let i = 0; i < wordToSpell.length; i++) {
      let randomLetterIndex = Math.floor(
        Math.random() * posibleLetterSpaces.length
      );
      while (pastLetterSpaces.indexOf(randomLetterIndex) !== -1) {
        randomLetterIndex = Math.floor(
          Math.random() * posibleLetterSpaces.length
        );
      }

      pastLetterSpaces.push(randomLetterIndex);
      // console.log(posibleLetterSpaces)

      squares[posibleLetterSpaces[randomLetterIndex]].classList.add('letter');
      squares[posibleLetterSpaces[randomLetterIndex]].textContent =
        wordToSpell[i];
    }

    // fill in the rest of possible letter spaces with pac dots
    for (let i = 0; i < posibleLetterSpaces.length; i++) {
      if (squares[posibleLetterSpaces[i]].textContent == '') {
        squares[posibleLetterSpaces[i]].classList.add('pac-dot');
      }
    }
  }

  function deleteDivsInGrid() {
    while (grid.firstChild) {
      grid.removeChild(grid.lastChild);
    }
  }

  function resetGhostPositions() {
    // for (let i = 0; i < ghosts.length; i++) {
    grid.querySelectorAll('.ghost').forEach((thisDiv) => {
      thisDiv.classList.remove('ghost');
      if (thisDiv.classList.contains('scared-ghost')) {
        thisDiv.classList.remove('scared-ghost');
      }
    });
    grid.querySelector('.blinky').classList.remove('blinky');
    grid.querySelector('.pinky').classList.remove('pinky');
    grid.querySelector('.inky').classList.remove('inky');
    grid.querySelector('.clyde').classList.remove('clyde');

    // ghosts[i].currentIndex;
    // ghosts[i].startIndex = allLevels[currentLevel].fourGhostPositions[i];
    // }

    deleteGhosts();
    // determine starting position of ghosts

    //   change ghosts[  ..stuff.. ] because this has starting positions in it
    // ghost placement for initial board

    ghosts = [
      new Ghost('blinky', allLevels[currentLevel].fourGhostPositions[0], 250),
      new Ghost('pinky', allLevels[currentLevel].fourGhostPositions[1], 400),
      new Ghost('inky', allLevels[currentLevel].fourGhostPositions[2], 300),
      new Ghost('clyde', allLevels[currentLevel].fourGhostPositions[3], 500),
    ];
    drawGhostsOnGrid();
  }

  function resetPositionsOnly() {
    // setCharacterPosition(
    //   allLevels[levelIndex - 1].characterPosition,
    //   levelIndex
    // );
    grid.querySelector('.pac-man').classList.remove('pac-man');
    pacmanCurrentIndex = allLevels[currentLevel].characterPosition;
    setCharacterPosition(pacmanCurrentIndex, currentLevel);

    resetGhostPositions();
  }

  // currentLevel++; before calling createLevel(currentLevel)
  // Replace old level and characters with new ones
  function createLevel(levelIndex, wordToSpell) {
    deleteDivsInGrid();
    layout = boards[allLevels[levelIndex - 1].board];

    //takes board array and colors in squares
    createBoard();

    // determine starting position of character
    setCharacterPosition(
      allLevels[levelIndex - 1].characterPosition,
      levelIndex
    );

    deleteGhosts();
    // determine starting position of ghosts

    //   change ghosts[  ..stuff.. ] because this has starting positions in it
    // ghost placement for initial board
    ghosts = [
      new Ghost('blinky', allLevels[levelIndex - 1].fourGhostPositions[0], 250),
      new Ghost('pinky', allLevels[levelIndex - 1].fourGhostPositions[1], 400),
      new Ghost('inky', allLevels[levelIndex - 1].fourGhostPositions[2], 300),
      new Ghost('clyde', allLevels[levelIndex - 1].fourGhostPositions[3], 500),
    ];
    drawGhostsOnGrid();
    // tellGhostsToMove();

    removeLetterSquares();
    createWord(wordToSpell);
    putLettersOnGrid(wordToSpell);
  }

  function removeLetterSquares() {
    while (word_display.firstChild) {
      word_display.removeChild(word_display.lastChild);
    }
  }

  // Creating word that needs to be found
  function createWord(aWord) {
    word = aWord;
    for (let i = 0; i < word.length; i++) {
      const square = document.createElement('div');
      square.className = 'character';
      word_display.appendChild(square);
    }
    const fullWord = document.getElementById('full-word');
    fullWord.textContent = word;
  }

  // Starting position of pac-man
  function setCharacterPosition(startingIndex, levelIndex) {
    pacmanCurrentIndex = startingIndex;
    squares[pacmanCurrentIndex].classList.add('pac-man');
  }

  // Move pac-man
  function movePacman(e) {
    squares[pacmanCurrentIndex].classList.remove('pac-man');

    switch (e.keyCode) {
      // left arrow key moves left
      case 37:
        if (
          pacmanCurrentIndex % width !== 0 &&
          !squares[pacmanCurrentIndex - 1].classList.contains('wall') &&
          !squares[pacmanCurrentIndex - 1].classList.contains('ghost-lair')
        ) {
          pacmanCurrentIndex -= 1;
        }
        // Check if pacman is in the left exit
        if (pacmanCurrentIndex - 1 === 391) {
          pacmanCurrentIndex = 419;
        }

        break;
      // up arrow moves up
      case 38:
        if (
          pacmanCurrentIndex - width >= 0 &&
          !squares[pacmanCurrentIndex - width].classList.contains('wall') &&
          !squares[pacmanCurrentIndex - width].classList.contains('ghost-lair')
        ) {
          pacmanCurrentIndex -= width;
        }

        // Check if pacman is in the top exit
        if (pacmanCurrentIndex === 14) {
          pacmanCurrentIndex = 770;
        }

        break;
      // right arrow moves right
      case 39:
        if (
          pacmanCurrentIndex % width < width - 1 &&
          !squares[pacmanCurrentIndex + 1].classList.contains('wall') &&
          !squares[pacmanCurrentIndex + 1].classList.contains('ghost-lair')
        ) {
          pacmanCurrentIndex += 1;
        }

        // Check if pacman is in the right exit
        if (pacmanCurrentIndex + 1 === 420) {
          pacmanCurrentIndex = 392;
        }

        break;
      // down arrow moves down
      case 40:
        if (
          pacmanCurrentIndex + width < width * width &&
          !squares[pacmanCurrentIndex + width].classList.contains('wall') &&
          !squares[pacmanCurrentIndex + width].classList.contains('ghost-lair')
        ) {
          pacmanCurrentIndex += width;
        }

        // Check if pacman is in the bottom exit
        if (pacmanCurrentIndex === 770) {
          pacmanCurrentIndex = 14;
        }

        break;
    }

    squares[pacmanCurrentIndex].classList.add('pac-man');

    pacDotEaten();
    powerPelletEaten();
    letterEaten();
    checkForWin();
    checkGameOver();
  }

  // What happens when pac-man eats a pac-dot
  function pacDotEaten() {
    if (squares[pacmanCurrentIndex].classList.contains('pac-dot')) {
      bite_music.currentTime = 0;
      bite_music.play();
      score++;
      scoreDisplay.textContent = score;
      squares[pacmanCurrentIndex].classList.remove('pac-dot');
    }
  }

  function letterEaten() {
    const lettersOnBoard = document.querySelectorAll('.letter');
    const curr_letters = document.querySelectorAll('.character');
    if (squares[pacmanCurrentIndex].classList.contains('letter')) {
      let correctLetter = word[letterIndex];
      let letterYouAte = squares[pacmanCurrentIndex].textContent;
      // if letter is correct letter ....
      if (letterYouAte == correctLetter) {
        curr_letters[letterIndex].textContent =
          squares[pacmanCurrentIndex].textContent;
        letterIndex++;
        squares[pacmanCurrentIndex].classList.remove('letter');
        squares[pacmanCurrentIndex].textContent = '';
        score += 10;

        // else -> remove life and reset char and enemies
      } else {
        dontAllowPlay();
        lives--;
        livesOnScreen.textContent = lives;
        playAnimation('WRONG LETTER');
        resetPositionsOnly();
        allowPlay();
        checkGameOver();
      }
    }
  }

  // What happens when you eat a power-pellet
  let letterIndex = 0;
  function powerPelletEaten() {
    const curr_letters = document.querySelectorAll('.character');
    if (
      squares[pacmanCurrentIndex].classList.contains('power-pellet') &&
      letterIndex < word.length
    ) {
      score += 10;
      ghosts.forEach((ghost) => (ghost.isScared = true));
      setTimeout(unScareGhosts, 10000);
      squares[pacmanCurrentIndex].classList.remove('power-pellet');
      // curr_letters[letterIndex].textContent = word[letterIndex];
      // letterIndex += 1;
      // return letterIndex;
    }
  }

  // Make the ghosts stop appearing as aquamarine
  function unScareGhosts() {
    ghosts.forEach((ghost) => (ghost.isScared = false));
  }

  function deleteGhosts() {
    ghosts = [];
  }

  function drawGhostsOnGrid() {
    // Draw my ghosts onto the grid
    ghosts.forEach((ghost) => {
      squares[ghost.currentIndex].classList.add(ghost.className);
      squares[ghost.currentIndex].classList.add('ghost');
    });
  }

  function tellGhostsToMove() {
    // Move the ghosts randomly
    ghosts.forEach((ghost) => moveGhost(ghost));
  }

  // let blinkyJustatBottom = false;
  // let blinkyJustatTop = false;
  // Write the function to move the ghosts
  function moveGhost(ghost) {
    const directions = [-1, +1, width, -width];
    let direction = directions[Math.floor(Math.random() * directions.length)];

    ghost.timerId = setInterval(function () {
      // Check for top and bottom teleportation
      // check if at the top
      if (ghost.currentIndex === 14 && !ghost.justAtBottom) {
        ghost.justAtTop = true;
        squares[ghost.currentIndex].classList.remove(
          ghost.className,
          'ghost',
          'scared-ghost'
        );
        ghost.currentIndex = 770;
        squares[ghost.currentIndex].classList.add(ghost.className, 'ghost');
        // check if at the bottom
      } else if (ghost.currentIndex === 770 && !ghost.justAtTop) {
        ghost.justAtBottom = true;
        squares[ghost.currentIndex].classList.remove(
          ghost.className,
          'ghost',
          'scared-ghost'
        );
        ghost.currentIndex = 14;
        squares[ghost.currentIndex].classList.add(ghost.className, 'ghost');
        // if not at top or bottom
      } else {
        // If the square your ghost is going to go in does NOT contain a wall and a ghost, you can go there
        ghost.justAtBottom = false;
        ghost.justAtTop = false;
        if (
          !squares[ghost.currentIndex + direction].classList.contains('wall') &&
          !squares[ghost.currentIndex + direction].classList.contains('ghost')
        ) {
          // you can go here
          // remove all ghost related classes
          squares[ghost.currentIndex].classList.remove(
            ghost.className,
            'ghost',
            'scared-ghost'
          );
          // Change the currentIndex to the new safe sqware
          ghost.currentIndex += direction;
          // redraw the ghost in the new safe space
          squares[ghost.currentIndex].classList.add(ghost.className, 'ghost');

          // else find a new direction to try
        } else {
          direction = directions[Math.floor(Math.random() * directions.length)];
        }

        // if the ghost is currently scared
        if (ghost.isScared) {
          squares[ghost.currentIndex].classList.add('scared-ghost');
        }
      }

      // if the ghost is scared and pacman runs into it
      if (
        ghost.isScared &&
        squares[ghost.currentIndex].classList.contains('pac-man')
      ) {
        squares[ghost.currentIndex].classList.remove(
          ghost.className,
          'ghost',
          'scared-ghost'
        );
        ghost.currentIndex = ghost.startIndex;
        score += 100;
        squares[ghost.currentIndex].classList.add(ghost.className, 'ghost');
      }

      checkGameOver();
    }, ghost.speed);
  }

  // Change ghost speed depending on level

  function ghostLevelSpeed(ghost) {
    ghost.speed += 500;
  }

  // Check for game over
  function checkGameOver() {
    if (
      squares[pacmanCurrentIndex].classList.contains('ghost') &&
      !squares[pacmanCurrentIndex].classList.contains('scared-ghost')
    ) {
      dontAllowPlay();
      lives--;
      livesOnScreen.textContent = lives;
      if (lives > 0) {
        resetPositionsOnly();
        allowPlay();
        playAnimation('GHOST HIT');
        // else you lost the game, you'll have to start over from the beginning
      } else {
        gameState = 'lost';
        playButton.classList.remove('hidden');
        playButton.textContent = 'PLAY AGAIN';
        removeAnimations();
        playAnimation('YOU LOST');
      }
    }

    if (lives <= 0) {
      dontAllowPlay();
      gameState = 'lost';
      playButton.classList.remove('hidden');
      playButton.textContent = 'PLAY AGAIN';
      removeAnimations();
      playAnimation('YOU LOST');
    }
  }

  // Check for a win
  function checkForWin() {
    if (letterIndex === word.length) {
      wordWritten = '';
      for (let i = 0; i < word_display.children.length; i++) {
        wordWritten += word_display.childNodes[i].textContent;
      }

      if (wordWritten == word) {
        gameState = 'won';

        dontAllowPlay();
        document.removeEventListener('keyup', movePacman);
        playButton.classList.remove('hidden');
        playButton.textContent = 'NEXT LEVEL';
        playAnimation('YOU WIN!');
      }
    }
  }
});

// ******** MUSIC SECTION **********

let musicPlaying = false;
const music = document.getElementById('audioplayer');
// autoplay sound
window.addEventListener('click', startPlayingMusic);

function startPlayingMusic() {
  music.volume = 0.5;
  music.play();
  musicPlaying = true;
  window.removeEventListener('click', startPlayingMusic);
}

const musicToggle = document.getElementById('music-toggle-container');
const crossOut = document.getElementById('cross-out-line');
// window.removeEventListener('click',toggleMusic)
musicToggle.addEventListener('click', toggleMusic);

function toggleMusic() {
  window.removeEventListener('click', startPlayingMusic);

  if (!musicPlaying) {
    musicPlaying = true;
    music.play();
    // show no cross out line
    crossOut.classList.add('hidden');
  } else {
    musicPlaying = false;
    music.pause();
    // show the cross out line
    crossOut.classList.remove('hidden');
  }
}

// ******** END OF MUSIC SECTION **********

// ******** CSS ANIMATIONS SECTION ********

const appearingMessage = document.querySelector('.appearing-message');

function playAnimation(message) {
  if (message == 'YOU WIN!') {
    removeAnimations();
    appearingMessage.textContent = 'YOU WIN!';
    appearingMessage.classList.add('won-animation');
  } else if (message == 'YOU LOST') {
    removeAnimations();
    appearingMessage.textContent = 'TRY AGAIN';
    appearingMessage.classList.add('lost-animation');
  } else if (message == 'WRONG LETTER') {
    removeAnimations();
    appearingMessage.textContent = 'Oops! Wrong letter';
    appearingMessage.classList.add('wrong-letter-animation');
  } else if (message == 'GHOST HIT') {
    removeAnimations();
    appearingMessage.textContent = 'Hit by a ghost!';
    appearingMessage.classList.add('ghost-hit-animation');
  }
}

appearingMessage.addEventListener('animationend', removeAnimations);
function removeAnimations() {
  appearingMessage.classList.remove('won-animation');
  appearingMessage.classList.remove('lost-animation');
  appearingMessage.classList.remove('wrong-letter-animation');
  appearingMessage.classList.remove('ghost-hit-animation');
}

function endWonAnimation() {
  appearingMessage.classList.remove('won-animation');
}

// ******** END OF CSS ANIMATIONS SECTION ********

// ********* disable arrow keys making the browser window scroll *********
window.addEventListener(
  'keydown',
  function (e) {
    if (
      ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].indexOf(e.code) > -1
    ) {
      e.preventDefault();
    }
  },
  false
);
