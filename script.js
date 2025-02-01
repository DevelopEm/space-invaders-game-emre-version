// Add glue effect and bullet color changes
const bulletColors = {
  normal: '#FF0000',
  cyan: '#00FFFF',
  yellow: '#FFFF00',
  purple: '#800080',
};

let bulletEffect = 'normal';  // Default color for bullets

// Function to shoot a bullet with glue effect
function shootBullet() {
  if (gameOver) return;
  let bullet = {
    x: player.x + player.width / 2 - 2,
    y: player.y,
    width: 4,
    height: 10,
    dy: -bulletSpeed,
    color: bulletColors[bulletEffect], // Set the bullet color
  };
  bullets.push(bullet);
  shootSound.play();
}

// Function to draw bullets with color
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

// Update bullet color based on level
function updateBulletColor() {
  if (level >= 26) {
    bulletEffect = 'purple';
  } else if (level >= 16) {
    bulletEffect = 'yellow';
  } else if (level >= 6) {
    bulletEffect = 'cyan';
  } else {
    bulletEffect = 'normal';
  }
}

// Create leaderboard functionality
let leaderboard = JSON.parse(localStorage.getItem('leaderboard')) || [];

function addToLeaderboard(name, score) {
  leaderboard.push({ name, score });
  leaderboard.sort((a, b) => b.score - a.score); // Sort by score in descending order
  leaderboard = leaderboard.slice(0, 3); // Keep only top 3 players
  localStorage.setItem('leaderboard', JSON.stringify(leaderboard)); // Store in localStorage
}

// Show leaderboard screen
function showLeaderboard() {
  let leaderboardText = 'Leaderboard:\n';
  leaderboard.forEach((entry, index) => {
    leaderboardText += `${index + 1}. ${entry.name} - ${entry.score}\n`;
  });

  alert(leaderboardText);
}

// Game Over screen with fancy effects
function drawGameOver() {
  if (!gameOverSound.played) {
    gameOverSound.play();
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear canvas
  ctx.fillStyle = 'white';
  ctx.font = '40px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 40);

  ctx.font = '24px Arial';
  ctx.fillText(`Level: ${level}`, canvas.width / 2, canvas.height / 2);
  ctx.fillText(`Score: ${score}`, canvas.width / 2, canvas.height / 2 + 30);

  ctx.font = '20px Arial';
  ctx.fillText('Click to Restart or View Leaderboard', canvas.width / 2, canvas.height / 2 + 80);
}

// When the game ends, prompt the player to enter their name
function gameOverCondition() {
  gameOver = true;
  drawGameOver();
  clearInterval(gameInterval);

  // Prompt for name and store the score
  let playerName = prompt('Enter your name:');
  if (playerName) {
    addToLeaderboard(playerName, score);
  }

  setTimeout(() => {
    let action = prompt('Type "restart" to restart or "leaderboard" to view leaderboard');
    if (action === 'restart') {
      restartGame();
    } else if (action === 'leaderboard') {
      showLeaderboard();
    }
  }, 1000);
}

// Update invader creation logic to handle difficulty and leaderboard
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
      invaders[c][r].image.src = 'invader.png';
    }
  }
}

// Main game loop update to include level-based changes
function draw() {
  if (gameOver) return;

  updateBulletColor(); // Update bullet color based on level
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

// Restart the game and reset everything
function restartGame() {
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

// Initialize the game
createInvaders();
gameInterval = setInterval(draw, 1000 / 60);
