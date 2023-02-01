import './style.css'
import * as dat from 'lil-gui'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { Water } from 'three/examples/jsm/objects/Water.js'

let grid = [];
let border = [];
let island = [];
let roads = [];
let sands = [];
let scene;
let canvas = document.getElementById("island2D");
let ctx = canvas.getContext("2d");

const TYPES = {
  SEA: 0,
  GRASS: 1,
  SAND: 2,
  ROAD: 3,
  CENTER: 4,
}

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
parameters.drawCityCenter = () => drawCityCenter()
parameters.toggleId = () => toggleId()
parameters.modifiedNoise = 0.7
parameters.noiseDivider = 4
parameters.maxModifiedNoise = 0.1
parameters.seaColor = '#6ac0bd'
parameters.sandColor = '#fcebb6'
parameters.grassColor = '#a9f05f'
parameters.roadColor = '#4e5e5e'
parameters.commercialColor = '#b6b7bd'
parameters.roadsBetweenSpace = 3
parameters.deletedRoads = 100
parameters.cityCenterAreaSpawned = 2
parameters.cityCenterRadius = 0.5
parameters.generate3D = () => generateIsland3D()
parameters.rotateY = 0


const isSideTile = (x, y, value) => {
  return (x > 0 && grid[x - 1][y] === value) ||
         (x < grid.length - 1 && grid[x + 1][y] === value) ||
         (y > 0 && grid[x][y - 1] === value) ||
         (y < grid[0].length - 1 && grid[x][y + 1] === value)
}

const hasNSideTile = (x, y, value) => {
  let counter = 0
  if (x > 0 && grid[x - 1][y] === value) counter++
  if (x < grid.length - 1 && grid[x + 1][y] === value) counter++
  if (y > 0 && grid[x][y - 1] === value) counter++
  if (y < grid[0].length - 1 && grid[x][y + 1] === value) counter++
  return counter
}

const isDiagonalSideTile = (x, y, value) => {
  return (x > 0 && y > 0 && grid[x - 1][y - 1] === value) ||
         (x < grid.length - 1 && y < grid[0].length - 1 && grid[x + 1][y + 1] === value) ||
         (x < grid.length - 1 && y > 0 && grid[x + 1][y - 1] === value) ||
         (x > 0 && y < grid[0].length - 1 && grid[x - 1][y + 1] === value)
}

const deleteRoads = (x, y) => {
  if (grid[x][y] === TYPES.GRASS) return;
  roads.splice(roads.indexOf({x, y}), 1)
  grid[x][y] = TYPES.GRASS
  if (!(x + 1 < parameters.size && x - 1 >= 0 && y + 1 < parameters.size && y - 1 >= 0)) return;
  if (grid[x+1][y] === TYPES.ROAD && (hasNSideTile(x+1, y, TYPES.ROAD) === 0) || hasNSideTile(x+1, y, TYPES.ROAD) === 1) deleteRoads(x+1, y)
  if (grid[x-1][y] === TYPES.ROAD && (hasNSideTile(x-1, y, TYPES.ROAD) === 0) || hasNSideTile(x-1, y, TYPES.ROAD) === 1) deleteRoads(x-1, y)
  if (grid[x][y+1] === TYPES.ROAD && (hasNSideTile(x, y+1, TYPES.ROAD) === 0) || hasNSideTile(x, y+1, TYPES.ROAD) === 1) deleteRoads(x, y+1)
  if (grid[x][y-1] === TYPES.ROAD && (hasNSideTile(x, y-1, TYPES.ROAD) === 0) || hasNSideTile(x, y-1, TYPES.ROAD) === 1) deleteRoads(x, y-1)
}

const drawIsland = () => {
  // Set the size of each cell in the grid
  const cellWidth = sizes.width / parameters.size;
  const cellHeight = sizes.height / parameters.size;
  
  island.forEach((cell) => {
    let x = cell.x
    let y = cell.y
    ctx.clearRect(x * cellWidth, y * cellHeight, cellWidth, cellHeight);
    if (grid[x][y] === TYPES.ROAD) {
      ctx.fillStyle = parameters.roadColor;
    } else if (grid[x][y] === TYPES.CENTER) {
      ctx.fillStyle = parameters.commercialColor;
    } else {
      ctx.fillStyle = parameters.grassColor;
    }
    ctx.fillRect(x * cellWidth, y * cellHeight, cellWidth, cellHeight);
  });
}

/**
 * Debug
 */
const gui = new dat.GUI({ title: 'Generator' })

const generateIsland = () => {
  grid = []
  border = []
  island = []
  sands = []
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  perlin.seed()

  canvas.style.display = 'flex'
  canvas3D.style.display = 'none'

  // size x size full of 0
  grid = new Array(parameters.size).fill(TYPES.SEA).map(() => new Array(parameters.size).fill(TYPES.SEA))

  const centerX = parameters.size / 2;
  const centerY = parameters.size / 2;
  for (let x = 0; x < grid.length; x++) {
    for (let y = 0; y < grid[0].length; y++) {
      const distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
      const noise = perlin.get(x / (parameters.size / parameters.noiseDivider), y / (parameters.size / parameters.noiseDivider));
      const modifiedNoise = noise + (parameters.modifiedNoise - distance / (grid.length / 2));
  
      if (modifiedNoise > parameters.maxModifiedNoise) {
        grid[x][y] = TYPES.GRASS;
        island.push({ x, y });
      }
    }
  }
  
  let islandWithoutBorder = [];
  for(const cell of island) {
    let x = cell.x
    let y = cell.y
    if (isSideTile(x, y, TYPES.SEA) || isDiagonalSideTile(x, y, TYPES.SEA)) {
      grid[x][y] = TYPES.SAND;
      sands.push(cell)
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
      if (grid[x][y] === TYPES.GRASS) {
        ctx.fillStyle = parameters.grassColor;
      } else if (grid[x][y] === TYPES.SAND) {
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
  roads = [];
  island.forEach((cell) => grid[cell.x][cell.y] = TYPES.GRASS)

  canvas.style.display = 'flex'
  canvas3D.style.display = 'none'

  // Set the size of each cell in the grid
  const cellWidth = sizes.width / parameters.size;
  const cellHeight = sizes.height / parameters.size;

  for(const cell of island) {
    let x = cell.x
    let y = cell.y
    if ((x % parameters.roadsBetweenSpace === 0 || y % parameters.roadsBetweenSpace === 0) && !isSideTile(x, y, TYPES.SAND) && !isDiagonalSideTile(x, y, TYPES.SAND)) {
      grid[x][y] = 3
      roads.push(cell);
    }
  }

  for (let i = 0; i < parameters.deletedRoads; i++) {
    const randomCellIndex = Math.floor(Math.random() * roads.length)
    if (roads[randomCellIndex]) {
      deleteRoads(roads[randomCellIndex].x, roads[randomCellIndex].y)
    }
  }


  roads.forEach((cell) => {
    const counter = hasNSideTile(cell.x, cell.y, TYPES.ROAD);
    if (counter === 0) {
      grid[cell.x][cell.y] = TYPES.GRASS
      roads.splice(roads.indexOf({x: cell.x, y: cell.y}), 1)
    }
  });

  drawIsland()
}

const drawCityCenter = () => {
  canvas.style.display = 'flex'
  canvas3D.style.display = 'none'

  island.forEach((cell) => {
    if (grid[cell.x][cell.y] === TYPES.ROAD) return;
    grid[cell.x][cell.y] = TYPES.GRASS
  })
  perlin.seed()
  for (let i = 0; i < parameters.cityCenterAreaSpawned; i++) {
    const randomCellIndex = Math.floor(Math.random() * island.length)
    if (island[randomCellIndex]) {
      let cellRandom = island[randomCellIndex]
      for (let cell of island) {
        const distance = Math.sqrt(Math.pow(cell.x - cellRandom.x, 2) + Math.pow(cell.y - cellRandom.y, 2));
        const noise = perlin.get(cell.x / (100 / 3), cell.y / (100 / 3));
        const modifiedNoise = noise + (0.75 - distance / (grid.length / 2));
        
        if (grid[cell.x][cell.y] === TYPES.GRASS && modifiedNoise > parameters.cityCenterRadius) {
          grid[cell.x][cell.y] = TYPES.CENTER;
        }
      }
    }
  }
  drawIsland()
}


const toggleId = () => {
  // Set the size of each cell in the grid
  const cellWidth = sizes.width / parameters.size;
  const cellHeight = sizes.height / parameters.size;
  console.log(cellHeight)

  for (let x = 0; x < grid.length; x++) {
    for (let y = 0; y < grid[0].length; y++) {
      ctx.font = `${cellWidth}px Georgia`;
      ctx.fillStyle = "#000";
      ctx.fillText(grid[x][y].toString(), x * cellWidth, y * cellHeight + cellHeight);
    }
  }
}

const global2DFolder = gui.addFolder( '2D Island generation' );
const noiseFolder = global2DFolder.addFolder( 'Island Modifiers' );
noiseFolder.add(parameters, 'size').min(10).max(500).step(10).name('Size')
noiseFolder.add(parameters, 'modifiedNoise').min(0).max(1).step(0.1).name('Modified Noise')
noiseFolder.add(parameters, 'noiseDivider').min(1).max(20).step(1).name('Noise Divider')
noiseFolder.add(parameters, 'maxModifiedNoise').min(0).max(1).step(0.1).name('Max Modified Noise')
const colorFolder = global2DFolder.addFolder( 'Colors' );
colorFolder.close()
colorFolder.addColor( parameters, 'seaColor' );
colorFolder.addColor( parameters, 'sandColor' );
colorFolder.addColor( parameters, 'grassColor' );
colorFolder.addColor( parameters, 'roadColor' );
colorFolder.addColor( parameters, 'commercialColor' );
global2DFolder.add(parameters, 'generate').name('1. Generate')
const roadsFolder = global2DFolder.addFolder( 'Roads' );
roadsFolder.add(parameters, 'roadsBetweenSpace').min(1).max(20).step(1).name('Space Between Roads')
roadsFolder.add(parameters, 'deletedRoads').min(0).max(200).step(1).name('Deleted roads')
roadsFolder.add(parameters, 'drawRoads').name('2. Draw Roads')
const commercialFolder = global2DFolder.addFolder( 'Commercial' );
commercialFolder.add(parameters, 'cityCenterAreaSpawned').min(1).max(20).step(1).name('Area Spawned')
commercialFolder.add(parameters, 'cityCenterRadius').min(0).max(1).step(0.1).name('Radius')
commercialFolder.add(parameters, 'drawCityCenter').name('3. Draw City Center')
// global2DFolder.add(parameters, 'toggleId').name('Toggle Canva ID')

const canvas3D = document.getElementById("island3D");
canvas3D.style.display = 'none'

const sizes3D = {
  width: window.innerWidth,
  height: window.innerHeight
}

const textureLoader = new THREE.TextureLoader()
const grassColorTexture = textureLoader.load('/textures/grass/color.avif')
const grassMaterial = new THREE.MeshBasicMaterial({
  map: grassColorTexture
});

const sandColorTexture = textureLoader.load('/textures/sand/color.jpeg')
const sandMaterial = new THREE.MeshBasicMaterial({
  map: sandColorTexture
});


const generateIsland3D = () => {
  canvas.style.display = 'none'
  canvas3D.style.display = 'flex'

  scene = new THREE.Scene()
  scene.remove.apply(scene, scene.children);

  // Draw Island
  const geometry = new THREE.BoxGeometry(1, 0.25, 1)
  for (let cell of island.concat(sands)) {
    const material = new THREE.MeshBasicMaterial();
    const mesh = new THREE.Mesh(geometry, material)
    let x = cell.x
    let y = cell.y
    
    mesh.position.x = x
    mesh.position.z = y
    mesh.position.y = 0.75
    if (grid[x][y] === TYPES.ROAD) {
      mesh.position.y += 0.25
      mesh.material.color = new THREE.Color( parameters.roadColor );
    } else if (grid[x][y] === TYPES.CENTER) {
      mesh.material.color = new THREE.Color( parameters.commercialColor );
    } else if (grid[x][y] === TYPES.SAND) {
      mesh.position.y -= 0.25
      mesh.material = sandMaterial
    } else {
      mesh.material = grassMaterial
    }
    scene.add(mesh)
  }

  // Water
  const waterGeometry = new THREE.PlaneGeometry( 10000, 10000 );
  let water = new Water(
    waterGeometry,
    {
      textureWidth: 512,
      textureHeight: 512,
      waterNormals: textureLoader.load( 'textures/waternormals.jpg', function ( texture ) {
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      } ),
      waterColor: 0x001e0f,
      distortionScale: 3.7,
      size: 10,
      fog: scene.fog !== undefined
    }
  );
  water.rotation.x = - Math.PI / 2;
  scene.add( water );

  // Camera & Controls
  const camera = new THREE.PerspectiveCamera(75, sizes3D.width / sizes3D.height, 0.01, 1000)
  const controls = new OrbitControls(camera, canvas3D)
  controls.enableDamping = true
  controls.maxDistance = parameters.size 
  controls.maxPolarAngle = Math.PI / 2;
  controls.autoRotate = true
  controls.autoRotateSpeed = 1
  controls.target.set(parameters.size / 2, 1, parameters.size / 2);
  camera.position.copy(controls.target).add(new THREE.Vector3(0, parameters.size / 4, parameters.size / 1.5));
  controls.coupleCenters = true;
  controls.update();
  scene.add(camera)

  /**
   * Renderer
   */
  const renderer = new THREE.WebGLRenderer({
    canvas: canvas3D
  })
  renderer.setSize(sizes3D.width, sizes3D.height)
  renderer.setClearColor(parameters.seaColor)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

  window.addEventListener('resize', () =>
  {
      // Update sizes
      sizes3D.width = window.innerWidth
      sizes3D.height = window.innerHeight

      // Update camera
      camera.aspect = sizes3D.width / sizes3D.height
      camera.updateProjectionMatrix()

      // Update renderer
      renderer.setSize(sizes3D.width, sizes3D.height)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  })

  /**
   * Animate
   */
  const clock = new THREE.Clock()

  const tick = () =>
  {
      const elapsedTime = clock.getElapsedTime()

      water.material.uniforms[ 'time' ].value += 1.0 / 60.0;

      // Update controls
      controls.update()

      // Render
      renderer.render(scene, camera)

      // Call tick again on the next frame
      window.requestAnimationFrame(tick)
  }
  tick()
}

const global3DFolder = gui.addFolder( '3D Island generation' );
global3DFolder.close()
global3DFolder.add(parameters, 'generate3D').name('4. Generate')

generateIsland();