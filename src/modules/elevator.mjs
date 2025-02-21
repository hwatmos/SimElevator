import {
    numFloors, floorZeroX, floorZeroY, floorHeight, eleWidth, floorHeight, 
    ELEV_SPEED, SPEED
} from "./params.mjs";

import { elevYToFloorIfSafe} from "./support.mjs";

let elev,
floorRequests = new Array(numFloors).fill(false)
;


let higestRequestedFloor = -1 // neg. one indicates no floors are awaiting elevator
;

class ElevatorConsole {
    constructor(app, container, elev) {
        // Initiate sprite
        let colorPalette = [0xafc9ff, 0xc7d8ff, 0xfff4f3, 0xffe5cf, 0xffd9b2, 0xffffff, 0xffa651];
        this.graphic = new PIXI.Graphics();
        this.graphic.roundRect(0,0,44,Math.ceil(numFloors/2)*20 + 5,2).stroke(0xafc9ff);
        this.texture = app.renderer.generateTexture(this.graphic);
        this.container = new PIXI.Container();
        this.sprite = new PIXI.Sprite(this.texture);
        this.container.x = floorZeroX+120;
        this.container.y = floorZeroY - floorHeight * numFloors + floorHeight +20;
        this.sprite.x = 0;
        this.sprite.y = 0;
        // Buttons
        this.buttons = new Array(numFloors);
        this.activeButtonGraphic = new PIXI.Graphics().circle(0,0,7).fill(0xafc9ff);
        this.activeButtonTexture = app.renderer.generateTexture(this.activeButtonGraphic);
        this.inactiveButtonGraphic = new PIXI.Graphics().circle(0,0,7).stroke(0xafc9ff);
        this.inactiveButtonTexture = app.renderer.generateTexture(this.inactiveButtonGraphic);
        for (let i=numFloors-1; i>=0; i--) {
            this.buttons[i] = new Object;
            // left or right
            let col = i % 2 == 0 ? 0 : 1;
            this.buttons[i].sprite = new PIXI.Sprite(this.inactiveButtonTexture);
            this.buttons[i].sprite.x = 5 + col * 20
            this.buttons[i].sprite.y = 5 + (Math.ceil(numFloors/2) - Math.floor(i/2) - 1) * 20
            this.buttons[i].sprite.visible = true
            // player can press floor button on the elevator
            this.buttons[i].sprite.interactive = true;
            this.buttons[i].sprite.on('pointerdown', (event) => { elev.floorRequests[i] = true; });
            this.container.addChild(this.buttons[i].sprite);
        }
        this.container.addChild(this.sprite);
        container.addChild(this.container);

        this.update = function (elev) {
            for (let i=numFloors-1; i>=0; i--) {
                if (elev.floorRequests[i]) {
                this.buttons[i].sprite.texture = this.activeButtonTexture;
                } else {
                this.buttons[i].sprite.texture = this.inactiveButtonTexture;
                }
            }
        }
    }
}

class HallButtons {
    // The buttons used to call the eleveator, one on each floor
    constructor(app, container) {
        // Initiate sprite
        this.graphic = new PIXI.Graphics();
        //this.graphic.lineStyle(1,0xafc9ff,1,0.5,false);
        this.graphic.roundRect(0,0,44,numFloors/2*20 + 5,2);
        this.texture = app.renderer.generateTexture(this.graphic);
        this.sprite = new PIXI.Container();
        this.sprite.x = floorZeroX-3;
        this.sprite.y = floorZeroY+15;
        // Buttons
        this.buttons = new Array(numFloors);
        this.activeButtonGraphic = new PIXI.Graphics().circle(0,0,.5).fill(0xffffff).stroke(0xffffff);
        this.activeButtonTexture = app.renderer.generateTexture(this.activeButtonGraphic);
        this.inactiveButtonGraphic = new PIXI.Graphics().circle(0,0,.5).fill(0x302d40).stroke(0x302d40);
        this.inactiveButtonTexture = app.renderer.generateTexture(this.inactiveButtonGraphic);
        for (let i=numFloors-1; i>=0; i--) {
        this.buttons[i] = new Object;
        this.buttons[i].sprite = new PIXI.Sprite(this.inactiveButtonTexture);
        this.buttons[i].sprite.x = 0
        this.buttons[i].sprite.y = -(i) * floorHeight
        this.sprite.addChild(this.buttons[i].sprite)
        }
        container.addChild(this.sprite);

        this.update = function () {
        for (let i=numFloors-1; i>=0; i--) {
            if (floorRequests[i]) {
            this.buttons[i].sprite.texture = this.activeButtonTexture;
            } else {
            this.buttons[i].sprite.texture = this.inactiveButtonTexture;
            }
        }
        }
    }
}

class Elevator{
    constructor(app, container) {
        this.curFloor = 0;
        this.movSpeed = ELEV_SPEED * SPEED; // value of one gave me about 1 second per floor
        this.direction = 0; // 0 = no direction; 1 = up; -1 = down
        this.doorCloseDelay = 0;
        this.aboardCount = 0;
        this.floorRequests = new Array(numFloors).fill(false);
        this.higestRequestedFloor = -1;
		this.lowestRequestedFloor = numFloors+999; // only used to check if a floor below was requested so a large number is ok
        this.holdingDoor = false; // sprites can hold the door if there is more room on the elev and more sprites on the floor
        this.currentStatus = 0;
		this.numOfConsoleRequests = 0; // Tracks how many floors are currently lit up on the elevator console
        /**
         * 0   = idle i.e. standing, no passengers (and the door is open);
         * 1   = the door is open, riders are boarding or exiting;
         * 100 = going up;
         * 101 = going down;
         * 200 = opening door;
         * 300 = closing door;
         * 
         * Examples of state transition:
         * 0 >> 1 >> 300 >> 100 >> 200 >> 1 >> 300 >> 100 >> 200 >> 2 >> 1 >> 101 >> 200 > 2 >> 0;
         * 0 >> 300 >> 101 >> 200 >> 1 >> 300 >> 101 >> 200 >> 2 >> 0;
		 * 
		 * General rule:
		 * Always continue moving up (1) if the highest request is above.
		 * Only continue moving down (-1) if the lowest console request is below.
		 * When moving up (1), always stop at the console's requested floors.
		 * When moving down (-1), always stop at the console and hall requests.
         */
        //TODO: once all riders depart and noone boards, go to the highest floor where elevator was requested

        // Initiate sprite
        this.graphic = new PIXI.Graphics()
            .roundRect(0,0,eleWidth,floorHeight,2)
            .stroke({ color: 0xffffff, pixelLine: true });
        this.texture = app.renderer.generateTexture(this.graphic);
        this.sprite = new PIXI.Sprite(this.texture);
        this.x = floorZeroX;
        this.y = floorZeroY;
        this.sprite.x = floorZeroX;
        this.sprite.y = floorZeroY;
        app.stage.addChild(this.sprite);

        this.move = function(timeDelta, time) {
            switch (this.currentStatus) {
				case 0: // idle & door is closed
					// clear requests for the current floor
					//if (this.curFloor > -1) { // delete?
						if (this.floorRequests[this.curFloor]) {
							this.cancelElevatorRequest(this.curFloor);
						}
					//} // delete?
					// The next two sections check for requests. Hall requests are prioritized, i.e. if a hall request
					// was made at the same time as the console request, the hall request dictates the direction (this
					// is not a very likely situation for both types of requests to occur simultaneously)

					// Check for hall requests
					for (let i=numFloors-1; i>=0; i--) { // prioritize higher floors
						if (floorRequests[i]) {
							if (i == this.curFloor) {
								this.currentStatus = 200;
								cancelElevatorRequest(this.curFloor);
							}
						else {
							this.currentStatus = i > this.curFloor ? 100 : 101;
							this.direction = i > this.curFloor ? 1 : -1;
						}
						}
					}
					// if no hall requests, check what console requests were made
					if (this.currentStatus == 0) {
						for (let i=numFloors-1; i>=0; i--) { // prioritize higher floors
							if (this.floorRequests[i]) {
								this.currentStatus = i > this.curFloor ? 100 : 101;
								this.direction = i > this.curFloor ? 1 : -1;
							}
						}
					}
					break;

				case 1: // door is open, passengers are boarding and exiting
					if (this.doorCloseDelay >= 6 & !this.holdingDoor) {
						this.currentStatus = 300;
						this.doorCloseDelay = 0;
					} else {
						this.doorCloseDelay += 1;
					}
					break;

				case 100: // going up
					// go up and stop in only two cases: riders' destination, or the highest requested floor
					this.curFloor = elevYToFloorIfSafe(this.y)
					if (this.curFloor > -1) {
						if (this.floorRequests[this.curFloor]) { // a rider requested this floor, need to stop
							this.cancelElevatorRequest(this.curFloor);
							cancelElevatorRequest(this.curFloor);
							this.currentStatus = 200;
							break;
						}
						if (this.higestRequestedFloor < this.curFloor) {
							if (higestRequestedFloor == this.curFloor) { // no riders going up and this is the higest request
									this.cancelElevatorRequest(this.curFloor);
									cancelElevatorRequest(this.curFloor);
									this.currentStatus = 200;
									break;
							}
						}
					}
					this.y += - (this.movSpeed*floorHeight * timeDelta/60);
					break;

				case 101: // going down
					this.curFloor = elevYToFloorIfSafe(this.y)
					if (this.curFloor > -1) {
						if (this.floorRequests[this.curFloor] || floorRequests[this.curFloor]) {
								this.cancelElevatorRequest(this.curFloor);
								cancelElevatorRequest(this.curFloor);
								this.currentStatus = 200;
								break;
						}
					}
					this.y += (this.movSpeed*floorHeight * timeDelta/60);
					break;

				case 200: // door is opening
					// TODO: add timer to simultae door opening
					this.currentStatus = 1;
					break;

				case 300: // door is closing
					// TODO: add timer to simultae door closing
					this.curFloor = elevYToFloorIfSafe(this.y);
					switch (this.direction) {
						case 1: {
							if (this.higestRequestedFloor > this.curFloor || higestRequestedFloor > this.curFloor) {
								this.currentStatus = 100;
								this.direction = 1;
								break;
							}
							else if (this.higestRequestedFloor < this.curFloor || higestRequestedFloor < this.curFloor) {
								this.currentStatus = 101;
								this.direction = -1;
								break;
							}
							else {
								this.currentStatus = 0;
								this.direction = 0;
							}
						}
						case -1: {
							if (this.lowestRequestedFloor < this.curFloor) {
								this.currentStatus = 101;
								this.direction = -1;
								break;
							}
							else if (this.higestRequestedFloor > this.curFloor || higestRequestedFloor > this.curFloor) {
								this.currentStatus = 100;
								this.direction = 1;
								break;
							}
							else {
								this.currentStatus = 0;
								this.direction = 0;
							}
						}
						case 0: {
							if (this.higestRequestedFloor > this.curFloor || higestRequestedFloor > this.curFloor) {
									this.currentStatus = 100;
									this.direction = 1;
								break;
							}
							else if (this.higestRequestedFloor < this.curFloor && this.higestRequestedFloor >= 0 || higestRequestedFloor < this.curFloor && higestRequestedFloor >= 0) {
									this.currentStatus = 101;
									this.direction = -1;
								break;
							}
						}
					}
					break;
			}
            this.sprite.y = this.y; 
        }

		this.pushButtonOnElev = function (floor) {
			if (!this.floorRequests[floor]) {
				this.numOfConsoleRequests ++;
				this.floorRequests[floor] = true;
			}
			this.higestRequestedFloor = -1
			for (i=numFloors-1; i>=0; i--) {
					if (this.floorRequests[i]) {
					this.higestRequestedFloor = i;
				break;
				}
			}
			this.lowestRequestedFloor = numFloors+999;
			for (i=0; i<=numFloors-1; i++) {
					if (this.floorRequests[i]) {
					this.lowestRequestedFloor = i;
				break;
				}
			}
		}

		this.cancelElevatorRequest = function (floor) { // same name as global function. this one clears only the console, rename to match this purpose
			this.floorRequests[floor] = false;
			this.numOfConsoleRequests --;
		
			this.higestRequestedFloor = -1;
			for (i=numFloors-1; i>=0; i--) {
				if (this.floorRequests[i]) {
					this.higestRequestedFloor = i;
					break;
				}
			}
			this.lowestRequestedFloor = numFloors+999;
			for (i=0; i<=numFloors-1; i++) {
					if (this.floorRequests[i]) {
					this.lowestRequestedFloor = i;
				break;
				}
			}
      }
    }
}

function cancelElevatorRequest(floor) {
  floorRequests[floor] = false;

  higestRequestedFloor = -1;
  for (i=numFloors-1; i>=0; i--) {
    if (floorRequests[i]) {
      higestRequestedFloor = i;
      break;
    }
  }

  //console.log('highest is ' + higestRequestedFloor)
}

function requestElevator(floor) {
    /**
     * Simulates person requesting an elevator on a given floor.
     * 
     * Updates the floorRequests array to true for a given floor integer.
     */
    if (!floorRequests[floor] && floor!=null) {
      floorRequests[floor] = true;
      //console.log('Requested elevator on floor '+floor);
  
      higestRequestedFloor = -1;
      for (i=numFloors-1; i>=0; i--) {
        if (floorRequests[i]) {
          higestRequestedFloor = i;
          break;
        }
      }
    }
  }

export {ElevatorConsole, HallButtons, Elevator, floorRequests, requestElevator};