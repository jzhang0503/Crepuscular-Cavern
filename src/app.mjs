import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { createScene, createCamera } from './components.mjs';
import {texture1, texture2, texture3, texture4} from './textures.mjs';

import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { GammaCorrectionShader } from 'three/examples/jsm/shaders/GammaCorrectionShader.js';
import * as Lsystem from './lsystems/lsystem'

import Stats from 'stats.js';

const stats = new Stats();
stats.showPanel(0);
document.body.appendChild(stats.dom);

// variables for three.js
let renderer, scene, camera, caveMesh, controls;
let composer, bloomPass, renderTarget, sceneWithoutBloom, sceneWithBloom;
let innerComposer, medComposer, outerComposer;
let mesh;
let rotating = false;
let prevMouse = new THREE.Vector3(window.innerWidth / 2, window.innerHeight / 2);

// variables for foveated rendering
let eyeCoord = new THREE.Vector2(0,0);
let mouseCoord = new THREE.Vector2(0,0);
// fbo with full resolution
const innerResTarget= new THREE.WebGLRenderTarget(
  window.innerWidth * window.devicePixelRatio,
  window.innerHeight * window.devicePixelRatio,
  {
    count: 1,
    minFilter: THREE.NearestFilter,
    magFilter: THREE.NearestFilter
  }
);
// fbo with resolution / 2
const medResTarget= new THREE.WebGLRenderTarget(
  window.innerWidth * window.devicePixelRatio / 2.0,
  window.innerHeight * window.devicePixelRatio / 2.0,
  {
    count: 1,
    minFilter: THREE.NearestFilter,
    magFilter: THREE.NearestFilter
  }
);
// fbo with resolution / 4
const outerResTarget= new THREE.WebGLRenderTarget(
  window.innerWidth * window.devicePixelRatio / 4.0,
  window.innerHeight * window.devicePixelRatio / 4.0,
  {
    count: 1,
    minFilter: THREE.NearestFilter,
    magFilter: THREE.NearestFilter
  }
);

// Create custom shader material for texturing
const triplanarMaterial = new THREE.ShaderMaterial({
  vertexShader: document.getElementById('caveVertexShader').textContent,
  fragmentShader: document.getElementById('caveFragmentShader').textContent,
  uniforms: {
    textureX: { value: texture1 },
    textureY: { value: texture1 },
    textureZ: { value: texture1 },
  },
});

// // scene and camera for fbo rendering
let screen, screenCamera, sunScreen ,sunScreenCamera;

// keep track of uniforms that may need to be updated in render loop
const uniforms = {
  time: {value: 1.0},
  windowSize: {value: new THREE.Vector2(window.innerWidth, window.innerHeight)},
  eyeCoord: {value: eyeCoord},
  innerTexture: {value: innerResTarget.texture},
  medTexture: {value: medResTarget.texture},
  outerTexture: {value: outerResTarget.texture},
  foveate: {value: true},
  glow: {value: false},
  mouse: {value: false},
  fill: {value: false},
  innerRadius: {value: 50.0},
  outerRadius: {value: 50.0},
};

// event listeners

// update eye tracking data every frame
webgazer.setGazeListener(function(data, event) {
	if (data == null) {
		return;
	}

  // transform and update eye coord 
  eyeCoord = new THREE.Vector2(data.x * devicePixelRatio, (window.innerHeight - data.y) * devicePixelRatio);

  // for having a sphere follow the eyes, iterate through all vertices and transform
  if (mesh != null){
    const x = (data.x / window.innerWidth) * 2 - 1;
    const y = -(data.y / window.innerHeight) * 2 + 1;

    const newPos = new THREE.Vector3(x, y, 1);
    newPos.unproject(camera);

    mesh.position.copy(newPos);    
  }
}).begin();

// pause/start eye tracking when checkbox changes
var eyeCheckbox = document.querySelector("input[name=eye]");
eyeCheckbox.addEventListener('change', function(){
  uniforms.mouse.value = !this.checked;
  if(this.checked){
    webgazer.resume();
    webgazer.showVideo(true); 
  }
  else{
    webgazer.pause();
    webgazer.showVideo(false); 
  }
});

// control foveation when checkbox changes
var checkbox = document.querySelector("input[name=fr]");
checkbox.addEventListener('change', function(){
  uniforms.foveate.value = this.checked;
  if(this.checked && !uniforms.mouse.value){
    webgazer.resume();
    webgazer.showVideo(true); 
  }
  else{
    webgazer.pause();
    webgazer.showVideo(false); 
  }
});

// fill pixels
var fillCheckbox = document.querySelector("input[name=fr-1]");
fillCheckbox.addEventListener('change', function(){
  uniforms.fill.value = this.checked;
});

// adjust textures
var textureCheckbox = document.querySelector("input[name=texture]");
textureCheckbox.addEventListener('change', function(){
  if (this.checked) {
    caveMesh.traverse((o) => {
      if (o.isMesh) {
        // Update the texture in the triplanar shader
        o.material = triplanarMaterial;
        o.material.uniforms.textureX.value = texture1;
        o.material.uniforms.textureY.value = texture1;
        o.material.uniforms.textureZ.value = texture1;
      }
    });
  }
  else {
    caveMesh.traverse((o) => {
      if (o.isMesh) {
        o.material = o.userData.originalMaterial.clone(); // Restore the original material
      }
    });
  }
});

var texture2Checkbox = document.querySelector("input[name=texture2]");
texture2Checkbox.addEventListener('change', function(){
  if (this.checked) {
    caveMesh.traverse((o) => {
      if (o.isMesh) {
        // Update the texture in the triplanar shader
        o.material = triplanarMaterial;
        o.material.uniforms.textureX.value = texture2;
        o.material.uniforms.textureY.value = texture2;
        o.material.uniforms.textureZ.value = texture2;
      }
    });
  }
  else {
    caveMesh.traverse((o) => {
      if (o.isMesh) {
        o.material = o.userData.originalMaterial.clone(); // Restore the original material
      }
    });
  }
});

var texture3Checkbox = document.querySelector("input[name=texture3]");
texture3Checkbox.addEventListener('change', function(){
  if (this.checked) {
    caveMesh.traverse((o) => {
      if (o.isMesh) {
        // Update the texture in the triplanar shader
        o.material = triplanarMaterial;
        o.material.uniforms.textureX.value = texture3;
        o.material.uniforms.textureY.value = texture3;
        o.material.uniforms.textureZ.value = texture3;
      }
    });
  }
  else {
    caveMesh.traverse((o) => {
      if (o.isMesh) {
        o.material = o.userData.originalMaterial.clone(); // Restore the original material
      }
    });
  }
});

var texture4Checkbox = document.querySelector("input[name=texture4]");
texture4Checkbox.addEventListener('change', function(){
  if (this.checked) {
    caveMesh.traverse((o) => {
      if (o.isMesh) {
        // Update the texture in the triplanar shader
        o.material = triplanarMaterial;
        o.material.uniforms.textureX.value = texture4;
        o.material.uniforms.textureY.value = texture4;
        o.material.uniforms.textureZ.value = texture4;
      }
    });
  }
  else {
    caveMesh.traverse((o) => {
      if (o.isMesh) {
        o.material = o.userData.originalMaterial.clone(); // Restore the original material
      }
    });
  }
});

var lightCheckbox = document.querySelector("input[name=glow]");
lightCheckbox.addEventListener('change', function(){
  uniforms.glow.value = this.checked;

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

  if(uniforms.foveate.value && uniforms.mouse.value){
    mouseCoord = new THREE.Vector2(event.clientX * devicePixelRatio, (window.innerHeight - event.clientY) * devicePixelRatio);
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
webgazer.showPredictionPoints(false); 

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

  addCave();

  Lsystem.basicCrystal(scene, new THREE.Vector3(0,0,0),4);
  Lsystem.basicTree(scene, new THREE.Vector3(0,0,5),6);

  initBloom();

  initFBO();
}

function addCave() {
  // load in the cave from blender
  const loader = new GLTFLoader();
  loader.load(
    'src/models/ClosedCave.glb',
    async function( gltf ){
      const model = gltf.scene;
      // rotate and scale cave
      model.rotateY(180);
      model.scale.set(30,30,30);

      model.traverse((o) => {
        if (o.isMesh) {
          // Save the original material to userData
          o.userData.originalMaterial = o.material.clone();
        }
      });

      caveMesh = model;
      scene.add(model);
    },
    function(error){
      console.error(error);
    }
  )
}

function initBloom() {
  // Create the render target for post-processing
  renderTarget = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight);

  // Set up EffectComposers
  innerComposer = new EffectComposer(renderer, innerResTarget);
  medComposer = new EffectComposer(renderer, medResTarget);
  outerComposer = new EffectComposer(renderer, outerResTarget);
  composer = new EffectComposer(renderer, renderTarget);
  
  innerComposer.addPass(new RenderPass(scene, camera));
  medComposer.addPass(new RenderPass(scene, camera));
  outerComposer.addPass(new RenderPass(scene, camera));
  composer.addPass(new RenderPass(scene, camera));

  // Set up bloom effect (only applies to the scene with the sun)
  bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    1.0,  // Strength of bloom
    0.4,  // Bloom radius
    0.85   // Threshold for bloom
  );
  
  innerComposer.addPass(bloomPass);
  medComposer.addPass(bloomPass);
  outerComposer.addPass(bloomPass);
  composer.addPass(bloomPass);

  // Add gamma correction or other post-processing effects
  innerComposer.addPass(new ShaderPass(GammaCorrectionShader));
  medComposer.addPass(new ShaderPass(GammaCorrectionShader));
  outerComposer.addPass(new ShaderPass(GammaCorrectionShader));
  composer.addPass(new ShaderPass(GammaCorrectionShader));
}

function initFBO() {
  //FOVEATION FBO
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
  stats.begin();
    render();
  stats.end();
}

function render(){
  // update variables for foveation
  if(uniforms.mouse.value){
    uniforms.eyeCoord.value = mouseCoord;
  }
  else{
    uniforms.eyeCoord.value = eyeCoord;
  }

  let coord = uniforms.eyeCoord.value;

  // render separate textures if foveating
  if(uniforms.foveate.value){

    renderer.setViewport(0,0,window.innerWidth, window.innerHeight);

    // render the entire screen, but only update pixels in the inner radius
    renderer.setScissorTest(true);
    renderer.setRenderTarget(innerResTarget);
    renderer.setScissor(coord.x - uniforms.innerRadius.value, 
                        coord.y - uniforms.innerRadius.value,
                        uniforms.innerRadius.value * 2,
                        uniforms.innerRadius.value * 2);
    if(uniforms.glow.value){
      innerComposer.render();
    }
    else{
      renderer.render(scene, camera);
    }
    

    // render the entire screen, but only update pixels in the outer radius
    renderer.setScissorTest(true);
    renderer.setRenderTarget(medResTarget);
    renderer.setScissor(coord.x - uniforms.outerRadius.value, 
                        coord.y - uniforms.outerRadius.value,
                        uniforms.outerRadius.value * 2,
                        uniforms.outerRadius.value * 2);
    medComposer.render();
    if(uniforms.glow.value){
      medComposer.render();
    }
    else{
      renderer.render(scene, camera);
    }

    // update all pixels on the screen at lowest resolution
    renderer.setScissorTest(false);
    renderer.setRenderTarget(outerResTarget);
    outerComposer.render();
    if(uniforms.glow.value){
      outerComposer.render();
    }
    else{
      renderer.render(scene, camera);
    }
  
    // update texture uniforms for shader
    uniforms.innerTexture.value = innerResTarget.texture;
    uniforms.medTexture.value = medResTarget.texture;
    uniforms.outerTexture.value = outerResTarget.texture;
  
    // render to the "screen"
    renderer.setRenderTarget(null);
    renderer.render(screen, screenCamera);
  }
  // only render one texture if not foveating
  else{

    if(uniforms.glow.value){
      renderer.setRenderTarget(renderTarget);
      composer.render();
    }
    else{
      // update all pixels on the screen at highest resolution
      renderer.setRenderTarget(innerResTarget);
      renderer.render(scene, camera);

      // render to the "screen"
      renderer.setRenderTarget(null);
      renderer.render(screen, screenCamera);
    }
    
  }
  
}








