// Game constants and variables
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;  // Make canvas width dynamic
canvas.height = window.innerHeight; // Make canvas height dynamic

let player, bullets, invaders, gameOver, rightPressed, leftPressed, spacePressed;
let score = 0;
let level = 1;
let invaderSpeed = 0.3;
let invaderDirection = 1; // 1 for right, -1 for left
let invaderRowCount = 3;
let invaderColumnCount = 5;
let gameInterval;
let restartTextHeight = 60; // Distance of restart text from center of canvas
let playerName = ""; // Variable for player name input

// Player object (spaceship)
player = {
  x: canvas.width / 2 - 20,
  y: canvas.height - 100, // 100px from the bottom
  width: 40,
  height: 40,
  speed: 5,
  dx: 0,
  image: new Image(),
};

player.image.src = 'spaceship.png'; // Path to spaceship image

// Bullet object
bullets = [];
const bulletSpeed = 4;

// Invader object
invaders = [];
const invaderWidth = 40;
const invaderHeight = 40;
const invaderPadding = 10;
const invaderOffsetTop = 30;
const invaderOffsetLeft = 30;

gameOver = false;

// Sounds
const shootSound = new Audio('shoot.wav'); // Path to shoot sound
const gameOverSound = new Audio('GameOver.mp3'); // Path to game over sound
const backgroundMusic = new Audio('BackgroundMusic.wav'); // Path to background music

// Background music settings
backgroundMusic.loop = true; // Loop background music
backgroundMusic.volume = 0.3; // Adjust volume if needed

// Font for "space-like" text
ctx.font = '20px "Press Start 2P", cursive'; // Use the space-like font

// Trigger to start background music after first interaction
let musicStarted = false;

// Touchstart event to trigger background music and track player movement
canvas.addEventListener('touchstart', function(e) {
  e.preventDefault();  // Prevent default touch behavior (like scrolling)
  
  if (!musicStarted) {
    backgroundMusic.play(); // Play background music after first touch
    musicStarted = true; // Prevent restarting background music on subsequent touches
  }

  touchStartX = e.touches[0].clientX;  // Track the starting X position of touch
  touchStartY = e.touches[0].clientY;  // Track the starting Y position of touch
});

// Function to shoot a bullet
function shootBullet() {
  if (gameOver) return;
  let bullet = {
    x: player.x + player.width / 2 - 2,
    y: player.y,
    width: 4,
    height: 10,
    dy: -bulletSpeed,
  };
  bullets.push(bullet);

  // Play the shoot sound
  shootSound.play();
}

// Function to create invaders
function createInvaders() {
  invaders = [];
  for (let c = 0; c < invaderColumnCount; c++) {
    invaders[c] = [];
    for (let r = 0; r < invaderRowCount; r++) {
      invaders[c][r] = {
        x: c * (invaderWidth + invaderPadding) + invaderOffsetLeft,
        y: r * (invaderHeight + invaderPadding) + invaderOffsetTop,
        status: 1,
        image: new Image(),
      };
      invaders[c][r].image.src = 'invader.png'; // Path to invader image
    }
  }
}

// Function to draw the player (spaceship)
function drawPlayer() {
  ctx.drawImage(player.image, player.x, player.y, player.width, player.height);
}

// Function to draw bullets
function drawBullets() {
  for (let i = 0; i < bullets.length; i++) {
    if (bullets[i].y < 0) {
      bullets.splice(i, 1);
      continue;
    }
    ctx.fillStyle = '#FF0000';
    ctx.fillRect(bullets[i].x, bullets[i].y, bullets[i].width, bullets[i].height);
    bullets[i].y += bullets[i].dy;
  }
}

// Function to draw invaders
function drawInvaders() {
  for (let c = 0; c < invaderColumnCount; c++) {
    for (let r = 0; r < invaderRowCount; r++) {
      if (invaders[c][r].status === 1) {
        ctx.drawImage(invaders[c][r].image, invaders[c][r].x, invaders[c][r].y, invaderWidth, invaderHeight);
      }
    }
  }
}

// Function to detect collisions between bullets and invaders
function detectCollisions() {
  for (let i = 0; i < bullets.length; i++) {
    for (let c = 0; c < invaderColumnCount; c++) {
      for (let r = 0; r < invaderRowCount; r++) {
        let invader = invaders[c][r];
        if (invader.status === 1) {
          if (
            bullets[i].x > invader.x &&
            bullets[i].x < invader.x + invaderWidth &&
            bullets[i].y > invader.y &&
            bullets[i].y < invader.y + invaderHeight
          ) {
            invader.status = 0; // Destroy the invader
            bullets.splice(i, 1); // Remove the bullet
            score += 10; // Increase score
            if (checkWin()) {
              level++;
              invaderSpeed = Math.min(invaderSpeed + 0.2, 2); // Increase speed as levels go up, up to a max speed
              if (level <= 5) {
                invaderRowCount = Math.min(invaderRowCount + 1, 4); // Increase rows slightly
                invaderColumnCount = Math.min(invaderColumnCount + 1, 7); // Increase columns slowly
              }
              createInvaders();  // Regenerate the invaders with updated count and speed
            }
            break;
          }
        }
      }
    }
  }
}

// Check if all invaders are destroyed
function checkWin() {
  for (let c = 0; c < invaderColumnCount; c++) {
    for (let r = 0; r < invaderRowCount; r++) {
      if (invaders[c][r].status === 1) {
        return false;
      }
    }
  }
  return true;
}

// Function to move the player
function movePlayer() {
  if (rightPressed && player.x < canvas.width - player.width) {
    player.x += player.speed;
  } else if (leftPressed && player.x > 0) {
    player.x -= player.speed;
  }
}

// Function to move the invaders
function moveInvaders() {
  let shouldMoveDown = false;

  for (let c = 0; c < invaderColumnCount; c++) {
    for (let r = 0; r < invaderRowCount; r++) {
      let invader = invaders[c][r];
      if (invader.status === 1) {
        invader.x += invaderSpeed * invaderDirection;

        // Check if invader reaches the edge of the screen
        if (invader.x + invaderWidth > canvas.width || invader.x < 0) {
          invaderDirection = -invaderDirection;
          shouldMoveDown = true;
        }

        // Check if invader reaches the bottom (player)
        if (invader.y + invaderHeight >= player.y && invader.status === 1) {
          gameOverCondition(); // End the game
          return;
        }
      }
    }
  }

  if (shouldMoveDown) {
    for (let c = 0; c < invaderColumnCount; c++) {
      for (let r = 0; r < invaderRowCount; r++) {
        if (invaders[c][r].status === 1) {
          invaders[c][r].y += invaderHeight; // Move all invaders down a row
        }
      }
    }
  }
}

// Function to draw the score
function drawScore() {
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '16px "Press Start 2P", cursive';
  ctx.fillText('Score: ' + score, 8, 20);
}

// Function to draw the level
function drawLevel() {
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '16px "Press Start 2P", cursive';
  ctx.fillText('Level: ' + level, canvas.width - 80, 20);
}

// Function to draw the leaderboard (Top 3 scores)
function drawLeaderboard() {
  ctx.fillStyle = 'white';
  ctx.font = '20px "Press Start 2P", cursive';
  ctx.fillText('Leaderboard:', canvas.width / 2 - 100, 30);
  let topScores = getTopScores();
  for (let i = 0; i < topScores.length; i++) {
    ctx.fillText(`${topScores[i].name}: ${topScores[i].score}`, canvas.width / 2 - 100, 60 + i * 30);
  }
}

// Get top 3 scores from localStorage
function getTopScores() {
  let topScores = JSON.parse(localStorage.getItem('topScores'));
  if (!topScores) topScores = [];
  return topScores.slice(0, 3);
}

// Function to save score and name to localStorage
function saveScore(name, score) {
  let topScores = getTopScores();
  topScores.push({ name, score });
  topScores.sort((a, b) => b.score - a.score); // Sort by score descending
  localStorage.setItem('topScores', JSON.stringify(topScores));
}

// Function to handle restart button click (after game over)
function handleRestartButtonClick(e) {
  const restartButtonX = canvas.width / 2 - 80;
  const restartButtonY = canvas.height / 2 + restartTextHeight;
  const restartButtonWidth = 160;
  const restartButtonHeight = 40;
  
  // Check if the touch position is within the "Restart" button area
  if (
    e.touches[0].clientX > restartButtonX &&
    e.touches[0].clientX < restartButtonX + restartButtonWidth &&
    e.touches[0].clientY > restartButtonY &&
    e.touches[0].clientY < restartButtonY + restartButtonHeight
  ) {
    restartGame();
  }
}

// Function to draw the game over screen with summary
function drawGameOver() {
  ctx.fillStyle = 'white';
  ctx.font = '30px "Press Start 2P", cursive';
  ctx.fillText('GAME OVER', canvas.width / 2 - 100, canvas.height / 2 - 40);
  ctx.font = '20px "Press Start 2P", cursive';
  ctx.fillText('Level: ' + level, canvas.width / 2 - 40, canvas.height / 2);
  ctx.fillText('Score: ' + score, canvas.width / 2 - 40, canvas.height / 2 + 30);

  // Draw Restart Button
  ctx.fillStyle = 'blue';
  ctx.fillRect(canvas.width / 2 - 80, canvas.height / 2 + restartTextHeight, 160, 40);
  ctx.fillStyle = 'white';
  ctx.font = '20px "Press Start 2P", cursive';
  ctx.fillText('Restart', canvas.width / 2 - 40, canvas.height / 2 + restartTextHeight + 25);
  
  // Display leaderboard
  drawLeaderboard();

  // Prompt for name input after game over
  promptForName();
}

// Prompt the player to input their name
function promptForName() {
  const nameInput = document.createElement('input');
  nameInput.type = 'text';
  nameInput.placeholder = 'Enter your name';
  nameInput.style.position = 'absolute';
  nameInput.style.left = canvas.width / 2 - 100 + 'px';
  nameInput.style.top = canvas.height / 2 + 100 + 'px';
  nameInput.style.fontFamily = '"Press Start 2P", cursive';
  nameInput.style.fontSize = '20px';
  nameInput.style.padding = '5px';

  document.body.appendChild(nameInput);

  nameInput.addEventListener('blur', function() {
    playerName = nameInput.value.trim();
    if (playerName === "") playerName = "Anonymous";  // Default name if empty

    saveScore(playerName, score);
    document.body.removeChild(nameInput);
    restartGame();  // Restart the game
  });

  nameInput.focus();
}

// Restart the game
function restartGame() {
  if (gameOver) {
    // Reset everything for a fresh start
    score = 0;
    level = 1;
    invaderSpeed = 0.3;
    invaderDirection = 1;
    invaderRowCount = 3;
    invaderColumnCount = 5;
    gameOver = false;
    createInvaders();
    backgroundMusic.play(); // Restart background music
    gameInterval = setInterval(draw, 1000 / 60); // Restart the game loop
  }
}

// Main game loop
function draw() {
  if (gameOver) {
    return;
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas
  drawPlayer();
  drawBullets();
  drawInvaders();
  drawScore();
  drawLevel();
  detectCollisions();
  movePlayer();
  moveInvaders();
}

// Initialize the game
createInvaders();
gameInterval = setInterval(draw, 1000 / 60); // 60 FPS
