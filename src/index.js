import 'normalize.css';

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader';
import {UVsDebug} from 'three/examples/jsm/utils/UVsDebug';
import {GUI} from 'three/examples/jsm/libs/dat.gui.module';

import Material from './Material';
import params from './params';

import data from './data';

// materials
const materials = {};
data.materials.forEach((material) => {
  materials[material.name] = new Material(material);
});

// scene
const scene = new THREE.Scene();
scene.background = new THREE.Color( 0xf7f7f7 );

// camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
camera.position.set( 2, 1, 1.5 );
scene.add( camera );

// renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio( window.devicePixelRatio );
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild( renderer.domElement );

// hemi light
const hemiLight = new THREE.HemisphereLight(0xffffff, 0x666666, 0.3);
scene.add(hemiLight);

// directional light
const directionalLight = new THREE.DirectionalLight( 0xffffff, 0.8 );
directionalLight.castShadow = true;
// directionalLight.shadow.bias = -0.0001;
directionalLight.shadow.mapSize.width = 1024*4;
directionalLight.shadow.mapSize.height = 1024*4;
scene.add( directionalLight );

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
loader.load(
	data.model.url,
	function ( gltf ) {
    const object = gltf.scene;    
    object.traverse((child) => {
      
      if(child.isMesh) {
        // make object receive and cast shadows
        child.receiveShadow = true;
        child.castShadow = true;

        data.model.mappings.map((map) => {
          if(map.mesh === child.name) {
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

// resize handler
window.addEventListener( 'resize', onWindowResize, false );
function onWindowResize(){
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize( window.innerWidth, window.innerHeight );
}


// animate
function animate() {
	requestAnimationFrame( animate );
  controls.update();
  directionalLight.position.set(camera.position.x+1, camera.position.y+1, camera.position.z+1);
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
})














