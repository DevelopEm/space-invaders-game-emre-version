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

// Star object
let stars = [];
const starCount = 100; // Number of stars

// Create stars for the background with a "5D" effect
function createStars() {
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      z: Math.random() * 100,  // Depth (fake 3rd dimension)
      size: Math.random() * 2 + 1, // Random size between 1 and 4
      speed: Math.random() * 0.2 + 0.1, // Random speed for twinkling effect
      opacity: Math.random() * 0.1 + 0.3, // Random opacity
      hue: Math.random() * 360, // Random color (hue)
      phase: Math.random() * 2 * Math.PI, // Phase for rotation or fluctuation
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

// Create stars for the background with a "5D" effect
function createStars() {
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      z: Math.random() * 100,  // Depth (fake 3rd dimension)
      size: Math.random() * 2 + 1, // Random size between 1 and 4
      speed: Math.random() * 0.2 + 0.1, // Random speed for twinkling effect
      opacity: Math.random() * 0.1 + 0.3, // Random opacity
      hue: Math.random() * 360, // Random color (hue)
      phase: Math.random() * 2 * Math.PI, // Phase for rotation or fluctuation
      rotation: Math.random() * 360,  // Rotation angle for 5D effect
    });
  }
}
// Function to draw stars with a "5D" effect
function drawStars() {
  for (let i = 0; i < stars.length; i++) {
    let star = stars[i];

    // Simulate 5D depth and dynamic movement
    let sizeFactor = 1 + star.z / 100; // Scale based on depth
    let opacityFactor = Math.sin(star.phase) * 0.3 + 0.1; // Opacity fluctuations (twinkling effect)
    let speedFactor = star.speed + star.z / 5000; // Speed changes based on depth

    // Calculate the new size, opacity, and position
    let starSize = star.size * sizeFactor;
    let starOpacity = star.opacity * opacityFactor;
    
    // Change position based on speed and depth
    star.y += speedFactor;
    star.x += Math.sin(star.phase) * speedFactor; // Horizontal fluctuation

    // Reset star to top if it goes off the bottom of the screen
    if (star.y > canvas.height) {
      star.y = 0;
      star.x = Math.random() * canvas.width; // Random horizontal position
      star.z = Math.random() * 200;  // Reset depth (simulate movement in 5D space)
    }

    // Apply rotation and scaling for the 5D effect
    ctx.save(); // Save the current canvas state before transformation
    ctx.translate(star.x, star.y); // Move to the star's position
    ctx.rotate(star.rotation * Math.PI / 100); // Rotate the star

    // Draw a polygon star (a 5-pointed star for example)
    ctx.beginPath();
    ctx.moveTo(0, -starSize);
    for (let j = 1; j < 5; j++) {
      let angle = j * Math.PI * 3 / 5;
      let x = Math.sin(angle) * starSize;
      let y = Math.cos(angle) * starSize;
      ctx.lineTo(x, y);
    }
    ctx.closePath();

    // Apply dynamic color and opacity
    ctx.fillStyle = `hsla(${star.hue}, 1000%, 75%, ${starOpacity})`; // Random color with opacity
    ctx.fill();
    
    ctx.restore(); // Restore the canvas state after transformation

    // Update the phase to create continuous movement (simulating "rotation")
    star.phase += 0.1; // Adjust this value to make the effect more noticeable
    star.rotation += 1; // Gradually change rotation for spinning effect
  }
}
// Player object (spaceship)
player = {
  x: canvas.width / 2 - 20,
  y: canvas.height - 100, // 100px from the bottom
  width: 50,
  height: 40,
  speed: 6,
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

// Sounds
const shootSound = new Audio('shoot.wav'); // Path to shoot sound
const gameOverSound = new Audio('GameOver.mp3'); // Path to game over sound
const backgroundMusic = new Audio('BackgroundMusic.wav'); // Path to background music

// Background music settings
backgroundMusic.loop = true; // Loop background music
backgroundMusic.volume = 0.3; // Adjust volume if needed

// Touch event listeners for mobile control
let touchStartX = 0;  // for touch movement tracking
let touchStartY = 0;  // for touch movement tracking

// Trigger to start background music after first interaction
let musicStarted = false;

// Keyboard input tracking
rightPressed = false;
leftPressed = false;
spacePressed = false;

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
  if (touchEndX < touchStartX && player.x > 0) {
    player.x -= player.speed;  // Move left
  } else if (touchEndX > touchStartX && player.x < canvas.width - player.width) {
    player.x += player.speed;  // Move right
  }
  touchStartX = touchEndX;  // Update the touch start X to current position for continuous movement
});

// Touch event to fire bullets
canvas.addEventListener('touchstart', function(e) {
  if (!gameOver) {
    shootBullet();  // Fire a bullet when the screen is touched
  } else {
    restartGame();  // Restart the game if game over screen is active
  }
});

// Keyboard event listeners for player movement
document.addEventListener('keydown', function(e) {
  if (e.key === 'ArrowRight' || e.key === 'd') {
    rightPressed = true;
  } else if (e.key === 'ArrowLeft' || e.key === 'a') {
    leftPressed = true;
  } else if (e.key === ' ' && !gameOver) {
    shootBullet();
  }
});

document.addEventListener('keyup', function(e) {
  if (e.key === 'ArrowRight' || e.key === 'd') {
    rightPressed = false;
  } else if (e.key === 'ArrowLeft' || e.key === 'a') {
    leftPressed = false;
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

  // Play the shoot sound
  shootSound.play();
}

// Function to increase bullet speed based on level
function increaseBulletSpeed() {
  if (level >= 20) {
    bulletSpeed = 8;
  } else if (level >= 15) {
    bulletSpeed = 7;
  } else if (level >= 10) {
    bulletSpeed = 6;
  } else if (level >= 5) {
    bulletSpeed = 5;
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

// Function to move invaders
function moveInvaders() {
  for (let c = 0; c < invaderColumnCount; c++) {
    for (let r = 0; r < invaderRowCount; r++) {
      if (invaders[c][r].status === 1) {
        invaders[c][r].x += invaderSpeed * invaderDirection;
      }
    }
  }

  // Check for edge collision
  let edge = false;
  for (let c = 0; c < invaderColumnCount; c++) {
    for (let r = 0; r < invaderRowCount; r++) {
      if (invaders[c][r].status === 1) {
        if (invaders[c][r].x + invaderWidth >= canvas.width || invaders[c][r].x <= 0) {
          edge = true;
        }
      }
    }
  }

  if (edge) {
    invaderDirection *= -1;
    for (let c = 0; c < invaderColumnCount; c++) {
      for (let r = 0; r < invaderRowCount; r++) {
        invaders[c][r].y += invaderHeight; // Move invaders down if they hit an edge
      }
    }
  }
}

// Function to detect collision between bullets and invaders
function detectBulletCollision() {
  for (let i = 0; i < bullets.length; i++) {
    for (let c = 0; c < invaderColumnCount; c++) {
      for (let r = 0; r < invaderRowCount; r++) {
        if (invaders[c][r].status === 1) {
          if (
            bullets[i].x > invaders[c][r].x &&
            bullets[i].x < invaders[c][r].x + invaderWidth &&
            bullets[i].y > invaders[c][r].y &&
            bullets[i].y < invaders[c][r].y + invaderHeight
          ) {
            invaders[c][r].status = 0; // Mark invader as hit
            bullets.splice(i, 1); // Remove bullet
            score += 10;
            if (score % 50 === 0) {
              level++;
              increaseBulletSpeed();
            }
            return;
          }
        }
      }
    }
  }
}

// Function to draw the score
function drawScore() {
  ctx.font = '20px Arial';
  ctx.fillStyle = '#fff';
  ctx.fillText(`Score: ${score}`, 20, 30);
  ctx.fillText(`Level: ${level}`, canvas.width - 100, 30);
}

// Function to end the game
function gameOverScreen() {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  ctx.fillStyle = 'white';
  ctx.font = '40px Arial';
  ctx.fillText('Game Over', canvas.width / 2 - 100, canvas.height / 2 - 40);
  ctx.fillText(`Score: ${score}`, canvas.width / 2 - 80, canvas.height / 2 + 10);
  
  ctx.font = '20px Arial';
  ctx.fillText('Press Enter to Restart', canvas.width / 2 - 100, canvas.height / 2 + 40);
  ctx.fillText('Leaderboard (Top 3 Scores)', canvas.width / 2 - 115, canvas.height / 2 + 70);
  
  // Play the game over sound when the game ends
  if (!gameOverSound.paused) {
    gameOverSound.pause(); // Pause the sound if it is already playing
    gameOverSound.currentTime = 0; // Reset the sound to the beginning
  }
  gameOverSound.play(); // Play the game over sound
  
  // Display leaderboard
  let leaderboard = JSON.parse(localStorage.getItem('leaderboard')) || [];
  leaderboard.push({ name: 'Player', score: score });
  leaderboard.sort((a, b) => b.score - a.score); // Sort leaderboard by score
  leaderboard = leaderboard.slice(0, 3); // Keep top 3 scores
  
  for (let i = 0; i < leaderboard.length; i++) {
    ctx.fillText(`${leaderboard[i].name}: ${leaderboard[i].score}`, canvas.width / 2 - 100, canvas.height / 2 + 100 + i * 30);
  }
}

// Function to prompt for player's name after game over and restart game
function promptPlayerName() {
  const name = prompt('Enter your name for the leaderboard:') || 'Player';
  const leaderboard = JSON.parse(localStorage.getItem('leaderboard')) || [];
  leaderboard.push({ name: name, score: score });
  leaderboard.sort((a, b) => b.score - a.score); // Sort leaderboard by score
  localStorage.setItem('leaderboard', JSON.stringify(leaderboard.slice(0, 3))); // Store top 3 scores
  restartGame();
}

// Function to restart the game
function restartGame() {
  score = 0;
  level = 1;
  invaderSpeed = 0.3;
  invaderDirection = 1;
  invaderRowCount = 3;
  invaderColumnCount = 5;
  createInvaders();
  bullets = [];
  player.x = canvas.width / 2 - 20;
  player.y = canvas.height - 100;
  gameOver = false;
  clearInterval(gameInterval);
  gameInterval = setInterval(gameLoop, 1000 / 60);
  gameOverSound.pause(); // Stop game over sound
  gameOverSound.currentTime = 0; // Reset game over sound
  promptPlayerName(); // Prompt for player name
}

// Main game loop
function gameLoop() {
  drawBackground();
  drawStars();
  drawScore();
  drawPlayer();
  drawBullets();
  drawInvaders();
  moveInvaders();
  detectBulletCollision();

  if (gameOver) {
    gameOverScreen();
  }

  // Handle player movement
  if (rightPressed && player.x < canvas.width - player.width) {
    player.x += player.speed;
  } else if (leftPressed && player.x > 0) {
    player.x -= player.speed;
  }

  if (score >= level * 50) {
    level++;
    invaderSpeed += 0.1; // Speed up invaders with each level
  }
}

// Initialize game
createStars();
createInvaders();
gameInterval = setInterval(gameLoop, 1000 / 60);
