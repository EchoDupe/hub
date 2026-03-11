const playBoard = document.querySelector(".play-board");
const scoreElement = document.querySelector(".score");
const highScoreElement = document.querySelector(".high-score");
const controls = document.querySelectorAll(".controls i");

let gameOver = false;
let foodX, foodY;
let snakeX = 15, snakeY = 15; // Start in middle
let velocityX = 0, velocityY = 0;
let snakeBody = [];
let setIntervalId;
let score = 0;

let highScore = localStorage.getItem("snake-high-score") || 0;
highScoreElement.innerText = `BEST: ${highScore}`;

const updateFoodPosition = () => {
    foodX = Math.floor(Math.random() * 30) + 1;
    foodY = Math.floor(Math.random() * 30) + 1;
}

const handleGameOver = () => {
    clearInterval(setIntervalId);
    alert("CONNECTION LOST: Snake Fragmented.");
    location.reload();
}

const changeDirection = e => {
    const key = e.key ? e.key.toLowerCase() : e;

    // WSAD & Arrows Logic
    if((key === "w" || key === "arrowup") && velocityY != 1) {
        velocityX = 0; velocityY = -1;
    } else if((key === "s" || key === "arrowdown") && velocityY != -1) {
        velocityX = 0; velocityY = 1;
    } else if((key === "a" || key === "arrowleft") && velocityX != 1) {
        velocityX = -1; velocityY = 0;
    } else if((key === "d" || key === "arrowright") && velocityX != -1) {
        velocityX = 1; velocityY = 0;
    }
}

controls.forEach(button => button.addEventListener("click", () => changeDirection(button.dataset.key)));

const initGame = () => {
    if(gameOver) return handleGameOver();
    let html = `<div class="food" style="grid-area: ${foodY} / ${foodX}"></div>`;

    if(snakeX === foodX && snakeY === foodY) {
        updateFoodPosition();
        snakeBody.push([foodY, foodX]);
        score++;
        highScore = score >= highScore ? score : highScore;
        localStorage.setItem("snake-high-score", highScore);
        scoreElement.innerText = `SCORE: ${score}`;
        highScoreElement.innerText = `BEST: ${highScore}`;
    }

    for (let i = snakeBody.length - 1; i > 0; i--) {
        snakeBody[i] = snakeBody[i - 1];
    }
    snakeBody[0] = [snakeX, snakeY];

    snakeX += velocityX;
    snakeY += velocityY;

    if(snakeX <= 0 || snakeX > 30 || snakeY <= 0 || snakeY > 30) {
        return gameOver = true;
    }

    for (let i = 0; i < snakeBody.length; i++) {
        html += `<div class="${i === 0 ? 'head' : 'body'}" style="grid-area: ${snakeBody[i][1]} / ${snakeBody[i][0]}"></div>`;
        if (i !== 0 && snakeBody[0][1] === snakeBody[i][1] && snakeBody[0][0] === snakeBody[i][0]) {
            gameOver = true;
        }
    }
    playBoard.innerHTML = html;
}

updateFoodPosition();
setIntervalId = setInterval(initGame, 100);
document.addEventListener("keydown", changeDirection);
