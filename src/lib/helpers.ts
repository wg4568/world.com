import { Vector2 } from "./vector";

export function ToRadians(degrees: number) {
    return (degrees * Math.PI) / 180;
}

export function ToDegrees(radians: number) {
    return (radians * 180) / Math.PI;
}

export function UnitCircle(degrees: number, scale = 1) {
    return new Vector2(
        Math.cos(ToRadians(degrees)) * scale,
        Math.sin(ToRadians(degrees)) * scale
    );
}

export function AngleBetween(point1: Vector2, point2: Vector2) {
    return Math.atan2(point1.y - point2.y, point1.x - point2.x);
}

export function DistanceBetween(point1: Vector2, point2: Vector2) {
    return Math.sqrt(
        Math.pow(point1.x - point2.x, 2) + Math.pow(point1.y - point2.y, 2)
    );
}

export function StepBetween(point1: Vector2, point2: Vector2) {
    if (point1.x == 0 && point1.y == 0 && point2.x == 0 && point2.y == 0)
        return Vector2.Empty();
    var hype = DistanceBetween(point1, point2);
    var dx = (point1.x - point2.x) / hype;
    var dy = (point1.y - point2.y) / hype;
    return new Vector2(dx, dy);
}

export function RandomInt(min: number, max: number) {
    return Math.floor(Math.random() * (max - min) + min);
}

export function LoadImage(url: string) {
    var img = new Image();
    img.src = url;
    return img;
}

export function Now() {
    return new Date().getTime() / 1000;
}

export function Constrict(val: number, min: number, max: number) {
    if (val < min) {
        return min;
    }
    if (val > max) {
        return max;
    } else {
        return val;
    }
}

export function PadZeros(number: string, length: number) {
    var str = "" + number;
    while (str.length < length) {
        str = "0" + str;
    }
    return str;
}

export function RandomString() {
    var s1 = Math.random().toString(36).substring(2, 15);
    var s2 = Math.random().toString(36).substring(2, 15);
    return s1 + s2;
}

export function JoinBuffers(buffers: Uint8Array[]) {
    var length = buffers.map((b) => b.length).reduce((a, b) => a + b);
    var tmp = new Uint8Array(length);
    var idx = 0;

    for (var i = 0; i < buffers.length; i++) {
        tmp.set(buffers[i], idx);
        idx += buffers[i].length;
    }

    return tmp;
}
