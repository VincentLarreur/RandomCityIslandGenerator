import './style.css'
import * as dat from 'lil-gui'

let grid = [];
let border = [];
let island = [];
let canvas = document.getElementById("canvas");
let ctx = canvas.getContext("2d");

const sizes = {
  width: Math.min(window.innerWidth, window.innerHeight),
  height: Math.min(window.innerWidth, window.innerHeight)
}
// Set the canvas dimensions to match the grid
canvas.width = sizes.width;
canvas.height = sizes.height;

const parameters = {}
parameters.size = 100;
parameters.generate = () => generateIsland()
parameters.drawRoads = () => drawRoads()
parameters.download = () => download()
parameters.modifiedNoise = 0.7
parameters.noiseDivider = 4
parameters.maxModifiedNoise = 0.1
parameters.seaColor = '#6ac0bd'
parameters.sandColor = '#fcebb6'
parameters.grassColor = '#a9f05f'
parameters.roadColor = '#4e5e5e'

const isSideTile = (x, y, value) => {
  return (x > 0 && grid[x - 1][y] === value) ||
         (x < grid.length - 1 && grid[x + 1][y] === value) ||
         (y > 0 && grid[x][y - 1] === value) ||
         (y < grid[0].length - 1 && grid[x][y + 1] === value)
}

/**
 * Debug
 */
const gui = new dat.GUI()

const generateIsland = () => {
  grid = []
  border = []
  island = []
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  perlin.seed()

  // size x size full of 0
  grid = new Array(parameters.size).fill(0).map(() => new Array(parameters.size).fill(0))

  const centerX = parameters.size / 2;
  const centerY = parameters.size / 2;
  for (let x = 0; x < grid.length; x++) {
    for (let y = 0; y < grid[0].length; y++) {
      const distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
      const noise = perlin.get(x / (parameters.size / parameters.noiseDivider), y / (parameters.size / parameters.noiseDivider));
      const modifiedNoise = noise + (parameters.modifiedNoise - distance / (grid.length / 2));
  
      if (modifiedNoise > parameters.maxModifiedNoise) {
        grid[x][y] = 1;
        island.push({ x, y });
      }
    }
  }
  
  let islandWithoutBorder = [];
  for(const cell of island) {
    let x = cell.x
    let y = cell.y
    if (isSideTile(x, y, 0)) {
      grid[x][y] = 2;
      // let index = island.indexOf(cell);
      // island.splice(index, 1);
    } else {
      islandWithoutBorder.push(cell)
    }
  }
  island = islandWithoutBorder
  islandWithoutBorder = null;

  // Set the size of each cell in the grid
  const cellWidth = sizes.width / parameters.size;
  const cellHeight = sizes.height / parameters.size;
  
  // Iterate through the grid and draw each cell
  for (let x = 0; x < grid.length; x++) {
    for (let y = 0; y < grid[0].length; y++) {      
      if (grid[x][y] === 1) {
        ctx.fillStyle = parameters.grassColor;
      } else if (grid[x][y] === 2) {
        ctx.fillStyle = parameters.sandColor;
      } else {
        ctx.fillStyle = parameters.seaColor;
      }
      // Draw the cell
      ctx.fillRect(x * cellWidth, y * cellHeight, cellWidth, cellHeight);
    }
  }
}

const drawRoads = () => {
  // Set the size of each cell in the grid
  const cellWidth = sizes.width / parameters.size;
  const cellHeight = sizes.height / parameters.size;

  for(const cell of island) {
    let x = cell.x
    let y = cell.y
    if ((x % 3 === 0 || y % 3 === 0) && !isSideTile(x, y, 2)) {
      ctx.clearRect(x * cellWidth, y * cellHeight, cellWidth, cellHeight);

      ctx.fillStyle = parameters.roadColor;
      
      ctx.fillRect(x * cellWidth, y * cellHeight, cellWidth, cellHeight);
    }
  }
}

gui.add(parameters, 'size').min(10).max(1000).step(10).name('Size')
gui.add(parameters, 'modifiedNoise').min(0).max(1).step(0.1).name('Modified Noise')
gui.add(parameters, 'noiseDivider').min(1).max(20).step(1).name('Noise Divider')
gui.add(parameters, 'maxModifiedNoise').min(0).max(1).step(0.1).name('Max Modified Noise')
gui.addColor( parameters, 'seaColor' );
gui.addColor( parameters, 'sandColor' );
gui.addColor( parameters, 'grassColor' );
gui.addColor( parameters, 'roadColor' );
gui.add(parameters, 'generate').name('Generate')
gui.add(parameters, 'drawRoads').name('Draw Roads')
generateIsland();