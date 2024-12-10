import * as THREE from 'three';

// function to create a basic scene with lighting
export function createScene(){
    let scene = new THREE.Scene();
    scene.background = new THREE.Color( 0xf0f0f0 );
    const ambientLight = new THREE.AmbientLight( 0xffffff, 0.4 );
    scene.add( ambientLight );

    const dirLight = new THREE.DirectionalLight( 0xefefff, 1.5 );
    dirLight.position.set( 10, 10, 10 );
    scene.add( dirLight );

    return scene;
}

// function to create a basic perspective camera and set the position reasonably
export function createCamera(){
    let camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 0.1, 500 );
	camera.position.set( 0, 2, 18 );
    camera.updateProjectionMatrix();

    return camera;
}

