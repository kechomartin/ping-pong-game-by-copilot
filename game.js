const canvas = document.getElementById('pong');
const ctx = canvas.getContext('2d');

// Game objects
const paddleWidth = 12, paddleHeight = 90;
const ballRadius = 10;

const player1 = {
  x: 0 + 10,
  y: canvas.height / 2 - paddleHeight / 2,
  width: paddleWidth,
  height: paddleHeight,
  color: '#43e97b',
  dy: 0,
  speed: 6,
  score: 0
};

const player2 = {
  x: canvas.width - paddleWidth - 10,
  y: canvas.height / 2 - paddleHeight / 2,
  width: paddleWidth,
  height: paddleHeight,
  color: '#43e97b',
  dy: 0,
  speed: 6,
  score: 0
};

const ball = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  radius: ballRadius,
  speed: 6,
  dx: 6 * (Math.random() > 0.5 ? 1 : -1),
  dy: 6 * (Math.random() * 2 - 1),
  color: '#f6f9fa'
};

function drawRect(x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

function drawCircle(x, y, r, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.closePath();
  ctx.fill();
}

function drawText(text, x, y, color) {
  ctx.fillStyle = color;
  ctx.font = "40px Segoe UI, Arial, sans-serif";
  ctx.fillText(text, x, y);
}

function resetBall() {
  ball.x = canvas.width / 2;
  ball.y = canvas.height / 2;
  ball.dx = ball.speed * (Math.random() > 0.5 ? 1 : -1);
  ball.dy = ball.speed * (Math.random() * 2 - 1);
}

function update() {
  // Move paddles
  player1.y += player1.dy;
  player2.y += player2.dy;

  // Keep paddles in bounds
  player1.y = Math.max(0, Math.min(canvas.height - player1.height, player1.y));
  player2.y = Math.max(0, Math.min(canvas.height - player2.height, player2.y));

  // Move ball
  ball.x += ball.dx;
  ball.y += ball.dy;

  // Ball collision with top/bottom
  if (ball.y - ball.radius < 0 || ball.y + ball.radius > canvas.height) {
    ball.dy *= -1;
  }

  // Ball collision with paddles
  let paddle = (ball.x < canvas.width / 2) ? player1 : player2;
  if (
    ball.x - ball.radius < paddle.x + paddle.width &&
    ball.x + ball.radius > paddle.x &&
    ball.y + ball.radius > paddle.y &&
    ball.y - ball.radius < paddle.y + paddle.height
  ) {
    // Calculate hit position
    let collidePoint = (ball.y - (paddle.y + paddle.height / 2)) / (paddle.height / 2);
    let angle = collidePoint * (Math.PI / 4); // max 45deg
    let direction = (ball.x < canvas.width / 2) ? 1 : -1;
    ball.dx = direction * ball.speed * Math.cos(angle);
    ball.dy = ball.speed * Math.sin(angle);
    // Slightly increase speed
    ball.speed += 0.2;
  }

  // Score update
  if (ball.x - ball.radius < 0) {
    player2.score++;
    ball.speed = 6;
    resetBall();
  }
  if (ball.x + ball.radius > canvas.width) {
    player1.score++;
    ball.speed = 6;
    resetBall();
  }
}

function render() {
  // Clear
  drawRect(0, 0, canvas.width, canvas.height, '#222');
  // Draw net
  for (let i = 10; i < canvas.height; i += 30) {
    drawRect(canvas.width / 2 - 2, i, 4, 20, '#555');
  }
  // Draw paddles
  drawRect(player1.x, player1.y, player1.width, player1.height, player1.color);
  drawRect(player2.x, player2.y, player2.width, player2.height, player2.color);
  // Draw ball
  drawCircle(ball.x, ball.y, ball.radius, ball.color);
  // Draw scores
  drawText(player1.score, canvas.width / 4, 60, '#fff');
  drawText(player2.score, 3 * canvas.width / 4, 60, '#fff');
}

function game() {
  update();
  render();
  requestAnimationFrame(game);
}

// Controls
document.addEventListener('keydown', (e) => {
  switch (e.key) {
    case 'w':
    case 'W':
      player1.dy = -player1.speed;
      break;
    case 's':
    case 'S':
      player1.dy = player1.speed;
      break;
    case 'ArrowUp':
      player2.dy = -player2.speed;
      break;
    case 'ArrowDown':
      player2.dy = player2.speed;
      break;
  }
});
document.addEventListener('keyup', (e) => {
  switch (e.key) {
    case 'w':
    case 'W':
    case 's':
    case 'S':
      player1.dy = 0;
      break;
    case 'ArrowUp':
    case 'ArrowDown':
      player2.dy = 0;
      break;
  }
});

// Start game
game();