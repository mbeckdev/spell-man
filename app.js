'use strict';

import { boards } from './boards.js';

// eating button element
const bite_music = document.createElement('audio');
bite_music.setAttribute(
  'src',
  'music/zapsplat_cartoon_bite_single_crunch_001_29121.mp3'
);

// autoplay sound
window.addEventListener('click', () => {
  document.getElementById('audioplayer').play();
});

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

  // Create our Ghost template
  class Ghost {
    constructor(className, startIndex, speed) {
      this.className = className;
      this.startIndex = startIndex;
      this.speed = speed;
      this.currentIndex = startIndex;
      this.timerId = NaN;
      this.isScared = false;
    }
  }

  setupInitialThings();
  function setupInitialThings() {
    // document.addEventListener('keydown', function (event) {
    //   console.log(event.code);
    // });
    document.addEventListener('keyup', movePacman);
    playButton.addEventListener('click', playButtonClicked);

    createLevel(0, 'THAT');
    dontAllowPlay();
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
        currentLevel = 0;
        letterIndex = 0;
        createLevel(currentLevel, 'CHAR');

        gameState = 'playing';
        allowPlay();
        //hide playbuttton
        playButton.classList.add('hidden');
        break;
      case 'won':
        // you clicked on 'next level', so load the next level
        currentLevel++;
        letterIndex = 0;
        createLevel(currentLevel, 'WIND');

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
      }
    }
  }

  function deleteDivsInGrid() {
    while (grid.firstChild) {
      grid.removeChild(grid.lastChild);
    }
  }

  // currentLevel++; before calling createLevel(currentLevel)
  // Replace old level and characters with new ones
  function createLevel(levelIndex, wordToSpell) {
    deleteDivsInGrid();
    layout = boards[levelIndex]; //board[0] = 'level 1' shown to the user
    createBoard(); //takes board array and colors in squares
    // determine starting position of character
    setCharacterPosition(490); //490 for initial character position on first board

    deleteGhosts();
    // determine starting position of ghosts

    //   change ghosts[  ..stuff.. ] because this has starting positions in it
    // ghost placement for initial board
    ghosts = [
      new Ghost('blinky', 348, 250),
      new Ghost('pinky', 376, 400),
      new Ghost('inky', 351, 300),
      new Ghost('clyde', 379, 500),
    ];
    drawGhostsOnGrid();
    // tellGhostsToMove();

    removeLetterSquares();
    createWord(wordToSpell);
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
      square.style.display = 'inline-block';
      square.style.width = '40px';
      square.style.height = '70px';
      square.style.color = 'rgb(212, 69, 69)';
      square.style.fontSize = '50px';
      square.style.border = '1px solid black';
      square.style.padding = '0px 2px';
      word_display.appendChild(square);
    }
  }

  // Starting position of pac-man
  function setCharacterPosition(startingIndex) {
    pacmanCurrentIndex = startingIndex;
    squares[pacmanCurrentIndex].classList.add('pac-man');
  }

  // Move pac-man
  function movePacman(e) {
    squares[pacmanCurrentIndex].classList.remove('pac-man');

    console.log(pacmanCurrentIndex);
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
        if (pacmanCurrentIndex - 1 === 363) {
          pacmanCurrentIndex = 391;
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
        if (pacmanCurrentIndex + 1 === 392) {
          pacmanCurrentIndex = 364;
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
        break;
    }

    squares[pacmanCurrentIndex].classList.add('pac-man');

    pacDotEaten();
    powerPelletEaten();
    checkGameOver();
    checkForWin();
  }

  // What happens when pac-man eats a pac-dot
  function pacDotEaten() {
    if (squares[pacmanCurrentIndex].classList.contains('pac-dot')) {
      bite_music.play();
      score++;
      scoreDisplay.textContent = score;
      squares[pacmanCurrentIndex].classList.remove('pac-dot');
    }
  }

  // What happens when you eat a power-pellet
  let letterIndex = 0;
  function powerPelletEaten() {
    const curr_letter = document.querySelectorAll('.character');
    if (
      squares[pacmanCurrentIndex].classList.contains('power-pellet') &&
      letterIndex < word.length
    ) {
      score += 10;
      ghosts.forEach((ghost) => (ghost.isScared = true));
      setTimeout(unScareGhosts, 10000);
      squares[pacmanCurrentIndex].classList.remove('power-pellet');
      curr_letter[letterIndex].textContent = word[letterIndex];
      letterIndex += 1;
      return letterIndex;
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

  // Write the function to move the ghosts
  function moveGhost(ghost) {
    const directions = [-1, +1, width, -width];
    let direction = directions[Math.floor(Math.random() * directions.length)];

    ghost.timerId = setInterval(function () {
      // If the square your ghost is going to go in does NOT contain a wall and a ghost, you can go there
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

  // Check for game over
  function checkGameOver() {
    if (
      squares[pacmanCurrentIndex].classList.contains('ghost') &&
      !squares[pacmanCurrentIndex].classList.contains('scared-ghost')
    ) {
      gameState = 'lost';
      dontAllowPlay();

      // setTimeout(function () {
      //   alert('Game Over!'),500;
      // });
      scoreDisplay.textContent = 'GAME OVER';
      playButton.classList.remove('hidden');
      playButton.textContent = 'PLAY AGAIN';
    }
  }

  // Check for a win
  function checkForWin() {
    if (letterIndex === word.length) {
      // if (score === 274 || letterIndex === word.length) {
      gameState = 'won';
      console.log(letterIndex);

      dontAllowPlay();
      document.removeEventListener('keyup', movePacman);
      scoreDisplay.textContent = 'YOU WIN';
      playButton.classList.remove('hidden');
      playButton.textContent = 'NEXT LEVEL';
    }
  }
});
