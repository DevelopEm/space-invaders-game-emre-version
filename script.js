// Game constants and variables
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;  // Make canvas width dynamic
canvas.height = window.innerHeight; // Make canvas height dynamic

let player, bullets, invaders, gameOver, rightPressed, leftPressed, upPressed, downPressed, spacePressed;
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
  y: canvas.height / 2 - 20, // Start at the center of the canvas
  z: 0,  // Depth (positive for closer, negative for farther)
  width: 40,
  height: 40,
  speed: 5,
  dx: 0,
  dy: 0,
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

// Twinkling star variables
let stars = [];
const numStars = 200; // Number of stars
const maxStarSize = 2; // Maximum size of stars
const minStarSize = 0.5; // Minimum size of stars

// Function to create stars
function createStars() {
  stars = [];
  for (let i = 0; i < numStars; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * (maxStarSize - minStarSize) + minStarSize,
      brightness: Math.random() * 0.5 + 0.5, // Random brightness between 0.5 and 1
      speed: Math.random() * 0.2 + 0.05, // Slow random movement speed
    });
  }
}

// Function to draw the space background with stars moving as the spaceship moves
function drawSpaceBackground() {
  // Create gradient for the background (black to dark blue)
  let gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, 'black');
  gradient.addColorStop(1, '#1b2a49');

  // Fill background with gradient
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw stars
  for (let i = 0; i < stars.length; i++) {
    let star = stars[i];
    
    // Move stars based on the player's movement (simulate traveling through space)
    star.x -= player.dx * 0.1; // Stars move opposite to spaceship's x movement
    star.y -= player.dy * 0.1; // Stars move opposite to spaceship's y movement

    // Handle wrapping of stars when they move off-screen
    if (star.x < 0) star.x = canvas.width;
    if (star.x > canvas.width) star.x = 0;
    if (star.y < 0) star.y = canvas.height;
    if (star.y > canvas.height) star.y = 0;

    // Update star size based on spaceship depth (z-axis)
    let starSize = star.size * (1 - player.z * 0.1); // Size decreases with depth (move farther away)
    starSize = Math.max(starSize, minStarSize); // Prevent stars from disappearing completely

    // Draw the stars
    ctx.beginPath();
    ctx.arc(star.x, star.y, starSize, 0, 2 * Math.PI);
    ctx.fillStyle = `rgba(255, 255, 255, ${star.brightness})`; // Adjust brightness
    ctx.fill();
  }
}

// Touch event listeners for mobile control
let touchStartX = 0;  // for touch movement tracking
let touchStartY = 0;  // for touch movement tracking

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

// Touchmove event to track player movement
canvas.addEventListener('touchmove', function(e) {
  e.preventDefault();
  let touchEndX = e.touches[0].clientX;  // Track the current X position of touch
  let touchEndY = e.touches[0].clientY;  // Track the current Y position of touch

  // Move spaceship in all directions based on touch
  player.dx = (touchEndX - touchStartX) / 10;
  player.dy = (touchEndY - touchStartY) / 10;

  // Update the touch start position for continuous movement
  touchStartX = touchEndX;
  touchStartY = touchEndY;
});

// Function to get bullet color based on level
function getBulletColor() {
  if (level >= 26) {
    bulletSpeed = 11; // Faster bullets after level 26
    return 'purple'; // Purple bullets
  } else if (level >= 16) {
    bulletSpeed = 10; // Faster bullets after level 16
    return 'yellow'; // Yellow bullets
  } else if (level >= 6) {
    bulletSpeed = 9; // Faster bullets after level 6
    return 'cyan'; // Cyan bullets
  } else {
    bulletSpeed = 8; // Default bullet speed
    return 'red'; // Red bullets for lower levels
  }
}

// Function to shoot a bullet
function shootBullet() {
  if (gameOver) return;
  let bullet = {
    x: player.x + player.width / 2 - 2,
    y: player.y,
    width: 4,
    height: 10,
    dy: -bulletSpeed, // Bullet speed based on level
    color: getBulletColor(), // Get bullet color based on level
  };
  bullets.push(bullet);

  // Play the shoot sound
  shootSound.play();
  lastShotTime = Date.now(); // Update the last shot time to prevent fast shooting
}

// Function to draw bullets with a glow effect
function drawBullets() {
  for (let i = 0; i < bullets.length; i++) {
    if (bullets[i].y < 0) {
      bullets.splice(i, 1); // Remove bullets that go off-screen
      continue;
    }
    
    // Set glowing effect
    ctx.shadowColor = bullets[i].color;
    ctx.shadowBlur = 20; // Increase shadow blur for better glow effect
    ctx.fillStyle = bullets[i].color;
    ctx.fillRect(bullets[i].x, bullets[i].y, bullets[i].width, bullets[i].height);
    
    bullets[i].y += bullets[i].dy; // Move the bullet
  }
  ctx.shadowBlur = 0; // Reset shadow blur after drawing bullets
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
              invaderSpeed = Math.min(invaderSpeed + 0.1, 1); // Increase speed as levels go up, up to a max speed
              if (level <= 10) {
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
  player.x += player.dx;
  player.y += player.dy;

  // Prevent player from moving out of bounds
  player.x = Math.max(0, Math.min(player.x, canvas.width - player.width));
  player.y = Math.max(0, Math.min(player.y, canvas.height - player.height));
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

// Handle game over
function gameOverCondition() {
  gameOver = true;
  backgroundMusic.pause(); // Stop background music
  gameOverSound.play(); // Play game over sound

  // Store the score in the leaderboard
  if (leaderboard.length < 5 || score > leaderboard[4].score) {
    let name = prompt("Game Over! Enter your name:");
    leaderboard.push({ name: name || "Anonymous", score: score });
    leaderboard.sort((a, b) => b.score - a.score); // Sort leaderboard by score
    leaderboard = leaderboard.slice(0, 5); // Keep only top 5 scores
  }
}

// Function to display the score
function displayScore() {
  ctx.font = "20px Arial";
  ctx.fillStyle = "white";
  ctx.fillText("Score: " + score, 10, 30);
}

// Function to display the leaderboard
function displayLeaderboard() {
  ctx.font = "20px Arial";
  ctx.fillStyle = "white";
  ctx.fillText("Leaderboard:", canvas.width - 200, 30);

  leaderboard.forEach((entry, index) => {
    ctx.fillText(`${index + 1}. ${entry.name}: ${entry.score}`, canvas.width - 200, 60 + index * 30);
  });
}

// Function to update the game
function update() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawSpaceBackground();
  movePlayer();
  drawPlayer();
  moveInvaders();
  drawInvaders();
  drawBullets();
  detectCollisions();
  displayScore();
  displayLeaderboard();
}

// Set up keyboard events for player movement
document.addEventListener('keydown', (e) => {
  if (e.key === "ArrowLeft") {
    player.dx = -player.speed;
  }
  if (e.key === "ArrowRight") {
    player.dx = player.speed;
  }
  if (e.key === "ArrowUp") {
    player.dy = -player.speed;
  }
  if (e.key === "ArrowDown") {
    player.dy = player.speed;
  }
  if (e.key === " ") {
    if (Date.now() - lastShotTime > shootDelay) {
      shootBullet();
    }
  }
});

// Handle keyup events
document.addEventListener('keyup', (e) => {
  if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
    player.dx = 0;
  }
  if (e.key === "ArrowUp" || e.key === "ArrowDown") {
    player.dy = 0;
  }
});

// Start the game loop and invader generation
createStars();
createInvaders();
gameInterval = setInterval(update, 1000 / 60);
