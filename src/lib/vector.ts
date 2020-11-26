import { RandomInt } from "./helpers";

export class Vector2 {
    x: number;
    y: number;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    get a() {
        return this.x;
    }

    get b() {
        return this.y;
    }

    set a(val: number) {
        this.x = val;
    }

    set b(val: number) {
        this.y = val;
    }

    static Empty() {
        return new Vector2(0, 0);
    }

    static Random(xmin: number, xmax: number, ymin: number, ymax: number) {
        var x = RandomInt(xmin, xmax);
        var y = RandomInt(ymin, ymax);
        return new Vector2(x, y);
    }

    static Add(v1: Vector2, v2: Vector2) {
        return new Vector2(v1.a + v2.a, v1.b + v2.b);
    }

    static Sub(v1: Vector2, v2: Vector2) {
        return new Vector2(v1.a - v2.a, v1.b - v2.b);
    }

    static Mul(v1: Vector2, v2: Vector2) {
        return new Vector2(v1.a * v2.a, v1.b * v2.b);
    }

    static Div(v1: Vector2, v2: Vector2) {
        return new Vector2(v1.a * v2.a, v1.b * v2.b);
    }
}
