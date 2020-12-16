import * as THREE from "three";

import { PointerLockControls } from "three/examples/jsm/controls/PointerLockControls";
import { bindDocumentInputs, InputState } from "../lib/input";
import { Debugger } from "./util/debugger";

import config from "../../config.json";
import resources from "./resources";

function resizeWindow() {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
}

// initial setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 20000);
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

function create_dude(idx: number) {
    var dude = new THREE.Mesh(
        new THREE.PlaneGeometry(),
        new THREE.MeshLambertMaterial({
            map: resources.texture(`dude${idx}`),
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
        map: resources.texture(`dude${idx}`),
        alphaTest: 0.5
    });

    dude.customDistanceMaterial = new THREE.MeshDistanceMaterial({
        map: resources.texture(`dude${idx}`),
        alphaTest: 0.5
    });

    return dude;
}

function create_ground() {
    var plane = new THREE.Mesh(
        new THREE.PlaneGeometry(1000, 1000),
        new THREE.MeshPhongMaterial({
            map: resources.texture("grass"),
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
            map: resources.texture(name),
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
    sun.shadow.mapSize.width = 1024 * 5 * config.game.shadows;
    sun.shadow.mapSize.height = 1024 * 5 * config.game.shadows;
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

    sun.position.set(100, 70, 100);

    return sun;
}

function create_bladee() {
    var bladee = resources.gltf("bladee").scene.clone();
    bladee.position.set(-40, 30, -40);
    return bladee;
}

camera.position.set(1, 3, 2);

const controls = new PointerLockControls(camera, renderer.domElement);
renderer.domElement.onclick = () => controls.lock();

var dude = parseInt(
    prompt(`DUDE? (number from 1-${config.game.dudes})`) as string
);
if (dude < 1 || dude > config.game.dudes) alert("bro...");

resources.ready(() => {
    console.log(resources);

    var skybox = create_skybox();
    var sun = create_sun();
    var hemi = create_hemi();
    var ground = create_ground();
    var bladee = create_bladee();

    var store = resources.gltf("jam").scene.clone();
    store.position.set(40, 7, 40);
    store.rotation.y = -Math.PI / 2;
    // scene.add(store);

    var seven = resources.gltf("711").scene.clone();
    seven.position.set(100, 1, 100);
    scene.add(seven);

    var pattie = new THREE.PointLight(0xffff00, 1);
    pattie.position.set(40, 10, 40);
    pattie.castShadow = true;
    pattie.shadow.bias = -0.0001;
    // scene.add(pattie);

    var kraft = resources.gltf("kraft").scene.clone();
    kraft.position.set(10, 0, 10);
    scene.add(kraft);

    scene.add(skybox);
    scene.add(sun);
    scene.add(hemi);
    scene.add(ground);
    scene.add(bladee);

    var me = create_dude(dude);
    var me_id = -1;
    scene.add(me);

    for (var i = 1; i < config.game.dudes; i++) {
        let dude = create_dude(i);
        dude.position.set(4 * i, 2, 0);
        scene.add(dude);
    }

    function frame() {
        requestAnimationFrame(frame);
        var delta = clock.getDelta();

        var speed = config.game.walk;
        if (input.keyboard.get("ShiftLeft")) speed = config.game.sprint;
        if (input.keyboard.get("KeyW")) controls.moveForward(speed);
        if (input.keyboard.get("KeyS")) controls.moveForward(-speed);
        if (input.keyboard.get("KeyD")) controls.moveRight(speed);
        if (input.keyboard.get("KeyA")) controls.moveRight(-speed);

        if (input.keyboard.get("ArrowLeft")) bladee.rotation.y -= 0.01;
        if (input.keyboard.get("ArrowRight")) bladee.rotation.y += 0.01;

        me.position.x = camera.position.x;
        me.position.z = camera.position.z;
        me.rotation.y = camera.rotation.y;

        debug.debugFrame();
        renderer.render(scene, camera);
    }

    frame();
});
