import * as THREE from 'three';
import params from './params';

class Material {
  constructor(args) {
    this.name = args.name || "Untitled";
    this.colorValue = args.color || 0xffffff;
    this.textureMapURL = args.texture || null;
    this.normalMapURL = args.normal || null;
    this.aorMapURL = args.aor || null;
    this.roughness = args.roughness || 0;
    this.metalness = args.metalness || 0;
    this.reflectivity = args.reflectivity || 0;
    
    this.loader = new THREE.TextureLoader;

    this.textureMap = this.texture(params.textureScale);
    this.normalMap = this.normal(params.textureScale);
    this.aorMap = this.aor(params.textureScale);

    this.material = new THREE.MeshPhysicalMaterial();
    this.material.color = new THREE.Color(this.colorValue);
    this.material.reflectivity = this.reflectivity;
    this.material.metalness = this.metalness;
    this.material.roughness = this.roughness;
    this.textureMapURL === null ? null : this.material.map = this.textureMap;
    this.normalMapURL === null ? null : this.material.normalMap = this.normalMap;
    this.aorMapURL === null ? null : this.material.roughnessMap = this.aorMap;
    this.aorMapURL === null ? null : this.material.aoMap = this.aorMap;
    this.material.envMap = null;
  }

  texture(scale) {
    const texture = this.loader.load(this.textureMapURL);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.encoding = THREE.sRGBEncoding;
    texture.repeat.set( scale, scale );
    texture.flipY = false;
    return texture;
  }

  normal(scale) {
    const normal = this.loader.load(this.normalMapURL);
    normal.wrapS = THREE.RepeatWrapping;
    normal.wrapT = THREE.RepeatWrapping;
    normal.encoding = THREE.sRGBEncoding;
    normal.repeat.set( scale, scale );
    normal.flipY = false;
    return normal;
  }

  aor(scale) {
    const aor = this.loader.load(this.aorMapURL);
    aor.wrapS = THREE.RepeatWrapping;
    aor.wrapT = THREE.RepeatWrapping;
    aor.encoding = THREE.sRGBEncoding;
    aor.repeat.set( scale, scale );
    aor.flipY = false;
    return aor;
  }
}

export default Material;