// Game constants and variables
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;  // Make canvas width dynamic
canvas.height = window.innerHeight; // Make canvas height dynamic

let player, bullets, invaders, gameOver, rightPressed, leftPressed, spacePressed;
let score = 0;
let level = 1;
let invaderSpeed = 0.05;
let invaderDirection = 1; // 1 for right, -1 for left
let invaderRowCount = 3;
let invaderColumnCount = 5;
let gameInterval;
let bulletSpeed = 5; // Initial bullet speed
let shootDelay = 10; // Delay between shots in milliseconds (for faster shooting after level 6)
let lastShotTime = 0; // Time of the last shot (to control shooting speed)
let leaderboard = []; // Leaderboard to store players' names and scores
let playerName = ""; // Player name from prompt

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

// Stars for the twinkling effect
let stars = [];

// Create stars (each star will have random properties)
function createStars(numStars) {
  for (let i = 0; i < numStars; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 2 + 1, // Random size between 1 and 3
      opacity: Math.random(), // Random opacity for twinkling effect
      twinkleSpeed: Math.random() * 0.02 + 0.01, // Speed of twinkling
    });
  }
}

// Update and draw the gradient background and stars
function drawBackground() {
  // Create a space-like gradient background
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, '#000428'); // Dark space blue
  gradient.addColorStop(1, '#004e92'); // Lighter blue for the deep space feel
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw stars with twinkle effect
  for (let i = 0; i < stars.length; i++) {
    const star = stars[i];
    star.opacity += star.twinkleSpeed; // Change opacity over time

    // Reverse opacity direction when limits are reached (twinkling effect)
    if (star.opacity > 1 || star.opacity < 0) {
      star.twinkleSpeed = -star.twinkleSpeed;
    }

    ctx.beginPath();
    ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`; // White stars with twinkle
    ctx.fill();
  }
}

// Player object, Bullet, Invaders, etc. remain as they are...

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
  ctx.font = '16px Arial';
  ctx.fillText('Score: ' + score, 8, 20);
}

// Function to draw the level
function drawLevel() {
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '16px Arial';
  ctx.fillText('Level: ' + level, canvas.width - 80, 20);
}

// Function to update leaderboard
function updateLeaderboard(name, score) {
  leaderboard.push({ name, score });
  leaderboard.sort((a, b) => b.score - a.score); // Sort by score descending
  if (leaderboard.length > 3) {
    leaderboard = leaderboard.slice(0, 3); // Keep only the top 3 players
  }
}

// Function to draw the game over screen with summary and leaderboard
function drawGameOver() {
  // Ask for player name
  if (playerName === "") {
    playerName = prompt("Enter your name:");
  }

  // Update leaderboard with player's score
  updateLeaderboard(playerName, score);

  ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear canvas
  
  // Game over text
  ctx.fillStyle = 'white';
  ctx.font = '30px Arial';
  ctx.fillText('GAME OVER', canvas.width / 2 - 100, canvas.height / 2 - 40);
  ctx.font = '20px Arial';
  ctx.fillText('Level: ' + level, canvas.width / 2 - 40, canvas.height / 2);
  ctx.fillText('Score: ' + score, canvas.width / 2 - 40, canvas.height / 2 + 30);

  // Display leaderboard
  ctx.font = '16px Arial';
  ctx.fillText('Leaderboard:', canvas.width / 2 - 60, canvas.height / 2 + 70);
  for (let i = 0; i < leaderboard.length; i++) {
    ctx.fillText(`${i + 1}. ${leaderboard[i].name}: ${leaderboard[i].score}`, canvas.width / 2 - 60, canvas.height / 2 + 100 + i * 30);
  }

  // Restart instructions
  ctx.fillText('Touch to Restart', canvas.width / 2 - 80, canvas.height / 2 + 180);
}

// Function to end the game
function gameOverCondition() {
  gameOver = true;
  drawGameOver();
  clearInterval(gameInterval); // Stop the game
  gameOverSound.play(); // Play game over sound
}

// Restart the game when clicked
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
    playerName = ""; // Reset player name
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

  drawBackground();  // Draw the background with gradient and stars
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
createStars(100); // Generate 100 stars for the background
gameInterval = setInterval(draw, 1000 / 60); // 60 FPS
