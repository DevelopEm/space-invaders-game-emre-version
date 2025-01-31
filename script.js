// Game constants and variables
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;  // Make canvas width dynamic
canvas.height = window.innerHeight; // Make canvas height dynamic

let player, bullets, invaders, invaderBullets, gameOver, rightPressed, leftPressed, spacePressed;
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

// Invader object
invaders = [];
const invaderWidth = 40;
const invaderHeight = 40;
const invaderPadding = 10;
const invaderOffsetTop = 30;
const invaderOffsetLeft = 30;

// Invader bullets
invaderBullets = [];
const invaderBulletSpeed = 1;
const invaderBulletCooldown = 1000; // 1 second cooldown for invaders to shoot

gameOver = false;

// Sounds
const shootSound = new Audio('shoot.wav'); // Path to shoot sound
const gameOverSound = new Audio('GameOver.mp3'); // Path to game over sound
const backgroundMusic = new Audio('BackgroundMusic.wav'); // Path to background music

// Background music settings
backgroundMusic.loop = true; // Loop background music
backgroundMusic.volume = 0.3; // Adjust volume if needed

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
        lastShotTime: 0, // To track the time when invader last shot
        image: new Image(),
      };
      invaders[c][r].image.src = 'invader.png'; // Path to invader image
    }
  }
}

// Function to make invaders shoot (level 5 and beyond)
function invaderShoot() {
  if (level < 5) return; // Don't shoot before level 5
  
  const shootingChance = 0.005;  // 0.5% chance for each invader

  const currentTime = Date.now();

  for (let c = 0; c < invaderColumnCount; c++) {
    for (let r = 0; r < invaderRowCount; r++) {
      let invader = invaders[c][r];
      if (invader.status === 1 && currentTime - invader.lastShotTime > invaderBulletCooldown) {
        if (Math.random() < shootingChance) {  // Only shoot based on chance
          let bullet = {
            x: invader.x + invaderWidth / 2 - 2,
            y: invader.y + invaderHeight,  // Position the bullet just below the invader
            width: 4,
            height: 10,
            dy: invaderBulletSpeed,  // Move the bullet downward
          };
          invaderBullets.push(bullet);  // Add the bullet to the invader bullets array
          invader.lastShotTime = currentTime;  // Update the last shot time for the invader
        }
      }
    }
  }
}

// Function to move invader bullets
function moveInvaderBullets() {
  for (let i = 0; i < invaderBullets.length; i++) {
    invaderBullets[i].y += invaderBullets[i].dy;
    if (invaderBullets[i].y > canvas.height) {
      invaderBullets.splice(i, 1); // Remove bullet when off-screen
      i--;
    }
  }
}

// Function to draw invader bullets
function drawInvaderBullets() {
  ctx.fillStyle = '#00FF00';  // Bullet color (Green for invader bullets)
  for (let i = 0; i < invaderBullets.length; i++) {
    ctx.fillRect(invaderBullets[i].x, invaderBullets[i].y, invaderBullets[i].width, invaderBullets[i].height);
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
            break;
          }
        }
      }
    }
  }

  // Check for collision with invader bullets (hit the player)
  for (let i = 0; i < invaderBullets.length; i++) {
    if (
      invaderBullets[i].x > player.x &&
      invaderBullets[i].x < player.x + player.width &&
      invaderBullets[i].y > player.y &&
      invaderBullets[i].y < player.y + player.height
    ) {
      gameOverCondition(); // End the game when player is hit
    }
  }
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

// Function to draw the game
function draw() {
  if (gameOver) {
    return;
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas
  drawPlayer();
  drawBullets();
  drawInvaders();
  drawInvaderBullets();
  drawScore();
  drawLevel();
  detectCollisions();
  movePlayer();
  moveInvaders();
  invaderShoot();  // Check and handle invader shooting
  moveInvaderBullets();  // Move invader bullets
}

// Initialize the game
createInvaders();
gameInterval = setInterval(draw, 1000 / 60); // 60 FPS
