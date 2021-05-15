import 'normalize.css';

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { UVsDebug } from 'three/examples/jsm/utils/UVsDebug';
import { GUI } from 'three/examples/jsm/libs/dat.gui.module';

import Material from './Material';
import params from './params';

import data from './data';

const sidebar = $('#sidebar');
const main = $('#main');

// materials
const materials = {};
data.materials.forEach((material) => {
  materials[material.name] = new Material(material);
});

// variable materials
const variableMaterials = {};
data.variableMaterials.forEach((material) => {
  variableMaterials[material.name] = new Material(material);
});

// add materials to sidebar
for (const material in variableMaterials) {
  let link = `
    <a href="#" data-material="${variableMaterials[material].name}">
      <img src="${variableMaterials[material].textureMapURL}" alt="" />
      ${variableMaterials[material].name}
    </a>
  `;
  sidebar.append(link);
};

// scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf7f7f7);

// camera
const camera = new THREE.PerspectiveCamera(75, main.innerWidth() / main.innerHeight(), 0.1, 20);
camera.position.set(2, 1, 1.5);
scene.add(camera);

// floor
const floorGeometry = new THREE.PlaneGeometry(2000, 2000);
floorGeometry.rotateX(- Math.PI / 2);

const floorMaterial = new THREE.ShadowMaterial();
floorMaterial.opacity = 0.2;

const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.position.y = 0;
floor.receiveShadow = true;
scene.add(floor);;

// renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.setSize(main.innerWidth(), main.innerHeight());
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
main.append(renderer.domElement);

// // hemi light
// const hemiLight = new THREE.HemisphereLight(0xffffff, 0x666666, 0.3);
// scene.add(hemiLight);

const secondaryLightsIntensity = 0.3;

// Main Light
const mainLight = new THREE.DirectionalLight(0xffffff, 0.8);
mainLight.castShadow = true;
// mainLight.shadow.bias = -0.0001;
mainLight.shadow.mapSize.width = 1024 * 4;
mainLight.shadow.mapSize.height = 1024 * 4;
mainLight.position.set(0, 3, 0.5);
scene.add(mainLight);
const helper = new THREE.DirectionalLightHelper(mainLight, 1, 0x000000);
scene.add(helper);

// Left Light
const leftLight = new THREE.DirectionalLight(0xffffff, secondaryLightsIntensity);
leftLight.position.set(-5, 1, 0);
scene.add(leftLight);
const leftLightHelper = new THREE.DirectionalLightHelper(leftLight, 0.5, 0x666666);
scene.add(leftLightHelper);

// Right <Light></Light>
const rightLight = new THREE.DirectionalLight(0xffffff, secondaryLightsIntensity);
rightLight.position.set(5, 1, 0);
scene.add(rightLight);
const rightLightHelper = new THREE.DirectionalLightHelper(rightLight, 0.5, 0x666666);
scene.add(rightLightHelper);

// Front Light
const frontLight = new THREE.DirectionalLight(0xffffff, secondaryLightsIntensity);
frontLight.position.set(0, 1, 5);
scene.add(frontLight);
const frontLightHelper = new THREE.DirectionalLightHelper(frontLight, 0.5, 0x666666);
scene.add(frontLightHelper);

// Back Light
// const backLight = new THREE.DirectionalLight(0xffffff, secondaryLightsIntensity);
// backLight.position.set(5, 1, 0);
// scene.add(backLight);
// const backLightHelper = new THREE.DirectionalLightHelper(backLight, 0.5, 0x666666);
// scene.add(backLightHelper);

// controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.listenToKeyEvents(window);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.screenSpacePanning = false;
controls.minDistance = 0.2;
controls.maxDistance = 5;
controls.maxPolarAngle = Math.PI / 2;
controls.update();

// axes helper
const axesHelper = new THREE.AxesHelper(1.5);
scene.add(axesHelper);

// gltf model
const loader = new GLTFLoader();
let object = null;

loader.load(
  data.model.url,
  function (gltf) {
    object = gltf.scene;
    object.traverse((child) => {

      if (child.isMesh) {
        child.receiveShadow = true;
        child.castShadow = true;

        data.model.mappings.map((map) => {
          if (map.mesh === child.name && map.variableMaterial) {
            child.material = variableMaterials[map.variableMaterial].material;
          }

          if (map.mesh === child.name && !map.variableMaterial) {
            child.material = materials[map.material].material;
          }
        })
      }
    });

    scene.add(object);
  },
  function (xhr) {
    console.log((xhr.loaded / xhr.total * 100) + '% loaded');
  },
  function (error) {
    console.log('An error happened');
  }
);

// add events to sidebar links
$('body').on('click', $('a[data-material]'), function (event) {
  event.preventDefault();
  if ($(event.target).data('material')) {
    object.traverse((child) => {
      if (child.isMesh) {
        data.model.mappings.map((map) => {
          if (map.mesh === child.name && map.variableMaterial) {
            child.material = variableMaterials[$(event.target).data('material')].material;
          }
        })
      }
    });
  }
});

// resize handler
window.addEventListener('resize', onWindowResize, false);
function onWindowResize() {
  camera.aspect = main.innerWidth() / main.innerHeight();
  camera.updateProjectionMatrix();
  renderer.setSize(main.innerWidth(), main.innerHeight());
}

// animate
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  // directionalLight.position.set(camera.position.x+1, camera.position.y+1, camera.position.z+1);
  renderer.render(scene, camera);
}

animate();

const gui = new GUI();
gui.add(params, 'textureScale').min(0.001).max(0.01).step(.0001).listen().onChange(function (value) {
  params.textureScale = value;

  for (const mat in materials) {
    materials[mat].textureMap.repeat.set(params.textureScale, params.textureScale);
    materials[mat].normalMap.repeat.set(params.textureScale, params.textureScale);
    materials[mat].aorMap.repeat.set(params.textureScale, params.textureScale);
  };

  for (const mat in variableMaterials) {
    variableMaterials[mat].textureMap.repeat.set(params.textureScale, params.textureScale);
    variableMaterials[mat].normalMap.repeat.set(params.textureScale, params.textureScale);
    variableMaterials[mat].aorMap.repeat.set(params.textureScale, params.textureScale);
  };
});










