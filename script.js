// Game constants and variables
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let player, bullets, invaders, gameOver, rightPressed, leftPressed, spacePressed;
let score = 0;
let level = 1;
let invaderSpeed = 0.3;
let invaderDirection = 1;
let invaderRowCount = 3;
let invaderColumnCount = 5;
let gameInterval;
let restartTextHeight = 60; 

// Bullet properties
let bulletSpeed = 4;
let bulletColor = '#FF0000'; // Initial bullet color (red)

// Player object (spaceship)
player = {
  x: canvas.width / 2 - 20,
  y: canvas.height - 100, 
  width: 40,
  height: 40,
  speed: 5,
  dx: 0,
  image: new Image(),
};
player.image.src = 'spaceship.png';

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
const shootSound = new Audio('shoot.wav');
const gameOverSound = new Audio('GameOver.mp3');
const backgroundMusic = new Audio('BackgroundMusic.wav');
backgroundMusic.loop = true;
backgroundMusic.volume = 0.3;

let touchStartX = 0;
let touchStartY = 0;
let musicStarted = false;

// Touch event listeners for mobile control
canvas.addEventListener('touchstart', function(e) {
  e.preventDefault();  
  
  if (!musicStarted) {
    backgroundMusic.play(); 
    musicStarted = true; 
  }

  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
});

canvas.addEventListener('touchmove', function(e) {
  e.preventDefault();
  let touchEndX = e.touches[0].clientX;
  if (touchEndX < touchStartX && player.x > 0) {
    player.x -= player.speed;
  } else if (touchEndX > touchStartX && player.x < canvas.width - player.width) {
    player.x += player.speed;
  }
  touchStartX = touchEndX;
});

canvas.addEventListener('touchstart', function(e) {
  if (!gameOver) {
    shootBullet();
  } else {
    restartGame();
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
    color: bulletColor, // Set the bullet color
    trail: []  // To store glue trail effect
  };
  bullets.push(bullet);
  shootSound.play();
}

// Function to adjust bullet color and speed based on level
function updateBulletProperties() {
  if (level >= 26) {
    bulletColor = 'purple';
    bulletSpeed = 6;  // Faster bullets
  } else if (level >= 17) {
    bulletColor = 'yellow';
    bulletSpeed = 5;  // Slightly faster bullets
  } else if (level >= 7) {
    bulletColor = 'cyan';
    bulletSpeed = 5;  // Faster bullets
  }
}

// Function to draw the player (spaceship)
function drawPlayer() {
  ctx.drawImage(player.image, player.x, player.y, player.width, player.height);
}

// Function to draw bullets with glue effect
function drawBullets() {
  for (let i = 0; i < bullets.length; i++) {
    if (bullets[i].y < 0) {
      bullets.splice(i, 1);
      continue;
    }

    ctx.fillStyle = bullets[i].color;
    ctx.fillRect(bullets[i].x, bullets[i].y, bullets[i].width, bullets[i].height);

    // Draw the glue trail
    ctx.fillStyle = bullets[i].color;
    for (let j = 0; j < bullets[i].trail.length; j++) {
      ctx.fillRect(bullets[i].trail[j].x, bullets[i].trail[j].y, bullets[i].width, bullets[i].height);
    }
    
    bullets[i].y += bullets[i].dy;
    
    // Add to the trail
    bullets[i].trail.push({x: bullets[i].x, y: bullets[i].y});
    if (bullets[i].trail.length > 10) {
      bullets[i].trail.shift(); // Keep the trail length limited
    }
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
            score += 10; 
            if (checkWin()) {
              level++;
              updateBulletProperties();  // Update bullet properties based on level
              createInvaders();  // Regenerate the invaders
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

        if (invader.x + invaderWidth > canvas.width || invader.x < 0) {
          invaderDirection = -invaderDirection;
          shouldMoveDown = true;
        }

        if (invader.y + invaderHeight >= player.y) {
          gameOverCondition();
          return;
        }
      }
    }
  }

  if (shouldMoveDown) {
    for (let c = 0; c < invaderColumnCount; c++) {
      for (let r = 0; r < invaderRowCount; r++) {
        if (invaders[c][r].status === 1) {
          invaders[c][r].y += invaderHeight;
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

// Function to draw the game over screen with summary
function drawGameOver() {
  if (!gameOverSound.played) {
    gameOverSound.play();
  }

  ctx.fillStyle = 'white';
  ctx.font = '30px Arial';
  ctx.fillText('GAME OVER', canvas.width / 2 - 100, canvas.height / 2 - 40);
  ctx.font = '20px Arial';
  ctx.fillText('Level: ' + level, canvas.width / 2 - 40, canvas.height / 2);
  ctx.fillText('Score: ' + score, canvas.width / 2 - 40, canvas.height / 2 + 30);
  ctx.fillText('Click to Restart', canvas.width / 2 - 80, canvas.height / 2 + restartTextHeight);

  // Leaderboard prompt after game over
  setTimeout(function() {
    let playerName = prompt('Enter your name to submit your score:');
    if (playerName) {
      let leaderboard = JSON.parse(localStorage.getItem('leaderboard')) || [];
      leaderboard.push({ name: playerName, score: score });
      leaderboard.sort((a, b) => b.score - a.score);
      leaderboard = leaderboard.slice(0, 3); // Top 3 players
      localStorage.setItem('leaderboard', JSON.stringify(leaderboard));

      // Show top 3 players
      alert('Top 3 Players:\n' + leaderboard.map((entry, index) => `${index + 1}. ${entry.name}: ${entry.score}`).join('\n'));
    }
  }, 500);
}

// Function to end the game
function gameOverCondition() {
  gameOver = true;
  drawGameOver();
  clearInterval(gameInterval);
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
    backgroundMusic.play();
    gameInterval = setInterval(draw, 1000 / 60);
  }
}

// Main game loop
function draw() {
  if (gameOver) {
    return;
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height); 
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
createInvaders();
gameInterval = setInterval(draw, 1000 / 60); 
