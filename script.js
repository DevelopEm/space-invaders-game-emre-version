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
let bulletSpeed = 4; // Base speed of bullet
let fireRate = 10; // Delay between bullets
let lastFireTime = 0; // Store last bullet fire time

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

// Leaderboard functionality
let leaderboard = JSON.parse(localStorage.getItem('leaderboard')) || [];

// Restart button for touch control
let restartButton = document.createElement('button');
restartButton.innerText = 'Touch to Restart';
restartButton.style.position = 'absolute';
restartButton.style.top = '50%'; // Initial position of restart button
restartButton.style.left = '50%';
restartButton.style.transform = 'translate(-50%, -50%)';
restartButton.style.fontSize = '20px';
restartButton.style.backgroundColor = 'red';
restartButton.style.color = 'white';
restartButton.style.border = 'none';
restartButton.style.padding = '10px 20px';
restartButton.style.display = 'none'; // Initially hidden
document.body.appendChild(restartButton);

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
  if (!gameOver) {
    shootBullet();  // Fire a bullet when the screen is touched
  } else {
    restartGame();  // Restart the game if game over screen is active
  }
});

// Function to shoot a bullet
function shootBullet() {
  if (gameOver || Date.now() - lastFireTime < fireRate) return; // Ensure bullets fire with delay
  let bullet = {
    x: player.x + player.width / 2 - 2,
    y: player.y,
    width: 6,  // Slightly wider bullet
    height: 15, // Taller bullet
    dy: -bulletSpeed,
    glowAlpha: 1.0,  // Alpha value for the glow effect
  };
  bullets.push(bullet);

  lastFireTime = Date.now(); // Update last fire time
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
      invaders[c][r].image.src = 'invader.png'; // Path to invader image
    }
  }
}

// Function to draw the player (spaceship)
function drawPlayer() {
  ctx.drawImage(player.image, player.x, player.y, player.width, player.height);
}

// Function to draw bullets (with glowing effect for level 5+)
function drawBullets() {
  for (let i = 0; i < bullets.length; i++) {
    if (bullets[i].y < 0) {
      bullets.splice(i, 1);
      continue;
    }

    // Glowing effect for bullets in level 5+
    if (level >= 5) {
      let gradient = ctx.createRadialGradient(bullets[i].x + bullets[i].width / 2, bullets[i].y + bullets[i].height / 2, 0, bullets[i].x + bullets[i].width / 2, bullets[i].y + bullets[i].height / 2, 15);
      gradient.addColorStop(0, 'rgba(0, 255, 255, 1)');  // Bright cyan center
      gradient.addColorStop(1, 'rgba(0, 255, 255, 0)');  // Fading outer glow

      ctx.fillStyle = gradient;
      ctx.fillRect(bullets[i].x, bullets[i].y, bullets[i].width, bullets[i].height);
    } else {
      ctx.fillStyle = '#FF0000';
      ctx.fillRect(bullets[i].x, bullets[i].y, bullets[i].width, bullets[i].height);
    }

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
              fireRate = Math.max(5, fireRate - 1); // Decrease the fire rate to fire faster at higher levels
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

// Function to draw the game over screen with leaderboard and restart button
function drawGameOver() {
  // Ensure that the game over sound is played only once
  if (!gameOverSound.played) {
    gameOverSound.play(); // Play the game over sound
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas before drawing the game over screen
  
  // Game Over text
  ctx.fillStyle = 'white';
  ctx.font = '30px Arial';
  ctx.fillText('GAME OVER', canvas.width / 2 - 100, canvas.height / 2 - 80); // Added more vertical space

  // Score and Level text
  ctx.font = '20px Arial';
  ctx.fillText('Level: ' + level, canvas.width / 2 - 40, canvas.height / 2 - 40);
  ctx.fillText('Score: ' + score, canvas.width / 2 - 40, canvas.height / 2);

  // Show the leaderboard in spacey font and style with extra padding
  ctx.fillStyle = '#FFD700';  // Gold text for leaderboard
  ctx.font = '24px "Space Mono", monospace';  // Use a space-like font
  ctx.fillText('Top 3 Scores:', canvas.width / 2 - 90, canvas.height / 2 + 50);  // Spacing added
  
  leaderboard.slice(0, 3).forEach((entry, index) => {
    ctx.fillText(`${index + 1}. ${entry.name}: ${entry.score}`, canvas.width / 2 - 90, canvas.height / 2 + 80 + index * 40);
  });

  // Adjust position of restart button (below the leaderboard)
  restartButton.style.display = 'block';  // Ensure the restart button is shown
  restartButton.style.top = `${canvas.height / 2 + 180 + leaderboard.length * 40}px`;  // Adjust the vertical position of the restart button to avoid overlap
}

// Function to end the game
function gameOverCondition() {
  gameOver = true;
  updateLeaderboard(); // Update leaderboard
  drawGameOver();
  clearInterval(gameInterval); // Stop the game
  gameOverSound.play(); // Play the game over sound
}

// Restart the game when clicked
restartButton.addEventListener('touchstart', function(e) {
  if (gameOver) {
    restartGame();  // Restart the game when the button is touched
  }
});

// Restart the game
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
    createInvaders();
    backgroundMusic.play(); // Restart background music
    gameInterval = setInterval(draw, 1000 / 60); // Restart the game loop
    restartButton.style.display = 'none'; // Hide the restart button
  }
}
