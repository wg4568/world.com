import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { PointerLockControls } from "three/examples/jsm/controls/PointerLockControls";
import { Debugger } from "./debugger";

import config from "../../config.json";
import { bindDocumentInputs, InputState } from "../lib/input";

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
export var camera = new THREE.PerspectiveCamera(75, 1, 0.1, 20000);
const renderer = new THREE.WebGLRenderer();
const debug = new Debugger(camera, renderer, config.freecam);
const clock = new THREE.Clock();
const input = new InputState();
scene.background = new THREE.Color(0xd6eef8);
renderer.shadowMap.enabled = true;
bindDocumentInputs(input);

// resize to window
document.body.style.margin = "0px";
window.addEventListener("resize", resizeWindow);
document.body.appendChild(renderer.domElement);
resizeWindow();

// load textures
const loader = new THREE.TextureLoader();
const textures = new Map<string, THREE.Texture>();
textures.set("sky_up", loader.load("static/img/skybox/up.bmp", rotate(1)));
textures.set("sky_down", loader.load("static/img/skybox/down.bmp", rotate(-1)));
textures.set("sky_north", loader.load("static/img/skybox/north.bmp"));
textures.set("sky_south", loader.load("static/img/skybox/south.bmp"));
textures.set("sky_east", loader.load("static/img/skybox/east.bmp"));
textures.set("sky_west", loader.load("static/img/skybox/west.bmp"));
textures.set("grass", loader.load("static/img/grass.jpg", repeat(100, 100)));

for (var d = 1; d <= 15; d++)
    textures.set(
        `guy${d}`,
        loader.load(`static/img/dudes/dude${d}.png`, setPixelArt)
    );

const gltfLoader = new GLTFLoader();
gltfLoader.load("static/model/world/world.glb", (gltf) => {
    gltf.scene.scale.set(10, 10, 10);
    gltf.scene.receiveShadow = true;
    enableShadows(gltf.scene);
    // scene.add(gltf.scene);
});

function create_dude(idx: number) {
    var dude = new THREE.Mesh(
        new THREE.PlaneGeometry(),
        new THREE.MeshLambertMaterial({
            map: textures.get(`guy${idx}`),
            side: THREE.DoubleSide,
            alphaTest: 1
        })
    );

    dude.scale.set(4, 4, 4);

    dude.position.set(4 * (idx - 1), 2, 0);
    dude.castShadow = true;
    dude.receiveShadow = true;
    dude.customDepthMaterial = new THREE.MeshDepthMaterial({
        depthPacking: THREE.RGBADepthPacking,
        map: textures.get(`guy${idx}`),
        alphaTest: 0.5
    });

    return dude;
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
    var hemi = new THREE.HemisphereLight(0xc7f8ff, 0xffffff, 0.4);

    return hemi;
}

function create_sun() {
    var sun = new THREE.DirectionalLight(0xffffff, 0.7);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 1024 * 5 * config.graphics.shadows;
    sun.shadow.mapSize.height = 1024 * 5 * config.graphics.shadows;
    sun.shadow.bias = -0.0001;
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

    sun.position.set(0, 70, 0);

    return sun;
}

var skybox = create_skybox();
var sun = create_sun();
var hemi = create_hemi();
var ground = create_ground();

scene.add(skybox);
scene.add(sun);
scene.add(hemi);
scene.add(ground);

camera.position.set(1, 3, 2);

export const controls = new PointerLockControls(camera, renderer.domElement);
renderer.domElement.onclick = () => {
    controls.lock();
};

var speeds = {
    walk: 0.1,
    sprint: 0.25
};

var dude = parseInt(prompt("DUDE? (number from 1-15)") as string);
var me = create_dude(dude);
var me_id = -1;
scene.add(me);

var socket = new WebSocket("ws://home.gardna.net:8104");
var players = new Map<
    number,
    { x: number; y: number; z: number; a: number; d: THREE.Mesh }
>();

socket.onmessage = (msg) => {
    var data = JSON.parse(msg.data);

    if (data.t == 0) me_id = data.i;
    if (data.t == 2) players.delete(data.i);
    else if (data.t == 1) {
        var frame = data.p as {
            i: number;
            x: number;
            y: number;
            z: number;
            a: number;
            d: number;
        }[];

        frame.forEach((e) => {
            var pl = players.get(e.i);
            if (e.i == me_id) return;

            if (pl) {
                players.set(e.i, {
                    x: e.x,
                    y: e.y,
                    z: e.z,
                    a: e.a,
                    d: pl.d
                });
            } else {
                var m = create_dude(e.d);
                players.set(e.i, {
                    x: e.x,
                    y: e.y,
                    z: e.z,
                    a: e.a,
                    d: m
                });
                scene.add(m);
            }
        });
    }
};

function send_position() {
    if (socket.readyState != WebSocket.OPEN) return;

    socket.send(
        JSON.stringify({
            x: camera.position.x,
            y: camera.position.y,
            z: camera.position.z,
            a: camera.rotation.y,
            d: dude
        })
    );
}

function frame() {
    requestAnimationFrame(frame);
    var delta = clock.getDelta();

    var speed = speeds.walk;
    if (input.keyboard.get("ShiftLeft")) speed = speeds.sprint;
    if (input.keyboard.get("KeyW")) controls.moveForward(speed);
    if (input.keyboard.get("KeyS")) controls.moveForward(-speed);
    if (input.keyboard.get("KeyD")) controls.moveRight(speed);
    if (input.keyboard.get("KeyA")) controls.moveRight(-speed);

    me.position.x = camera.position.x;
    me.position.z = camera.position.z;
    me.rotation.y = camera.rotation.y;

    sun.position.x = camera.position.x;
    sun.position.z = camera.position.z;
    // sun.target.position.set(
    //     camera.position.x + 100,
    //     0,
    //     camera.position.z + 100
    // );
    // sun.updateMatrixWorld();

    players.forEach((v, k) => {
        if (k != me_id) {
            v.d.position.set(v.x, v.y, v.z);
            v.d.rotation.y = v.a;
        }
    });

    socket.send(
        JSON.stringify({
            x: me.position.x,
            y: me.position.y,
            z: me.position.z,
            a: me.rotation.y,
            d: dude
        })
    );

    // sun.position.x += 0.05;
    // if (sun.position.x > 50) sun.position.x = -50;

    debug.debugFrame();
    renderer.render(scene, camera);
}

frame();
