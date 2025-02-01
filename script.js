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
const bulletSpeed = 4;
const bulletGlueTime = 500; // Time in milliseconds for glue to last

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

// Trigger to start background music after first interaction
canvas.addEventListener('touchstart', function(e) {
  e.preventDefault();
  
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
  if (gameOver) return;
  
  let bullet = {
    x: player.x + player.width / 2 - 2,
    y: player.y,
    width: 4,
    height: 10,
    dy: -bulletSpeed,
    isGlue: level >= 5,  // Enable glue effect after level 5
    glueTimer: level >= 5 ? Date.now() : null,  // Track the glue duration
    color: getBulletColor(level),  // Get bullet color based on level
    glow: getBulletGlow(level),  // Get glow effect based on level
  };
  
  bullets.push(bullet);

  // Play the shoot sound with a fancy effect
  shootSound.play();
}

// Function to get the bullet color based on the current level
function getBulletColor(level) {
  if (level <= 4) {
    return 'red';  // Red for levels 1-4
  } else if (level <= 10) {
    return 'cyan';  // Cyan for levels 5-10
  } else if (level <= 15) {
    return 'yellow';  // Yellow for levels 10-15
  } else {
    return 'purple';  // Purple for levels 16 and beyond
  }
}

// Function to get the bullet glow effect based on the current level
function getBulletGlow(level) {
  if (level <= 4) {
    return 'rgba(255, 0, 0, 0.6)';  // Red glow for levels 1-4
  } else if (level <= 10) {
    return 'rgba(0, 255, 255, 0.6)';  // Cyan glow for levels 5-10
  } else if (level <= 15) {
    return 'rgba(255, 255, 0, 0.6)';  // Yellow glow for levels 10-15
  } else {
    return 'rgba(128, 0, 128, 0.6)';  // Purple glow for levels 16 and beyond
  }
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

// Function to draw bullets with dynamic effects based on level
function drawBullets() {
  for (let i = 0; i < bullets.length; i++) {
    if (bullets[i].y < 0) {
      bullets.splice(i, 1);
      continue;
    }

    // Apply the color and glow effect based on the current bullet
    ctx.fillStyle = bullets[i].color;
    ctx.shadowColor = bullets[i].glow;
    ctx.shadowBlur = 10;

    ctx.fillRect(bullets[i].x, bullets[i].y, bullets[i].width, bullets[i].height);
    bullets[i].y += bullets[i].dy;

    // If the glue timer has expired, remove the bullet's glue effect
    if (bullets[i].isGlue && Date.now() - bullets[i].glueTimer > bulletGlueTime) {
      bullets[i].isGlue = false;
    }

    // Reset shadow effect for the next bullet
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
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
            if (bullets[i].isGlue) {
              bullets[i].y = invader.y; // Stick the bullet to the invader
              bullets[i].dy = 0;  // Stop the bullet's movement
            } else {
              bullets.splice(i, 1); // Remove the bullet
            }
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

// Function to trigger the game over
function gameOverCondition() {
  gameOver = true;
  clearInterval(gameInterval); // Stop the game loop
  gameOverSound.play(); // Play game over sound
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

// Function to draw the game over screen with a retro, space-themed look
function drawGameOver() {
  ctx.fillStyle = 'white';
  ctx.font = '50px "Press Start 2P", monospace';  // Retro pixel font
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Create a glowing text effect
  ctx.shadowColor = 'rgba(0, 255, 255, 0.8)';  // Cyan glow
  ctx.shadowBlur = 10;

  ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 40);

  // Reset shadow effect for the next text
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;

  // Draw "Level" and "Score" with a more retro feel
  ctx.fillStyle = 'cyan';  // Retro neon cyan
  ctx.font = '30px "Press Start 2P", monospace';
  ctx.fillText('Level: ' + level, canvas.width / 2, canvas.height / 2 + 10);
  ctx.fillText('Score: ' + score, canvas.width / 2, canvas.height / 2 + 40);

  // Add some extra glow effect for "Click to Restart"
  ctx.fillStyle = 'yellow';  // A warm, inviting retro color for restart text
  ctx.font = '24px "Press Start 2P", monospace';
  ctx.fillText('Click to Restart', canvas.width / 2, canvas.height / 2 + 80);

  // Glowing effect on the restart text for extra flair
  ctx.shadowColor = 'rgba(255, 255, 0, 0.8)';  // Yellow glow
  ctx.shadowBlur = 15;
  ctx.fillText('Click to Restart', canvas.width / 2, canvas.height / 2 + 80);
  ctx.shadowColor = 'transparent';  // Reset the glow effect
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
    createInvaders();
    backgroundMusic.play(); // Restart background music
    gameInterval = setInterval(draw, 1000 / 60); // Restart the game loop
  }
}

// Main game loop
function draw() {
  if (gameOver) {
    drawGameOver(); // Show the game over screen if the game is over
    return;
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas
  drawPlayer();
  drawBullets();
  drawInvaders();
  drawScore();
  drawLevel();
  detectCollisions();
  movePlayer();
  moveInvaders();
}
