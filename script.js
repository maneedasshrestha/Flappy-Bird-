const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

// Initialize canvas size
resizeCanvas();
window.addEventListener('resize', resizeCanvas); // Update canvas size on window resize

let bird = {
    x: 50,
    y: canvas.height / 2,
    width: 20,
    height: 20,
    gravity: 0.5,
    lift: -10,
    velocity: 0,
    maxVelocity: 10
};

let pipes = [];
let score = 0;
let bestScore = localStorage.getItem('bestScore') ? parseInt(localStorage.getItem('bestScore')) : 0; // Load best score from localStorage
let gameOver = false;
let pipeSpeed = 2; // Initial speed of pipes
let pipeGenerationIntervalId; // To store the interval ID for pipe generation

// Pipe generation parameters
const PIPE_GENERATION_INTERVAL = 1500; // Every 1.5 seconds
const PIPE_WIDTH = 40; // Increased pipe width
const GAP = 150; // Gap between the top and bottom pipes
const MIN_PIPE_HEIGHT = 20; // Minimum height for pipes

function setup() {
    // Clear previous pipes and reset variables if necessary
    if (pipeGenerationIntervalId) {
        clearInterval(pipeGenerationIntervalId);
    }

    // Generate pipes at regular intervals
    pipeGenerationIntervalId = setInterval(() => {
        if (!gameOver) {
            const pipeHeight = Math.random() * (canvas.height - GAP - MIN_PIPE_HEIGHT) + MIN_PIPE_HEIGHT;
            pipes.push({
                x: canvas.width,
                y: pipeHeight,
                height: canvas.height - pipeHeight - GAP, // Bottom pipe height
                scored: false,
            });
        }
    }, PIPE_GENERATION_INTERVAL);
    
    // Add event listeners for input handling
    document.addEventListener('keydown', (event) => {
        if (event.code === 'Space') {
            if (gameOver) {
                restartGame(); // Restart game if it's over
            } else {
                bird.velocity = bird.lift; // Set velocity to lift value for a stronger flap
            }
        }
    });

    canvas.addEventListener('click', handleInput);
    canvas.addEventListener('touchstart', handleInput);

    gameLoop();
}
function gameLoop() {
    if (gameOver) {
        drawGameOverMenu(); // Show game over menu when game is over
        return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw the ground
    ctx.fillStyle = 'green';
    ctx.fillRect(0, canvas.height - 50, canvas.width, 50); // Ground

    // Apply gravity to the bird
    bird.velocity += bird.gravity;
    bird.y += bird.velocity;

    // Limit the downward velocity to prevent it from falling too fast
    if (bird.velocity > bird.maxVelocity) {
        bird.velocity = bird.maxVelocity;
    }

    // Prevent the bird from going off-screen
    if (bird.y + bird.height >= canvas.height - 50) { // Adjust for ground height
        bird.y = canvas.height - 50 - bird.height; // Stop at the ground
        gameOver = true;
        if (score > bestScore) {
            bestScore = score; // Update best score if the current score is higher
            localStorage.setItem('bestScore', bestScore); // Save the new best score
        }
    } else if (bird.y < 0) {
        bird.y = 0; // Prevent the bird from flying above the canvas
        bird.velocity = 0; // Reset velocity when hitting the top
    }

    // Draw the bird
    ctx.fillStyle = 'yellow';
    ctx.fillRect(bird.x, bird.y, bird.width, bird.height);

    // Draw pipes
    pipes.forEach((pipe, index) => {
        ctx.fillStyle = 'green';
        // Draw top pipe
        ctx.fillRect(pipe.x, 0, PIPE_WIDTH, pipe.y);
        // Draw bottom pipe
        ctx.fillRect(pipe.x, pipe.y + GAP, PIPE_WIDTH, pipe.height);

        // Move pipes
        pipe.x -= pipeSpeed; // Use variable speed

        // Collision detection
        if (bird.x < pipe.x + PIPE_WIDTH &&
            bird.x + bird.width > pipe.x &&
            (bird.y < pipe.y || bird.y + bird.height > pipe.y + pipe.height + GAP)) {
            gameOver = true;
            if (score > bestScore) {
                bestScore = score; // Update best score if the current score is higher
                localStorage.setItem('bestScore', bestScore); // Save the new best score
            }
        }

        // Score
        if (pipe.x + PIPE_WIDTH < bird.x && !pipe.scored) {
            score++;
            pipe.scored = true;

            // Increase difficulty by increasing pipe speed
            if (score % 5 === 0) { // Every 5 points, increase speed
                pipeSpeed += 0.5; // Increase speed
            }
        }

        // Remove off-screen pipes
        if (pipe.x + PIPE_WIDTH < 0) {
            pipes.splice(index, 1);
        }
    });

    // Display score in the center of the screen
    ctx.fillStyle = 'black';
    ctx.font = '40px "Press Start 2P", cursive'; // Gamey font
    ctx.textAlign = 'center';
    ctx.fillText(score, canvas.width / 2, canvas.height / 2);

    requestAnimationFrame(gameLoop);
}

// Draw game over menu
function drawGameOverMenu() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'; // Semi-transparent background
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = 'white';
    ctx.font = '25px "Press Start 2P", cursive'; // Smaller game over font
    ctx.textAlign = 'center';
    ctx.fillText('Game Over!', canvas.width / 2, canvas.height / 2 - 60);
    ctx.fillText('Score: ' + score, canvas.width / 2, canvas.height / 2);
    ctx.fillText('Best Score: ' + bestScore, canvas.width / 2, canvas.height / 2 + 40);
    
    // Draw Restart Button
    const restartButton = {
        x: canvas.width / 2 - 80,
        y: canvas.height / 2 + 100,
        width: 160,
        height: 50,
        text: 'Restart',
    };

    ctx.fillStyle = '#FFCC00'; // Button color
    ctx.fillRect(restartButton.x, restartButton.y, restartButton.width, restartButton.height);
    ctx.fillStyle = 'black';
    ctx.font = '20px "Press Start 2P", cursive'; // Gamey font for button text
    ctx.fillText(restartButton.text, canvas.width / 2, canvas.height / 2 + 130); // Center text in button
}

// Handle input for jumping or restarting the game
function handleInput(event) {
    const restartButton = {
        x: canvas.width / 2 - 80,
        y: canvas.height / 2 + 100,
        width: 160,
        height: 50,
    };

    // Check if the input is within the bounds of the restart button
    const touchX = event.type === 'touchstart' ? event.touches[0].clientX : event.clientX;
    const touchY = event.type === 'touchstart' ? event.touches[0].clientY : event.clientY;

    if (
        touchX >= restartButton.x &&
        touchX <= restartButton.x + restartButton.width &&
        touchY >= restartButton.y &&
        touchY <= restartButton.y + restartButton.height
    ) {
        restartGame(); // Call restart game function
    } else {
        // If not touching the restart button, make the bird jump
        if (!gameOver) {
            bird.velocity = bird.lift; // Jump
        }
    }
}
// Restart the game
function restartGame() {
    bird.y = canvas.height / 2; // Reset the bird's position
    bird.velocity = 0; // Reset velocity
    pipes = []; // Clear the pipes
    score = 0; // Reset the score
    gameOver = false; // Reset the game over flag
    pipeSpeed = 2; // Reset pipe speed

    // Clear the pipe generation interval if it exists
    clearInterval(pipeGenerationIntervalId); // Stop the current pipe generation
    pipeGenerationIntervalId = null; // Set to null to indicate no active interval

    // Re-initialize the game and add input event listeners again
    setup(); // Start the game loop again
}

// Start the game
setup();
