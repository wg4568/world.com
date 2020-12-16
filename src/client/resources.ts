import {
    setPixelArt,
    rotate,
    repeat,
    enableShadows,
    scaleGLTF
} from "./util/callbacks";
import { Loader } from "./util/loader";

import config from "../../config.json";

// load textures
var dudes = [];
for (var d = 1; d <= config.game.dudes; d++)
    dudes.push({
        name: `dude${d}`,
        path: `static/img/dudes/dude${d}.png`,
        callback: setPixelArt
    });

const resources = new Loader(
    [
        {
            name: "sky_up",
            path: "static/img/skybox/up.bmp",
            callback: rotate(1)
        },
        {
            name: "sky_down",
            path: "static/img/skybox/down.bmp",
            callback: rotate(-1)
        },
        {
            name: "sky_north",
            path: "static/img/skybox/north.bmp"
        },
        {
            name: "sky_south",
            path: "static/img/skybox/south.bmp"
        },
        {
            name: "sky_east",
            path: "static/img/skybox/east.bmp"
        },
        {
            name: "sky_west",
            path: "static/img/skybox/west.bmp"
        },
        {
            name: "grass",
            path: "static/img/grass.jpg",
            callback: repeat(100, 100)
        },
        ...dudes
    ],
    [
        {
            name: "trashcan",
            path: "static/model/trashcan/trashcan.glb",
            callback: [scaleGLTF(0.7, 0.7, 0.7), enableShadows]
        },
        {
            name: "bladee",
            path: "static/model/bladee.glb",
            callback: [scaleGLTF(30, 30, 30), enableShadows]
        },
        {
            name: "jam",
            path: "static/model/jam.glb",
            callback: [scaleGLTF(2, 2, 2), enableShadows]
        },
        {
            name: "kraft",
            path: "static/model/kraft.glb",
            callback: [scaleGLTF(0.5, 0.5, 0.5), enableShadows]
        },
        {
            name: "711",
            path: "static/model/711.glb",
            callback: [scaleGLTF(2.2, 2.2, 2.2), enableShadows]
        }
    ]
);

export default resources;
