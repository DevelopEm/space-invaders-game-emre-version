// Game constants and variables
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Set canvas to fill the entire window
canvas.width = window.innerWidth;  // Full width of the window
canvas.height = window.innerHeight; // Full height of the window

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

// Trigger to start background music after first interaction
let musicStarted = false;

// Starry background variables
const stars = [];
const starCount = 200; // Number of stars
const starSpeed = 0.5; // Speed of stars

// Star object constructor with shiny effect
function createStar() {
  return {
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    size: Math.random() * 2 + 1,  // Random size between 1 and 3
    speed: Math.random() * starSpeed + 0.1, // Random speed for each star
    baseBrightness: Math.random() * 0.5 + 0.5, // Random brightness
    brightness: Math.random() * 0.5 + 0.5, // Start with a random brightness
    twinkleSpeed: Math.random() * 0.02 + 0.005, // Speed of twinkling effect
  };
}

// Create stars
for (let i = 0; i < starCount; i++) {
  stars.push(createStar());
}

// Function to draw the shiny stars
function drawStarryBackground() {
  for (let i = 0; i < stars.length; i++) {
    const star = stars[i];

    // Update the brightness to create a twinkling effect
    star.brightness += star.twinkleSpeed;
    if (star.brightness > star.baseBrightness + 0.5 || star.brightness < star.baseBrightness - 0.5) {
      star.twinkleSpeed = -star.twinkleSpeed; // Reverse the twinkling direction
    }

    // Create a shiny, glowing effect for each star
    const gradient = ctx.createRadialGradient(star.x, star.y, 0, star.x, star.y, star.size);
    gradient.addColorStop(0, `rgba(255, 255, 255, ${star.brightness})`);
    gradient.addColorStop(1, `rgba(255, 255, 255, 0)`);  // Fade out to transparent

    // Fill the star with the radial gradient
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();
  }

  // Move stars
  for (let i = 0; i < stars.length; i++) {
    stars[i].y += stars[i].speed;
    if (stars[i].y > canvas.height) {
      stars[i].y = 0; // Reset star position when it reaches the bottom
    }
  }
}

// Gradient background for the canvas (e.g., black to dark blue)
function drawGradientBackground() {
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, 'black');  // Start with black
  gradient.addColorStop(1, 'darkblue');  // End with dark blue
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height); // Fill the canvas with the gradient
}

// Mobile touch event listeners for mobile control
let touchStartX = 0;  // for touch movement tracking
let touchStartY = 0;  // for touch movement tracking

// Trigger to start background music after first interaction
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
        const invader = invaders[c][r];
        if (invader.status === 1) {
          if (bullets[i].x < invader.x + invaderWidth &&
              bullets[i].x + bullets[i].width > invader.x &&
              bullets[i].y < invader.y + invaderHeight &&
              bullets[i].y + bullets[i].height > invader.y) {
            // Bullet hit the invader
            invader.status = 0; // Mark invader as destroyed
            bullets.splice(i, 1); // Remove the bullet
            score += 10; // Increase score
            checkLevelUp();
            break;
          }
        }
      }
    }
  }
}

// Function to move the invaders
function moveInvaders() {
  let hitEdge = false;
  for (let c = 0; c < invaderColumnCount; c++) {
    for (let r = 0; r < invaderRowCount; r++) {
      if (invaders[c][r].status === 1) {
        invaders[c][r].x += invaderSpeed * invaderDirection;
        if (invaders[c][r].x <= 0 || invaders[c][r].x >= canvas.width - invaderWidth) {
          hitEdge = true;
        }
      }
    }
  }
  if (hitEdge) {
    invaderDirection *= -1; // Reverse the invader direction
    for (let c = 0; c < invaderColumnCount; c++) {
      for (let r = 0; r < invaderRowCount; r++) {
        invaders[c][r].y += 10; // Move invaders down
      }
    }
  }
}

// Function to check if the invaders reached the player
function checkGameOver() {
  for (let c = 0; c < invaderColumnCount; c++) {
    for (let r = 0; r < invaderRowCount; r++) {
      if (invaders[c][r].status === 1 && invaders[c][r].y + invaderHeight >= player.y) {
        gameOver = true; // End the game if invaders reach player
        gameOverSound.play(); // Play game over sound
      }
    }
  }
}

// Function to check if player has reached a new level
function checkLevelUp() {
  if (score >= level * 100) {
    level++;
    invaderSpeed += 0.05; // Increase invader speed
    if (level % 5 === 0) {
      shootDelay -= 1; // Speed up shooting rate every 5 levels
    }
  }
}

// Function to draw the score and level
function drawScoreAndLevel() {
  ctx.font = '24px Arial';
  ctx.fillStyle = 'white';
  ctx.fillText('Score: ' + score, 20, 30);
  ctx.fillText('Level: ' + level, canvas.width - 100, 30);
}

// Function to restart the game after game over
function restartGame() {
  gameOver = false;
  score = 0;
  level = 1;
  invaderSpeed = 0.05;
  invaderDirection = 1;
  invaderRowCount = 3;
  invaderColumnCount = 5;
  invaders = [];
  createInvaders(); // Create new invaders
  bullets = [];
  drawPlayer();
}

// Main game loop
function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear canvas
  drawGradientBackground(); // Draw gradient background
  drawStarryBackground(); // Draw shiny stars
  drawScoreAndLevel();
  drawBullets();
  moveInvaders();
  drawInvaders();
  drawPlayer();
  detectCollisions();
  checkGameOver();
  if (!gameOver) {
    requestAnimationFrame(gameLoop); // Continue the game loop if not over
  }
}

// Create invaders and start the game loop
createInvaders();
gameLoop();
