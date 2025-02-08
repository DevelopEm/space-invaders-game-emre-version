// Game constants and variables
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;  // Make canvas width dynamic
canvas.height = window.innerHeight; // Make canvas height dynamic

let player, bullets, invaders, invaderBullets, gameOver, rightPressed, leftPressed, spacePressed;
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
invaderBullets = [];  // Array to store invader bullets
let invaderLastShotTime = [];  // Track last shot time for each invader
let invaderShotDelay = 2000; // Delay between invader shots (in milliseconds)

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
      invaderLastShotTime[c * invaderRowCount + r] = 0; // Initialize last shot time for each invader
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

// Function to draw invader bullets
function drawInvaderBullets() {
  for (let i = 0; i < invaderBullets.length; i++) {
    // Draw invader bullets
    ctx.fillStyle = 'green'; // Color for invader bullets
    ctx.fillRect(invaderBullets[i].x, invaderBullets[i].y, invaderBullets[i].width, invaderBullets[i].height);

    // Move invader bullets
    invaderBullets[i].y += invaderBullets[i].dy;

    // Remove bullets that go off-screen
    if (invaderBullets[i].y > canvas.height) {
      invaderBullets.splice(i, 1);
      continue;
    }

    // Check for collision with the player
    if (
      invaderBullets[i].x > player.x &&
      invaderBullets[i].x < player.x + player.width &&
      invaderBullets[i].y + invaderBullets[i].height > player.y
    ) {
      gameOverCondition(); // End the game if an invader bullet hits the player
      return;
    }
  }
}

// Function for invader shooting (from level 3 and above)
function invaderShoot() {
  if (level >= 3) {  // Start invader shooting from level 3
    for (let c = 0; c < invaderColumnCount; c++) {
      for (let r = 0; r < invaderRowCount; r++) {
        let invader = invaders[c][r];

        if (invader.status === 1) { // If invader is alive
          // Check if enough time has passed since last shot
          if (Date.now() - (invaderLastShotTime[c * invaderRowCount + r] || 0) > invaderShotDelay) {
            // Random chance for invader to shoot
            if (Math.random() < 0.05) {  // 5% chance for invader to shoot
              let invaderBullet = {
                x: invader.x + invaderWidth / 2 - 2,
                y: invader.y + invaderHeight, // Shoot from the bottom of invader
                width: 4,
                height: 10,
                dy: 3, // Speed of invader's bullet
              };
              invaderBullets.push(invaderBullet);
              invaderLastShotTime[c * invaderRowCount + r] = Date.now(); // Update last shot time
              break;
            }
          }
        }
      }
    }
  }
}

// Function to handle game over condition
function gameOverCondition() {
  gameOver = true;
  gameOverSound.play();  // Play game over sound
  backgroundMusic.pause(); // Stop background music on game over
  ctx.font = '30px Arial';
  ctx.fillStyle = 'white';
  ctx.fillText('Game Over', canvas.width / 2 - 80, canvas.height / 2);
  ctx.fillText('Press R to Restart', canvas.width / 2 - 120, canvas.height / 2 + 50);
  updateLeaderboard();
}

// Function to update leaderboard
function updateLeaderboard() {
  if (localStorage.getItem('leaderboard')) {
    leaderboard = JSON.parse(localStorage.getItem('leaderboard'));
  }
  
  leaderboard.push({name: playerName, score: score});
  leaderboard.sort((a, b) => b.score - a.score);  // Sort by score descending
  
  // Save top 5 players to leaderboard
  leaderboard = leaderboard.slice(0, 5);
  
  localStorage.setItem('leaderboard', JSON.stringify(leaderboard));
}

// Function to restart the game
function restartGame() {
  gameOver = false;
  score = 0;
  level = 1;
  invaderRowCount = 3;
  invaderColumnCount = 5;
  invaderDirection = 1;
  player.x = canvas.width / 2 - 20;
  player.y = canvas.height - 100;
  invaders = [];
  invaderBullets = [];
  createInvaders();
  backgroundMusic.play();
}

// Start the game
createInvaders();
gameInterval = setInterval(draw, 1000 / 60);  // 60 FPS
