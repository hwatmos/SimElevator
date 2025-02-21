import {
    numFloors,
    MAX_QUEUE_LENGTH, setNextArrivalTime,
    floorZeroX,
    floorZeroY,
    floorHeight,
    MAX_PASSENGERS,
    SPEED,
    eleWidth,
    poissonLambda
} from "./params.mjs";
import { floorRequests, requestElevator } from "./elevator.mjs";
import { randPoisson } from "./support.mjs";
import { container, maxX } from "./engine.mjs";

let
    queueLengthByFloor = new Array(numFloors).fill(0), // count of Sprites waiting i.e. excludes sprites that are from this floor but are already on elevator;
    spritesByFloor = new Array(numFloors),
    passengers = [],
    nextArrivalsTime = randPoisson(60),
    queuePositionsByFloor = [],
    personsMovementSpeed = 10 * SPEED
    ;
for (let i = 0; i < numFloors; i++) {
    spritesByFloor[i] = [];
};
for (let i = 0; i < numFloors; i++) {
    queuePositionsByFloor[i] = new Array(100).fill(false);
};

function createNewPerson(currentTime, forceFloor = -1) {
    // Randomly picks starting and destination floors and creates new person.
    let startingFloor = 0;
    if (forceFloor >= 0) {
        startingFloor = forceFloor;
    }
    else {
        startingFloor = Math.random() >= 0.5 ? startingFloor : Math.floor(Math.random() * numFloors);
    }
    if (queueLengthByFloor[startingFloor] >= MAX_QUEUE_LENGTH) {
        return;
    }
    let destinationFloor = -1;

    // Appropriately choose random destination
    if (startingFloor > 0) {
        // most likely going to floor zero
        if (Math.random() < 0.95) { // 0.85 resulted in too many going up from non-ground floor.
            // That caused an ungly buildup of passengers
            destinationFloor = 0;
        } else {
            // random floor different from starting floor
            do {
                destinationFloor = Math.floor(Math.random() * numFloors);
            } while (startingFloor == destinationFloor);
        }
    } else {
        // starting floor is 0 so pick any non zero floor for destination
        destinationFloor = Math.floor(Math.random() * (numFloors - 1)) + 1;
    }

    // Store reference to this new person
    spritesByFloor[startingFloor].push(new Person(currentTime, startingFloor, destinationFloor));
    // Random arrival time for the next person
    nextArrivalsTime = currentTime + randPoisson(poissonLambda);
}

function pickPersonsColor(floor) {
    /**
     * Randomly pick a color for a person's sprite.
     * TODO: assign color based on floor number
     */
    let colorPalette = [0xafc9ff, 0xc7d8ff, 0xfff4f3, 0xffe5cf, 0xffd9b2, 0xffffff, 0xffa651];
    let color = colorPalette[Math.floor(Math.random() * 6)];
    return color;
}

class Person {
    constructor(currentTime, floor, destinationFloor, sprite_status) {
        this.color = pickPersonsColor(floor);
        this.birthTime = currentTime;
        this.startingFloor = floor;
        this.destinationFloor = destinationFloor;
        this.direction = this.destinationFloor > this.startingFloor ? 1 : -1;
        this.requestedElevator = false;

        this.x = Math.min(floorZeroX - 10 * (queueLengthByFloor[floor] + 1), floorZeroX - Math.random() * 80 - 20);
        this.x = this.startingFloor == 0 ? 0 : this.x;
        this.y = floorZeroY - floorHeight * floor + 15;
        this.exitDoorNum = Math.floor(Math.random() * 3)
        this.exitDoorXLoc = floorZeroX + (this.destinationFloor == 0 ? maxX : Math.random() * 95);
        this.currentStatus = 0;
        this.holdingDoorForNextPers = false; // not needed for the logic but used for displaying sprite status

        this.movementSpeedModifier = Math.random() * 0.6 + 0.9;
        /**
         * 0   = waiting for the elevator.
         * 1   = in process of boarding the elevator.
         * 100 = on the elevator.
         * 101 = in process of exiting the elevator.
         * 200 = walking to the exit (departed elevator).
         * 999 = awaiting destruction.
         */
        this.positionInQueue = queueLengthByFloor[floor] + 1;
        this.enteredQueue = false; // false indicates that this sprite is still walking towards the queue
        queuePositionsByFloor[this.startingFloor][this.positionInQueue] = true;

        this.destroy = function () {
            container.removeChild(this.sprite);
        };

        // Movement
        this.move = function (time, timeDelta, elev, app) {
            switch (this.currentStatus) {
                case 0: // Waiting for an elevator // ! 0909
                    this.holdingDoorForNextPers = false;
                    // Adjust position in queue
                    if (queuePositionsByFloor[this.startingFloor][this.positionInQueue - 1] == false) {
                        // if space to the right freed up, move right
                        queuePositionsByFloor[this.startingFloor][this.positionInQueue] = false;
                        this.positionInQueue--;
                        queuePositionsByFloor[this.startingFloor][this.positionInQueue] = true;
                    }

                    // If close enough to their place in queue, consider this sprite to be in the queue
                    if (this.x >= floorZeroX - 10 * (this.positionInQueue + 1) - 30) {
                        if (!this.enteredQueue) {
                            queueLengthByFloor[this.startingFloor]++;
                            this.enteredQueue = true;
                        }
                    }

                    // If x-coordinate different from positionInQueue's x-coord, move towards the correct x
                    if (this.x < floorZeroX - 10 * (this.positionInQueue + 1)) {
                        this.x += this.movementSpeedModifier * personsMovementSpeed * timeDelta / 60;
                        // randomly change speed
                        if (Math.random() > .9) {
                            this.movementSpeedModifier = Math.random() * 0.6 + 0.9;
                        }
                    }
                    else if (this.positionInQueue == 0) { // first in queue...
                        if (!this.requestedElevator && !(elev.curFloor == this.startingFloor && elev.currentStatus == 1) || (!floorRequests[this.startingFloor] && elev.curFloor != this.startingFloor)) {
                            requestElevator(this.startingFloor);
                            this.requestedElevator = true;
                        }
                        if (elev.curFloor == this.startingFloor) { // ... and elevator is here - consider boarding.
                            if (elev.currentStatus == 1) {
                                // if going in the same direction as the elevator, board
                                // or if elevator is empty, board
                                //if (elev.aboardCount==0 || elev.direction*this.direction >= 0) { // Unnecessary with the current approach where sprite queue is like a stack b/c sprites can't skip line.  So, waiting until elev. is going in the correct direction blocks all sprites behind
                                if (elev.aboardCount < MAX_PASSENGERS) {
                                    elev.currentlyBoardingCount++;
                                    this.currentStatus = 1;
                                    elev.holdingDoor = true;
                                    queuePositionsByFloor[this.startingFloor][this.positionInQueue] = false;
                                    this.positionInQueue = -1;
                                    queueLengthByFloor[this.startingFloor]--;
                                }
                                //}
                            }
                        }
                    }
                    break;

                case 1: // Boarding the elevator // ! 0909
                    // walk towards the elevator until on it
                    this.holdingDoorForNextPers = false;
                    // *remember: elevator's passenger count was already increased in case 0
                    if (this.x < floorZeroX + eleWidth / 2 - 1) {
                        this.x += personsMovementSpeed * timeDelta / 60;
                        elev.holdingDoor = true;
                    } else {
                        this.currentStatus = 100;
                        elev.aboardCount++;
                        elev.pushConsoleButton(this.destinationFloor);
                        elev.currentlyBoardingCount--;
                    }
                    break;

                case 100: // Aboard the elevator // ! 0909
                    // If the elevator is still boarding, hold the door if there is still room
                    if (elev.currentStatus == 1) {
                        if (elev.aboardCount < MAX_PASSENGERS & queueLengthByFloor[elev.curFloor] > 0) {
                            elev.holdingDoor = true;
                            this.holdingDoorForNextPers = true;
                        } else {
                            elev.holdingDoor = false;
                            this.holdingDoorForNextPers = false;
                        }
                    }
                    // Arrived at the destination floor?
                    if (elev.curFloor == this.destinationFloor) {
                        if (elev.currentStatus == 1) {
                            this.currentStatus = 101;
                            elev.holdingDoor = true;
                            elev.currentlyDepartingCount++;
                            elev.aboardCount--;
                        }
                    }
                    // Move rider sprites together with the elevator
                    this.x = elev.sprite.x + eleWidth / 2 - 1;
                    this.y = elev.sprite.y + 15;
                    break;

                case 101: // Exiting the elevator // ! 0909
                    this.holdingDoorForNextPers = false;
                    if (this.x < floorZeroX + 10) {
                        this.x += personsMovementSpeed * timeDelta / 60;
                        elev.holdingDoor = true;
                    } else {
                        this.currentStatus = 200;
                        elev.currentlyDepartingCount--;
                    }

                    break;
                case 200: // Walking towards "exit" // ! 0909
                    this.holdingDoorForNextPers = false;
                    // move sprite to the right until reaching exitDoorXLoc
                    if (this.x < this.exitDoorXLoc) {
                        this.x += this.movementSpeedModifier * personsMovementSpeed * timeDelta / 60;
                    } else {
                        this.currentStatus = 999;
                    }
                    // randomly change speed
                    if (Math.random() > .9) {
                        this.movementSpeedModifier = Math.random() * 0.6 + 0.9;
                    }
                    break;
                case 999: // Awaiting destruction // ! 0909
                    // will be destroyed by the main loop
                    this.destroy();
                    break;
                default:
                    break;
            }
            // Update sprite with coords as recalculated in above cases
            this.sprite.x = this.x;
            this.sprite.y = this.y;
        };

        // Sprite
        this.pers_height = 3 + 2 * Math.random();
        this.graphic = new PIXI.Graphics()
            .circle(0, -this.pers_height, 2)
            .ellipse(0, 5 - this.pers_height, 1 + Math.random(), this.pers_height)
            .fill(this.color);

        this.texture = app.renderer.generateTexture(this.graphic);
        this.sprite = new PIXI.Sprite(this.texture);
        this.sprite.x = this.x;
        this.sprite.y = this.y;
        this.sprite.anchor.set(0, 0.5);

        // Interactivity
        this.sprite.interactive = true;
        this.sprite.on('pointerdown', (event) => {
            if (sprite_status.sprite_ref != null) { sprite_status.sprite_ref.sprite.tint = 0xFFFFFF; }
            sprite_status.sprite_ref = this;
            this.sprite.tint = 0xff0000;
        })

        container.addChild(this.sprite);
    }
}

function moveSprites(elapsed, delta, elev, app) {
    for (let i = 0; i < numFloors; i++) {
        for (let j = 0; j < spritesByFloor[i].length; j++) {
            spritesByFloor[i][j].move(elapsed, delta, elev, app);
        }
    }
}


export { Person, moveSprites, passengers, createNewPerson, nextArrivalsTime };