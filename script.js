// Game constants and variables
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Ensure that the canvas takes up the full window and has no padding/margin
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

document.body.style.margin = 0;
document.body.style.padding = 0;
canvas.style.display = 'block';

let player, bullets, invaders, gameOver, rightPressed, leftPressed, spacePressed;
let score = 0;
let level = 1;
let invaderSpeed = 0.3;
let invaderDirection = 1;
let invaderRowCount = 3;
let invaderColumnCount = 5;
let gameInterval;
let restartTextHeight = 60;
let leaderboard = [];  // Top 3 leaderboard
let playerName = '';
let leaderboardSubmitted = false;

// Player object
player = {
  x: canvas.width / 2 - 20,
  y: canvas.height - 100,
  width: 40,
  height: 40,
  speed: 5,
  dx: 0,
  image: new Image(),
};

player.image.src = 'spaceship.png';

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

const shootSound = new Audio('shoot.wav');
const gameOverSound = new Audio('GameOver.mp3');
const backgroundMusic = new Audio('BackgroundMusic.wav');

// Background music settings
backgroundMusic.loop = true;
backgroundMusic.volume = 0.3;

// Touch event listeners
let touchStartX = 0;
let touchStartY = 0;
let musicStarted = false;

canvas.addEventListener('touchstart', function(e) {
  e.preventDefault();

  if (!musicStarted) {
    backgroundMusic.play();
    musicStarted = true;
  }

  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
});

canvas.addEventListener('touchmove', function(e) {
  e.preventDefault();
  let touchEndX = e.touches[0].clientX;
  if (touchEndX < touchStartX && player.x > 0) {
    player.x -= player.speed;
  } else if (touchEndX > touchStartX && player.x < canvas.width - player.width) {
    player.x += player.speed;
  }
  touchStartX = touchEndX;
});

canvas.addEventListener('touchstart', function(e) {
  if (!gameOver) {
    shootBullet();
  } else if (leaderboardSubmitted) {
    restartGame();
  } else {
    promptName();
  }
});

// Shoot bullet function
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

  shootSound.play();
}

// Create invaders
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
      invaders[c][r].image.src = 'invader.png';
    }
  }
}

// Draw player (spaceship)
function drawPlayer() {
  ctx.drawImage(player.image, player.x, player.y, player.width, player.height);
}

// Draw bullets with a glowing effect
function drawBullets() {
  for (let i = 0; i < bullets.length; i++) {
    if (bullets[i].y < 0) {
      bullets.splice(i, 1);
      continue;
    }

    // Red bullets with glowing effect
    if (level <= 4) {
      ctx.shadowColor = '#FF0000';
      ctx.shadowBlur = 15;

      ctx.fillStyle = '#FF0000';
      ctx.fillRect(bullets[i].x, bullets[i].y, bullets[i].width, bullets[i].height);

      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
    } else {
      ctx.fillStyle = '#00FFFF';  // Cyan bullets after level 4
      ctx.fillRect(bullets[i].x, bullets[i].y, bullets[i].width, bullets[i].height);
    }

    bullets[i].y += bullets[i].dy;
  }
}

// Draw invaders
function drawInvaders() {
  for (let c = 0; c < invaderColumnCount; c++) {
    for (let r = 0; r < invaderRowCount; r++) {
      if (invaders[c][r].status === 1) {
        ctx.drawImage(invaders[c][r].image, invaders[c][r].x, invaders[c][r].y, invaderWidth, invaderHeight);
      }
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
              invaderSpeed = Math.min(invaderSpeed + 0.2, 2);
              if (level <= 5) {
                invaderRowCount = Math.min(invaderRowCount + 1, 4);
                invaderColumnCount = Math.min(invaderColumnCount + 1, 7);
              }
              createInvaders();
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

// Move the player
function movePlayer() {
  if (rightPressed && player.x < canvas.width - player.width) {
    player.x += player.speed;
  } else if (leftPressed && player.x > 0) {
    player.x -= player.speed;
  }
}

// Move the invaders
function moveInvaders() {
  let shouldMoveDown = false;

  for (let c = 0; c < invaderColumnCount; c++) {
    for (let r = 0; r < invaderRowCount; r++) {
      let invader = invaders[c][r];
      if (invader.status === 1) {
        invader.x += invaderSpeed * invaderDirection;

        if (invader.x + invaderWidth > canvas.width || invader.x < 0) {
          invaderDirection = -invaderDirection;
          shouldMoveDown = true;
        }

        if (invader.y + invaderHeight >= player.y && invader.status === 1) {
          gameOverCondition();
          return;
        }
      }
    }
  }

  if (shouldMoveDown) {
    for (let c = 0; c < invaderColumnCount; c++) {
      for (let r = 0; r < invaderRowCount; r++) {
        if (invaders[c][r].status === 1) {
          invaders[c][r].y += invaderHeight;
        }
      }
    }
  }
}

// Draw the score
function drawScore() {
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '16px Arial';
  ctx.fillText('Score: ' + score, 8, 20);
}

// Draw the level
function drawLevel() {
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '16px Arial';
  ctx.fillText('Level: ' + level, canvas.width - 80, 20);
}

// Draw the game over screen and prompt for name input
function drawGameOver() {
  ctx.fillStyle = 'white';
  ctx.font = '30px Arial';
  ctx.fillText('GAME OVER', canvas.width / 2 - 100, canvas.height / 2 - 40);
  ctx.font = '20px Arial';
  ctx.fillText('Level: ' + level, canvas.width / 2 - 40, canvas.height / 2);
  ctx.fillText('Score: ' + score, canvas.width / 2 - 40, canvas.height / 2 + 30);

  if (!leaderboardSubmitted) {
    ctx.fillText('Enter your name (Max 10 chars)', canvas.width / 2 - 80, canvas.height / 2 + 80);
  }

  if (leaderboard.length > 0) {
    ctx.fillText('Leaderboard:', canvas.width / 2 - 70, canvas.height / 2 + 120);
    leaderboard.forEach((entry, index) => {
      ctx.fillText(`${index + 1}. ${entry.name} - ${entry.score}`, canvas.width / 2 - 70, canvas.height / 2 + 140 + index * 20);
    });
  }
}

// Handle the game over condition
function gameOverCondition() {
  gameOver = true;
  leaderboardSubmitted = false;
  gameOverSound.play();
  clearInterval(gameInterval);
  updateLeaderboard();
  drawGameOver();
}

// Update the leaderboard with the player's score
function updateLeaderboard() {
  if (leaderboard.length < 3 || leaderboard[2].score < score) {
    const name = prompt("Enter your name: ");
    playerName = name.slice(0, 10); // Limit name to 10 characters

    leaderboard.push({ name: playerName, score: score });
    leaderboard.sort((a, b) => b.score - a.score);  // Sort leaderboard by score
    leaderboard = leaderboard.slice(0, 3);  // Keep only top 3
  }
  leaderboardSubmitted = true;
}

// Restart the game when clicked
function restartGame() {
  if (gameOver) {
    score = 0;
    level = 1;
    invaderSpeed = 0.3;
    invaderDirection = 1;
    invaderRowCount = 3;
    invaderColumnCount = 5;
    gameOver = false;
    leaderboardSubmitted = false;
    createInvaders();
    backgroundMusic.play();
    gameInterval = setInterval(draw, 1000 / 60);
  }
}

// Main game loop
function draw() {
  if (gameOver) {
    return;
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawPlayer();
  drawBullets();
  drawInvaders();
  drawScore();
  drawLevel();
  detect
