import 'normalize.css';

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader';
import {UVsDebug} from 'three/examples/jsm/utils/UVsDebug';
import {GUI} from 'three/examples/jsm/libs/dat.gui.module';
import { LightProbeGenerator } from 'three/examples/jsm/lights/LightProbeGenerator';

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
scene.background = new THREE.Color( 0xf7f7f7 );

// camera
const camera = new THREE.PerspectiveCamera(75, main.innerWidth() / main.innerHeight(), 0.1, 20);
let cameraLimit = 0.2;
camera.position.set(2, 1, 1.5);
scene.add(camera);

/**
 * Light probe
 */
const lightProbe = new THREE.LightProbe();

const urls = [
  './textures/px.png',
  './textures/nx.png',
  './textures/py.png',
  './textures/ny.png',
  './textures/pz.png',
  './textures/nz.png',
];

let lpLight = null;
let backgroundTexture = null;
new THREE.CubeTextureLoader().load(urls, function (cubeTexture) {
  cubeTexture.encoding = THREE.sRGBEncoding;
  lightProbe.copy(LightProbeGenerator.fromCubeTexture(cubeTexture));
  lightProbe.intensity = params.lightProbe;

  lpLight = lightProbe;

  // attach envMap to all materials
  for (const material in variableMaterials) {
    variableMaterials[material].material.envMap = cubeTexture;
    variableMaterials[material].material.envMapIntensity = params.environment;
  };
  for (const material in materials) {
    materials[material].material.envMap = cubeTexture;
    materials[material].material.envMapIntensity = params.environment;
  };

  // optional background
  // scene.background = cubeTexture;
  backgroundTexture = cubeTexture;
});

scene.add(lightProbe);

/**
 * Main ligt
 */
const keyLight = new THREE.DirectionalLight(0xffffff, params.keyLight);
keyLight.castShadow = true;
keyLight.shadow.mapSize.width = 512;
keyLight.shadow.mapSize.height = 512;
keyLight.position.set(0, 250, 20);
// keyLight.shadow.bias = 0.0001;
scene.add(keyLight);
// const helper = new THREE.DirectionalLightHelper(keyLight, 1, 0x000000);
// scene.add(helper);

/**
 * fill light
 */
const fillLight = new THREE.DirectionalLight(0xffffff, params.fillLight);
// fillLight.castShadow = true;
// fillLight.shadow.mapSize.width = 250;
// fillLight.shadow.mapSize.height = 250;
// fillLight.position.set(camera.position.x + 1, camera.position.y + 1, camera.position.z + 1);
scene.add(fillLight);
// const fillLightHelper = new THREE.DirectionalLightHelper(fillLight, 1, 0x000000);
// scene.add(fillLightHelper);

// floor
const floorGeometry = new THREE.PlaneGeometry(2000, 2000);
floorGeometry.rotateX(- Math.PI / 2);

const floorMaterial = new THREE.ShadowMaterial();
floorMaterial.opacity = 0.5;

const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.position.y = 0;
floor.receiveShadow = true;
scene.add(floor);;

// renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio( window.devicePixelRatio );
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.setSize( main.innerWidth(), main.innerHeight() );
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
main.append( renderer.domElement );

// controls
const controls = new OrbitControls( camera, renderer.domElement );
controls.listenToKeyEvents( window );
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.screenSpacePanning = false;
controls.minDistance = cameraLimit;
controls.maxDistance = Infinity;
controls.maxPolarAngle = (Math.PI / 2) - 0.1;
controls.update();

// axes helper
// const axesHelper = new THREE.AxesHelper( 1.5 );
// scene.add( axesHelper );

// gltf model
const loader = new GLTFLoader();
let object = null;

loader.load(
	data.model.url,
	function ( gltf ) {
    object = gltf.scene;

    const boxLimits = new THREE.BoxHelper(object);
    boxLimits.geometry.computeBoundingBox();

    const min = boxLimits.geometry.boundingBox.min;
    const max = boxLimits.geometry.boundingBox.max;
    const maxKey = Object.keys(max).reduce(function (a, b) { return max[a] > max[b] ? a : b });
    cameraLimit = max[maxKey] * 2;
    controls.minDistance = cameraLimit;
    controls.update();



    object.traverse((child) => {
      if(child.isMesh) {
        child.receiveShadow = true;
        child.castShadow = true;

        data.model.mappings.map((map) => {
          if(map.mesh === child.name && map.variableMaterial) {
            child.material = variableMaterials[map.variableMaterial].material;
          }

          if(map.mesh === child.name && !map.variableMaterial) {
            child.material = materials[map.material].material;
          }
        })
      }
    });

    scene.add( object );
	},
	function ( xhr ) {
		console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
	},
	function ( error ) {
		console.log( 'An error happened' );
	}
);

// add events to sidebar links
$('body').on('click', $('a[data-material]'), function(event){
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
window.addEventListener( 'resize', onWindowResize, false );
function onWindowResize(){
  camera.aspect = main.innerWidth() / main.innerHeight();
  camera.updateProjectionMatrix();
  renderer.setSize( main.innerWidth(), main.innerHeight() );
}

// animate
function animate() {
	requestAnimationFrame( animate );
  controls.update();
  fillLight.position.set(camera.position.x - 0.5, camera.position.y + 0.5, camera.position.z + 0.5);
	renderer.render( scene, camera );
}

animate();

const gui = new GUI();
gui.add(params, 'textureScale').min(0.001).max(0.01).step(.0001).listen().onChange(function(value){
  params.textureScale = value;

  for (const mat in materials) {
    materials[mat].textureMap.repeat.set( params.textureScale, params.textureScale );
    materials[mat].normalMap.repeat.set( params.textureScale, params.textureScale );
    materials[mat].aorMap.repeat.set( params.textureScale, params.textureScale );
  };

  for (const mat in variableMaterials) {
    variableMaterials[mat].textureMap.repeat.set( params.textureScale, params.textureScale );
    variableMaterials[mat].normalMap.repeat.set( params.textureScale, params.textureScale );
    variableMaterials[mat].aorMap.repeat.set( params.textureScale, params.textureScale );
  };
});

gui.add(params, 'environment').min(0).max(1).step(.01).listen().onChange(function (value) {
  params.environment = value;

  for (const mat in materials) {
    materials[mat].material.envMapIntensity = params.environment;
  };

  for (const mat in variableMaterials) {
    variableMaterials[mat].material.envMapIntensity = params.environment;
  };
});


gui.add(params, 'keyLight').min(0).max(1).step(.01).listen().onChange(function (value) {
  params.keyLight = value;

  keyLight.intensity = params.keyLight;
});

gui.add(params, 'fillLight').min(0).max(1).step(.01).listen().onChange(function (value) {
  params.fillLight = value;

  fillLight.intensity = params.fillLight;
});

gui.add(params, 'lightProbe').min(0).max(1).step(.01).listen().onChange(function (value) {
  params.lightProbe = value;

  lpLight.intensity = params.lightProbe;
});


gui.add(params, 'background').onChange(function (value) {
  params.background = value;

  if (params.background) {
    scene.background = backgroundTexture;
  } else {
    scene.background = new THREE.Color(0xf7f7f7);
  }
});








