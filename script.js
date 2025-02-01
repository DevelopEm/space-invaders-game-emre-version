const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 800;
canvas.height = 600;

// Player settings
const player = {
  x: canvas.width / 2 - 20,
  y: canvas.height - 60,
  width: 40,
  height: 20,
  color: 'white',
  speed: 5
};

// Bullet settings
const bullets = [];
const bulletSpeed = 7;

// Invader settings
const invaders = [];
let invaderRowCount = 3;
let invaderColumnCount = 5;
const invaderWidth = 40;
const invaderHeight = 20;
const invaderPadding = 10;
const invaderOffsetTop = 50;
const invaderOffsetLeft = 50;
let invaderSpeed = 0.3;
let invaderDirection = 1;

// Game state
let rightPressed = false;
let leftPressed = false;
let spacePressed = false;
let score = 0;
let level = 1;
let gameOver = false;

// Leaderboard
const leaderboard = [];

// Sounds
const backgroundMusic = new Audio('background.mp3');
const shootSound = new Audio('shoot.mp3');
const gameOverSound = new Audio('gameover.mp3');

// Create invaders
function createInvaders() {
  invaders.length = 0; // Clear existing invaders
  for (let row = 0; row < invaderRowCount; row++) {
    for (let col = 0; col < invaderColumnCount; col++) {
      const x = col * (invaderWidth + invaderPadding) + invaderOffsetLeft;
      const y = row * (invaderHeight + invaderPadding) + invaderOffsetTop;
      invaders.push({ x, y, width: invaderWidth, height: invaderHeight, destroyed: false });
    }
  }
}

// Draw player
function drawPlayer() {
  ctx.fillStyle = player.color;
  ctx.fillRect(player.x, player.y, player.width, player.height);
}

// Draw bullets
function drawBullets() {
  ctx.fillStyle = 'red';
  bullets.forEach((bullet, index) => {
    ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    bullet.y -= bulletSpeed;
    if (bullet.y < 0) bullets.splice(index, 1); // Remove bullet if off-screen
  });
}

// Draw invaders
function drawInvaders() {
  ctx.fillStyle = 'green';
  invaders.forEach((invader) => {
    if (!invader.destroyed) {
      ctx.fillRect(invader.x, invader.y, invader.width, invader.height);
    }
  });
}

// Draw score and level
function drawScoreAndLevel() {
  ctx.fillStyle = 'white';
  ctx.font = '20px Arial';
  ctx.fillText(`Score: ${score}`, 10, 20);
  ctx.fillText(`Level: ${level}`, canvas.width - 100, 20);
}

// Move player
function movePlayer() {
  if (rightPressed && player.x < canvas.width - player.width) {
    player.x += player.speed;
  } else if (leftPressed && player.x > 0) {
    player.x -= player.speed;
  }
}

// Shoot bullet
function shootBullet() {
  if (spacePressed) {
    bullets.push({
      x: player.x + player.width / 2 - 2.5,
      y: player.y,
      width: 5,
      height: 10
    });
    shootSound.play();
    spacePressed = false; // Prevent continuous shooting
  }
}

// Move invaders
function moveInvaders() {
  let edgeReached = false;
  invaders.forEach((invader) => {
    if (!invader.destroyed) {
      invader.x += invaderSpeed * invaderDirection;
      if (invader.x + invader.width > canvas.width || invader.x < 0) {
        edgeReached = true;
      }
    }
  });
  if (edgeReached) {
    invaderDirection *= -1;
    invaders.forEach((invader) => {
      invader.y += 20;
    });
  }
}

// Detect collisions
function detectCollisions() {
  bullets.forEach((bullet, bIndex) => {
    invaders.forEach((invader, iIndex) => {
      if (!invader.destroyed &&
          bullet.x < invader.x + invader.width &&
          bullet.x + bullet.width > invader.x &&
          bullet.y < invader.y + invader.height &&
          bullet.y + bullet.height > invader.y) {
        invader.destroyed = true;
        bullets.splice(bIndex, 1);
        score += 10;

        // Level up
        if (invaders.every((inv) => inv.destroyed)) {
          level++;
          invaderSpeed += 0.2;
          invaderRowCount++;
          invaderColumnCount++;
          createInvaders();
        }
      }
    });
  });

  // Check for game over
  invaders.forEach((invader) => {
    if (!invader.destroyed && invader.y + invader.height > player.y) {
      gameOver = true;
      clearInterval(gameInterval);
      gameOverSound.play();
    }
  });
}

// Draw game over screen
function drawGameOver() {
  ctx.fillStyle = 'red';
  ctx.font = '40px Arial';
  ctx.fillText('GAME OVER', canvas.width / 2 - 120, canvas.height / 2);
  ctx.font = '20px Arial';
  ctx.fillText('Click to restart', canvas.width / 2 - 80, canvas.height / 2 + 40);

  // Update leaderboard
  updateLeaderboard();
}

// Update leaderboard
function updateLeaderboard() {
  leaderboard.push(score);
  leaderboard.sort((a, b) => b - a);
  if (leaderboard.length > 3) leaderboard.pop();
}

// Restart the game
function restartGame() {
  gameOver = false;
  score = 0;
  level = 1;
  invaderSpeed = 0.3;
  invaderRowCount = 3;
  invaderColumnCount = 5;
  player.x = canvas.width / 2 - player.width / 2;
  bullets.length = 0;
  createInvaders();
  gameInterval = setInterval(updateGame, 20);
}

// Game loop
function updateGame() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (!gameOver) {
    movePlayer();
    moveInvaders();
    detectCollisions();
    drawPlayer();
    drawBullets();
    drawInvaders();
    drawScoreAndLevel();
  } else {
    drawGameOver();
  }
}

// Event listeners
window.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowRight') rightPressed = true;
  if (e.key === 'ArrowLeft') leftPressed = true;
  if (e.key === ' ') spacePressed = true;
});

window.addEventListener('keyup', (e) => {
  if (e.key === 'ArrowRight') rightPressed = false;
  if (e.key === 'ArrowLeft') leftPressed = false;
});

canvas.addEventListener('click', () => {
  if (gameOver) restartGame();
});

// Initialize the game
function init() {
  createInvaders();
  backgroundMusic.loop = true;
  backgroundMusic.play();
  gameInterval = setInterval(updateGame, 20);
}

// Start the game
init();
