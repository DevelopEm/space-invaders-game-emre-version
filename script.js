const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Set canvas size
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Game variables
let player, bullets, invaders, gameOver, score, level;
let leaderboard = [];
let playerName = "";

// Initialize game objects and start the game
function init() {
  player = {
    x: canvas.width / 2 - 20,
    y: canvas.height - 100,
    width: 40,
    height: 40,
    speed: 5,
    dx: 0,
    image: new Image(),
  };
  player.image.src = 'spaceship.png'; // Set image source

  bullets = [];
  invaders = [];
  score = 0;
  level = 1;
  gameOver = false;

  createInvaders();
  gameInterval = setInterval(draw, 1000 / 60); // Start game loop
}

// Create invaders
function createInvaders() {
  invaders = [];
  for (let c = 0; c < 5; c++) {
    invaders[c] = [];
    for (let r = 0; r < 3; r++) {
      invaders[c][r] = {
        x: c * 50 + 30,
        y: r * 40 + 30,
        status: 1,
      };
    }
  }
}

// Draw player
function drawPlayer() {
  ctx.drawImage(player.image, player.x, player.y, player.width, player.height);
}

// Draw bullets
function drawBullets() {
  for (let i = 0; i < bullets.length; i++) {
    if (bullets[i].y < 0) {
      bullets.splice(i, 1);
      continue;
    }
    ctx.fillStyle = '#FF0000';
    ctx.fillRect(bullets[i].x, bullets[i].y, bullets[i].width, bullets[i].height);
    bullets[i].y -= 4;
  }
}

// Draw invaders
function drawInvaders() {
  for (let c = 0; c < invaders.length; c++) {
    for (let r = 0; r < invaders[c].length; r++) {
      if (invaders[c][r].status === 1) {
        ctx.fillStyle = '#00FF00';
        ctx.fillRect(invaders[c][r].x, invaders[c][r].y, 40, 40);
      }
    }
  }
}

// Move player
function movePlayer() {
  if (player.dx < 0 && player.x > 0) {
    player.x += player.dx;
  } else if (player.dx > 0 && player.x < canvas.width - player.width) {
    player.x += player.dx;
  }
}

// Detect collisions between bullets and invaders
function detectCollisions() {
  for (let i = 0; i < bullets.length; i++) {
    for (let c = 0; c < invaders.length; c++) {
      for (let r = 0; r < invaders[c].length; r++) {
        if (invaders[c][r].status === 1) {
          if (
            bullets[i].x > invaders[c][r].x &&
            bullets[i].x < invaders[c][r].x + 40 &&
            bullets[i].y > invaders[c][r].y &&
            bullets[i].y < invaders[c][r].y + 40
          ) {
            invaders[c][r].status = 0;
            bullets.splice(i, 1);
            score += 10;
            break;
          }
        }
      }
    }
  }
}

// Handle player movement with arrow keys
function handleKeyPress(e) {
  if (e.key === 'ArrowLeft') player.dx = -player.speed;
  if (e.key === 'ArrowRight') player.dx = player.speed;
}

function handleKeyUp(e) {
  if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') player.dx = 0;
}

// Shoot bullets when spacebar is pressed
function shootBullet() {
  let bullet = {
    x: player.x + player.width / 2 - 2,
    y: player.y,
    width: 4,
    height: 10,
  };
  bullets.push(bullet);
}

// Move invaders downwards and left/right
function moveInvaders() {
  for (let c = 0; c < invaders.length; c++) {
    for (let r = 0; r < invaders[c].length; r++) {
      if (invaders[c][r].status === 1) {
        invaders[c][r].x += level * 0.5;
        if (invaders[c][r].x > canvas.width - 40 || invaders[c][r].x < 0) {
          for (let c2 = 0; c2 < invaders.length; c2++) {
            for (let r2 = 0; r2 < invaders[c2].length; r2++) {
              invaders[c2][r2].y += 40;
            }
          }
          break;
        }
      }
    }
  }
}

// Draw score and level
function drawScoreAndLevel() {
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '16px Arial';
  ctx.fillText('Score: ' + score, 20, 20);
  ctx.fillText('Level: ' + level, canvas.width - 100, 20);
}

// Draw Game Over screen
function drawGameOver() {
  ctx.fillStyle = 'white';
  ctx.font = '30px Arial';
  ctx.fillText('GAME OVER', canvas.width / 2 - 100, canvas.height / 2 - 40);
  ctx.font = '20px Arial';
  ctx.fillText('Score: ' + score, canvas.width / 2 - 40, canvas.height / 2);

  // Red button for restarting the game
  ctx.fillStyle = '#FF0000';
  ctx.beginPath();
  ctx.arc(canvas.width / 2, canvas.height / 2 + 50, 60, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '18px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Touch to Restart', canvas.width / 2, canvas.height / 2 + 55);
}

// Ask for player name
function askForName() {
  const input = document.createElement('input');
  input.type = 'text';
  input.placeholder = 'Enter your name';
  input.style.position = 'absolute';
  input.style.top = '50%';
  input.style.left = '50%';
  input.style.transform = 'translate(-50%, -50%)';
  input.style.fontSize = '18px';
  input.style.padding = '10px';
  input.style.borderRadius = '5px';
  document.body.appendChild(input);

  input.addEventListener('blur', function () {
    playerName = input.value;
    leaderboard.push({ name: playerName, score: score });
    leaderboard.sort((a, b) => b.score - a.score);
    leaderboard = leaderboard.slice(0, 3); // Keep top 3 scores
    input.remove();
    showLeaderboard();
  });

  input.focus();
}

// Show leaderboard screen
function showLeaderboard() {
  ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear canvas
  ctx.fillStyle = 'yellow';
  ctx.font = '30px Arial';
  ctx.fillText('Leaderboard', canvas.width / 2 - 90, 50);

  ctx.font = '20px Arial';
  for (let i = 0; i < leaderboard.length; i++) {
    ctx.fillText(`${i + 1}. ${leaderboard[i].name}: ${leaderboard[i].score}`, canvas.width / 2 - 100, 100 + i * 30);
  }

  // Show the red button to restart the game
  ctx.fillStyle = '#FF0000';
  ctx.beginPath();
  ctx.arc(canvas.width / 2, canvas.height / 2 + 150, 60, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '18px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Touch to Restart', canvas.width / 2, canvas.height / 2 + 155);
}

// Restart the game when clicked
function restartGame() {
  score = 0;
  level = 1;
  playerName = "";
  gameOver = false;
  createInvaders();
  init(); // Restart game loop
}

// Handle restart button click
canvas.addEventListener('click', function(e) {
  if (gameOver) {
    // Check if "Touch to Restart" button is clicked
    const dist = Math.sqrt(Math.pow(e.x - canvas.width / 2, 2) + Math.pow(e.y - canvas.height / 2 + 50, 2));
    if (dist < 60) {
      restartGame();
    }
  } else {
    // If game is over, show player name input and leaderboard
    if (!playerName) {
      askForName();
    }
  }
});

// Main game loop
function draw() {
  if (gameOver) {
    drawGameOver();
    return;
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas
  movePlayer();
  moveInvaders();
  drawPlayer();
  drawBullets();
  drawInvaders();
  drawScoreAndLevel();
  detectCollisions();
}

// Start the game
init();
