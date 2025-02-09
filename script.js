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
const bulletSpeed = 6;

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

// Variable to track user interaction to start music
let musicStarted = false;

// Touch event listeners for mobile control
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

// Touch event to fire bullets
canvas.addEventListener('touchstart', function(e) {
  if (!gameOver) {
    shootBullet();  // Fire a bullet when the screen is touched
  } else {
    restartGame();  // Restart the game if game over screen is active
  }
});

// Game Over Sound fix - Play sound after user interaction
function playGameOverSound() {
  if (!gameOverSound.played) {
    gameOverSound.play();
    gameOverSound.played = true;
  }
}

// Function to draw the game over screen with summary
function drawGameOver() {
  // Ensure that the game over sound is played only once
  playGameOverSound();

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
