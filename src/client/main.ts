import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { Debugger } from "./debugger";

import config from "../../config.json";

function resizeWindow() {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
}

function setPixelArt(texture: THREE.Texture) {
    texture.minFilter = THREE.NearestFilter;
    texture.magFilter = THREE.NearestFilter;
}

function rotate(amount: number) {
    return (texture: THREE.Texture) => {
        texture.center = new THREE.Vector2(0.5, 0.5);
        texture.rotation = (amount * Math.PI) / 2;
    };
}

function repeat(x: number, y: number) {
    return (texture: THREE.Texture) => {
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat = new THREE.Vector2(x, y);
    };
}

function enableShadows(obj: THREE.Group) {
    obj.traverse((child) => {
        if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;
        }
    });
}

// initial setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 20000);
const renderer = new THREE.WebGLRenderer();
const debug = new Debugger(camera, renderer, config.debug);
scene.background = new THREE.Color(0xd6eef8);
renderer.shadowMap.enabled = true;

// resize to window
document.body.style.margin = "0px";
window.addEventListener("resize", resizeWindow);
document.body.appendChild(renderer.domElement);
resizeWindow();

// load textures
const loader = new THREE.TextureLoader();
const textures = new Map<string, THREE.Texture>();
textures.set("tnt_side", loader.load("static/img/tnt_side.png", setPixelArt));
textures.set("tnt_top", loader.load("static/img/tnt_top.png", setPixelArt));
textures.set("tnt_bot", loader.load("static/img/tnt_bottom.png", setPixelArt));
textures.set("sky_up", loader.load("static/img/skybox/up.bmp", rotate(1)));
textures.set("sky_down", loader.load("static/img/skybox/down.bmp", rotate(-1)));
textures.set("sky_north", loader.load("static/img/skybox/north.bmp"));
textures.set("sky_south", loader.load("static/img/skybox/south.bmp"));
textures.set("sky_east", loader.load("static/img/skybox/east.bmp"));
textures.set("sky_west", loader.load("static/img/skybox/west.bmp"));
textures.set("grass", loader.load("static/img/grass.jpg", repeat(100, 100)));

const gltfLoader = new GLTFLoader();
gltfLoader.load("static/model/donut.glb", (gltf) => {
    gltf.scene.scale.set(100 * 1, 100 * 1, 100 * 1);
    // gltf.scene.receiveShadow = false;

    enableShadows(gltf.scene);

    scene.add(gltf.scene);
});

// game elements
function create_tnt() {
    var mat_tnt_side = new THREE.MeshLambertMaterial({
        map: textures.get("tnt_side")
    });

    var mat_tnt_top = new THREE.MeshLambertMaterial({
        map: textures.get("tnt_top")
    });

    var mat_tnt_bottom = new THREE.MeshLambertMaterial({
        map: textures.get("tnt_bot")
    });

    var geometry = new THREE.BoxGeometry(1, 1, 1);
    var cube = new THREE.Mesh(geometry, [
        mat_tnt_side,
        mat_tnt_side,
        mat_tnt_top,
        mat_tnt_bottom,
        mat_tnt_side,
        mat_tnt_side
    ]);

    cube.position.y = 2;
    cube.castShadow = true;
    cube.receiveShadow = true;

    return cube;
}

function create_ground() {
    var plane = new THREE.Mesh(
        new THREE.PlaneGeometry(1000, 1000),
        new THREE.MeshPhongMaterial({
            map: textures.get("grass"),
            reflectivity: 0,
            shininess: 0
        })
    );

    plane.rotation.x = Math.PI / -2;
    plane.receiveShadow = true;
    plane.castShadow = false;

    return plane;
}

function create_skybox() {
    let make_texture = (name: string) => {
        return new THREE.MeshBasicMaterial({
            map: textures.get(name),
            side: THREE.BackSide
        });
    };

    var skybox = new THREE.Mesh(new THREE.BoxGeometry(10000, 10000, 10000), [
        make_texture("sky_north"),
        make_texture("sky_south"),
        make_texture("sky_up"),
        make_texture("sky_down"),
        make_texture("sky_west"),
        make_texture("sky_east")
    ]);

    return skybox;
}

function create_hemi() {
    var hemi = new THREE.HemisphereLight(0xc7f8ff, 0xffffff, 0.5);

    return hemi;
}

function create_sun() {
    var sun = new THREE.DirectionalLight(0xffffff, 0.7);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 1024 * 5 * config.graphics.shadows;
    sun.shadow.mapSize.height = 1024 * 5 * config.graphics.shadows;
    sun.shadow.bias = -0.001;
    sun.shadow.camera = new THREE.OrthographicCamera(
        -100,
        100,
        100,
        -100,
        0.5,
        1000
    );

    var helper = new THREE.DirectionalLightHelper(sun, 5);
    scene.add(helper);

    // var sun = new THREE.Mesh(
    //     new THREE.BoxGeometry(100, 100, 100),
    //     new THREE.MeshBasicMaterial({ color: 0xff0000 })
    // );

    // sun.position.x = 2800 / 50;
    // sun.position.y = 2800 / 50;
    // sun.position.z = 5000 / 50;

    sun.position.set(100, 100, 100);

    return sun;
}

var skybox = create_skybox();
var cube = create_tnt();
var ground = create_ground();

scene.add(skybox);
// scene.add(cube);
scene.add(ground);

scene.add(create_sun());
scene.add(create_hemi());

function frame() {
    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;

    debug.debugFrame();
    requestAnimationFrame(frame);
    renderer.render(scene, camera);
}

frame();
