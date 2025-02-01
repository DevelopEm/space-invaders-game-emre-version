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
let playerName = "";
let leaderboard = [];

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

// Game Over Screen Style
const gameOverTextStyle = {
  font: '30px "Press Start 2P", cursive',
  color: '#FFFF00', // Yellow color for space theme
};

const restartButtonStyle = {
  font: '20px "Press Start 2P", cursive',
  color: '#FFFF00', // Yellow text color
  bgColor: '#FF0000', // Red button color
  padding: '10px 20px',
  borderRadius: '5px',
  cursor: 'pointer',
  textAlign: 'center',
  text: 'Click to Restart',
  width: 200,
};

// Leaderboard functionality
function updateLeaderboard(playerName, score) {
  leaderboard.push({ name: playerName, score: score });
  leaderboard.sort((a, b) => b.score - a.score); // Sort leaderboard by score (desc)
  if (leaderboard.length > 5) {
    leaderboard = leaderboard.slice(0, 5); // Keep only the top 5
  }
}

// Draw Game Over screen
function drawGameOver() {
  ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear canvas
  
  // Game Over Text
  ctx.fillStyle = gameOverTextStyle.color;
  ctx.font = gameOverTextStyle.font;
  ctx.fillText('GAME OVER', canvas.width / 2 - 100, canvas.height / 2 - 40);

  // Score and Level Text
  ctx.fillStyle = gameOverTextStyle.color;
 
