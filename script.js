// Game constants and variables
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let player, bullets, invaders, gameOver, rightPressed, leftPressed, spacePressed;
let score = 0;
let level = 1;
let invaderSpeed = 0.1;
let invaderDirection = 1;
let invaderRowCount = 3;
let invaderColumnCount = 5;
let gameInterval;
let restartTextHeight = 60; // Distance of restart text from center of canvas

// Star object
let stars = [];
const starCount = 200; // Number of stars

// Leaderboard
let leaderboard = JSON.parse(localStorage.getItem('leaderboard')) || [];

function updateLeaderboard(name, score) {
  leaderboard.push({ name, score });
  leaderboard.sort((a, b) => b.score - a.score); // Sort by score, descending
  leaderboard = leaderboard.slice(0, 3); // Keep only top 3
  localStorage.setItem('leaderboard', JSON.stringify(leaderboard));
}

// Create stars for the background
function createStars() {
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 0.5 + 2, // Random size between 1 and 4
      speed: Math.random() * 0.8 + 0.3, // Random speed for twinkling effect
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
    
    // Reset star to top if it goes off the bottom of the screen
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
let bulletSpeed = 6; // Default bullet speed

// Function to change bullet color based on level
function getBulletColor() {
  if (level >= 20) return 'pink';
  if (level >= 15) return 'green';
  if (level >= 10) return 'yellow';
  if (level >= 5) return 'cyan';
  return '#FF0000'; // Default red
}

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

// Function to add glow effect on bullets
function drawBullets() {
  for (let i = 0; i < bullets.length; i++) {
    if (bullets[i].y < 0) {
      bullets.splice(i, 1);
      continue;
    }
    
    ctx.shadowBlur = 10;
    ctx.shadowColor = getBulletColor(); // Add glow effect with the bullet color
    ctx.fillStyle = getBulletColor(); // Set bullet color
    ctx.fillRect(bullets[i].x, bullets[i].y, bullets[i].width, bullets[i].height);
    bullets[i].y += bullets[i].dy;
  }
}

// Function to create invaders
function createInvaders() {
  invaders = [];
  let maxRows = Math.floor(canvas.height / (invaderHeight + invaderPadding)); // Adjust row count to screen height
  invaderRowCount = Math.min(maxRows, 5); // Limit max rows to 5 for better performance and playability
  
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

// Function to increase bullet speed based on level
function increaseBulletSpeed() {
  if (level >= 20) {
    bulletSpeed = 10;
  } else if (level >= 15) {
    bulletSpeed = 9;
  } else if (level >= 10) {
    bulletSpeed = 8;
  } else if (level >= 5) {
    bulletSpeed = 7;
  }
}

// Function to draw the game over screen with summary
function drawGameOver() {
  if (!gameOverSound.played) {
    gameOverSound.play(); // Play the game over sound
  }

  ctx.fillStyle = 'white';
  ctx.font = '30px Arial';
  ctx.fillText('GAME OVER', canvas.width / 2 - 100, canvas.height / 2 - 40);
  ctx.font = '20px Arial';
  ctx.fillText('Level: ' + level, canvas.width / 2 - 40, canvas.height / 2);
  ctx.fillText('Score: ' + score, canvas.width / 2 - 40, canvas.height / 2 + 30);
  ctx.fillText('Click to Restart', canvas.width / 2 - 80, canvas.height / 2 + restartTextHeight);

  // Prompt for player's name and update leaderboard
  let playerName = prompt('Enter your name:');
  if (playerName) {
    updateLeaderboard(playerName, score);
  }
  // Show leaderboard
  ctx.fillText('Top Scores:', canvas.width / 2 - 60, canvas.height / 2 + 70);
  for (let i = 0; i < leaderboard.length; i++) {
    ctx.fillText(`${i + 1}. ${leaderboard[i].name} - ${leaderboard[i].score}`, canvas.width / 2 - 60, canvas.height / 2 + 100 + (i * 30));
  }
}

// Function to end the game
function gameOverCondition() {
  gameOver = true;
  drawGameOver();
  clearInterval(gameInterval); // Stop the game
  gameOverSound.play();
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
  drawBackground();  // Draw the background gradient
  drawStars();  // Draw the stars
  drawPlayer();
  drawBullets();
  drawInvaders();
  drawScore();
  drawLevel();
  detectCollisions();
  movePlayer();
  moveInvaders();

  increaseBulletSpeed(); // Increase bullet speed based on level
}

// Initialize the game
createStars();  // Create the stars
createInvaders();
gameInterval = setInterval(draw, 1000 / 60); // 60 FPS
