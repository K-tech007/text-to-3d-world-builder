import './style.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// 1. Get the website's 3D display area
const container = document.getElementById('scene-container');

// 2. Create the 3D scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9bbdce);
scene.fog = new THREE.Fog(0x9bbdce, 25, 90);

// 3. Create the camera
const camera = new THREE.PerspectiveCamera(
    60,
    container.clientWidth / container.clientHeight,
    0.1,
    200
);

camera.position.set(12, 10, 18);

// 4. Create the renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;

container.appendChild(renderer.domElement);

// 5. Add camera controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.maxPolarAngle = Math.PI / 2.05;
controls.minDistance = 5;
controls.maxDistance = 45;
controls.target.set(0, 1, 0);

// 6. Add lighting
const ambientLight = new THREE.HemisphereLight(
    0xcce5ff,
    0x52613a,
    2
);
scene.add(ambientLight);

const sunlight = new THREE.DirectionalLight(0xffe3b0, 3);
sunlight.position.set(15, 25, 10);
sunlight.castShadow = true;
sunlight.shadow.mapSize.set(2048, 2048);
sunlight.shadow.camera.left = -25;
sunlight.shadow.camera.right = 25;
sunlight.shadow.camera.top = 25;
sunlight.shadow.camera.bottom = -25;
scene.add(sunlight);

// 7. Create the forest ground
const groundGeometry = new THREE.PlaneGeometry(100, 100);
const groundMaterial = new THREE.MeshStandardMaterial({
    color: 0x496b39,
    roughness: 1
});

const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// 8. Create a tree
function createTree(x, z, scale = 1) {
    const tree = new THREE.Group();

    // Tree trunk
    const trunkGeometry = new THREE.CylinderGeometry(0.18, 0.25, 2, 8);
    const trunkMaterial = new THREE.MeshStandardMaterial({
        color: 0x76502e,
        roughness: 1
    });

    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.y = 1;
    trunk.castShadow = true;
    tree.add(trunk);

    // Tree leaves
    const leafMaterial = new THREE.MeshStandardMaterial({
        color: 0x245c32,
        roughness: 1
    });

    const layers = [
        { radius: 1.3, height: 2.2, y: 2.5 },
        { radius: 1.05, height: 2, y: 3.5 },
        { radius: 0.75, height: 1.7, y: 4.4 }
    ];

    layers.forEach(layer => {
        const geometry = new THREE.ConeGeometry(
            layer.radius,
            layer.height,
            8
        );

        const leaves = new THREE.Mesh(geometry, leafMaterial);
        leaves.position.y = layer.y;
        leaves.castShadow = true;
        tree.add(leaves);
    });

    tree.position.set(x, 0, z);
    tree.scale.setScalar(scale);

    scene.add(tree);
    return tree;
}

// 9. Create several trees
const trees = [];

const treePositions = [
    [-5, -4], [-8, 2], [-3, 5],
    [5, -5], [8, 1], [3, 6],
    [-10, -8], [10, -9], [0, -9],
    [-12, 5], [12, 6]
];

treePositions.forEach(([x, z]) => {
    trees.push(createTree(x, z, 0.8 + Math.random() * 0.5));
});

// 10. Create mountains
function createMountain(x, z, size) {
    const geometry = new THREE.ConeGeometry(size, size * 1.8, 4);

    const material = new THREE.MeshStandardMaterial({
        color: 0x687b72,
        flatShading: true,
        roughness: 1
    });

    const mountain = new THREE.Mesh(geometry, material);
    mountain.position.set(x, size * 0.85, z);
    mountain.rotation.y = Math.PI / 4;
    mountain.castShadow = true;

    scene.add(mountain);
}

createMountain(-22, -25, 12);
createMountain(-5, -30, 16);
createMountain(17, -27, 13);

// 11. Create the sky atmosphere
scene.background = new THREE.Color(0x9bbdce);

// 12. Handle browser resizing
window.addEventListener('resize', () => {
    const width = container.clientWidth;
    const height = container.clientHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    renderer.setSize(width, height);
});

// 13. TEXT COMMAND SYSTEM

const commandInput = document.getElementById('command-input');
const generateButton = document.getElementById('generate-btn');
const statusMessage = document.getElementById('status');

function generateCommand() {
    const command = commandInput.value.trim().toLowerCase();

    if (command === '') {
        statusMessage.textContent = 'Please enter a command.';
        return;
    }

    // ADD TREES
    const addMatch = command.match(/add\s+(\d+)\s+trees?/);

    if (addMatch) {
        const quantity = Math.min(Number(addMatch[1]), 50);

        for (let i = 0; i < quantity; i++) {
            const x = (Math.random() - 0.5) * 28;
            const z = (Math.random() - 0.5) * 28;

            trees.push(createTree(x, z, 0.8 + Math.random() * 0.5));
        }

        statusMessage.textContent =
            `${quantity} trees added successfully!`;

        commandInput.value = '';
        return;
    }

    // REMOVE ALL TREES
    if (command.includes('remove all trees')) {
        trees.forEach(tree => {
            scene.remove(tree);
        });

        trees.length = 0;

        statusMessage.textContent = 'All trees removed!';
        commandInput.value = '';
        return;
    }

    // REMOVE A NUMBER OF TREES
    const removeMatch = command.match(/remove\s+(\d+)\s+trees?/);

    if (removeMatch) {
        const quantity = Math.min(Number(removeMatch[1]), 50);
        const actualQuantity = Math.min(quantity, trees.length);

        for (let i = 0; i < actualQuantity; i++) {
            const tree = trees.pop();
            scene.remove(tree);
        }

        statusMessage.textContent =
            `${actualQuantity} trees removed!`;

        commandInput.value = '';
        return;
    }
// STOP RAIN
if (command.includes('stop rain') || command.includes('stop raining')) {
    removeRain();

    statusMessage.textContent = 'Rain stopped!';
    commandInput.value = '';
    return;
}

// START RAIN
if (command.includes('rain')) {
    if (!rain) {
        createRain();
    }

    statusMessage.textContent = 'Rain started!';
    commandInput.value = '';
    return;
}
// CHANGE TO NIGHTTIME
if (command.includes('night')) {
    scene.background.set(0x081426);
    scene.fog.color.set(0x081426);

    ambientLight.color.set(0x526b91);
    ambientLight.intensity = 0.5;

    sunlight.color.set(0x8ca3c7);
    sunlight.intensity = 0.3;

    statusMessage.textContent = 'Nighttime activated!';
    commandInput.value = '';
    return;
}

// CHANGE TO DAYTIME
if (command.includes('day')) {
    scene.background.set(0x9bbdce);
    scene.fog.color.set(0x9bbdce);

    ambientLight.color.set(0xcce5ff);
    ambientLight.intensity = 2;

    sunlight.color.set(0xffe3b0);
    sunlight.intensity = 3;

    statusMessage.textContent = 'Daytime activated!';
    commandInput.value = '';
    return;
}

// CHANGE TO SUNSET
if (command.includes('sunset')) {
    scene.background.set(0xf29b72);
    scene.fog.color.set(0xf29b72);

    ambientLight.color.set(0xffb080);
    ambientLight.intensity = 1.2;

    sunlight.color.set(0xff7040);
    sunlight.intensity = 2;

    statusMessage.textContent = 'Sunset activated!';
    commandInput.value = '';
    return;
}
// SAVE WORLD
if (command.includes('save world')) {
    const worldData = {
        trees: trees.map(tree => ({
            x: tree.position.x,
            z: tree.position.z,
            scale: tree.scale.x
        })),

        background: scene.background.getHex(),
        fog: scene.fog.color.getHex(),

        ambientColor: ambientLight.color.getHex(),
        ambientIntensity: ambientLight.intensity,

        sunlightColor: sunlight.color.getHex(),
        sunlightIntensity: sunlight.intensity,

        rainActive: Boolean(rain),

        cameraPosition: camera.position.toArray(),
        cameraTarget: controls.target.toArray()
    };

    localStorage.setItem(
        'textTo3DWorld',
        JSON.stringify(worldData)
    );

    statusMessage.textContent = 'World saved successfully!';
    commandInput.value = '';
    return;
}

// RESTORE WORLD
if (command.includes('restore world')) {
    const savedWorld = localStorage.getItem('textTo3DWorld');

    if (!savedWorld) {
        statusMessage.textContent = 'No saved world found!';
        return;
    }

    const worldData = JSON.parse(savedWorld);

    // Remove existing trees
    trees.forEach(tree => scene.remove(tree));
    trees.length = 0;

    // Restore saved trees
    worldData.trees.forEach(tree => {
        trees.push(createTree(tree.x, tree.z, tree.scale));
    });

    // Restore lighting
    scene.background.set(worldData.background);
    scene.fog.color.set(worldData.fog);

    ambientLight.color.set(worldData.ambientColor);
    ambientLight.intensity = worldData.ambientIntensity;

    sunlight.color.set(worldData.sunlightColor);
    sunlight.intensity = worldData.sunlightIntensity;

    // Restore rain
    if (worldData.rainActive) {
        if (!rain) createRain();
    } else {
        removeRain();
    }

    // Restore camera
    camera.position.fromArray(worldData.cameraPosition);
    controls.target.fromArray(worldData.cameraTarget);
    controls.update();

    statusMessage.textContent = 'Your saved world has been restored!';
    commandInput.value = '';
    return;
}
// RESET WORLD
if (command === 'reset world') {

    // Remove rain
    removeRain();

    // Remove all existing trees
    trees.forEach(tree => scene.remove(tree));
    trees.length = 0;

    // Recreate the original forest
    treePositions.forEach(([x, z]) => {
        trees.push(
            createTree(x, z, 0.8 + Math.random() * 0.5)
        );
    });

    // Restore daytime
    scene.background.set(0x9bbdce);
    scene.fog.color.set(0x9bbdce);

    ambientLight.color.set(0xcce5ff);
    ambientLight.intensity = 2;

    sunlight.color.set(0xffe3b0);
    sunlight.intensity = 3;

    // Reset camera
    camera.position.set(12, 10, 18);
    controls.target.set(0, 1, 0);
    controls.update();

    statusMessage.textContent = 'World reset successfully!';
    commandInput.value = '';
    return;
}
// ZOOM IN
if (command === 'zoom in') {
    const direction = camera.position.clone().sub(controls.target);

    const newDistance = Math.max(
        controls.minDistance,
        direction.length() * 0.75
    );

    direction.setLength(newDistance);
    camera.position.copy(controls.target).add(direction);

    controls.update();

    statusMessage.textContent = 'Camera zoomed in!';
    commandInput.value = '';
    return;
}

// ZOOM OUT
if (command === 'zoom out') {
    const direction = camera.position.clone().sub(controls.target);

    const newDistance = Math.min(
        controls.maxDistance,
        direction.length() * 1.3
    );

    direction.setLength(newDistance);
    camera.position.copy(controls.target).add(direction);

    controls.update();

    statusMessage.textContent = 'Camera zoomed out!';
    commandInput.value = '';
    return;
}
    statusMessage.textContent =
        'Command not recognized. Try: Add 5 trees or Remove all trees.';
}

// Generate button
generateButton.addEventListener('click', generateCommand);

// Press Enter to generate
commandInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        generateCommand();
    }
});

// Example command buttons
document.querySelectorAll('.example-btn').forEach(button => {
    button.addEventListener('click', () => {
        commandInput.value = button.textContent;
        generateCommand();
    });
});
// RAIN EFFECT

let rain = null;

function createRain() {
    const rainCount = 1500;
    const positions = [];

    for (let i = 0; i < rainCount; i++) {
        positions.push(
            (Math.random() - 0.5) * 40,
            Math.random() * 25,
            (Math.random() - 0.5) * 40
        );
    }

    const geometry = new THREE.BufferGeometry();

    geometry.setAttribute(
        'position',
        new THREE.Float32BufferAttribute(positions, 3)
    );

    const material = new THREE.PointsMaterial({
        color: 0xcceeff,
        size: 0.08
    });

    rain = new THREE.Points(geometry, material);
    scene.add(rain);
}

function removeRain() {
    if (rain) {
        scene.remove(rain);
        rain.geometry.dispose();
        rain.material.dispose();
        rain = null;
    }
}

function animateRain() {
    if (!rain) return;

    const positions = rain.geometry.attributes.position.array;

    for (let i = 0; i < positions.length; i += 3) {
        positions[i + 1] -= 0.25;

        if (positions[i + 1] < 0) {
            positions[i + 1] = 25;
        }
    }

    rain.geometry.attributes.position.needsUpdate = true;
}
// 13. Animation loop
function animate() {
    requestAnimationFrame(animate);

    controls.update();
    animateRain();

    renderer.render(scene, camera);
}

animate();

console.log('3D Forest loaded successfully!');
