import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { createScene, createCamera } from './components.mjs';

// variables for three.js
let renderer, scene, camera, controls;
let mesh;
let rotating = false;
let prevMouse = new THREE.Vector3(window.innerWidth / 2, window.innerHeight / 2);

// variables for foveated rendering
let eyeCoord = new THREE.Vector2(0,0);
// fbo with max resolution
const innerResTarget= new THREE.WebGLRenderTarget(
  window.innerWidth * window.devicePixelRatio,
  window.innerHeight * window.devicePixelRatio,
  {
    count: 1,
    minFilter: THREE.NearestFilter,
    magFilter: THREE.NearestFilter
  }
);
// scene and camera for fbo rendering
let screen, screenCamera;

// keep track of uniforms that may need to be updated in render loop
const uniforms = {
  time: {value: 1.0},
  windowSize: {value: new THREE.Vector2(window.innerWidth, window.innerHeight)},
  eyeCoord: {value: eyeCoord},
  innerTexture: {value: innerResTarget.texture},
  foveate: {value: true},
  fill: {value: false},
  innerRadius: {value: 50},
  outerRadius: {value: 50},
};

// event listeners

// update eye tracking data every frame
webgazer.setGazeListener(function(data, elapsedTime) {
	if (data == null) {
		return;
	}

  // iterate through all vertices and transform
  if (mesh != null){
    const x = (data.x / window.innerWidth) * 2 - 1;
    const y = -(data.y / window.innerHeight) * 2 + 1;

    eyeCoord = new THREE.Vector2(data.x * devicePixelRatio, (window.innerHeight - data.y) * devicePixelRatio);

    const newPos = new THREE.Vector3(x, y, 1);
    newPos.unproject(camera);

    mesh.position.copy(newPos);    
  }
}).begin();

// pause/start eye tracking when checkbox changes
var checkbox = document.querySelector("input[name=fr]");
checkbox.addEventListener('change', function(){
  if(this.checked){
    webgazer.resume();
    uniforms.foveate.value = true;
  }
  else{
    webgazer.pause();
    uniforms.foveate.value = false;
  }
});

// fill pixels
var fillCheckbox = document.querySelector("input[name=fr-1]");
fillCheckbox.addEventListener('change', function(){
  uniforms.fill.value = this.checked;
});

// adjust foveation radii
document.getElementById("innerRadius").oninput = function() {
  var value = document.getElementById("innerRadius").value;
  document.getElementById("innerRadiusVal").innerHTML = value;
  uniforms.innerRadius.value = value;
};
document.getElementById("outerRadius").oninput = function() {
  var value = document.getElementById("outerRadius").value;
  document.getElementById("outerRadiusVal").innerHTML = value;
  uniforms.outerRadius.value = value;
};

// track mouse movement for rotation when mouse is down
document.addEventListener("mousedown", (event) =>{
  rotating = true;
  prevMouse = new THREE.Vector2(event.offsetX, event.offsetY);
});

// stop tracking mouse movement for rotation when mouse is up
document.addEventListener("mouseup", (event) =>{
  rotating = false;
});

// rotate the camera when the mouse moves
document.addEventListener("mousemove", (event) =>{
  if(rotating){
    const deltaX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
    const deltaY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;

    // update camera rotation
    camera.rotation.y -= deltaX * 0.005; 
    camera.rotation.x -= deltaY * 0.005; 
  }
});

// move the camera when translation keys (wasd, ctrl, space) are down
document.addEventListener('keydown', (event) => {
  const speed = 3; 
  let cameraMovement = new THREE.Vector3(0, 0, 0);

  // check all keys being used
  if (event.key === 'w') {
    const lookVector = new THREE.Vector3();
    camera.getWorldDirection(lookVector);
    cameraMovement.add(lookVector.multiplyScalar(speed));
  }
  if (event.key === 's') {
    const lookVector = new THREE.Vector3();
    camera.getWorldDirection(lookVector);
    cameraMovement.sub(lookVector.multiplyScalar(speed));
  }
  if (event.key === 'a') {
    const lookVector = new THREE.Vector3();
    camera.getWorldDirection(lookVector);
    lookVector.cross(camera.up); 
    cameraMovement.sub(lookVector.normalize().multiplyScalar(speed));
  }
  if (event.key === 'd') {
    const lookVector = new THREE.Vector3();
    camera.getWorldDirection(lookVector);
    lookVector.cross(camera.up); 
    cameraMovement.add(lookVector.normalize().multiplyScalar(speed));
  }
  if (event.ctrlKey) {
    cameraMovement.add(new THREE.Vector3(0, -1, 0).multiplyScalar(speed));
  }
  if (event.key === ' ') {
    cameraMovement.add(new THREE.Vector3(0, 1, 0).multiplyScalar(speed));
  }

  // add movement to the camera's position
  const newPosition = new THREE.Vector3().copy(camera.position);
  newPosition.add(cameraMovement);
  camera.position.set(newPosition.x, newPosition.y, newPosition.z);
});

// update renderer and camera size when the window is resized
window.addEventListener('resize', onWindowResize, false);
function onWindowResize(){
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth , window.innerHeight);
}

// start eye tracking
webgazer.begin();

// set up scenes
init();

function init(){
  // set up renderer
  const root = document.getElementById("app");
  renderer = new THREE.WebGLRenderer();
  renderer.setPixelRatio(devicePixelRatio);
	renderer.setSize( window.innerWidth, window.innerHeight );
	renderer.setAnimationLoop( animate );
	root.appendChild( renderer.domElement );

  // set up scene
	scene = createScene();

  // set up camera
	camera = createCamera();

  // create vertices
  const geometry = new THREE.SphereGeometry(5,20,20);
  geometry.rotateY(0.2);

  // this is not necessary, just doing so for clarity on how attributes are set
  geometry.setAttribute('position', geometry.attributes.position);
  geometry.computeVertexNormals();
  geometry.setAttribute('normal', geometry.attributes.normal);

  // create material with shaders in index.html
  const shaderMaterial = new THREE.RawShaderMaterial({
    glslVersion: THREE.GLSL3,
    uniforms: uniforms,
    vertexShader: document.getElementById('vertexShader').textContent,
    fragmentShader: document.getElementById('fragmentShader').textContent,
  });

  // add mesh with geometry and material to scene
  mesh = new THREE.Mesh(geometry, shaderMaterial);
  scene.add(mesh);

  // add cave
  const loader = new GLTFLoader();
  loader.load(
    'src/models/CaveVersion2.glb',
    async function( gltf ){
      const model = gltf.scene;
      // rotate and scale to whatever looks good
      model.rotateY(180);
      model.scale.set(20,20,20);

      /*
      // update materials if using custom shader
      model.traverse((o) => {
        if (o.isMesh) o.material = shaderMaterial;
      });
      */

      scene.add(model);
    },
    function(error){
      console.error(error);
    }
  )

  // set up postprocessing for foveation
  screen = new THREE.Scene();
  screen.background = new THREE.Color( 0xf0f0f0 );

  // use custom shader to get texture coordinates
  const screenMaterial = new THREE.ShaderMaterial({
    uniforms: uniforms,
    vertexShader: document.getElementById('screenVertexShader').textContent,
    fragmentShader: document.getElementById('screenFragmentShader').textContent,
  });

  // project texture on to plane positioned like a screen
  const planeGeometry = new THREE.PlaneGeometry(2, 2);
  const plane = new THREE.Mesh(planeGeometry, screenMaterial);
  screen.add(plane);
  
  // set up camera in front of screen
  screenCamera = new THREE.OrthographicCamera( - 1, 1, 1, - 1, 0, 1 );
}

function animate(){
  requestAnimationFrame(animate);
  render();
}

function render(){
  uniforms.eyeCoord.value = eyeCoord;

  renderer.setRenderTarget(innerResTarget);
  renderer.render(scene, camera);

  uniforms.innerTexture.value = innerResTarget.texture;

  renderer.setRenderTarget(null);
  renderer.render(screen, screenCamera);
}

