// ============================================================
// BREAKOUT
// Smash the brick wall with a bouncing ball. You steer the
// paddle along the bottom; miss the ball and you lose a life.
// Clear every brick to win. Three lives per game.
// ============================================================

// ---------- Canvas setup ----------

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// ---------- The ball ----------

const ballRadius = 10;
let ballX = canvas.width / 2;
let ballY = canvas.height - 30;
let ballDX = 2; // horizontal speed (pixels per frame)
let ballDY = -2; // vertical speed — negative means moving up

// ---------- The paddle ----------

const paddleWidth = 75;
const paddleHeight = 10;
let paddleX = (canvas.width - paddleWidth) / 2;
let rightPressed = false;
let leftPressed = false;

// ---------- The brick wall ----------

// The wall's shape: 3 rows of 5 bricks, with a small gap
// (padding) between bricks and a margin at the top and sides.
const brickRows = 3;
const brickCols = 5;
const brickWidth = 75;
const brickHeight = 20;
const brickPadding = 10;
const brickTop = 30;
const brickLeft = 32;

// One entry per brick. status 1 = standing, 0 = smashed.
// x/y get filled in while drawing, so the collision check
// always knows exactly where each brick sits.
const bricks = [];
for (let col = 0; col < brickCols; col++) {
  bricks[col] = [];
  for (let row = 0; row < brickRows; row++) {
    bricks[col][row] = { x: 0, y: 0, status: 1 };
  }
}

// ---------- Score, lives, and game state ----------

let score = 0;
let lives = 3;
// "ready"   — ball resting on the paddle, waiting to launch
// "playing" — ball in flight
// "won"     — every brick smashed
// "over"    — out of lives
let gameState = "ready";

// ---------- Controls ----------

// Keyboard: track the arrow keys, launch/restart with Space.
document.addEventListener("keydown", (event) => {
  if (event.key === "Right" || event.key === "ArrowRight") {
    rightPressed = true;
  } else if (event.key === "Left" || event.key === "ArrowLeft") {
    leftPressed = true;
  }

  if (event.code === "Space") {
    event.preventDefault(); // keep the page from scrolling
    launchOrRestart();
  }
});

document.addEventListener("keyup", (event) => {
  if (event.key === "Right" || event.key === "ArrowRight") {
    rightPressed = false;
  } else if (event.key === "Left" || event.key === "ArrowLeft") {
    leftPressed = false;
  }
});

// Mouse/touch: the paddle follows the pointer across the
// canvas, and a press launches the ball (or restarts).
canvas.addEventListener("pointermove", (event) => {
  const canvasEdge = canvas.getBoundingClientRect();
  const pointerX = event.clientX - canvasEdge.left;
  // Keep the paddle fully on the field as it follows.
  paddleX = Math.max(
    0,
    Math.min(canvas.width - paddleWidth, pointerX - paddleWidth / 2),
  );
});

canvas.addEventListener("pointerdown", launchOrRestart);

// One action button for every state: launch when ready,
// reset when the game has ended, nothing mid-flight.
function launchOrRestart() {
  if (gameState === "ready") {
    gameState = "playing";
  } else if (gameState === "won" || gameState === "over") {
    resetGame();
  }
}

// Put everything back to the start: fresh wall, fresh score,
// three lives, ball resting on the paddle.
function resetGame() {
  score = 0;
  lives = 3;
  for (let col = 0; col < brickCols; col++) {
    for (let row = 0; row < brickRows; row++) {
      bricks[col][row].status = 1;
    }
  }
  resetBallAndPaddle();
  gameState = "ready";
}

// Ball back on the paddle, paddle back in the middle.
function resetBallAndPaddle() {
  paddleX = (canvas.width - paddleWidth) / 2;
  ballX = canvas.width / 2;
  ballY = canvas.height - 30;
  ballDX = 2;
  ballDY = -2;
}

// ---------- Drawing ----------

function drawBall() {
  ctx.beginPath();
  ctx.arc(ballX, ballY, ballRadius, 0, Math.PI * 2);
  ctx.fillStyle = "#0095dd";
  ctx.fill();
  ctx.closePath();
}

function drawPaddle() {
  ctx.beginPath();
  ctx.rect(paddleX, canvas.height - paddleHeight, paddleWidth, paddleHeight);
  ctx.fillStyle = "#0095dd";
  ctx.fill();
  ctx.closePath();
}

// Draw every standing brick, and store each brick's position
// as we go — the collision check reads those same numbers.
function drawBricks() {
  for (let col = 0; col < brickCols; col++) {
    for (let row = 0; row < brickRows; row++) {
      const brick = bricks[col][row];
      if (brick.status === 1) {
        const brickX = col * (brickWidth + brickPadding) + brickLeft;
        const brickY = row * (brickHeight + brickPadding) + brickTop;
        brick.x = brickX;
        brick.y = brickY;
        ctx.beginPath();
        ctx.rect(brickX, brickY, brickWidth, brickHeight);
        ctx.fillStyle = "#0095dd";
        ctx.fill();
        ctx.closePath();
      }
    }
  }
}

// Score top-left, lives top-right, both above the brick wall.
function drawStatus() {
  ctx.font = "16px Arial";
  ctx.fillStyle = "#0095dd";
  ctx.textAlign = "left";
  ctx.fillText(`Score: ${score}`, 8, 20);
  ctx.textAlign = "right";
  ctx.fillText(`Lives: ${lives}`, canvas.width - 8, 20);
}

// Center-screen messages for the non-playing states.
function drawMessage() {
  ctx.font = "20px Arial";
  ctx.fillStyle = "#0095dd";
  ctx.textAlign = "center";
  if (gameState === "ready") {
    ctx.fillText(
      "Click or press Space to launch",
      canvas.width / 2,
      canvas.height / 2,
    );
  } else if (gameState === "won") {
    ctx.fillText(
      "YOU WIN — click or press Space to play again",
      canvas.width / 2,
      canvas.height / 2,
    );
  } else if (gameState === "over") {
    ctx.fillText(
      "GAME OVER — click or press Space to try again",
      canvas.width / 2,
      canvas.height / 2,
    );
  }
}

// ---------- Collision detection ----------

// Ball vs. bricks. If the ball's center is inside a standing
// brick, the brick is smashed: flip the ball's vertical
// direction, add the points, and check for the win.
function brickCollision() {
  for (let col = 0; col < brickCols; col++) {
    for (let row = 0; row < brickRows; row++) {
      const brick = bricks[col][row];
      if (
        brick.status === 1 &&
        ballX > brick.x &&
        ballX < brick.x + brickWidth &&
        ballY > brick.y &&
        ballY < brick.y + brickHeight
      ) {
        ballDY = -ballDY;
        brick.status = 0;
        score += 1;
        if (score === brickRows * brickCols) {
          gameState = "won";
        }
      }
    }
  }
}

// ---------- The frame loop ----------

// One frame: wipe the canvas, draw everything, run the
// physics while the ball is in flight, then queue the next
// frame. requestAnimationFrame keeps it looping smoothly.
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBricks();
  drawBall();
  drawPaddle();
  drawStatus();
  drawMessage();

  if (gameState === "playing") {
    brickCollision();

    // Side walls: bounce off the left and right edges.
    if (
      ballX + ballDX > canvas.width - ballRadius ||
      ballX + ballDX < ballRadius
    ) {
      ballDX = -ballDX;
    }

    // Top wall bounces. The bottom edge is the danger zone:
    // the paddle can save the ball, otherwise a life is lost.
    if (ballY + ballDY < ballRadius) {
      ballDY = -ballDY;
    } else if (ballY + ballDY > canvas.height - ballRadius) {
      if (ballX > paddleX && ballX < paddleX + paddleWidth) {
        // Saved. Where the ball lands on the paddle steers it:
        // dead center goes straight up, the edges angle away.
        const hitSpot = (ballX - (paddleX + paddleWidth / 2)) / (paddleWidth / 2);
        ballDX = hitSpot * 3;
        ballDY = -ballDY;
      } else {
        lives -= 1;
        if (lives === 0) {
          gameState = "over";
        } else {
          resetBallAndPaddle();
          gameState = "ready";
        }
      }
    }

    ballX += ballDX;
    ballY += ballDY;
  } else if (gameState === "ready") {
    // Waiting to launch: the ball rides the paddle.
    ballX = paddleX + paddleWidth / 2;
    ballY = canvas.height - paddleHeight - ballRadius;
  }

  // Paddle movement from the arrow keys, clamped to the field.
  if (rightPressed) {
    paddleX = Math.min(canvas.width - paddleWidth, paddleX + 7);
  } else if (leftPressed) {
    paddleX = Math.max(0, paddleX - 7);
  }

  requestAnimationFrame(draw);
}

// Start the loop.
draw();
