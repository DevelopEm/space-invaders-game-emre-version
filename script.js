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
let playerName = "";
let leaderboard = [];

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

// Game Over Screen Style
const gameOverTextStyle = {
  font: '30px "Press Start 2P", cursive',
  color: 'yellow',
};

const restartButtonStyle = {
  font: '20px "Press Start 2P", cursive',
  color: 'white',
  bgColor: 'red',
  padding: '10px 20px',
  borderRadius: '5px',
  cursor: 'pointer',
  textAlign: 'center',
  text: 'Click to Restart',
  width: 200,
};

// Leaderboard functionality
function updateLeaderboard(playerName, score) {
  leaderboard.push({ name: playerName, score: score });
  leaderboard.sort((a, b) => b.score - a.score); // Sort leaderboard by score (desc)
  if (leaderboard.length > 5) {
    leaderboard = leaderboard.slice(0, 5); // Keep only the top 5
  }
}

// Draw Game Over screen
function drawGameOver() {
  ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear canvas
  
  // Game Over Text
  ctx.fillStyle = gameOverTextStyle.color;
  ctx.font = gameOverTextStyle.font;
  ctx.fillText('GAME OVER', canvas.width / 2 - 100, canvas.height / 2 - 40);

  // Score and Level Text
  ctx.fillStyle = 'white';
  ctx.font = '18px "Press Start 2P", cursive'; // Adjust font size for score and level
  ctx.fillText('Score: ' + score, canvas.width / 2 - 50, canvas.height / 2);
  ctx.fillText('Level: ' + level, canvas.width / 2 - 50, canvas.height / 2 + 30);

  // Display Leaderboard
  ctx.fillText('Leaderboard:', canvas.width / 2 - 80, canvas.height / 2 + 70);
  for (let i = 0; i < leaderboard.length; i++) {
    ctx.fillText((i + 1) + '. ' + leaderboard[i].name + ': ' + leaderboard[i].score, canvas.width / 2 - 50, canvas.height / 2 + 100 + (i * 30));
  }

  // Restart Button
  ctx.fillStyle = restartButtonStyle.bgColor;
  ctx.fillRect(canvas.width / 2 - restartButtonStyle.width / 2, canvas.height / 2 + 130, restartButtonStyle.width, 40);
  ctx.fillStyle = restartButtonStyle.color;
  ctx.font = restartButtonStyle.font;
  ctx.textAlign = 'center';
  ctx.fillText(restartButtonStyle.text, canvas.width / 2, canvas.height / 2 + 155);
}

// Prompt for player name
function askForPlayerName() {
  const name = prompt('Enter your name:');
  playerName = name ? name : 'Player'; // Use 'Player' if no name is entered
  updateLeaderboard(playerName, score); // Update leaderboard with player's score
  drawGameOver(); // Draw the game over screen
}

// Function to restart the game
function restartGame() {
  if (gameOver) {
    // Reset game variables
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

// Create Invaders
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

// Detect collisions between bullets and invaders
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
              invaderSpeed = Math.min(invaderSpeed + 0.2, 2); // Increase speed as levels go up
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

// Draw score and level
function drawScoreAndLevel() {
  ctx.fillStyle = 'white';
  ctx.font = '16px "Press Start 2P", cursive'; // Adjust font size for better fitting
  ctx.fillText('Score: ' + score, 8, 20); // Score at the top-left
  ctx.fillText('Level: ' + level, canvas.width - 80, 20); // Level at the top-right
}

// Function to end the game
function gameOverCondition() {
  gameOver = true;
  drawGameOver();
  clearInterval(gameInterval); // Stop the game
  gameOverSound.play(); // Play game over sound
  askForPlayerName(); // Ask for player's name and update leaderboard
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
  drawScoreAndLevel();
  detectCollisions();
  moveInvaders();
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

// Initialize the game
createInvaders();
gameInterval = setInterval(draw, 1000 / 60); // 60 FPS

// Add event listener for restart
canvas.addEventListener('click', function(e) {
  if (gameOver) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Check if click is on the restart button
    if (
      x > canvas.width / 2 - restartButtonStyle.width / 2 &&
      x < canvas.width / 2 + restartButtonStyle.width / 2 &&
      y > canvas.height / 2 + 130 &&
      y < canvas.height / 2 + 170
    ) {
      restartGame(); // Restart game
    }
  }
});
