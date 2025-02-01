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
let shootRate = 400; // Initial shooting rate (in ms)

// Player object
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
const bulletSpeed = 4;

// Invader object
invaders = [];
const invaderWidth = 40;
const invaderHeight = 40;
const invaderPadding = 10;
const invaderOffsetTop = 30;
const invaderOffsetLeft = 30;

// Sounds
const shootSound = new Audio('shoot.wav');
const gameOverSound = new Audio('GameOver.mp3');
const backgroundMusic = new Audio('BackgroundMusic.wav');

backgroundMusic.loop = true;
backgroundMusic.volume = 0.3;
let musicStarted = false;

canvas.addEventListener('touchstart', function(e) {
  e.preventDefault();
  if (!musicStarted) {
    backgroundMusic.play();
    musicStarted = true;
  }
  shootBullet();
});

function shootBullet() {
  if (gameOver) return;
  let bulletColor = level > 5 ? 'cyan' : 'red';
  let bullet = {
    x: player.x + player.width / 2 - 2,
    y: player.y,
    width: 4,
    height: 10,
    dy: -bulletSpeed,
    color: bulletColor,
    glueEffect: true, // Both red and cyan bullets slow invaders
  };
  bullets.push(bullet);
  shootSound.play();
}

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
            invader.status = 0;
            bullets.splice(i, 1);
            score += 10;

            // Glue effect slows down invaders
            if (invaderSpeed > 0.1) invaderSpeed -= 0.05;

            if (checkWin()) {
              level++;
              invaderSpeed = Math.min(invaderSpeed + 0.2, 2);
              if (level <= 5) {
                invaderRowCount = Math.min(invaderRowCount + 1, 4);
                invaderColumnCount = Math.min(invaderColumnCount + 1, 7);
              }
              createInvaders();
            }
            break;
          }
        }
      }
    }
  }
}

function drawScore() {
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '16px Arial';
  ctx.fillText('Score: ' + score, 8, 20);
}

function drawLevel() {
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '16px Arial';
  ctx.fillText('Level: ' + level, canvas.width - 80, 20);
}

function draw() {
  if (gameOver) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawPlayer();
  drawBullets();
  drawInvaders();
  drawScore();
  drawLevel();
  detectCollisions();
  movePlayer();
  moveInvaders();

  // Increase shooting speed if score is high
  if (score >= 500) shootRate = 200;
}

createInvaders();
gameInterval = setInterval(draw, 1000 / 60);
