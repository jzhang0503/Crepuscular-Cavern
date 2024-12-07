import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';



// variables for three.js
let renderer, scene, camera, controls;
let mesh;
let rotating = false;
let prevMouse = new THREE.Vector3(window.innerWidth / 2, window.innerHeight / 2);


webgazer.begin();

webgazer.setGazeListener(function(data, elapsedTime) {
	if (data == null) {
		return;
	}

  // iterate through all vertices and transform
  if (mesh != null){
    const x = (data.x / window.innerWidth) * 2 - 1;
    const y = -(data.y / window.innerHeight) * 2 + 1;

    const newPos = new THREE.Vector3(x, y, 1);
    newPos.unproject(camera);

    mesh.position.copy(newPos);
  }
}).begin();

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
    const deltaX = event.offsetX - prevMouse.x;
    const deltaY = event.offsetY - prevMouse.y;
    prevMouse = new THREE.Vector3(deltaX, deltaY);

    let theta = deltaX / window.innerWidth * Math.PI / 2;
    camera.rotation.y = theta;

    theta = deltaY / window.innerWidth * Math.PI / 2;
    camera.rotation.x = theta;

    camera.updateProjectionMatrix();
  }
});

document.addEventListener('keydown', (event) => {
  let cameraMovement = new THREE.Vector3(0,0,0);

  if(event.key === 'w'){
    const lookVector = new THREE.Vector3();
    camera.getWorldDirection(lookVector);
    cameraMovement.add(lookVector);
  }
  if(event.key === 's'){
    const lookVector = new THREE.Vector3();
    camera.getWorldDirection(lookVector);
    cameraMovement.sub(lookVector);
  }
  if(event.key === 'a'){
    const lookVector = new THREE.Vector3();
    camera.getWorldDirection(lookVector);
    lookVector.cross(camera.up);
    cameraMovement.sub(lookVector);
  }
  if(event.key === 'd'){
    const lookVector = new THREE.Vector3();
    camera.getWorldDirection(lookVector);
    lookVector.cross(camera.up);
    cameraMovement.add(lookVector);
  }
  if(event.ctrlKey){
    cameraMovement.add(new THREE.Vector3(0,-1,0));
  }
  if(event.key === ' '){
    cameraMovement.add(new THREE.Vector3(0,1,0));
  }

  // add movement to camera position
  const newPosition = new THREE.Vector3(camera.position.x, camera.position.y, camera.position.z);
  newPosition.add(cameraMovement);
  camera.position.set(newPosition.x, newPosition.y, newPosition.z);
  camera.updateProjectionMatrix();

});

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
	scene = new THREE.Scene();
  scene.background = new THREE.Color( 0xf0f0f0 );
  const ambientLight = new THREE.AmbientLight( 0xffffff, 0.4 );
scene.add( ambientLight );

const dirLight = new THREE.DirectionalLight( 0xefefff, 1.5 );
dirLight.position.set( 10, 10, 10 );
scene.add( dirLight );

  // set up camera
	camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 0.1, 500 );
	camera.position.set( 0, 2, 18 );
  camera.updateProjectionMatrix();

  // give camera controls
  

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
    uniforms:{
      time: {value: 1.0}
    },
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
      scene.add(model);
    },
    function(error){
      console.error(error);
    }
  )

}

function animate(){
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

