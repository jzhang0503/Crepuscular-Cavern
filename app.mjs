import * as THREE from '../node_modules/three/build/three.module.js'

// variables for three.js
let renderer, scene, camera;
let mesh;

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

init();

function init(){
  // set up renderer
  renderer = new THREE.WebGLRenderer();
  renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( window.innerWidth, window.innerHeight );
	renderer.setAnimationLoop( animate );
	document.body.appendChild( renderer.domElement );

  // set up scene
	scene = new THREE.Scene();
  scene.background = new THREE.Color( 0xf0f0f0 );
  scene.add( new THREE.AmbientLight( 0xaaaaaa ) );

  // set up camera
	camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 0.1, 500 );
	camera.position.set( 0, 2, 10 );

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
}

function animate(){
  renderer.render(scene, camera);
}

