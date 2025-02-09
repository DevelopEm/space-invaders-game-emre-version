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
    color: getBulletColor(level),  // Set bullet color based on level
    glow: getBulletGlow(level),    // Set bullet glow based on level
  };

  bullets.push(bullet);

  // Play the shoot sound
  shootSound.play();
}

// Function to get bullet color based on level
function getBulletColor(level) {
  if (level >= 20) {
    return 'green'; // Green bullets after level 20
  } else if (level >= 15) {
    return 'pink'; // Pink bullets after level 15
  } else if (level >= 10) {
    return 'yellow'; // Yellow bullets after level 10
  } else if (level >= 5) {
    return 'cyan'; // Cyan bullets after level 5
  } else {
    return 'white'; // Default white bullets
  }
}

// Function to get bullet speed based on level
function getBulletSpeed(level) {
  if (level >= 20) {
    return 9; // Speed 9 after level 20
  } else if (level >= 15) {
    return 8; // Speed 8 after level 15
  } else if (level >= 10) {
    return 7; // Speed 7 after level 10
  } else if (level >= 5) {
    return 6; // Speed 6 after level 5
  } else {
    return 5; // Default speed before level 5
  }
}

// Update bullet speed dynamically when the level increases
function increaseBulletSpeed() {
  bulletSpeed = getBulletSpeed(level); // Set bullet speed according to level
}

// Function to draw bullets
function drawBullets() {
  for (let i = 0; i < bullets.length; i++) {
    if (bullets[i].y < 0) {
      bullets.splice(i, 1);
      continue;
    }

    // Set the bullet's color and glow based on its level
    ctx.shadowColor = bullets[i].color;  // Apply the glow effect
    ctx.shadowBlur = 15; // Apply glow blur effect
    ctx.fillStyle = bullets[i].color;
    ctx.fillRect(bullets[i].x, bullets[i].y, bullets[i].width, bullets[i].height);
    bullets[i].y += bullets[i].dy;
  }

  // Reset shadow settings after drawing bullets
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
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

  // Play the shoot sound
  gameOver.play();
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

// Leaderboard
let leaderboard = JSON.parse(localStorage.getItem('leaderboard')) || [];

function updateLeaderboard(name, score) {
  leaderboard.push({ name, score });
  leaderboard.sort((a, b) => b.score - a.score); // Sort by score, descending
  leaderboard = leaderboard.slice(0, 3); // Keep only top 3
  localStorage.setItem('leaderboard', JSON.stringify(leaderboard));
}

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

// Function to draw the game over screen with summary
function drawGameOver() {
  // Ensure that the game over sound is played only once
  if (!gameOverSound.played) {
    gameOverSound.play(); // Play the game over sound
  }

  ctx.fillStyle = 'white';
  ctx.font = '30px Arial';
  ctx.fillText('GAME OVER', canvas.width / 2 - 100, canvas.height / 2 - 40);
  ctx.font = '20px Arial';
  ctx.fillText('Level: ' + level, canvas.width / 2 - 40, canvas.height / 2);
  ctx.fillText('Score: ' + score, canvas.width / 2 - 40, canvas.height / 2 + 30);
  ctx.fillText('Touch to Restart', canvas.width / 2 - 80, canvas.height / 2 + restartTextHeight);
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
}

// Initialize the game
createStars();  // Create the stars
createInvaders();
gameInterval = setInterval(draw, 1000 / 60); // 60 FPS
