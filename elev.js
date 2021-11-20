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
  this.idle = true;
  this.idleAsOf = 0.;
  this.goingUp = true;

  // Initiate sprite
  this.graphic = new PIXI.Graphics();
  this.graphic.lineStyle(1,0xffffff,1,0.5,false);
  this.graphic.drawRoundedRect(0,0,eleWidth,floorHeight,2);
  this.texture = app.renderer.generateTexture(this.graphic);
  this.sprite = new PIXI.Sprite(this.texture);
  this.sprite.x = floorZeroX;
  this.sprite.y = floorZeroY;
  container.addChild(this.sprite);

  this.closeDoor = function(time) {
    // Make it more realistic by providing a delay
    if (time > this.idleAsOf + elevOnboardingPauseTime) {
      // If the elevator is idle, read the next floor from the queue.
      if (this.idle) {
        // If riders waiting to get to their destinations
        if (ridersQueue.length>0) {
          ridersQueue.sort((a,b) => a - b);
          for (let i=0;i<ridersQueue.length;i++) {
            //if (ridersQueue[i] > this.curFloor == this.goingUp) {
              this.nextFloor = ridersQueue.splice(i,1)[0];
              break;
            //}
          }
          if (this.curFloor!=this.nextFloor) {
            for (let i=ridersQueue.length-1; i>=0; i--) {
              //if (ridersQueue[i] < this.curFloor == this.goingUp) {
                this.nextFloor = ridersQueue.splice(i,1)[0];
                break;
              //}
            }
          }
          console.log('Next floor: ' + this.nextFloor);
          this.idle = false;
        }
      } else { // elevator not idle

      }
    }
  }

  this.move = function(timeDelta, time) {
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

    // Move rider sprites together with the elevator
    for (i=0; i<spritesOnElev.length; i++) {
      spritesOnElev[i].sprite.x = this.sprite.x + eleWidth/2 -1;
      spritesOnElev[i].sprite.y = this.sprite.y + 15;
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
  let newSpritesFloor = Math.floor(Math.random()*numFloors);
  let newSpritesDest = -1;
  if (newSpritesFloor > 0) {
    // most likely going to floor zero
    if (Math.random() < 0.85) {
      newSpritesDest = 0;
    } else{
      do {
        newSpritesDest = Math.floor(Math.random()*numFloors);
      } while (newSpritesFloor == newSpritesDest);
    }
  } else {
    do {
      newSpritesDest = Math.floor(Math.random()*numFloors);
    } while (newSpritesFloor == newSpritesDest);
  }
  spritesByFloor[newSpritesFloor].push(new Person(elapsed,newSpritesFloor,newSpritesDest));

  nextArrivalsTime = elapsed + randPoisson(100);
}
function pickPersonsColor(floor) {
  let colorPalette = [0xafc9ff, 0xc7d8ff, 0xfff4f3, 0xffe5cf, 0xffd9b2, 0xffffff, 0xffa651];
  let color = colorPalette[Math.floor(Math.random() * 6)];
  return color;
}
function requestElevator(floor) {
  if (!floorRequests[floor] && floor!=null) {
    floorRequests[floor] = true;
    console.log('Requested elevator on floor '+floor);
  }
}
/**
 * *Sprites
 */

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
     * 0 = waiting for the elevator.
     * 1 = on the elevator.
     * 2 = departed elevator, walking to the exit.
     */

    requestElevator(floor);

    queueLengthByFloor[floor]++;

    this.destroy = function () {
      container.removeChild(this.sprite);
    };

    this.depart = function() {
      this.currentStatus = 2;
    }

    // Movement
    this.move = function (time, timeDelta) {
      switch (this.currentStatus) {
        case 0:
          // if space to the right freed up, move right
          // if right most, and elevator is here then consider boarding.
          //   if going in the same direction as the elevator, board
          break;
        case 1:
          // just adjust the sprite's position together with the elevator's
          break;
        case 2:
          // move sprite to the right until reaching exitDoorXLoc
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
test = new Person(0);
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
  
  if (elapsed >= nextArrivalsTime) {
    createNewPerson(elapsed);
  }

  if (elev.idle) {
    moveSprites(elev.curFloor,elapsed);
  }
  elev.move(delta, elapsed);
});
//#endregion