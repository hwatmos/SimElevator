/**
 * *Dev Notes
 * 2021-11-14
 * - Updated Persons class. The class now adjusts elevator's boarding, departing,
 * and aboard counts so that the elevator knows when it can start closing doors.
 * - Started updating elevator function/class too. Removed closeDoor function. 
 * Next, need to change move() to use currentStatus
 */

/////////////////////////////////////////////////////////////////////////////////
//#region Helper functions
/**
 * *Poisson Distribution
 * 
 * https://stackoverflow.com/questions/1241555/algorithm-to-generate-poisson-and-binomial-random-numbers
 */

 function randPoisson(lambda) {
  let L = Math.exp(-lambda);
  let p = 1.0;
  let k = 0;

  do {
      k++;
      p *= Math.random();
  } while (p > L);
  return k - 1;
}

// #endregion
/////////////////////////////////////////////////////////////////////////////////
//#region PixiJs setup
/**
 * * PixiJS setup.
 */

 const app = new PIXI.Application({
  autoResize: true,
  resolution: devicePixelRatio,
  backgroundColor: 0x3d3b49
});
document.querySelector('#frame').appendChild(app.view);

let maxX = app.screen.width;
let maxY = app.screen.height;
let halfX = maxX/2.;
let halfY = maxY/2.;

// Resize function window
function resize() {

  // Get the p
  const parent = app.view.parentNode;

  // Listen for window resize events
  window.addEventListener('resize', resize);

  // Resize the renderer
  app.renderer.resize(parent.clientWidth, parent.clientHeight);

  // You can use the 'screen' property as the renderer visible
  // area, this is more useful than view.width/height because
  // it handles resolution
  //rect.position.set(app.screen.width, app.screen.height);
  maxX = app.screen.width;
  maxY = app.screen.height;
  halfX = maxX/2.;
  halfY = maxY/2.;

}

resize();

let container = new PIXI.Container();

// #endregion
/////////////////////////////////////////////////////////////////////////////////
//#region Branding
/**
 * *Branding
 */
const style = new PIXI.TextStyle({
  fontFamily: 'Courier New',
  fontSize: 36,
  //fontStyle: 'italic',
  //fontWeight: 'bold',
  //fill: ['#ffffff', '#00ff99'], // gradient
  fill: '#33ff00',
  //stroke: '#4a1850',
  strokeThickness: 0,
  //dropShadow: true,
  //dropShadowColor: '#000000',
  //dropShadowBlur: 4,
  //dropShadowAngle: Math.PI / 6,
  //dropShadowDistance: 6,
  //wordWrap: true,
  //wordWrapWidth: 440,
  lineJoin: 'round',
});

const richText = new PIXI.Text('0xhwatmos', style);
richText.x = 10;
richText.y = 50;
richText.interactive = true;
richText.on('pointerdown', (event) => { console.log('clicked!'); });

app.stage.addChild(richText);

// #endregion
/////////////////////////////////////////////////////////////////////////////////
//#region Setup
/**
 * *Setup
 */
let numFloors = 10;
let floorZeroX = 500;
let floorZeroY = 500;
let floorHeight = 25;
let eleWidth = 15;

let floorQueue = []; //*TODO: replacing this with floorRequests list
let floorRequests = new Array(numFloors).fill(false);
let elevRequests = new Array(numFloors).fill(false);
let ridersQueue = [];
let elevOpen = true;
let elevOnboardingPauseTime = 100;

let spritesByFloor = new Array(numFloors);
for (let i=0; i<numFloors; i++) {
  spritesByFloor[i] = [];
}
let spritesOnElev = [];
let queueLengthByFloor = new Array(numFloors).fill(0); // count of Sprites waiting
// i.e. excludes sprites that are from this floor but are already on elevator
let idxCountByFloor = new Array(numFloors).fill(0); 

// #endregion
/////////////////////////////////////////////////////////////////////////////////
//#region Static graphics
/**
 * *Draw floors
 */
 const floorGraphics = new PIXI.Graphics();
 floorGraphics.lineStyle(1,0xA4969B,1,0.5,false);
 for (let i = -1; i<10; i++) {
   floorGraphics.moveTo(floorZeroX-100,floorZeroY - i*floorHeight);
   floorGraphics.lineTo(floorZeroX+100,floorZeroY - i*floorHeight);
 }
 floorGraphics.moveTo(floorZeroX-100,floorZeroY - (numFloors-1)*floorHeight);
 floorGraphics.lineTo(floorZeroX-100,floorZeroY + floorHeight);
 floorGraphics.moveTo(floorZeroX+100,floorZeroY - (numFloors-1)*floorHeight);
 floorGraphics.lineTo(floorZeroX+100,floorZeroY + floorHeight);
 floorGraphics.moveTo(0,floorZeroY + floorHeight);
 floorGraphics.lineTo(maxX,floorZeroY + floorHeight);
 
 container.addChild(floorGraphics);

// #endregion
/////////////////////////////////////////////////////////////////////////////////
//#region Elevator
/**
 * *Elevator Sprite
 */
function Elevator() {

    this.curFloor = 0;
    this.nextFloor = 0;
    this.movSpeed = 1.5; // value of one gave me about 1 second per floor
    this.idle = true; // TODO: delete?
    this.idleAsOf = 0.; // TODO: delete? can move once everyone is aboard
    this.goingUp = true;

    this.doorIsOpen = true;
    this.aboardCount = 0;
    this.currentlyBoardingCount = 0;
    this.aboardCount = 0;
    this.currentlyDepartingCount = 0;

    this.currentStatus = 0;
    /**
     * 0   = idle i.e. standing, no passengers (and the door is open);
     * 1   = riders are onboarding the elevator;
     * 2   = riders are exiting the elevator;
     * 100 = going up;
     * 101 = going down;
     * 200 = opening door;
     * 300 = closing door;
     * 
     * Examples of state transition:
     * 0 >> 1 >> 300 >> 100 >> 200 >> 1 >> 300 >> 100 >> 200 >> 2 >> 1 >> 101 >> 200 > 2 >> 0;
     * 0 >> 300 >> 101 >> 200 >> 1 >> 300 >> 101 >> 200 >> 2 >> 0;
     */
    //TODO: once all riders depart and noone boards, go to the top floor where elevator was requested

    // Initiate sprite
    this.graphic = new PIXI.Graphics();
    this.graphic.lineStyle(1,0xffffff,1,0.5,false);
    this.graphic.drawRoundedRect(0,0,eleWidth,floorHeight,2);
    this.texture = app.renderer.generateTexture(this.graphic);
    this.sprite = new PIXI.Sprite(this.texture);
    this.sprite.x = floorZeroX;
    this.sprite.y = floorZeroY;
    container.addChild(this.sprite);

    this.move = function(timeDelta, time) {
        // TODO: Must rely on the new variables (aboard, onboarding, departing, floorRequests, elevRequests)
        let verticalOffset = - (this.sprite.y - floorZeroY);

        // Adjust curFloor as the elevator moves up and down
        if (Math.floor(verticalOffset/floorHeight) > this.curFloor) {
            this.curFloor++;
            console.log(this.curFloor);
            if (this.curFloor == this.nextFloor) {
                elevOpen = true;
                this.idle = true;
                this.idleAsOf = time;
            }
        }
        else if (Math.ceil(verticalOffset/floorHeight) < this.curFloor) {
        this.curFloor--;
            console.log(this.curFloor);
            if (this.curFloor == this.nextFloor) {
                elevOpen = true;
                this.idle = true;
                this.idleAsOf = time;
            }
        }

        // Move the elevator if it hasn't reached the destination (nextFloor) yet.
        if (this.curFloor != this.nextFloor) {
        let movDirection = -1 + 2 * (this.curFloor < this.nextFloor);
        this.sprite.y += - movDirection * (this.movSpeed*floorHeight * timeDelta/60);
        }

        
    }
}

//#endregion
/////////////////////////////////////////////////////////////////////////////////
//#region Logic
function pushButtonOnElev(floor) {
  if (!ridersQueue.includes(floor)) {
    console.log('Rider pressed '+floor);
    ridersQueue.push(floor);
  }
}

function moveSprites(floor, time) {
  // Remove sprites who just arrived at their destination
  let numOnElev = spritesOnElev.length;
  for (let i=0; i<numOnElev; i++) {
    if (spritesOnElev[i].destinationFloor==floor) {
      spritesOnElev[i].destroy();
      spritesOnElev.splice(i,1)[0];
      i--;
      numOnElev--;
    }
  }
  // Onboard sprites who go in the same direction
  let numInQueue = spritesByFloor[floor].length;
  let elevHasSprites = (spritesOnElev.length>0) ? true : false;
  let elevGoingUp = elev.goingUp;

  for (let i=0; i<numInQueue; i++) {
    let spriteDestination = spritesByFloor[floor][i].destinationFloor;
    let spriteWantsUp = (floor < spriteDestination) ? true : false;
    if (!elevHasSprites || spriteWantsUp==elevGoingUp) {
      // Move this person from floor array to elev array
      spritesOnElev.push(spritesByFloor[floor].splice(i,1)[0]);
      pushButtonOnElev(spriteDestination);
      i--;
      numInQueue--;
    }
  }
  elev.closeDoor(time);
}
//#endregion
/////////////////////////////////////////////////////////////////////////////////
//#region People
function createNewPerson(currentTime) {
  /**
   * Randomly picks starting and destination floors and creates new person.
   * Adds the person to spritesByFloor array.
   * Calculates nextArrivalsTime.
   */
  let startingFloor = Math.floor(Math.random()*numFloors);
  let destinationFloor = -1;
  
  // Appropriately choose random destination
  if (startingFloor > 0) {
    // most likely going to floor zero
    if (Math.random() < 0.85) {
      destinationFloor = 0;
    } else{
      // random floor different from starting floor
      do {
        destinationFloor = Math.floor(Math.random()*numFloors);
      } while (startingFloor == destinationFloor);
    }
  } else {
    // starting floor is 0 so pick any non zero floor for destination
    destinationFloor = Math.floor(Math.random()*(numFloors-1))+1;
  }

  // Store reference to this new person
  spritesByFloor[startingFloor].push(new Person(elapsed,startingFloor,destinationFloor));
  // Random arrival time for the next person
  nextArrivalsTime = elapsed + randPoisson(100);
}

function pickPersonsColor(floor) {
  /**
   * Randomly pick a color for a person's sprite.
   */
  let colorPalette = [0xafc9ff, 0xc7d8ff, 0xfff4f3, 0xffe5cf, 0xffd9b2, 0xffffff, 0xffa651];
  let color = colorPalette[Math.floor(Math.random() * 6)];
  return color;
}

function requestElevator(floor) {
  /**
   * Simulates person requesting an elevator on a given floor.
   * 
   * Updates the floorRequests array to true for a given floor integer.
   */
  if (!floorRequests[floor] && floor!=null) {
    floorRequests[floor] = true;
    console.log('Requested elevator on floor '+floor);
  }
}

function pressButtonOnElev(floor) {
  /**
   * Simulates passenger pressing destination floor's button 
   * on the elevator's control panel.
   */
    if (!elevRequests[floor]) {
        elevRequests[floor] = true;
    }
}

/**
 * TODO: Move these elsewhere.
 */
let queuePositionsByFloor = []; // each floor is bool array
for (let i = 0; i<numFloors; i++) {
    queuePositionsByFloor[i] = new Array(100).fill(false);
}
//let countOfWaitingByFloor = Array(numFloors).fill(0);
let personsMovementSpeed = 10;
let passengers = [];

class Person {
  constructor(currentTime, floor, destinationFloor) {
    this.color = pickPersonsColor(floor);
    this.birthTime = currentTime;
    this.startingFloor = floor;
    this.destinationFloor = destinationFloor;

    this.x = floorZeroX - 10 * (queueLengthByFloor[floor] + 1);
    this.y = floorZeroY - floorHeight * floor + 15;
    this.exitDoorXLoc = floorZeroX + 100 + (this.destinationFloor==0) ? 0 : Math.random()+200;
    this.currentStatus = 0;
    /**
     * 0   = waiting for the elevator.
     * 1   = in process of boarding the elevator.
     * 100 = on the elevator.
     * 101 = in process of exiting the elevator.
     * 200 = departed elevator, walking to the exit.
     * 999 = awaiting destruction.
     */
    this.positionInQueue = queueLengthByFloor + 1;
    queueLengthByFloor ++;
    queuePositionsByFloor[this.startingFloor][this.positionInQueue] = true;

    requestElevator(floor);

    queueLengthByFloor[floor]++;

    this.destroy = function () {
      container.removeChild(this.sprite);
    };

    // Movement
    this.move = function (time, timeDelta) {
      switch (this.currentStatus) {
        case 0: // Waiting for an elevator
            if (this.positionInQueue == 0) {
                // if right most, and elevator is here then consider boarding.
                if (elev.curFloor == this.curFloor) {
                    if (elev.doorIsOpen) {
                        // if going in the same direction as the elevator, board
                        // or if elevator is empty, board
                        if (elev.aboardCount==0 || elev.goingUp == this.destinationFloor > this.startingFloor) {
                            elev.currentlyBoardingCount ++;
                            elev.aboardCount ++;
                            this.currentStatus = 1;
                            queuePositionsByFloor[this.startingFloor][this.positionInQueue] = false;
                            this.positionInQueue = -1;
                        }
                    }
                }
            } else if (queuePositionsByFloor[this.startingFloor][this.positionInQueue-1] == false) {
                // if space to the right freed up, move right
                queuePositionsByFloor[this.startingFloor][this.positionInQueue] = false;
                this.positionInQueue -- ;
                queuePositionsByFloor[this.startingFloor][this.positionInQueue] = true;
            }
            
            if (this.x < floorZeroX - 10 * (this.positionInQueue + 1)) {
                this.x += personsMovementSpeed * timeDelta / 60;
            }
            break;

        case 1: // Boarding the elevator
            // walk towards the elevator until on it
            // *remember: elevator's passenger count was already increased in case 0
            if (this.x < floorZeroX + eleWidth/2-1) {
                this.x += personsMovementSpeed * timeDelta / 60;
            } else {
                this.currentStatus = 100;
                elev.currentlyBoardingCount --;
            }
            break;

        case 100: // Aboard the elevator
            // Arrived at the destination floor?
            if (elev.curFloor == this.destinationFloor) {
                if (elev.doorIsOpen) {
                    elev.currentlyDepartingCount ++ ;
                    elev.aboardCount -- ;
                    this.currentStatus = 101;
                }
            }
            // just adjust the sprite's position together with the elevator's
            // Move rider sprites together with the elevator
            this.x = elev.sprite.x + eleWidth/2 - 1;
            this.y = elev.sprite.y + 15;
            break;

        case 101: // Exiting the elevator
            if (this.x < floorZeroX + 10) {
                this.x += personsMovementSpeed * timeDelta / 60;
            } else {
                elev.currentlyDepartingCount --;
                this.currentStatus = 200;
            }

            break;
        case 200: // Walking towards "exit"
            // move sprite to the right until reaching exitDoorXLoc
            if (this.x < this.exitDoorXLoc) {
                this.x += personsMovementSpeed * timeDelta / 60;
            } else {
                this.currentStatus = 999;
            }
            break;
        case 999: // Awaiting destruction
            // will be destroyed by the main loop
            break;
        default:
          break;
      }
      this.sprite.x += 10;
      this.sprite.y += 10;
    };

    // Sprite
    this.graphic = new PIXI.Graphics();
    this.graphic.beginFill(this.color);
    this.graphic.lineStyle(0);
    this.graphic.drawCircle(0, 0, 2);
    this.graphic.endFill();
    this.texture = app.renderer.generateTexture(this.graphic);
    this.sprite = new PIXI.Sprite(this.texture);
    this.sprite.x = this.x;
    this.sprite.y = this.y;

    container.addChild(this.sprite);
  }
}

//#endregion
/////////////////////////////////////////////////////////////////////////////////
//#region Game loop
elev = new Elevator();

app.stage.addChild(container);
/**
 * *Game Loop
 */

// Add a ticker callback to move the sprite back and forth
let elapsed = 0.0;
let nextArrivalsTime = elapsed + randPoisson(100);
app.ticker.add((delta) => {
    elapsed += delta;

    // Creator
    if (elapsed >= nextArrivalsTime) {
        createNewPerson(elapsed);
    }
    // Destroyer
    for (let i = 0; i < passengers.length; i++) {
        if (passengers[i].currentStatus == 999){
            passengers[i].destroy();
            passengers.splice(i,1);
            i--;
        }
    }

    // Move people
    for (let i = 0; i < passengers.length; i++) {
        passengers[i].move(elapsed,delta);
    }

    // Move elevator
    elev.move(delta, elapsed);

});
//#endregion