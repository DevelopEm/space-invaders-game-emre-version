// Game constants and variables
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let player, bullets, invaders, gameOver, rightPressed, leftPressed, spacePressed;
let score = 0;
let level = 1;
let invaderSpeed = 0.3;
let invaderDirection = 1;
let invaderRowCount = 3;
let invaderColumnCount = 5;
let gameInterval;
let restartTextHeight = 60;

let bulletSpeed = 4; // Speed of the bullet

// Player object (spaceship)
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
let bulletColor = '#FF0000'; // Start with red bullets

// Invader object
invaders = [];
const invaderWidth = 40;
const invaderHeight = 40;
const invaderPadding = 10;
const invaderOffsetTop = 30;
const invaderOffsetLeft = 30;

gameOver = false;

// Sounds
const shootSound = new Audio('shoot.wav');
const gameOverSound = new Audio('GameOver.mp3');
const backgroundMusic = new Audio('BackgroundMusic.wav');
backgroundMusic.loop = true;
backgroundMusic.volume = 0.3;

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
  } else {
    restartGame(); // If game over, restart on touch
  }
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
      invaders[c][r].image.src = 'invader.png';
    }
  }
}

// Function to draw the player (spaceship)
function drawPlayer() {
  ctx.drawImage(player.image, player.x, player.y, player.width, player.height);
}

// Function to draw bullets (with glue effect)
function drawBullets() {
  for (let i = 0; i < bullets.length; i++) {
    if (bullets[i].y < 0) {
      bullets.splice(i, 1);
      continue;
    }
    ctx.fillStyle = bulletColor;
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

// Function to detect collisions
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
            invader.status = 0; // Destroy invader
            bullets.splice(i, 1); // Remove bullet
            score += 10; // Increase score
            if (checkWin()) {
              level++;
              invaderSpeed = Math.min(invaderSpeed + 0.2, 2);
              if (level > 4) {
                bulletColor = '#00FFFF'; // Cyan bullets with glue after level 4
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

        if (invader.x + invaderWidth > canvas.width || invader.x < 0) {
          invaderDirection = -invaderDirection;
          shouldMoveDown = true;
        }

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
          invaders[c][r].y += invaderHeight; // Move invaders down
        }
      }
    }
  }
}

// Function to draw score and level
function drawScore() {
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '16px Arial';
  ctx.fillText('Score: ' + score, 8, 20);
}

function drawLevel() {
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '16px Arial';
  ctx.fillText('Level: ' + level, canvas.width - 80, 20);
}

// Function to draw the game over screen
function drawGameOver() {
  if (!gameOverSound.played) {
    gameOverSound.play(); // Play sound once
  }
  
  ctx.fillStyle = 'white';
  ctx.font = '30px Arial';
  ctx.fillText('GAME OVER', canvas.width / 2 - 100, canvas.height / 2 - 40);
  ctx.font = '20px Arial';
  ctx.fillText('Level: ' + level, canvas.width / 2 - 40, canvas.height / 2);
  ctx.fillText('Score: ' + score, canvas.width / 2 - 40, canvas.height / 2 + 30);
  
  // Draw restart button
  ctx.fillStyle = '#FF0000';  // Red button color
  ctx.fillRect(canvas.width / 2 - 80, canvas.height / 2 + restartTextHeight, 160, 40);
  ctx.fillStyle = '#FFFFFF';  // White text color
  ctx.font = '20px Arial';
  ctx.fillText('Touch to Restart', canvas.width / 2 - 70, canvas.height / 2 + restartTextHeight + 25);
}

// Function to end the game
function gameOverCondition() {
  gameOver = true;
  drawGameOver();
  clearInterval(gameInterval);
  gameOverSound.play();
}

// Restart the game when touched
function restartGame() {
  if (gameOver) {
    score = 0;
    level = 1;
    invaderSpeed = 0.3;
    invaderDirection = 1;
    invaderRowCount = 3;
    invaderColumnCount = 5;
    gameOver = false;
    bulletColor = '#FF0000';  // Reset to red glue bullets
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

  ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear canvas
  drawPlayer();
  drawBullets();
  drawInvaders();
  drawScore();
  drawLevel();
  detectCollisions();
  movePlayer();
  moveInvaders();
}

createInvaders();
gameInterval = setInterval(draw, 1000 / 60);
