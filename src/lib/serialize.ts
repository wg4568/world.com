// HELPERS
function joinBuffers(buffers: Uint8Array[]) {
    var length = buffers.map((b) => b.length).reduce((a, b) => a + b);
    var tmp = new Uint8Array(length);
    var idx = 0;

    for (var i = 0; i < buffers.length; i++) {
        tmp.set(buffers[i], idx);
        idx += buffers[i].length;
    }

    return tmp;
}

function convertToBase(val: number, base: number, length?: number): number[] {
    if (val == 0 && length) new Array(length).fill(0);
    else if (val == 0) return [0];

    var result: number[] = [];

    while (val > 0) {
        let rem = val % base;
        result.push(rem);
        val = Math.floor(val / base);
    }

    if (length) {
        if (result.length > length)
            throw new OutOfBoundsError(
                `${val} out of range for array of size ${length}`
            );
        while (result.length < length) result.push(0);
    }

    return result.reverse();
}

function convertFromBase(val: number[], base: number): number {
    var result = 0;
    var backwards = val.slice().reverse(); // prevent mutation of val

    for (var i = 0; i < val.length; i++) {
        let place = Math.pow(base, i);
        result += backwards[i] * place;
    }

    return result;
}

function integerRange(
    val: number,
    bits: number,
    signed: boolean = false
): boolean {
    var max = Math.pow(2, bits);
    var min = 0;
    if (signed) {
        max -= max / 2;
        min -= max;
    }
    return val < max && val >= min;
}

function binaryToBytes(binary: Binary): Uint8Array {
    if (binary.length % 8 != 0)
        throw new ValidationError("binary length must be of multiple of 8");

    var length = binary.length / 8;
    var array = new Uint8Array(length);

    for (var i = 0; i < length; i++) {
        let total = 0;
        for (var j = 0; j < 8; j++)
            if (binary[i * 8 + j]) total += Math.pow(2, j);
        array.set(new Uint8Array([total]), i);
    }

    return array;
}

function bytesToBinary(data: Uint8Array): Binary {
    var array: Binary = [];

    for (var i = 0; i < data.length; i++) {
        let val = data[i];
        for (var j = 0; j < 8; j++) {
            if (val & Math.pow(2, j)) array.push(1);
            else array.push(0);
        }
    }

    return array;
}

function getFractionBits(val: number, n: number) {
    var result: Binary = [];
    var counter = seperateDecimal(val).decimal;
    while (result.length <= n) {
        counter *= 2;
        let { base, decimal } = seperateDecimal(counter);
        result.push(base as Bit);
        counter = decimal;
    }

    return result;
}

function getSubArray(data: Uint8Array, idx: number, length: number): number[] {
    return Array.from(data.subarray(idx, idx + length));
}

function seperateDecimal(val: number): { base: number; decimal: number } {
    var base = Math.floor(val);
    var decimal = val - base;
    return { base, decimal };
}

function encodeFloat(
    val: number,
    exponentSize: number,
    fractionSize: number,
    bias: number
) {
    var sign: Bit = val < 0 ? 1 : 0;

    var array: Binary = [];
    var { base } = seperateDecimal(val);

    var left = convertToBase(base, 2) as Binary;
    var right = getFractionBits(val, fractionSize * 2);
    var joined = [...left, ...right];

    for (var i = 0; i < joined.length; i++) if (joined[i] != 0) break;

    // handle zero
    if (i == joined.length) {
        var exponent = convertToBase(0, 2, exponentSize);
        i = 0;
    } else {
        var exponent = convertToBase(
            left.length - i - 1 + bias,
            2,
            exponentSize
        );
    }

    var fraction = joined.slice(i + 1, i + 1 + fractionSize);
    return binaryToBytes([sign, ...(exponent as Binary), ...fraction]);
}

function decodeFloat(
    val: Uint8Array,
    exponentSize: number,
    fractionSize: number,
    bias: number
): number {
    var binary = bytesToBinary(val);
    var sign = binary[0] == 1 ? -1 : 1;
    var exponent = convertFromBase(binary.slice(1, 1 + exponentSize), 2) - bias;
    var fraction =
        binary
            .slice(1 + exponentSize, 1 + exponentSize + fractionSize)
            .map((b, i) => b * Math.pow(2, -i - 1))
            .reduce((a, b) => a + b) + 1;

    return fraction * Math.pow(2, exponent) * sign;
}

// ERRORS
export class OutOfBoundsError extends Error {
    constructor(msg: string = "") {
        super("[Out of Bounds] " + msg);
    }
}

export class ValidationError extends Error {
    constructor(msg: string = "") {
        super("[Validation Error] " + msg);
    }
}

// TYPES
export type Type<Data> = {
    Length: (data: Data) => number;
    Validate: (data: Uint8Array, idx?: number) => boolean;
    Encode: (data: Data) => Uint8Array;
    Decode: (data: Uint8Array, idx?: number) => Data;
};

export type FlagArray = [
    boolean,
    boolean,
    boolean,
    boolean,
    boolean,
    boolean,
    boolean,
    boolean
];

export type Data =
    | string
    | number
    | boolean
    | FlagArray
    | Uint8Array
    | Uint8Array[];
type Format = {
    serialized: number;
    schema: Type<any>[];
};

type Callback = (data: Data[], type: string) => any;
type Bit = 1 | 0;
type Binary = Bit[];

// ENCODING
export const String8: Type<string> = {
    Length: (data: string) => {
        return 1 + data.length;
    },
    Validate: (data: Uint8Array, idx: number = 0) => {
        if (data.length - idx < 1) return false;
        if (data.length - idx - 1 < Uint8.Decode(data, idx)) return false;
        return true;
    },
    Encode: (data: string) => {
        var array = new Uint8Array(1 + data.length);

        try {
            array.set(Uint8.Encode(data.length), 0);
        } catch (err) {
            if (err instanceof OutOfBoundsError)
                throw new OutOfBoundsError(
                    "length exceeds maximum for String8"
                );
        }

        for (var i = 0; i < data.length; i++) {
            array[i + 1] = data.charCodeAt(i);
        }

        return array;
    },
    Decode: (data: Uint8Array, idx: number = 0) => {
        if (!String8.Validate(data, idx)) throw new ValidationError();

        var str = "";
        var length = Uint8.Decode(data, idx);

        for (var i = 0; i < length; i++) {
            str += String.fromCharCode(data[idx + 1 + i]);
        }

        return str;
    }
};

export const String16: Type<string> = {
    Length: (data: string) => {
        return 2 + data.length;
    },
    Validate: (data: Uint8Array, idx: number = 0) => {
        if (data.length - idx < 2) return false;
        if (data.length - idx - 2 < Uint16.Decode(data, idx)) return false;
        return true;
    },
    Encode: (data: string) => {
        var array = new Uint8Array(2 + data.length);

        try {
            array.set(Uint16.Encode(data.length), 0);
        } catch (err) {
            if (err instanceof OutOfBoundsError)
                throw new OutOfBoundsError(
                    "length exceeds maximum for String16"
                );
        }

        for (var i = 0; i < data.length; i++) {
            array[i + 2] = data.charCodeAt(i);
        }

        return array;
    },
    Decode: (data: Uint8Array, idx: number = 0) => {
        if (!String16.Validate(data, idx)) throw new ValidationError();

        var str = "";
        var length = Uint8.Decode(data, idx);

        for (var i = 0; i < length; i++) {
            str += String.fromCharCode(data[idx + 2 + i]);
        }

        return str;
    }
};

export const Raw8: Type<Uint8Array> = {
    Length: (data: Uint8Array) => {
        return 1 + data.length;
    },
    Validate: (data: Uint8Array, idx: number = 0) => {
        if (data.length - idx < 1) return false;
        if (data.length - idx - 1 < Uint8.Decode(data, idx)) return false;
        return true;
    },
    Encode: (data: Uint8Array) => {
        var array = new Uint8Array(1 + data.length);

        try {
            array.set(Uint8.Encode(data.length), 0);
        } catch (err) {
            if (err instanceof OutOfBoundsError)
                throw new OutOfBoundsError("length exceeds maximum for Raw8");
        }

        array.set(data, 1);
        return array;
    },
    Decode: (data: Uint8Array, idx: number = 0) => {
        if (!Raw8.Validate(data, idx)) throw new ValidationError();

        var length = Uint8.Decode(data, idx);
        return data.subarray(1, 1 + length);
    }
};

export const Raw16: Type<Uint8Array> = {
    Length: (data: Uint8Array) => {
        return 2 + data.length;
    },
    Validate: (data: Uint8Array, idx: number = 0) => {
        if (data.length - idx < 2) return false;
        if (data.length - idx - 2 < Uint8.Decode(data, idx)) return false;
        return true;
    },
    Encode: (data: Uint8Array) => {
        var array = new Uint8Array(2 + data.length);

        try {
            array.set(Uint8.Encode(data.length), 0);
        } catch (err) {
            if (err instanceof OutOfBoundsError)
                throw new OutOfBoundsError("length exceeds maximum for Raw16");
        }

        array.set(data, 2);
        return array;
    },
    Decode: (data: Uint8Array, idx: number = 0) => {
        if (!Raw8.Validate(data, idx)) throw new ValidationError();

        var length = Uint8.Decode(data, idx);
        return data.subarray(2, 2 + length);
    }
};

export const Int8: Type<number> = {
    Length: (data: number) => {
        return 1;
    },
    Validate: (data: Uint8Array, idx: number = 0) => {
        return data.length - idx >= 1;
    },
    Encode: (data: number) => {
        if (!integerRange(data, 8, true))
            throw new OutOfBoundsError(`${data} out of range for Int8`);
        return new Uint8Array([data + 128]);
    },
    Decode: (data: Uint8Array, idx: number = 0) => {
        if (!Int8.Validate(data, idx)) throw new ValidationError();

        return (data[idx] as number) - 128;
    }
};

export const Uint8: Type<number> = {
    Length: (data: number) => {
        return 1;
    },
    Validate: (data: Uint8Array, idx: number = 0) => {
        return data.length - idx >= 1;
    },
    Encode: (data: number) => {
        if (!integerRange(data, 8, false))
            throw new OutOfBoundsError(`${data} out of range for Uint8`);
        return new Uint8Array([data]);
    },
    Decode: (data: Uint8Array, idx: number = 0) => {
        if (!Uint8.Validate(data, idx)) throw new ValidationError();

        return data[idx] as number;
    }
};

export const Int16: Type<number> = {
    Length: (data: number) => {
        return 2;
    },
    Validate: (data: Uint8Array, idx: number = 0) => {
        return data.length - idx >= 2;
    },
    Encode: (data: number) => {
        if (!integerRange(data, 16, true))
            throw new OutOfBoundsError(`${data} out of range for Int16`);
        return new Uint8Array(convertToBase(data + 32768, 256, 2));
    },
    Decode: (data: Uint8Array, idx: number = 0) => {
        if (!Int16.Validate(data, idx)) throw new ValidationError();

        return convertFromBase(getSubArray(data, idx, 2), 256) - 32768;
    }
};

export const Uint16: Type<number> = {
    Length: (data: number) => {
        return 2;
    },
    Validate: (data: Uint8Array, idx: number = 0) => {
        return data.length - idx >= 2;
    },
    Encode: (data: number) => {
        if (!integerRange(data, 16, false))
            throw new OutOfBoundsError(`${data} out of range for Uint16`);
        return new Uint8Array(convertToBase(data, 256, 2));
    },
    Decode: (data: Uint8Array, idx: number = 0) => {
        if (!Uint16.Validate(data, idx)) throw new ValidationError();

        return convertFromBase(getSubArray(data, idx, 2), 256);
    }
};

export const Int32: Type<number> = {
    Length: (data: number) => {
        return 4;
    },
    Validate: (data: Uint8Array, idx: number = 0) => {
        return data.length - idx >= 4;
    },
    Encode: (data: number) => {
        if (!integerRange(data, 32, true))
            throw new OutOfBoundsError(`${data} out of range for Int32`);
        return new Uint8Array(convertToBase(data + 32768, 256, 4));
    },
    Decode: (data: Uint8Array, idx: number = 0) => {
        if (!Int32.Validate(data, idx)) throw new ValidationError();

        return convertFromBase(getSubArray(data, idx, 4), 256) - 32768;
    }
};

export const Uint32: Type<number> = {
    Length: (data: number) => {
        return 4;
    },
    Validate: (data: Uint8Array, idx: number = 0) => {
        return data.length - idx >= 4;
    },
    Encode: (data: number) => {
        if (!integerRange(data, 32, false))
            throw new OutOfBoundsError(`${data} out of range for Uint32`);
        return new Uint8Array(convertToBase(data, 256, 4));
    },
    Decode: (data: Uint8Array, idx: number = 0) => {
        if (!Uint32.Validate(data, idx)) throw new ValidationError();

        return convertFromBase(getSubArray(data, idx, 4), 256);
    }
};

export const Float: Type<number> = {
    Length: (data: number) => {
        return 4;
    },
    Validate: (data: Uint8Array, idx: number = 0) => {
        return data.length - idx >= 4;
    },
    Encode: (data: number) => {
        return encodeFloat(data, 8, 23, 127);
    },
    Decode: (data: Uint8Array, idx: number = 0) => {
        if (!Uint32.Validate(data, idx)) throw new ValidationError();

        return decodeFloat(data.subarray(idx, idx + 4), 8, 23, 127);
    }
};

export const Double: Type<number> = {
    Length: (data: number) => {
        return 8;
    },
    Validate: (data: Uint8Array, idx: number = 0) => {
        return data.length - idx >= 8;
    },
    Encode: (data: number) => {
        return encodeFloat(data, 11, 52, 1023);
    },
    Decode: (data: Uint8Array, idx: number = 0) => {
        if (!Uint32.Validate(data, idx)) throw new ValidationError();

        return decodeFloat(data.subarray(idx, idx + 8), 11, 52, 1023);
    }
};

export const List: Type<Uint8Array[]> = {
    Length: (data: Uint8Array[]) => {
        return (
            2 + data.length + data.map((e) => e.length).reduce((a, b) => a + b)
        );
    },
    Validate: (data: Uint8Array, idx: number = 0) => {
        if (data.length - idx < 2) return false;
        return true;
    },
    Encode: (data: Uint8Array[]) => {
        var array = new Uint8Array(List.Length(data));
        array.set(Uint16.Encode(data.length));

        var idx = 2;
        for (var i = 0; i < data.length; i++) {
            let size = data[i].length;
            array.set(Uint8.Encode(size), idx);
            array.set(data[i], idx + 1);
            idx += 1 + size;
        }

        return array;
    },
    Decode: (data: Uint8Array, idx: number = 0) => {
        if (!List.Validate(data, idx)) throw new ValidationError();
        var array: Uint8Array[] = [];
        var length = Uint16.Decode(data, idx);

        var index = idx + 2;
        for (var i = 0; i < length; i++) {
            let size = Uint8.Decode(data, index);
            let elem = data.subarray(index + 1, index + 1 + size);
            array.push(elem);
            index += 1 + size;
        }

        return array;
    }
};

export const Flags: Type<FlagArray> = {
    Length: (data: FlagArray) => {
        return 1;
    },
    Validate: (data: Uint8Array, idx: number = 0) => {
        return data.length - idx >= 1;
    },
    Encode: (data: FlagArray) => {
        var byte: number = 0;
        for (var i = 0; i < 8; i++)
            byte = byte | ((data[i] ? 1 : 0) << (7 - i));

        return new Uint8Array([byte]);
    },
    Decode: (data: Uint8Array, idx: number = 0) => {
        if (!Flags.Validate(data, idx)) throw new ValidationError();
        var number = data[idx];
        var flags: FlagArray = [
            false,
            false,
            false,
            false,
            false,
            false,
            false,
            false
        ];

        for (var i = 0; i < 8; i++) flags[i] = (number & (1 << (7 - i))) != 0;

        return flags;
    }
};

export const Boolean: Type<boolean> = {
    Length: (data: boolean) => {
        return 1;
    },
    Validate: (data: Uint8Array, idx: number = 0) => {
        return data.length - idx >= 1;
    },
    Encode: (data: boolean) => {
        return new Uint8Array([data ? 255 : 0]);
    },
    Decode: (data: Uint8Array, idx: number = 0) => {
        if (!Boolean.Validate(data, idx)) throw new ValidationError();

        return data[idx] != 0;
    }
};

// PACKING MACHINE
export class PackingMachine {
    private formats: Map<string, Format> = new Map<string, Format>();
    private serializer: Map<number, string> = new Map<number, string>();
    private funcs: Map<string, Callback> = new Map<string, Callback>();

    format(name: string, format: Type<any>[]): void {
        var id = this.formats.size;
        this.serializer.set(id, name);
        this.formats.set(name, {
            serialized: id,
            schema: format
        });
    }

    on(type: string, func: (data: Data[], type: string) => any) {
        this.funcs.set(type, func);
    }

    pack(type: string, data: Data[]): Uint8Array {
        var format = this.formats.get(type) as Format;
        if (!format) throw new Error("format does not exist");

        var encoded: Uint8Array[] = [];
        for (var i = 0; i < format.schema.length; i++) {
            encoded.push(format.schema[i].Encode(data[i]));
        }

        return joinBuffers([Uint8.Encode(format.serialized), ...encoded]);
    }

    unpack(data: Uint8Array): { name: string; data: Data[] } {
        var id = data[0];

        var name = this.serializer.get(id);
        if (!name) throw new Error("format does not exist");

        var format = this.formats.get(name);
        if (!format) throw new Error("format does not exist");

        var idx = 1;
        var array: Data[] = [];
        for (var i = 0; i < format.schema.length; i++) {
            let elem = format.schema[i].Decode(data, idx);
            idx += format.schema[i].Length(elem);
            array.push(elem);
        }

        return { name: name, data: array };
    }

    receive(packet: Uint8Array) {
        var { name, data } = this.unpack(packet);

        var func = this.funcs.get(name);
        if (func) func(data, name);
    }
}
