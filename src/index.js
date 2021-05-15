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

// define lights
const lightProbe = new THREE.LightProbe();

const urls = [
  '/textures/px.png',
  '/textures/nx.png',
  '/textures/py.png',
  '/textures/ny.png',
  '/textures/pz.png',
  '/textures/nz.png',
];

let lpLight = null;

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

  // const material = new THREE.MeshStandardMaterial({
  //   color: 0xffffff,
  //   metalness: 0,
  //   roughness: 0,
  //   envMap: cubeTexture,
  //   envMapIntensity: API.envMapIntensity,
  // });
});

// Main Light
const mainLight = new THREE.DirectionalLight(0xffffff, params.mainLight);
mainLight.castShadow = true;
mainLight.shadow.mapSize.width = 250;
mainLight.shadow.mapSize.height = 250;
mainLight.position.set(0, 250, 0);
scene.add(mainLight);
const helper = new THREE.DirectionalLightHelper(mainLight, 1, 0x000000);
scene.add(helper);

// add lights
scene.add(lightProbe);


// camera
const camera = new THREE.PerspectiveCamera(75, main.innerWidth() / main.innerHeight(), 0.1, 20);
camera.position.set( 2, 1, 1.5 );
scene.add( camera );

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
controls.minDistance = 0.2;
controls.maxDistance = 5;
controls.maxPolarAngle = Math.PI / 2;
controls.update();

// axes helper
const axesHelper = new THREE.AxesHelper( 1.5 );
scene.add( axesHelper );


// gltf model
const loader = new GLTFLoader();
let object = null;

loader.load(
	data.model.url,
	function ( gltf ) {
    object = gltf.scene;  
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
  // directionalLight.position.set(camera.position.x+1, camera.position.y+1, camera.position.z+1);
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


gui.add(params, 'mainLight').min(0).max(1).step(.01).listen().onChange(function (value) {
  params.mainLight = value;

  mainLight.intensity = params.mainLight;
});

gui.add(params, 'lightProbe').min(0).max(1).step(.01).listen().onChange(function (value) {
  params.lightProbe = value;

  lpLight.intensity = params.lightProbe;
});









