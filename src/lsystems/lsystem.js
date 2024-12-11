import * as THREE from 'three';


/**
* Generates an L-System string given an axiom, rules, and number of iterations
* @param {string} axiom - The starting string
* @param {Object} rules - The rules to apply to the axiom
* @param {number} iterations - The number of iterations to apply the rules
*/
export function generateLSystem(axiom, rules, iterations) {
    let result = axiom;
    for (let i = 0; i < iterations; i++) {
        let nextResult = '';
        for (let char of result) {
            nextResult += rules[char] || char;
        }
        result = nextResult;
    }
    return result;
}

/**
 * Draws an L-System in your scene
 * 
 * @param {THREE.Scene} scene - The scene to add the L-System to
 * @param {string} lSystem - The L-System string
 * @param {number} length - The length of each segment
 * @param {number} angle - The angle to rotate in radians
 * @param {THREE.Vector3} position - The starting position
 * @param {THREE.Geometry} geometry - The geometry to use for each segment
 * @param {THREE.Material} gradient - The material to use for each segment
 */
export function drawLSystem(scene, lSystem, length, angle, position = new THREE.Vector3(0, 0, 0), geometry = new THREE.ConeGeometry(.05, .1, 4), gradient = new THREE.MeshPhysicalMaterial({
    color: 0xf14bdf,
    metalness: 0.5,
    roughness: 0.5,
    clearcoat: 1,
    clearcoatRoughness: 0.1,
    reflectivity: 1,
    envMapIntensity: 1,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.5
})) {
    const group = new THREE.Group();
    const stack = [];
    let direction = new THREE.Vector3(1, 0, 0);
    let quaternion = new THREE.Quaternion();

    for (let char of lSystem) {
        switch (char) {
            case 'F': // Draw a line
                const box = new THREE.Mesh(geometry, gradient);
                box.position.copy(position);
                box.quaternion.copy(quaternion);
                group.add(box);
                position.add(direction.clone().multiplyScalar(length));
                break;
            case '+': // Rotate clockwise
                quaternion.multiplyQuaternions(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), angle), quaternion);
                direction.applyAxisAngle(new THREE.Vector3(0, 0, 1), angle);
                break;
            case '-': // Rotate counterclockwise
                quaternion.multiplyQuaternions(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), -angle), quaternion);
                direction.applyAxisAngle(new THREE.Vector3(0, 0, 1), -angle);
                break;
            case '&': // Rotate up
                quaternion.multiplyQuaternions(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), angle), quaternion);
                direction.applyAxisAngle(new THREE.Vector3(0, 1, 0), angle);
                break;
            case '^': // Rotate down
                quaternion.multiplyQuaternions(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -angle), quaternion);
                direction.applyAxisAngle(new THREE.Vector3(0, 1, 0), -angle);
                break;
            case '\\': // Rotate right
                quaternion.multiplyQuaternions(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), angle), quaternion);
                direction.applyAxisAngle(new THREE.Vector3(1, 0, 0), angle);
                break;
            case '/': // Rotate left
                quaternion.multiplyQuaternions(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -angle), quaternion);
                direction.applyAxisAngle(new THREE.Vector3(1, 0, 0), -angle);
                break;
            case '[': // Save state
                stack.push({ position: position.clone(), direction: direction.clone(), quaternion: quaternion.clone() });
                break;
            case ']':// Restore state
                const state = stack.pop();
                position.copy(state.position);
                direction.copy(state.direction);
                quaternion.copy(state.quaternion);
                break;
        }
    }

    return group;
}

/**
 * 
 * @param {THREE.Scene} scene - The scene to add the L-System to
 * @param {THREE.Vector3} pos - position of the object
 * @param {number} gen - number of generations(int)
 */
export function basicCrystal(scene,pos, gen){
     const boxGeometry = new THREE.BoxGeometry(.3,.3,.3);


    const lSystem = generateLSystem('F', { 'F': 'F[+F][-F]^F[F]\\F/F' }, gen);
    drawLSystem(scene, lSystem, 0.2, Math.PI / 2, pos,boxGeometry);
}

export function basicTree(scene,pos, gen){
    const cylinderGeometry = new THREE.CylinderGeometry(.05, .05, .1, 32);
    cylinderGeometry.rotateZ(Math.PI / 2);

    const lSystem2 = generateLSystem('+++X', { 'X': '&+F[^X][&X]FX', 'F': 'FF' }, gen);
    drawLSystem(scene, lSystem2, 0.1, .39, pos, cylinderGeometry);
}