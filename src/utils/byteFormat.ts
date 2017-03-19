const MAGNITUDE_PREFIXES: string[] = ["", "k", "M", "G", "TStatus"];
const MAGNITUDE_STEP: number = 1024;

function reducedFormat(unit: string, value: number): string {
    let magnitude = 0;
    while (value > MAGNITUDE_STEP) {
        value /= MAGNITUDE_STEP;
        magnitude++;
    }
    return `${value.toFixed(1)} ${MAGNITUDE_PREFIXES[magnitude]}${unit}`;
}

export function speed(value: number): string {
    return reducedFormat("B/s", value);
}

export function size(value: number): string {
    return reducedFormat("B", value);
}