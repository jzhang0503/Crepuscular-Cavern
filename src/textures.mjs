import * as THREE from 'three';

//TEXTURE 1
const textureLoader = new THREE.TextureLoader();
const texture1 = textureLoader.load('src/textures/caveTexture.jpg');
texture1.wrapS = THREE.RepeatWrapping;
texture1.wrapT = THREE.RepeatWrapping;
texture1.repeat.set(1, 1);

//TEXTURE 2
const textureLoader2 = new THREE.TextureLoader();
const texture2 = textureLoader2.load('src/textures/iceCave3.jpeg');
texture2.wrapS = THREE.RepeatWrapping;
texture2.wrapT = THREE.RepeatWrapping;
texture2.repeat.set(1, 1);

//TEXTURE 3
const textureLoader3 = new THREE.TextureLoader();
const texture3 = textureLoader3.load('src/textures/caveTexture3.jpeg');
texture3.wrapS = THREE.RepeatWrapping;
texture3.wrapT = THREE.RepeatWrapping;
texture3.repeat.set(1, 1);

//TEXTURE 4
const textureLoader4 = new THREE.TextureLoader();
const texture4 = textureLoader3.load('src/textures/emeraldCave.jpeg');
texture4.wrapS = THREE.RepeatWrapping;
texture4.wrapT = THREE.RepeatWrapping;
texture4.repeat.set(1, 1);

export { texture1, texture2, texture3, texture4 };
