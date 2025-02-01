// Game constants and variables
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth; // Make canvas width dynamic
canvas.height = window.innerHeight; // Make canvas height dynamic

let player, bullets, invaders, gameOver, rightPressed, leftPressed, spacePressed;
let score = 0;
let level = 1;
let invaderSpeed = 0.3;
let invaderDirection = 1; // 1 for right, -1 for left
let invaderRowCount = 3;
let invaderColumnCount = 5;
let glueEffectDuration = 3000; // 3 seconds for glue effect
let gameInterval;
let leaderboard = []; // To store top 3 player scores

let restartButton = {
  x: canvas.width / 2 - 100,
  y: canvas.height / 2 + 60,
  width: 200,
  height: 50,
  text: "Touch to Restart",
};

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
let fireCooldown = 500; // Milliseconds between shots
let lastFireTime = 0;

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
let touchStartX = 0; // for touch movement tracking

// Trigger to start background music after first interaction
let musicStarted = false;

// Touchstart event to trigger background music and track player movement
canvas.addEventListener('touchstart', function (e) {
  e.preventDefault(); // Prevent default touch behavior (like scrolling)

  if (!musicStarted) {
    backgroundMusic.play(); // Play background music after first touch
    musicStarted = true; // Prevent restarting background music on subsequent touches
  }

  touchStartX = e.touches[0].clientX; // Track the starting X position of touch

  // Check if restart button is pressed
  if (
    e.touches[0].clientX > restartButton.x &&
    e.touches[0].clientX < restartButton.x + restartButton.width &&
    e.touches[0].clientY > restartButton.y &&
    e.touches[0].clientY < restartButton.y + restartButton.height
  ) {
    restartGame();
  }
});

// Touchmove event to track player movement
canvas.addEventListener('touchmove', function (e) {
  e.preventDefault();
  let touchEndX = e.touches[0].clientX; // Track the current X position of touch
  if (touchEndX < touchStartX && player.x > 0) {
    player.x -= player.speed; // Move left
  } else if (touchEndX > touchStartX && player.x < canvas.width - player.width) {
    player.x += player.speed; // Move right
  }
  touchStartX = touchEndX; // Update the touch start X to current position for continuous movement
});

// Function to shoot a bullet
function shootBullet() {
  if (gameOver) return;

  const now = Date.now();
  if (now - lastFireTime < fireCooldown) return; // Enforce cooldown

  let bullet = {
    x: player.x + player.width / 2 - 2,
    y: player.y,
    width: 4,
    height: 10,
    dy: -bulletSpeed,
    color: level > 5 ? 'cyan' : 'red', // Cyan bullets after level 5
  };
  bullets.push(bullet);

  // Play the shoot sound
  shootSound.play();
  lastFireTime = now;
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
        glued: false, // Track if invader is glued
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
    ctx.fillStyle = bullets[i].color;
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

// Function to detect collisions and apply glue effect
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
            if (bullets[i].color === 'red' || bullets[i].color === 'cyan') {
              invader.glued = true;
              setTimeout(() => (invader.glued = false), glueEffectDuration);
            }

            invader.status = 0; // Destroy the invader
            bullets.splice(i, 1); // Remove the bullet
            score += 10; // Increase score

            if (checkWin()) {
              level++;
              fireCooldown = level > 5 ? 300 : 500; // Reduce cooldown for faster shooting after level 5
              invaderSpeed = Math.min(invaderSpeed + 0.2, 2); // Increase speed as levels go up, up to a max speed
              if (level <= 5) {
                invaderRowCount = Math.min(invaderRowCount + 1, 4); // Increase rows slightly
                invaderColumnCount = Math.min(invaderColumnCount + 1, 7); // Increase columns slowly
              }
              createInvaders(); // Regenerate the invaders with updated count and speed
            }
            break;
          }
        }
      }
    }
  }
}

// Function to draw the leaderboard
function drawLeaderboard() {
  ctx.fillStyle = 'white';
  ctx.font = '20px Arial';
  ctx.fillText('Leaderboard:', canvas.width / 2 - 80, canvas.height / 2 + 120);
  leaderboard.sort((a, b) => b.score - a.score).slice(0, 3).forEach((entry, index) => {
    ctx.fillText(
      `${index + 1}. ${entry.name}: ${entry.score}`,
      canvas.width / 2 - 80,
      canvas.height / 2 + 150 + index * 20
    );
  });
}

// Main game loop
function draw() {
  if (gameOver) {
    return;
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas
  drawPlayer();
  drawBullets();
  drawInvaders();
  detectCollisions();
  movePlayer();
  moveInvaders();

  ctx.fillStyle = 'red';
  ctx.fillRect(restartButton.x, restartButton.y, restartButton.width, restartButton.height);
  ctx.fillStyle = 'white';
  ctx.font = '20px Arial';
  ctx.fillText(restartButton.text, restartButton.x + 25, restartButton.y + 30);
}
