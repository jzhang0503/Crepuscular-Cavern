import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { createScene, createCamera } from './components.mjs';



// variables for three.js
let renderer, scene, camera, controls;
let mesh;
let rotating = false;
let prevMouse = new THREE.Vector3(window.innerWidth / 2, window.innerHeight / 2);

let eyeCoord = new THREE.Vector2(0,0);

const uniforms = {
  time: {value: 1.0},
  windowSize: {value: new THREE.Vector2(innerWidth, innerHeight)},
  eyeCoord: {value: eyeCoord}
};


webgazer.begin();

webgazer.setGazeListener(function(data, elapsedTime) {
	if (data == null) {
		return;
	}

  // iterate through all vertices and transform
  if (mesh != null){
    const x = (data.x / window.innerWidth) * 2 - 1;
    const y = -(data.y / window.innerHeight) * 2 + 1;

    eyeCoord = new THREE.Vector2(data.x, window.innerHeight - data.y);
    console.log(eyeCoord.y);

    const newPos = new THREE.Vector3(x, y, 1);
    newPos.unproject(camera);

    mesh.position.copy(newPos);
  }
}).begin();

var checkbox = document.querySelector("input[name=fr]");
checkbox.addEventListener('change', function(){
  if(this.checked){
    webgazer.resume();
  }
  else{
    webgazer.pause();
  }
});

document.addEventListener("mousedown", (event) =>{
  rotating = true;
  prevMouse = new THREE.Vector2(event.offsetX, event.offsetY);
});
document.addEventListener("mouseup", (event) =>{
  rotating = false;
});

function getRotation( theta, axis){
  // row major
  const cosTheta = Math.cos(theta);
    const sinTheta = Math.sin(theta);

    const x = axis[0], y = axis[1], z = axis[2];

    // Compute matrix elements
    const m11 = cosTheta + Math.pow(x, 2) * (1 - cosTheta);
    const m12 = x * y * (1 - cosTheta) + z * sinTheta;
    const m13 = x * z * (1 - cosTheta) - y * sinTheta;

    const m21 = x * y * (1 - cosTheta) - z * sinTheta;
    const m22 = cosTheta + Math.pow(y, 2) * (1 - cosTheta);
    const m23 = y * z * (1 - cosTheta) + x * sinTheta;

    const m31 = x * z * (1 - cosTheta) + y * sinTheta;
    const m32 = y * z * (1 - cosTheta) - x * sinTheta;
    const m33 = cosTheta + Math.pow(z, 2) * (1 - cosTheta);

    // Create the matrix and set its elements
    const matrix = new THREE.Matrix3();
    matrix.set(
        m11, m12, m13,
        m21, m22, m23,
        m31, m32, m33
    );

    return matrix;
  }

document.addEventListener("mousemove", (event) =>{
  if(rotating){
    const deltaX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
    const deltaY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;

    // Update camera rotation
    camera.rotation.y -= deltaX * 0.005; // Horizontal movement
    camera.rotation.x -= deltaY * 0.005; // Vertical movement
  }
});

document.addEventListener('keydown', (event) => {
  const speed = 3; 
  let cameraMovement = new THREE.Vector3(0, 0, 0);

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

  // Add movement to the camera's position
  const newPosition = new THREE.Vector3().copy(camera.position);
  newPosition.add(cameraMovement);
  camera.position.set(newPosition.x, newPosition.y, newPosition.z);
});


window.addEventListener('resize', onWindowResize, false);

function onWindowResize(){
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth , window.innerHeight);
}

init();

function init(){
  // set up renderer
  const root = document.getElementById("app");
  renderer = new THREE.WebGLRenderer();
  renderer.setPixelRatio( window.devicePixelRatio );
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
      model.rotateY(180);
      model.scale.set(10,10,10);
/*
      // update materials
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

}

function animate(){
  
  requestAnimationFrame(animate);
  render();
}

function render(){
  uniforms.eyeCoord.value = eyeCoord;

  renderer.render(scene, camera);
}

