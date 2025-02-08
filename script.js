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

// Leaderboard storage
let leaderboard = [];

// Ask for player name and store in a variable
let playerName = prompt("Enter your name:");
if (!playerName) {
  playerName = "Anonymous";  // Default name if the prompt is canceled or empty
}

// Create stars for the background
function createStars() {
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 3 + 1, // Random size between 1 and 4
      speed: Math.random() * 0.5 + 0.1, // Random speed for twinkling effect
      opacity: Math.random() * 0.5 + 0.5, // Random opacity
    });
  }
}

// Function to draw the gradient background
function drawBackground() {
  // Create gradient (black to dark blue)
  let gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, '#000000'); // Black at the top
  gradient.addColorStop(1, '#00008B'); // Dark blue at the bottom

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height); // Fill the canvas with the gradient
}

// Function to draw stars
function drawStars() {
  for (let i = 0; i < stars.length; i++) {
    let star = stars[i];
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2, false);
    ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`; // White with varying opacity
    ctx.fill();
    star.y += star.speed; // Move stars downwards
    
    // Reset star to top if it goes off the bottom of the screen
    if (star.y > canvas.height) {
      star.y = 0;
      star.x = Math.random() * canvas.width; // Random horizontal position
    }
  }
}

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
  };
  bullets.push(bullet);

  // Play the shoot sound
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

// Function to draw the score
function drawScore() {
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '16px Arial';
  ctx.fillText('Score: ' + score, 10, 30);
}

// Function to handle game over condition
function gameOverCondition() {
  gameOver = true;
  saveLeaderboard();  // Save the leaderboard before showing the game over screen
}

// Function to handle restarting the game
function restartGame() {
  // Reset game variables
  score = 0;
  level = 1;
  invaderSpeed = 0.3;
  invaderRowCount = 3;
  invaderColumnCount = 5;
  gameOver = false;

  // Recreate invaders and player
  createInvaders();
  player.x = canvas.width / 2 - 20;
  bullets = [];

  // Restart background music and gameplay
  backgroundMusic.currentTime = 0; // Reset music to start
  backgroundMusic.play();
  gameInterval = setInterval(gameLoop, 1000 / 60); // Restart the game loop
}

// Function to save leaderboard to localStorage
function saveLeaderboard() {
  leaderboard.push({
    name: playerName,
    score: score,
    level: level
  });

  // Sort leaderboard by score and level, descending order
  leaderboard.sort((a, b) => b.score - a.score || b.level - a.level);

  // Limit leaderboard to top 5 players
  leaderboard = leaderboard.slice(0, 5);

  // Store in localStorage
  localStorage.setItem('leaderboard', JSON.stringify(leaderboard));
}

// Function to load leaderboard from localStorage
function loadLeaderboard() {
  const storedLeaderboard = localStorage.getItem('leaderboard');
  if (storedLeaderboard) {
    leaderboard = JSON.parse(storedLeaderboard);
  }
}

  // Check if game over sound has already been played
  if (!gameOverSoundPlayed) {
    gameOverSound.play();  // Play the game over sound
    gameOverSoundPlayed = true;  // Set the flag to true to prevent re-playing the sound
  }
// Flag to track whether game over sound has been played
let gameOverSoundPlayed = false;

function gameOverCondition() {
  gameOver = true;

  // Check if game over sound has already been played
  if (!gameOverSoundPlayed) {
    gameOverSound.play();  // Play the game over sound
    gameOverSoundPlayed = true;  // Set the flag to true to prevent re-playing the sound
  }

  saveLeaderboard();  // Save the leaderboard before showing the game over screen
}

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
  ctx.fillText('Click to Restart', canvas.width / 2 - 80, canvas.height / 2 + restartTextHeight);

  // Draw leaderboard heading
  ctx.fillText('Leaderboard:', canvas.width / 2 - 80, canvas.height / 2 + 100);

  // Draw top 5 scores
  const maxLeaderboardEntries = 5;  // Limit the leaderboard to top 5
  for (let i = 0; i < Math.min(leaderboard.length, maxLeaderboardEntries); i++) {
    ctx.fillText(
      `${leaderboard[i].name} - Score: ${leaderboard[i].score} - Level: ${leaderboard[i].level}`,
      canvas.width / 2 - 150, canvas.height / 2 + 140 + (i * 30)
    );
  }
}

// Main game loop
function gameLoop() {
  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw background and stars
  drawBackground();
  drawStars();

  // Draw player and game elements
  if (gameOver) {
    drawGameOver();
    return;
  }

  drawPlayer();
  drawBullets();
  drawInvaders();
  movePlayer();
  moveInvaders();
  detectCollisions();
  drawScore();
}

// Start the game loop and load leaderboard on game start
loadLeaderboard();
gameInterval = setInterval(gameLoop, 1000 / 60); // 60 frames per second
