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
const bulletSpeed = 4;
let bulletColor = 'cyan';  // Default bullet color

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

// Background music start trigger
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

// Function to increase bullet speed and color based on level
function increaseBulletAttributes() {
  if (level >= 20) {
    bulletSpeed = 8;
    bulletColor = 'green'; // Level 20
  } else if (level >= 15) {
    bulletSpeed = 7;
    bulletColor = 'pink'; // Level 15
  } else if (level >= 10) {
    bulletSpeed = 6;
    bulletColor = 'yellow'; // Level 10
  } else if (level >= 5) {
    bulletSpeed = 5;
    bulletColor = 'cyan'; // Level 5
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
    dy: -bulletSpeed,
    color: bulletColor, // Set bullet color
  };
  bullets.push(bullet);

  // Play the shoot sound
  shootSound.play();
}

// Function to draw bullets with a glowing effect
function drawBullets() {
  for (let i = 0; i < bullets.length; i++) {
    if (bullets[i].y < 0) {
      bullets.splice(i, 1);
      continue;
    }

    // Set glow effect based on the bullet's color
    ctx.shadowBlur = 20;
    ctx.shadowColor = bullets[i].color; // Set the bullet's glow color

    // Draw bullet with dynamic color and glow effect
    ctx.fillStyle = bullets[i].color;
    ctx.fillRect(bullets[i].x, bullets[i].y, bullets[i].width, bullets[i].height);
    bullets[i].y += bullets[i].dy;
  }
  
  // Reset shadow effect for other elements
  ctx.shadowBlur = 0;
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
  for (let c = 0; c < invaderColumnCount; c++) {
    for (let r = 0; r < invaderRowCount; r++) {
      if (invaders[c][r].status === 1) {
        invaders[c][r].x += invaderSpeed * invaderDirection;
        // Reverse direction when invader hits the wall
        if (invaders[c][r].x + invaderWidth > canvas.width || invaders[c][r].x < 0) {
          invaderDirection *= -1;
          for (let c2 = 0; c2 < invaderColumnCount; c2++) {
            for (let r2 = 0; r2 < invaderRowCount; r2++) {
              invaders[c2][r2].y += invaderHeight; // Move invaders down
            }
          }
          break;
        }
      }
    }
  }
}

// Function to draw the score on screen
function drawScore() {
  ctx.font = '16px Arial';
  ctx.fillStyle = 'white';
  ctx.fillText(`Score: ${score}`, 8, 20);
}

// Function to draw the level on screen
function drawLevel() {
  ctx.font = '16px Arial';
  ctx.fillStyle = 'white';
  ctx.fillText(`Level: ${level}`, canvas.width - 80, 20);
}

// Function to end the game
function gameOverScreen() {
  gameOverSound.play();
  ctx.fillStyle = 'black';
  ctx.globalAlpha = 0.7;
  ctx.fillRect(0, canvas.height / 2 - 50, canvas.width, 100);
  ctx.globalAlpha = 1.0;
  ctx.font = '30px Arial';
  ctx.fillStyle = 'white';
  ctx.fillText(`Game Over! Final Score: ${score}`, canvas.width / 2 - 150, canvas.height / 2);
  ctx.font = '20px Arial';
  ctx.fillText('Click to Restart', canvas.width / 2 - 60, canvas.height / 2 + 30);
  gameOver = true;
}

// Function to restart the game
function restartGame() {
  score = 0;
  level = 1;
  invaderSpeed = 0.1;
  invaderDirection = 1;
  createInvaders();
  bullets = [];
  gameOver = false;
  gameInterval = setInterval(draw, 10);
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
  drawBullets(); // Draw bullets with dynamic color and glow effect
  drawInvaders();
  drawScore();
  drawLevel();
  detectCollisions();
  movePlayer();
  moveInvaders();
  increaseBulletAttributes(); // Update bullet attributes based on level
}

// Start the game
createStars();
createInvaders();
gameInterval = setInterval(draw, 10);
