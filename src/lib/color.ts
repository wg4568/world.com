import { RandomInt, Constrict, PadZeros } from "./helpers";

export class Color {
    private _red: number;
    private _green: number;
    private _blue: number;

    constructor(red: number, green: number, blue: number) {
        this._red = red;
        this._green = green;
        this._blue = blue;
    }

    static FromHex(hex: string) {
        var color = Color.ParseHEX(hex);
        return new Color(color[0], color[1], color[2]);
    }

    static Random() {
        var r = RandomInt(0, 255);
        var g = RandomInt(0, 255);
        var b = RandomInt(0, 255);
        var col = new Color(r, g, b);
        return col;
    }

    static RandomPastel() {
        var r = RandomInt(0, 255);
        var g = RandomInt(0, 255);
        var b = RandomInt(0, 255);
        var col = new Color(r, g, b);
        col.value = 255;
        col.saturation = 80;
        return col;
    }

    static RandomDark() {
        var r = RandomInt(0, 255);
        var g = RandomInt(0, 255);
        var b = RandomInt(0, 255);
        var col = new Color(r, g, b);
        col.value = 100;
        col.saturation = 255;
        return col;
    }

    static RandomNeon() {
        var r = RandomInt(0, 255);
        var g = RandomInt(0, 255);
        var b = RandomInt(0, 255);
        var col = new Color(r, g, b);
        col.value = 255;
        col.saturation = 255;
        return col;
    }

    get red() {
        return this._red;
    }
    get green() {
        return this._green;
    }
    get blue() {
        return this._blue;
    }

    get hue() {
        return this.hsv[0];
    }
    get saturation() {
        return this.hsv[1];
    }
    get value() {
        return this.hsv[2];
    }

    get hsv() {
        return Color.RGBtoHSV(this.rgb);
    }
    get rgb() {
        return [this.red, this.green, this.blue];
    }

    set red(val) {
        this._red = Math.floor(Constrict(val, 0, 255));
    }
    set green(val) {
        this._green = Math.floor(Constrict(val, 0, 255));
    }
    set blue(val) {
        this._blue = Math.floor(Constrict(val, 0, 255));
    }

    set hue(val) {
        this.hsv = [Constrict(val, 0, 255), this.hsv[1], this.hsv[2]];
    }
    set saturation(val) {
        this.hsv = [this.hsv[0], Constrict(val, 0, 255), this.hsv[2]];
    }
    set value(val) {
        this.hsv = [this.hsv[0], this.hsv[1], Constrict(val, 0, 255)];
    }

    set hsv(val: [number, number, number]) {
        this.rgb = Color.HSVtoRGB(val);
    }
    set rgb(val: [number, number, number]) {
        this.red = val[0];
        this.green = val[1];
        this.blue = val[2];
    }

    formatRGB() {
        return `rgb(${this.red}, ${this.green}, ${this.blue})`;
    }

    formatHEX() {
        var red = PadZeros(this.red.toString(16), 2);
        var green = PadZeros(this.green.toString(16), 2);
        var blue = PadZeros(this.blue.toString(16), 2);

        return `#${red}${green}${blue}`;
    }

    static RGBtoHSV(color: [number, number, number]): [number, number, number] {
        var r = color[0];
        var g = color[1];
        var b = color[2];
        var max = Math.max(r, g, b),
            min = Math.min(r, g, b),
            d = max - min,
            h,
            s = max === 0 ? 0 : d / max,
            v = max / 255;

        switch (max) {
            case min:
                h = 0;
                break;
            case r:
                h = g - b + d * (g < b ? 6 : 0);
                h /= 6 * d;
                break;
            case g:
                h = b - r + d * 2;
                h /= 6 * d;
                break;
            case b:
                h = r - g + d * 4;
                h /= 6 * d;
                break;
            default:
                h = 0;
                break;
        }

        return [h * 255, s * 255, v * 255];
    }

    static HSVtoRGB(color: [number, number, number]): [number, number, number] {
        var h = color[0] / 255;
        var s = color[1] / 255;
        var v = color[2] / 255;
        var r, g, b, i, f, p, q, t;
        i = Math.floor(h * 6);
        f = h * 6 - i;
        p = v * (1 - s);
        q = v * (1 - f * s);
        t = v * (1 - (1 - f) * s);
        switch (i % 6) {
            case 0:
                (r = v), (g = t), (b = p);
                break;
            case 1:
                (r = q), (g = v), (b = p);
                break;
            case 2:
                (r = p), (g = v), (b = t);
                break;
            case 3:
                (r = p), (g = q), (b = v);
                break;
            case 4:
                (r = t), (g = p), (b = v);
                break;
            case 5:
                (r = v), (g = p), (b = q);
                break;
            default:
                r = 0;
                g = 0;
                b = 0;
                break;
        }
        return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
    }

    static ParseRGB(string: string) {
        var array1 = string
            .substring(4, string.length - 1)
            .replace(/ /g, "")
            .split(",");
        var array2 = array1.map(function (x) {
            return parseInt(x);
        });
        var red = array2[0];
        var green = array2[1];
        var blue = array2[2];
        return [red, green, blue];
    }

    static ParseHEX(hex: string) {
        var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex) || [
            "0",
            "0",
            "0"
        ];
        var red = parseInt(result[1], 16);
        var green = parseInt(result[2], 16);
        var blue = parseInt(result[3], 16);
        return [red, green, blue];
    }

    static IsColor(color: Object) {
        return color instanceof Color;
    }
}
