import { SPEED, floorZeroY, floorHeight } from './params.mjs';

function randPoisson(lambda) {
    // https://stackoverflow.com/questions/1241555/algorithm-to-generate-poisson-and-binomial-random-numbers
    let L = Math.exp(-lambda/SPEED);
    let p = 1.0;
    let k = 0;

    do {
        k++;
        p *= Math.random();
    } while (p > L);
    return k - 1;
}

function elevYToFloorIfSafe(y) {
    // Convert y-coordinate to floor number
    threshold = 1;
    let floor = -1; // this value indicates that the elevator is not aligned with any floor
    let lowerFloor = Math.floor(-(y - floorZeroY) / floorHeight);
    let upperFloor = Math.ceil(-(y - floorZeroY) / floorHeight);
    if (Math.floor(-(y - threshold - floorZeroY) / floorHeight) == upperFloor) {
        // stop here, i.e. upperFloor
        floor = upperFloor;
    }
    else if (Math.ceil(-(y + threshold - floorZeroY) / floorHeight) == lowerFloor) {
        // stop here, i.e. lowerFloor
        floor = lowerFloor;
    }
    return floor;
}

export {randPoisson, elevYToFloorIfSafe};