import * as THREE from "three";
import { GLTF } from "three/examples/jsm/loaders/GLTFLoader";

export function setPixelArt(texture: THREE.Texture) {
    texture.minFilter = THREE.NearestFilter;
    texture.magFilter = THREE.NearestFilter;
}

export function rotate(amount: number) {
    return (texture: THREE.Texture) => {
        texture.center = new THREE.Vector2(0.5, 0.5);
        texture.rotation = (amount * Math.PI) / 2;
    };
}

export function repeat(x: number, y: number) {
    return (texture: THREE.Texture) => {
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat = new THREE.Vector2(x, y);
    };
}

export function enableShadows(obj: GLTF) {
    obj.scene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;
        }
    });
}

export function scaleGLTF(x: number, y: number, z: number) {
    return (obj: GLTF) => {
        obj.scene.scale.set(x, y, z);
    };
}
