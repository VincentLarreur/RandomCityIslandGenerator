import './style.css'

let size = 100


// Initialize 2D array with all elements set to 0 (water)
let grid = new Array(size).fill(0).map(() => new Array(size).fill(0));
let border = [];
let island = [];
// Select a random point on the grid to be the center of the island
const centerX = size / 2;
const centerY = size / 2;

for (let x = 0; x < grid.length; x++) {
  for (let y = 0; y < grid[0].length; y++) {
    const distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
    const noise = perlin.get(x / (size / 4), y / (size / 4));
    const modifiedNoise = noise + (0.7 - distance / (grid.length / 2));

    if (modifiedNoise > 0.1) {
      grid[x][y] = 1;
      island.push({ x, y });
    }
  }
}

for (let x = 0; x < grid.length; x++) {
  for (let y = 0; y < grid[0].length; y++) {
      if (grid[x][y] === 1) {
          if ((x > 0 && grid[x - 1][y] === 0) ||
              (x < grid.length - 1 && grid[x + 1][y] === 0) ||
              (y > 0 && grid[x][y - 1] === 0) ||
              (y < grid[0].length - 1 && grid[x][y + 1] === 0)) {
              border.push({ x, y });
          }
      }
  }
}

var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");

const sizes = {
  width: Math.min(window.innerWidth, window.innerHeight),
  height: Math.min(window.innerWidth, window.innerHeight)
}
// Set the size of each cell in the grid
const cellWidth = sizes.width / size;
const cellHeight = sizes.height / size;
// Set the canvas dimensions to match the grid
canvas.width = sizes.width;
canvas.height = sizes.height;

// Iterate through the grid and draw each cell
for (let x = 0; x < grid.length; x++) {
  for (let y = 0; y < grid[0].length; y++) {
    if (grid[x][y] === 1) {
      if (border.some(cell => cell.x === x && cell.y === y)) {
          ctx.fillStyle = "#fcebb6";
      } else {
        if (x % 3 === 0 || y % 3 === 0) {
          ctx.fillStyle = "#4e5e5e";
        } else {
          ctx.fillStyle = "#a9f05f";
        }
      }
    } else {
      // Fill cell with blue if it's water
      ctx.fillStyle = "#6ac0bd";
    }
    // Draw the cell
    ctx.fillRect(x * cellWidth, y * cellHeight, cellWidth, cellHeight);
  }
}