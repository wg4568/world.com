import * as THREE from "three";
import { GLTF, GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { createBigIntLiteral } from "typescript";
import resources from "../resources";

type Callback<Obj> = (obj: Obj) => any;
type Resource<Obj> = {
    name: string;
    path: string;
    callback?: Callback<Obj> | Callback<Obj>[];
};

export class Loader {
    private textureLoader = new THREE.TextureLoader();
    private gltfLoader = new GLTFLoader();

    private textures = new Map<string, THREE.Texture>();
    private gltfs = new Map<string, GLTF>();

    private texturesToLoad: Resource<THREE.Texture>[] = [];
    private gltfsToLoad: Resource<GLTF>[] = [];

    constructor(
        textures: Resource<THREE.Texture>[],
        gltfs: Array<Resource<GLTF>>
    ) {
        this.texturesToLoad = textures;
        this.gltfsToLoad = gltfs;
    }

    ready(callback: () => any) {
        var total = this.texturesToLoad.length + this.gltfsToLoad.length;
        var loaded = 0;

        this.texturesToLoad.forEach((resource) => {
            this.textureLoader.load(resource.path, (tex) => {
                if (resource.callback) {
                    if (Array.isArray(resource.callback))
                        resource.callback.forEach((cb) => cb(tex));
                    else resource.callback(tex);
                }
                this.textures.set(resource.name, tex);
                loaded++;

                if (loaded >= total) callback();
            });
        });

        this.gltfsToLoad.forEach((resource) => {
            this.gltfLoader.load(resource.path, (gltf) => {
                if (resource.callback) {
                    if (Array.isArray(resource.callback))
                        resource.callback.forEach((cb) => cb(gltf));
                    else resource.callback(gltf);
                }
                this.gltfs.set(resource.name, gltf);
                loaded++;

                if (loaded >= total) callback();
            });
        });
    }

    texture(name: string): THREE.Texture {
        var tex = this.textures.get(name);
        if (!tex) throw new Error(`texture '${name}' missing or not loaded`);
        return tex;
    }

    gltf(name: string): GLTF {
        var gltf = this.gltfs.get(name);
        if (!gltf) throw new Error(`gltf '${name}' missing or not loaded`);
        return gltf;
    }
}
