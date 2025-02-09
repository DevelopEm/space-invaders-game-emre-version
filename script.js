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
      rotation: Math.random() * 360,  // Rotation angle for 5D effect
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

// Function to get bullet glow effect based on level
function getBulletGlow(level) {
  if (level >= 20) {
    return 10; // Glowing effect after level 20
  } else if (level >= 10) {
    return 5; // Glowing effect after level 10
  } else {
    return 0; // No glowing effect for levels below 10
  }
}

// Function to update bullet positions
function updateBullets() {
  for (let i = 0; i < bullets.length; i++) {
    let bullet = bullets[i];
    bullet.y += bullet.dy;

    // Remove bullets that go off the screen
    if (bullet.y < 0) {
      bullets.splice(i, 1);
      i--;
    }
  }
}

// Create invaders
function createInvaders() {
  invaders = [];
  for (let row = 0; row < invaderRowCount; row++) {
    invaders[row] = [];
    for (let col = 0; col < invaderColumnCount; col++) {
      let invader = {
        x: col * (invaderWidth + invaderPadding) + invaderOffsetLeft,
        y: row * (invaderHeight + invaderPadding) + invaderOffsetTop,
        width: invaderWidth,
        height: invaderHeight,
        color: getInvaderColor(level),  // Set invader color based on level
      };
      invaders[row].push(invader);
    }
  }
}

// Function to get invader color based on level
function getInvaderColor(level) {
  if (level >= 20) {
    return 'green';  // Green invaders after level 20
  } else if (level >= 15) {
    return 'pink';  // Pink invaders after level 15
  } else if (level >= 10) {
    return 'yellow';  // Yellow invaders after level 10
  } else if (level >= 5) {
    return 'cyan';  // Cyan invaders after level 5
  } else {
    return 'white';  // Default white invaders
  }
}

// Function to draw invaders
function drawInvaders() {
  for (let row = 0; row < invaderRowCount; row++) {
    for (let col = 0; col < invaderColumnCount; col++) {
      let invader = invaders[row][col];
      ctx.fillStyle = invader.color;
      ctx.fillRect(invader.x, invader.y, invader.width, invader.height);
    }
  }
}

// Function to move invaders
function moveInvaders() {
  let edgeReached = false;

  for (let row = 0; row < invaderRowCount; row++) {
    for (let col = 0; col < invaderColumnCount; col++) {
      let invader = invaders[row][col];
      invader.x += invaderSpeed * invaderDirection;

      // Check if any invader has reached the edge of the screen
      if (invader.x + invader.width > canvas.width || invader.x < 0) {
        edgeReached = true;
      }
    }
  }

  // If edge is reached, move invaders down and reverse direction
  if (edgeReached) {
    invaderDirection *= -1;
    for (let row = 0; row < invaderRowCount; row++) {
      for (let col = 0; col < invaderColumnCount; col++) {
        invaders[row][col].y += invaderHeight;
      }
    }
  }
}

// Function to check collision between bullets and invaders
function checkCollisions() {
  for (let i = 0; i < bullets.length; i++) {
    let bullet = bullets[i];

    for (let row = 0; row < invaderRowCount; row++) {
      for (let col = 0; col < invaderColumnCount; col++) {
        let invader = invaders[row][col];

        if (bullet.x > invader.x && bullet.x < invader.x + invader.width &&
          bullet.y > invader.y && bullet.y < invader.y + invader.height) {
          // Remove invader and bullet upon collision
          invaders[row].splice(col, 1);
          bullets.splice(i, 1);
          i--;  // Adjust index after removing bullet
          score += 10;

          // Check if all invaders are destroyed
          if (invaders.length === 0 || invaders[0].length === 0) {
            level++;
            invaderSpeed += 0.1;  // Increase invader speed as the level goes up
            invaderRowCount++;     // Increase the number of invaders per row
            invaderColumnCount++;  // Increase the number of invaders per column
            createInvaders();  // Regenerate invaders for next level
          }

          break;
        }
      }
    }
  }
}

// Function to move player based on key or touch input
function movePlayer() {
  if (rightPressed && player.x < canvas.width - player.width) {
    player.x += player.speed;
  } else if (leftPressed && player.x > 0) {
    player.x -= player.speed;
  }
}

// Function to draw player
function drawPlayer() {
  ctx.drawImage(player.image, player.x, player.y, player.width, player.height);
}

// Draw score, level, and restart game instructions
function drawScore() {
  ctx.font = '24px Arial';
  ctx.fillStyle = 'white';
  ctx.fillText('Score: ' + score, 20, 30);
  ctx.fillText('Level: ' + level, canvas.width - 100, 30);
}

function drawGameOver() {
  ctx.font = '48px Arial';
  ctx.fillStyle = 'red';
  ctx.fillText('GAME OVER', canvas.width / 2 - 150, canvas.height / 2 - 20);
  ctx.font = '24px Arial';
  ctx.fillStyle = 'white';
  ctx.fillText('Tap to restart', canvas.width / 2 - 80, canvas.height / 2 + restartTextHeight);
}

// Function to restart the game
function restartGame() {
  gameOver = false;
  score = 0;
  level = 1;
  invaderSpeed = 0.3;
  invaderDirection = 1;
  invaderRowCount = 3;
  invaderColumnCount = 5;
  createInvaders();
  createStars();
}

// Main game loop
function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBackground();
  drawStars();
  movePlayer();
  drawPlayer();
  moveInvaders();
  drawInvaders();
  updateBullets();
  checkCollisions();
  drawScore();

  if (gameOver) {
    drawGameOver();
  } else {
    requestAnimationFrame(gameLoop);
  }
}

// Start the game
createInvaders();
createStars();
gameLoop();
