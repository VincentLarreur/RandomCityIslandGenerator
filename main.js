import './style.css'
import * as dat from 'lil-gui'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { Water } from 'three/examples/jsm/objects/Water.js'
import { Sky } from 'three/examples/jsm/objects/Sky.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter";

let grid = [];
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

const canvaSize = Math.min(window.innerWidth, window.innerHeight)
// Set the canvas dimensions to match the grid
canvas.width = canvaSize;
canvas.height = canvaSize;

const parameters = {}
parameters.size = 50;
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
parameters.deletedRoads = 15
parameters.cityCenterAreaSpawned = 2
parameters.cityCenterRadius = 0.5
parameters.autoRotate = true
parameters.generate3D = () => generateIsland3D()
parameters.placeBuildings = () => placeBuildings()
parameters.exportIsland = true
parameters.exportRoads = true
parameters.exportBuildings = true
parameters.binary = false
parameters.downloadName = 'new_city_island_generated'
parameters.exportGLTF = () => exportGLTF()


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
  const cellSize = canvaSize / parameters.size;
  
  island.forEach((cell) => {
    let x = cell.x
    let y = cell.y
    ctx.clearRect(x * cellSize, y * cellSize, cellSize, cellSize);
    if (grid[x][y] === TYPES.ROAD) {
      ctx.fillStyle = parameters.roadColor;
    } else if (grid[x][y] === TYPES.CENTER) {
      ctx.fillStyle = parameters.commercialColor;
    } else {
      ctx.fillStyle = parameters.grassColor;
    }
    ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
  });
}

/**
 * Debug
 */
const gui = new dat.GUI({ title: 'Generator' })

const generateIsland = () => {
  grid = []
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
  const cellSize = canvaSize / parameters.size;
  
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
      ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
    }
  }
}

const drawRoads = () => {
  roads = [];
  island.forEach((cell) => grid[cell.x][cell.y] = TYPES.GRASS)

  canvas.style.display = 'flex'
  canvas3D.style.display = 'none'

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
  const cellSize = canvaSize / parameters.size;

  for (let x = 0; x < grid.length; x++) {
    for (let y = 0; y < grid[0].length; y++) {
      ctx.font = `${cellWidth}px Georgia`;
      ctx.fillStyle = "#000";
      ctx.fillText(grid[x][y].toString(), x * cellSize, y * cellSize + cellSize);
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
// global2DFolder.add(parameters, 'toggleId').name('Show Canva ID (debug)')

const canvas3D = document.getElementById("island3D");
canvas3D.style.display = 'none'

const sizes3D = {
  width: window.innerWidth,
  height: window.innerHeight
}

const textureLoader = new THREE.TextureLoader()
const grassColorTexture = textureLoader.load('/textures/grass/color.avif')
grassColorTexture.offset.set(0.05, 0.05);
grassColorTexture.wrapS = grassColorTexture.wrapT = THREE.RepeatWrapping
const grassMaterial = new THREE.MeshBasicMaterial({
  map: grassColorTexture,
  color: new THREE.Color('#AAA')
});

const sandColorTexture = textureLoader.load('/textures/sand/color.jpeg')
const sandMaterial = new THREE.MeshBasicMaterial({
  map: sandColorTexture,
});

const houseColor1Texture = textureLoader.load('/textures/house/HouseTexture1.png')
houseColor1Texture.encoding = THREE.sRGBEncoding
let mat001 = new THREE.MeshBasicMaterial({
  map: houseColor1Texture
})

const houseColor2Texture = textureLoader.load('/textures/house/HouseTexture2.png')
houseColor2Texture.encoding = THREE.sRGBEncoding
let mat002 = new THREE.MeshBasicMaterial({
  map: houseColor2Texture
})

const houseColor3Texture = textureLoader.load('/textures/house/HouseTexture3.png')
houseColor3Texture.encoding = THREE.sRGBEncoding
let mat003 = new THREE.MeshBasicMaterial({
  map: houseColor3Texture
})

const houseColor4Texture = textureLoader.load('/textures/house/HouseTexture4.png')
houseColor4Texture.encoding = THREE.sRGBEncoding
let mat004 = new THREE.MeshBasicMaterial({
  map: houseColor4Texture
})

let materialArray = [mat001, mat002, mat003, mat004]

const getRandomMaterial = () => {
  return materialArray[Math.floor(Math.random() * materialArray.length)];
}

const gltfLoader = new GLTFLoader()
const gltfExporter = new GLTFExporter();

let exportRoads = []
let exportCubes = []
let controls = null

const placeRoad = (cell) => {
  let path = '/models/roads/Street_4Way.glb'
  let rotation = 0
  let x = cell.x
  let y = cell.y
  let numberSideTile = hasNSideTile(x, y, TYPES.ROAD)
  const left = (x > 0 && grid[x - 1][y] === TYPES.ROAD)
  const right = (x < grid.length - 1 && grid[x + 1][y] === TYPES.ROAD)
  const up = (y > 0 && grid[x][y - 1] === TYPES.ROAD)
  const down = (y < grid[0].length - 1 && grid[x][y + 1] === TYPES.ROAD)
  switch(numberSideTile) {
    case 0:
      const geometry = new THREE.BoxGeometry(1, 0.25, 1)
      const material = new THREE.MeshBasicMaterial();
      const mesh = new THREE.Mesh(geometry, material)
      mesh.material.color = new THREE.Color('#75777F');
      mesh.position.x = x
      mesh.position.z = y
      mesh.position.y = 0.75
      scene.add(mesh)
      return
    case 1:
      path = '/models/roads/Street_Deadend.glb'
      if (left) rotation = 0
      if (right) rotation = Math.PI
      if (up) rotation = - Math.PI / 2
      if (down) rotation = Math.PI / 2
      break;
    case 2:
      path = ((left && right) || (up && down)) ? '/models/roads/Street_Straight.glb' : '/models/roads/Street_Curve.glb'
      if (left && right) rotation = 0
      if (up && down) rotation = Math.PI / 2
      if (up && left) rotation = Math.PI
      if (up && right) rotation = Math.PI / 2
      if (down && left) rotation = - Math.PI / 2
      if (down && right) rotation = 0
      break;
    case 3:
      path = '/models/roads/Street_3Way.glb'
      if (up && left && right) rotation = - Math.PI / 2
      if (down && left && right) rotation = Math.PI / 2
      if (down && up && right) rotation = Math.PI
      if (down && up && left) rotation = 0
      break;
  }
  gltfLoader.load(
    path,
    (gltf) =>
    {
        let model = gltf.scene
        model.position.x = x
        model.position.z = y
        model.position.y = 0.8
        model.rotation.y = rotation
        model.scale.set(0.5, 0.5, 0.5)
        scene.add(model)
        exportRoads.push(model)
    }
  )
}

const generateIsland3D = () => {
  canvas.style.display = 'none'
  canvas3D.style.display = 'flex'
  global2DFolder.close()

  scene = new THREE.Scene()
  scene.remove.apply(scene, scene.children);
  exportCubes = []
  exportRoads = []
  Folder3D.show()

  // Draw Island
  const geometry = new THREE.BoxGeometry(1, 0.25, 1)
  for (let cell of island.concat(sands)) {
    let x = cell.x
    let y = cell.y
    if (grid[x][y] === TYPES.ROAD) {
      placeRoad(cell)
      continue
    }
    const material = new THREE.MeshBasicMaterial();
    const mesh = new THREE.Mesh(geometry, material)
    
    mesh.position.x = x
    mesh.position.z = y
    mesh.position.y = 0.75
    if (grid[x][y] === TYPES.CENTER) {
      mesh.material.color = new THREE.Color('#75777F');
    } else if (grid[x][y] === TYPES.SAND) {
      mesh.position.y -= 0.25
      mesh.material = sandMaterial
    } else {
      mesh.material = grassMaterial
    }
    scene.add(mesh)
    exportCubes.push(mesh)
  }

  let sun = new THREE.Vector3();

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

  // Skybox
  const sky = new Sky();
  sky.scale.setScalar( 10000 );
  scene.add( sky );

  const skyUniforms = sky.material.uniforms;

  skyUniforms[ 'turbidity' ].value = 2;
  skyUniforms[ 'rayleigh' ].value = 2;
  skyUniforms[ 'mieCoefficient' ].value = 0.005;
  skyUniforms[ 'mieDirectionalG' ].value = 0.75;

  const phi = THREE.MathUtils.degToRad( 89 );
  const theta = THREE.MathUtils.degToRad( 180 );

  sun.setFromSphericalCoords( 1, phi, theta );

  sky.material.uniforms[ 'sunPosition' ].value.copy( sun );
  water.material.uniforms[ 'sunDirection' ].value.copy( sun ).normalize();

  const ambientLight = new THREE.AmbientLight(0xffffff, 1)
  scene.add(ambientLight)

  // Camera & Controls
  const camera = new THREE.PerspectiveCamera(75, sizes3D.width / sizes3D.height, 0.01, 1000)
  controls = new OrbitControls(camera, canvas3D)
  controls.enableDamping = true
  controls.maxDistance = parameters.size 
  controls.maxPolarAngle = Math.PI / 2;
  controls.autoRotate = parameters.autoRotate
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
  exportGltfFolder.show()
  exportGltfFolder.close()
}

let buildings = []
const placeBuildings = () => {
  if (roads.length === 0) return
  if (buildings !== []) {
    for (let building of buildings) {
      scene.remove(building)
    }
    buildings = []
  }

  for (let cell of island) {
    let x = cell.x
    let y = cell.y
    if ((grid[x][y] === TYPES.CENTER || grid[x][y] === TYPES.GRASS) && hasNSideTile(x, y, TYPES.ROAD) > 0) {
      let path = '/models/buildings/House.glb'
      let rotation = 0
      if (grid[x][y] === TYPES.CENTER) {
        path = `/models/buildings/Flat${Math.floor(Math.random() * 2) + 1}.glb`
      } else {
        path = `/models/buildings/House${Math.floor(Math.random() * 5) + 1}.glb`
      }
      if (x > 0 && grid[x - 1][y] === TYPES.ROAD) rotation = - Math.PI / 2
      if ((x < grid.length - 1 && grid[x + 1][y] === TYPES.ROAD)) rotation = Math.PI / 2
      if (y > 0 && grid[x][y - 1] === TYPES.ROAD) rotation = Math.PI
      if (y < grid[0].length - 1 && grid[x][y + 1] === TYPES.ROAD) rotation = 0
      gltfLoader.load(
        path,
        (gltf) =>
        {
            let model = gltf.scene
            model.position.x = x
            model.position.z = y
            model.position.y = 0.9
            model.rotation.y = rotation
            model.scale.set(0.45, 0.45, 0.45)
            
            model.traverse( (object) => {
              if ( object.isMesh ) {
                object.material = getRandomMaterial();
              }
            } );
            scene.add(model)
            buildings.push(model)
        }
      )
    }
  }
}

const link = document.createElement( 'a' );
link.style.display = 'none';
document.body.appendChild( link ); // Firefox workaround, see #6594

const exportGLTF = () => {
  let exportArray = []
  if (parameters.exportIsland) exportArray = exportArray.concat(exportCubes)
  if (parameters.exportRoads) exportArray = exportArray.concat(exportRoads)
  if (parameters.exportBuildings) exportArray = exportArray.concat(buildings)
  let filename = (parameters.binary) ? parameters.downloadName.concat('.glb') : parameters.downloadName.concat('.gltf')
  gltfExporter.parse(
    exportArray,
    function ( gltf ) {
      const output = JSON.stringify( gltf, null, 2 );
      link.href = URL.createObjectURL(new Blob( [ output ], { type: 'text/plain' }))
      link.download = filename;
      link.click();
    },
    {
      binary: parameters.binary
    }
  )
}

const global3DFolder = gui.addFolder( '3D Island generation' );
global3DFolder.close()
global3DFolder.add(parameters, 'generate3D').name('4. Generate')
const Folder3D = global3DFolder.addFolder( 'Buildings and Rotation' );
Folder3D.hide()
Folder3D.add(parameters, 'autoRotate').name('Auto Rotate').onChange((value) => {
  if (controls) controls.autoRotate = value;
})
Folder3D.add(parameters, 'placeBuildings').name('5. Place Buildings')
const exportGltfFolder = global3DFolder.addFolder( 'Download GLTF' );
exportGltfFolder.hide()
exportGltfFolder.add(parameters, 'binary').name('Binary (.glb)')
exportGltfFolder.add(parameters, 'exportIsland').name('Include Island')
exportGltfFolder.add(parameters, 'exportRoads').name('Include Roads')
exportGltfFolder.add(parameters, 'exportBuildings').name('Include Buildings')
exportGltfFolder.add(parameters, 'downloadName').name('GLTF file name')
exportGltfFolder.add(parameters, 'exportGLTF').name('6. Download GLTF')

generateIsland();