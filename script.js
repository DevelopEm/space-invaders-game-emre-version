// Game constants and variables
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;  // Make canvas width dynamic
canvas.height = window.innerHeight; // Make canvas height dynamic

let player, bullets, invaders, gameOver, rightPressed, leftPressed, spacePressed;
let score = 0;
let level = 1;
let invaderSpeed = 0.1;
let invaderDirection = 1; // 1 for right, -1 for left
let invaderRowCount = 3;
let invaderColumnCount = 5;
let gameInterval;
let restartTextHeight = 60; // Distance of restart text from center of canvas

// Star object
let stars = [];
const starCount = 200; // Number of stars

// Leaderboard
let leaderboard = JSON.parse(localStorage.getItem('leaderboard')) || [];

// Sound files
const shootSound = new Audio('shoot.wav');
const gameOverSound = new Audio('GameOver.mp3');
const backgroundMusic = new Audio('BackgroundMusic.wav');

// Background music settings
backgroundMusic.loop = true;
backgroundMusic.volume = 0.3;

let touchStartX = 0;  // for touch movement tracking
let touchStartY = 0;  // for touch movement tracking

let musicStarted = false;

// Keyboard input tracking
rightPressed = false;
leftPressed = false;
spacePressed = false;

// Create stars for the background
function createStars() {
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 3 + 1, // Random size between 1 and 4
      speed: Math.random() * 0.5 + 0.1, // Random speed for twinkling effect
      opacity: Math.random() * 0.5 + 0.5, // Random opacity
    });
  }
}

// Function to draw the gradient background
function drawBackground() {
  let gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, 'black');
  gradient.addColorStop(1, '#00008B'); // Dark blue

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height); // Fill the canvas with the gradient
}

// Function to draw stars
function drawStars() {
  for (let i = 0; i < stars.length; i++) {
    let star = stars[i];
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2, false);
    ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`; // White with varying opacity
    ctx.fill();
    star.y += star.speed; // Move stars downwards
    
    if (star.y > canvas.height) {
      star.y = 0;
      star.x = Math.random() * canvas.width; // Random horizontal position
    }
  }
}

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
const bulletSpeed = 5;

// Invader object
invaders = [];
const invaderWidth = 40;
const invaderHeight = 40;
const invaderPadding = 10;
const invaderOffsetTop = 30;
const invaderOffsetLeft = 30;

gameOver = false;

// Function to update leaderboard
function updateLeaderboard(name, score) {
  leaderboard.push({ name, score });
  leaderboard.sort((a, b) => b.score - a.score); // Sort by score, descending
  leaderboard = leaderboard.slice(0, 3); // Keep only top 3
  localStorage.setItem('leaderboard', JSON.stringify(leaderboard));
}

// Function to shoot a bullet
function shootBullet() {
  if (gameOver) return;
  let bullet = {
    x: player.x + player.width / 2 - 2,
    y: player.y,
    width: 6,  // Set bullet width
    height: 12, // Set bullet height
    dy: -bulletSpeed,
    color: getBulletColor(), // Add the color to the bullet
  };
  bullets.push(bullet);

  // Play the shoot sound
  shootSound.play();
}

// Function to draw bullets with glow effect
function drawBullets() {
  for (let i = 0; i < bullets.length; i++) {
    if (bullets[i].y < 0) {
      bullets.splice(i, 1);
      continue;
    }

    ctx.shadowBlur = 10;
    ctx.shadowColor = bullets[i].color; // Set the glow color based on bullet's color
    ctx.fillStyle = bullets[i].color; // Set bullet color
    ctx.fillRect(bullets[i].x, bullets[i].y, bullets[i].width, bullets[i].height);
    bullets[i].y += bullets[i].dy;
  }
}

// Function to change bullet color based on level
function getBulletColor() {
  if (level >= 20) return 'pink';
  if (level >= 15) return 'green';
  if (level >= 10) return 'yellow';
  if (level >= 5) return 'cyan';
  return '#FF0000'; // Default color
}

// Function to draw the player (spaceship)
function drawPlayer() {
  ctx.drawImage(player.image, player.x, player.y, player.width, player.height);
}

// Function to draw invaders (no glow effect)
function drawInvaders() {
  ctx.shadowBlur = 0; // Disable glow effect for invaders
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
          invaders[c][r].y += invaderHeight; // Move all invaders down a row
        }
      }
    }
  }
}

// Function to reset the game
function gameOverCondition() {
  gameOverSound.play();
  gameOver = true;
  clearInterval(gameInterval);
  setTimeout(() => {
    let name = prompt("Game Over! Enter your name:");
    if (name) {
      updateLeaderboard(name, score);
      alert("Leaderboard: " + JSON.stringify(leaderboard));
    }
  }, 100);
}

// Function to create invaders
function createInvaders() {
  invaders = [];
  for (let c = 0; c < invaderColumnCount; c++) {
    invaders[c] = [];
    for (let r = 0; r < invaderRowCount; r++) {
      let invader = {
        x: c * (invaderWidth + invaderPadding) + invaderOffsetLeft,
        y: r * (invaderHeight + invaderPadding) + invaderOffsetTop,
        status: 1,
        image: new Image(),
      };
      invader.image.src = 'invader.png';  // Invader image path
      invaders[c][r] = invader;
    }
  }
}

// Function to update and render the game
function updateGame() {
  if (!gameOver) {
    drawBackground();
    drawStars();
    drawPlayer();
    movePlayer();
    drawBullets();
    detectCollisions();
    moveInvaders();
    drawInvaders();
    // Display score and level
    ctx.font = '20px Arial';
    ctx.fillStyle = 'white';
    ctx.fillText('Score: ' + score, 10, 30);
    ctx.fillText('Level: ' + level, canvas.width - 100, 30);
  } else {
    ctx.font = '30px Arial';
    ctx.fillStyle = 'white';
    ctx.fillText('Game Over', canvas.width / 2 - 80, canvas.height / 2);
    ctx.fillText('Press Space to Restart', canvas.width / 2 - 130, canvas.height / 2 + restartTextHeight);
  }
}

// Event listeners for keyboard input
document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowRight' || e.key === 'd') {
    rightPressed = true;
  } else if (e.key === 'ArrowLeft' || e.key === 'a') {
    leftPressed = true;
  } else if (e.key === ' ' && !gameOver) {
    shootBullet();
  } else if (e.key === ' ' && gameOver) {
    // Restart the game
    score = 0;
    level = 1;
    invaderSpeed = 0.1;
    invaderDirection = 1;
    invaderRowCount = 3;
    invaderColumnCount = 5;
    createInvaders();
    gameOver = false;
    gameInterval = setInterval(updateGame, 1000 / 60);
  }
});

document.addEventListener('keyup', (e) => {
  if (e.key === 'ArrowRight' || e.key === 'd') {
    rightPressed = false;
  } else if (e.key === 'ArrowLeft' || e.key === 'a') {
    leftPressed = false;
  }
});

// Event listeners for touch input
canvas.addEventListener('touchstart', (e) => {
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
});

canvas.addEventListener('touchmove', (e) => {
  let touchEndX = e.touches[0].clientX;
  let touchEndY = e.touches[0].clientY;

  if (touchEndX > touchStartX) {
    rightPressed = true;
    leftPressed = false;
  } else if (touchEndX < touchStartX) {
    leftPressed = true;
    rightPressed = false;
  }
  if (touchEndY < touchStartY) {
    shootBullet();
  }
});

// Initialize the game
createInvaders();
createStars();
gameInterval = setInterval(updateGame, 1000 / 60); // Start the game loop
