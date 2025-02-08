// Game constants and variables
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Dynamically update canvas size to fill the full screen
canvas.width = window.innerWidth;  // Full width of the screen
canvas.height = window.innerHeight; // Full height of the screen

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
  if (touchEndX < touchStartX && player.x > 0) {
    player.x -= player.speed;  // Move left
  } else if (touchEndX > touchStartX && player.x < canvas.width - player.width) {
    player.x += player.speed;  // Move right
  }
  touchStartX = touchEndX;  // Update the touch start X to current position for continuous movement
});

// Touch event to fire bullets
canvas.addEventListener('touchstart', function(e) {
  if (!gameOver && Date.now() - lastShotTime > shootDelay) {
    shootBullet();  // Fire a bullet when the screen is touched
  } else if (gameOver) {
    restartGame();  // Restart the game if game over screen is active
  }
});

// Keyboard event listeners for desktop support
document.addEventListener('keydown', function(e) {
  if (e.key === 'ArrowRight' || e.key === 'd') {
    rightPressed = true;
  }
  if (e.key === 'ArrowLeft' || e.key === 'a') {
    leftPressed = true;
  }
  if (e.key === ' ' && !gameOver && Date.now() - lastShotTime > shootDelay) {
    shootBullet();
  }
});

document.addEventListener('keyup', function(e) {
  if (e.key === 'ArrowRight' || e.key === 'd') {
    rightPressed = false;
  }
  if (e.key === 'ArrowLeft' || e.key === 'a') {
    leftPressed = false;
  }
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
        if (invader.x > canvas.width - invaderWidth || invader.x < 0) {
          shouldMoveDown = true;
        }
      }
    }
  }

  if (shouldMoveDown) {
    invaderDirection = -invaderDirection;
    for (let c = 0; c < invaderColumnCount; c++) {
      for (let r = 0; r < invaderRowCount; r++) {
        invaders[c][r].y += 10; // Move down if edge is reached
      }
    }
  }
}

// Function to check for game over
function checkGameOver() {
  for (let c = 0; c < invaderColumnCount; c++) {
    for (let r = 0; r < invaderRowCount; r++) {
      let invader = invaders[c][r];
      if (invader.status === 1 && invader.y + invaderHeight >= player.y) {
        gameOver = true;  // Game over if any invader reaches the player's level
        gameOverSound.play();
        break;
      }
    }
  }
}

// Function to display score
function drawScore() {
  ctx.font = '16px Arial';
  ctx.fillStyle = '#fff';
  ctx.fillText(`Score: ${score}`, 10, 20);
}

// Function to draw level
function drawLevel() {
  ctx.font = '16px Arial';
  ctx.fillStyle = '#fff';
  ctx.fillText(`Level: ${level}`, canvas.width - 100, 20);
}

// Function to display game over text
function drawGameOver() {
  ctx.font = '30px Arial';
  ctx.fillStyle = 'red';
  ctx.fillText('Game Over', canvas.width / 2 - 90, canvas.height / 2);
  ctx.fillText(`Final Score: ${score}`, canvas.width / 2 - 120, canvas.height / 2 + 40);
  ctx.fillText('Click or Tap to Restart', canvas.width / 2 - 140, canvas.height / 2 + 80);
}

// Function to restart the game
function restartGame() {
  score = 0;
  level = 1;
  invaderSpeed = 0.05;
  invaderRowCount = 3;
  invaderColumnCount = 5;
  bullets = [];
  invaders = [];
  createInvaders();
  gameOver = false;
}

// Main game loop
function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear canvas

  if (!gameOver) {
    drawStars(); // Draw moving stars
    drawPlayer(); // Draw the player
    drawBullets(); // Draw the bullets
    drawInvaders(); // Draw the invaders
    drawScore(); // Display score
    drawLevel(); // Display level

    movePlayer(); // Move player based on keyboard or touch input
    moveInvaders(); // Move invaders based on their logic
    detectCollisions(); // Check for collisions between bullets and invaders
    checkGameOver(); // Check if the game is over
  } else {
    drawGameOver(); // Draw game over text
  }

  requestAnimationFrame(gameLoop); // Continue the loop
}

// Create stars array
let stars = [];
function createStars() {
  stars = [];
  for (let i = 0; i < 200; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 2,
      speed: Math.random() * 0.5 + 0.1, // Random speed for each star
      opacity: Math.random() * 0.5 + 0.5, // Random opacity for twinkling effect
    });
  }
}

// Function to draw and animate stars
function drawStars() {
  ctx.fillStyle = 'white';
  for (let i = 0; i < stars.length; i++) {
    let star = stars[i];

    // Subtle movement of stars
    star.x += star.speed;
    if (star.x > canvas.width) {
      star.x = 0;
    }

    // Twinkling effect
    star.opacity += (Math.random() * 0.02 - 0.01);
    if (star.opacity > 1) star.opacity = 1;
    if (star.opacity < 0.2) star.opacity = 0.2;

    // Draw the star
    ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
    ctx.fillRect(star.x, star.y, star.size, star.size);
  }
}

// Initialize the game
createStars();
createInvaders();
gameLoop(); // Start the game loop
