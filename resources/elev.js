/**
 * *Scratchpad 
 * 
 */

/////////////////////////////////////////////////////////////////////////////////
//#region Helper functions
/**
 * *Poisson Distribution
 * 
 * https://stackoverflow.com/questions/1241555/algorithm-to-generate-poisson-and-binomial-random-numbers
 */

function randPoisson(lambda) {
  let L = Math.exp(-lambda/SPEED);
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
  fontSize: 24,
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
const style2 = new PIXI.TextStyle({
  fontFamily: 'Courier New',
  fontSize: 13,
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

const richText = new PIXI.Text('My name is Kamil.\nAnd this is my homepage.', style);
richText.x = 10;
richText.y = 395;//375;
richText.interactive = true;
richText.on('pointerdown', (event) => { console.log('clicked!'); });

app.stage.addChild(richText);

let text_desc = 'It is not mobile-friendly so I advise using your PC to view it.\n\n' +
  'Above, is a simulation of an elevator I used to ride as a kid.\n'+
  'The little people are randomly generated.  Each one enters the game with a destination\n' +
  'in mind.  You can interact with the elevator by pressing the buttons on the console.\n' +
  'But remember, don\'t be a rascal, don\'t press them all at once ;).\n\n' +
  'Writing simulations is my hobby.  There is something fascinating about creating simulated\n' +
  'worlds.  And one doesn\'t even need AI to give simulations a little spark of life.\n' +
  'Check out my GitHub at https://github.com/hwatmos/'
const richText2 = new PIXI.Text(text_desc, style2);
richText2.x = 10;
richText2.y = 470;//450;
richText2.interactive = true;
richText2.on('pointerdown', (event) => { console.log('clicked!'); });

app.stage.addChild(richText2);

// #endregion
/////////////////////////////////////////////////////////////////////////////////
//#region Setup
/**
 * *Setup
 */
let numFloors = 10;
let floorZeroX = 200;
let floorZeroY = 350;//250;
let floorHeight = 25;
let eleWidth = 15;

let floorRequests = new Array(numFloors).fill(false);
//let elevRequests = new Array(numFloors).fill(false); // TODO: delete?
let ridersQueue = [];
let elevOpen = true;
let elevOnboardingPauseTime = 100;
let higestRequestedFloor = -1;  // neg. one indicates no floors are awaiting elevator

let elevatorsLastStatus = -1;  // for debugging

let spritesByFloor = new Array(numFloors);
for (let i=0; i<numFloors; i++) {
  spritesByFloor[i] = [];
}
let spritesOnElev = [];
let queueLengthByFloor = new Array(numFloors).fill(0); // count of Sprites waiting
// i.e. excludes sprites that are from this floor but are already on elevator
let idxCountByFloor = new Array(numFloors).fill(0); 

let poissonLambda = 150;//771;//290;

let SPEED = 3; //10 and above causes moon-shot or hell-ride
let MAX_PASSENGERS = 10;
let MAX_QUEUE_LENGTH = 10; //won't create a new person if adding the person exceeds max
// queue lengths for that person's starting floor. This helps to keep spillage beyond
// the building's walls and makes the simulation a bit prettier.
let DOORS_PER_FLOOR = 3; // 0..3

// #endregion
/////////////////////////////////////////////////////////////////////////////////
//#region Dynamic Elements -- Foreground
/**
 * *Statistics & info
 */
const stat_style = new PIXI.TextStyle({
  fontFamily: 'Courier New',
  fontSize: 12,
  fill: '#33ff00',
  strokeThickness: 0,
  lineJoin: 'round',
});

let stats_aboardCount = new PIXI.Text('Aboard: ' + 0, stat_style);
stats_aboardCount.x = floorZeroX+120;
stats_aboardCount.y = floorZeroY - floorHeight * numFloors + floorHeight  ;
stats_aboardCount.interactive = true;
stats_aboardCount.visible = false;
stats_aboardCount.on('pointerdown', (event) => { console.log('clicked!'); });

app.stage.addChild(stats_aboardCount);

/**
 * *Elevator console
 */

class ElevatorConsole {
  constructor() {
    // Initiate sprite
    let colorPalette = [0xafc9ff, 0xc7d8ff, 0xfff4f3, 0xffe5cf, 0xffd9b2, 0xffffff, 0xffa651];
    this.graphic = new PIXI.Graphics();
    this.graphic.lineStyle(1,0xafc9ff,1,0.5,false);
    this.graphic.drawRoundedRect(0,0,44,numFloors/2*20 + 5,2);
    this.texture = app.renderer.generateTexture(this.graphic);
    this.sprite = new PIXI.Sprite(this.texture);
    this.sprite.x = floorZeroX+120;
    this.sprite.y = floorZeroY - floorHeight * numFloors + floorHeight +20;
    // Buttons
    this.buttons = new Array(numFloors);
    this.activeButtonGraphic = new PIXI.Graphics();
    this.activeButtonGraphic.lineStyle(1,0xafc9ff,1,0.5,false);
    this.activeButtonGraphic.beginFill(0xafc9ff);
    this.activeButtonGraphic.drawCircle(0,0,7)
    this.activeButtonGraphic.endFill();
    this.activeButtonTexture = app.renderer.generateTexture(this.activeButtonGraphic);
    this.inactiveButtonGraphic = new PIXI.Graphics();
    this.inactiveButtonGraphic.lineStyle(1,0xafc9ff,1,0.5,false);
    this.inactiveButtonGraphic.drawCircle(0,0,7)
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
      this.sprite.addChild(this.buttons[i].sprite)
    }
    container.addChild(this.sprite);

    this.update = function () {
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

/**
 * *Floor buttons
 */
class Floors {
  constructor() {
    // Initiate sprite
    let colorPalette = [0xafc9ff, 0xc7d8ff, 0xfff4f3, 0xffe5cf, 0xffd9b2, 0xffffff, 0xffa651];
    this.graphic = new PIXI.Graphics();
    this.graphic.lineStyle(1,0xafc9ff,1,0.5,false);
    this.graphic.drawRoundedRect(0,0,44,numFloors/2*20 + 5,2);
    this.texture = app.renderer.generateTexture(this.graphic);
    this.sprite = new PIXI.Sprite();
    this.sprite.x = floorZeroX-3;
    this.sprite.y = floorZeroY-(numFloors)*floorHeight + 15;
    // Buttons
    this.buttons = new Array(numFloors);
    this.activeButtonGraphic = new PIXI.Graphics();
    this.activeButtonGraphic.lineStyle(1,0xffffff,1,0.5,false);
    this.activeButtonGraphic.beginFill(0xffffff);
    this.activeButtonGraphic.drawCircle(0,0,.5)
    this.activeButtonGraphic.endFill();
    this.activeButtonTexture = app.renderer.generateTexture(this.activeButtonGraphic);
    this.inactiveButtonGraphic = new PIXI.Graphics();
    this.inactiveButtonGraphic.lineStyle(1,0x3d3b49,1,0.5,false);
    this.inactiveButtonGraphic.drawCircle(0,0,.5)
    this.inactiveButtonTexture = app.renderer.generateTexture(this.inactiveButtonGraphic);
    for (let i=numFloors-1; i>=0; i--) {
      this.buttons[i] = new Object;
      this.buttons[i].sprite = new PIXI.Sprite(this.inactiveButtonTexture);
      this.buttons[i].sprite.x = 0
      this.buttons[i].sprite.y = (10 - i) * floorHeight
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

/**
 * *Sprite stats
 */
class SpriteStatusBox {
  constructor() {
    this.sprite_ref;
    const style_sprite_status_text = new PIXI.TextStyle({
      fontFamily: 'Courier New',
      fontSize: 13,
      fontStyle: 'italic',
      fill: '#33ff00',
      strokeThickness: 0,
      lineJoin: 'round',
    });
    this.statusText = new PIXI.Text("Click a sprite to view their current properties",style_sprite_status_text);
    this.statusText.x = 5;
    this.statusText.y = 375;
    app.stage.addChild(this.statusText);

    this.update = function () {
      if (this.sprite_ref != null) {
        this.statusText.text = "Status: " + this.sprite_ref.currentStatus +
        ", Queue: " + this.sprite_ref.positionInQueue +
        ", Dest: " + this.sprite_ref.destinationFloor;
      }
    }
  }
}

// #endregion
/////////////////////////////////////////////////////////////////////////////////
//#region Static elements -- Foreground
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
 floorGraphics.moveTo(floorZeroX+eleWidth,floorZeroY - (numFloors-1)*floorHeight)
 floorGraphics.lineTo(floorZeroX+eleWidth,floorZeroY + floorHeight);
 floorGraphics.moveTo(floorZeroX+1.5,floorZeroY - (numFloors-1)*floorHeight)
 floorGraphics.lineTo(floorZeroX+1.5,floorZeroY + floorHeight);
 

/**
 * *Draw doors
 */
floorGraphics.beginFill(0x302d40);
 for (let i = 0; i<9; i++) {
  for (let j = 0; j<DOORS_PER_FLOOR; j++) {
    let doorx = floorZeroX+22+j*30;
    let doory = floorZeroY - (i+1)*floorHeight+7;
    floorGraphics.drawRect(doorx,doory,10,18);
    floorGraphics.drawRect(- 100 + doorx,doory,10,18);
  }
}
 
 container.addChild(floorGraphics);

// #endregion
/////////////////////////////////////////////////////////////////////////////////
//#region Dynamic Elements -- Background
/**
 * *Draw background buildings
 */
windowBrightGraphic = new PIXI.Graphics();
windowBrightGraphic.lineStyle(1,0xffffff,1,0.5,false);
windowBrightGraphic.beginFill(0xffffff);
windowBrightGraphic.drawRect(-3,-4,6,8);
windowBrightGraphic.endFill();
windowBrightTexture = app.renderer.generateTexture(windowBrightGraphic);

windowDarkGraphic = new PIXI.Graphics();
windowDarkGraphic.lineStyle(1,0x2b264d,1,0.5,false);
windowDarkGraphic.beginFill(0x000);
windowDarkGraphic.drawRect(-3,-4,6,8);
windowDarkGraphic.endFill();
windowDarkTexture = app.renderer.generateTexture(windowDarkGraphic);

function createXmasTexture()
{
    // adjust it if somehow you need better quality for very very big images
    const quality = 8;
    const canvas = document.createElement('canvas');
    canvas.width = 8;
    canvas.height = 10;
    const ctx = canvas.getContext('2d');
    // use canvas2d API to create gradient
    const grd = ctx.createLinearGradient(0, 0, quality, 0);
    grd.addColorStop(0, 'red');
    grd.addColorStop(0.8, 'green');

    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, quality, 10);
    //ctx.lineStyle(1,0xffffff,1,0.5,false);
    //ctx.drawRect(-3,-4,6,8);

    return PIXI.Texture.from(canvas);
}

const windowXmasTexture = createXmasTexture();

class BackgroundWindowXmas {
  constructor() {
    this.isBright = true;
    this.windowGlass = new PIXI.Sprite(windowXmasTexture);
    this.x = 400 + 20*3;
    this.y = 300 + (Math.ceil(10/7) - Math.floor(17/7) -1) * 20;
    this.windowGlass.x = this.x;
    this.windowGlass.y = this.y;

    this.windowGlass.interactive = true;
    this.windowGlass.on('pointertap', (event) => { 
      alert("You found me!  The word is: Empathetic!")
    });

    container.addChild(this.windowGlass);
  }
}

class BackgroundWindow {
  constructor(locX,locY,bright) {
    this.isBright = bright;
    this.windowGlass = new PIXI.Sprite(this.isBright ? windowBrightTexture : windowDarkTexture);
    this.windowGlass.x = locX;
    this.windowGlass.y = locY;

    this.windowGlass.interactive = true;
    this.windowGlass.on('pointertap', (event) => { 
      this.isBright = ! this.isBright;
      this.windowGlass.texture = this.isBright ? windowBrightTexture : windowDarkTexture;
    });

    container.addChild(this.windowGlass);
  }
}

class BackgroundBuilding {
  constructor(buildX,buildY) {
    this.windows = new Array(70);
    this.col = 0;
    for (let i=69; i>=0; i--) {
      this.brightWindow = Math.random()>0.8 ? 1 : 0;
      this.x = buildX + 20*this.col;
      this.y = buildY + (Math.ceil(10/7) - Math.floor(i/7) -1) * 20;
      this.windows[i] = new BackgroundWindow(this.x,this.y,this.brightWindow);
      this.col += 1;
      this.col = this.col>6 ? 0 : this.col;
    }
  }
}

// #endregion
/////////////////////////////////////////////////////////////////////////////////
//#region Elevator

function elevYToFloorIfSafe(y) {
  threshold = 1;
  floor = -1; // this value indicates that the elevator is not aligned with any floor
  let lowerFloor = Math.floor(-(y - floorZeroY) / floorHeight);
  let upperFloor = Math.ceil(-(y - floorZeroY) / floorHeight);
  if (Math.floor(-(y - threshold - floorZeroY) / floorHeight) == upperFloor) {
    // stop here, i.e. upperFloor
    floor = upperFloor;
    // Prevent overshooting (at high speeds, the elevator shoots above or below the bulding)
    // (does not work, need to handle in elevator's logic)
    //floor = Math.max(0,floor);
    //floor = Math.min(numFloors,floor);
  }
  else if (Math.ceil(-(y + threshold - floorZeroY) / floorHeight) == lowerFloor) {
    // stop here, i.e. lowerFloor
    floor = lowerFloor;
    // Prevent overshooting (at high speeds, the elevator shoots above or below the bulding)
    // (does not work, need to handle in elevator's logic)
    //floor = Math.max(0,floor);
    //floor = Math.min(numFloors,floor);
  }
  return floor;
}

/**
 * *Elevator Sprite
 */
function Elevator() {

    this.curFloor = 0;
    this.nextFloor = 0; // TODO: delete?
    this.movSpeed = 1.5 * SPEED; // value of one gave me about 1 second per floor
    this.idle = true; // TODO: delete?
    this.idleAsOf = 0.; // TODO: delete? can move once everyone is aboard
    this.goingUp = true;
    this.direction = 0; // 0 = no direction; 1 = up; -1 = down

    this.lastFloor = 0; // when moving up or down, don't stop at last floor where the door was open. this avoids infinite open close loops

    this.doorCloseDelay = 0;

    this.doorIsOpen = true;
    this.aboardCount = 0;
    this.currentlyBoardingCount = 0;
    this.currentlyDepartingCount = 0;

    this.floorRequests = new Array(numFloors).fill(false);
    this.higestRequestedFloor = -1;

    this.holdingDoor = false; // sprites can hold the door if there is more room on the elev and more sprites on the floor

    this.currentStatus = 0;
    /**
     * 0   = idle i.e. standing, no passengers (and the door is open);
     * 1   = riders are boarding the elevator; // TODO: delete
     * 2   = riders are exiting the elevator; // TODO: delete
     * 1   = the door is open, riders are boarding or exiting;
     * 100 = going up;
     * 101 = going down;
     * 200 = opening door;
     * 300 = closing door;
     * 
     * Examples of state transition:
     * 0 >> 1 >> 300 >> 100 >> 200 >> 1 >> 300 >> 100 >> 200 >> 2 >> 1 >> 101 >> 200 > 2 >> 0;
     * 0 >> 300 >> 101 >> 200 >> 1 >> 300 >> 101 >> 200 >> 2 >> 0;
     */
    //TODO: once all riders depart and noone boards, go to the highest floor where elevator was requested

    // Initiate sprite
    this.graphic = new PIXI.Graphics();
    this.graphic.lineStyle(1,0xffffff,1,0.5,false);
    this.graphic.drawRoundedRect(0,0,eleWidth,floorHeight,2);
    this.texture = app.renderer.generateTexture(this.graphic);
    this.sprite = new PIXI.Sprite(this.texture);
    this.x = floorZeroX;
    this.y = floorZeroY;
    this.sprite.x = floorZeroX;
    this.sprite.y = floorZeroY;
    container.addChild(this.sprite);

    this.move = function(timeDelta, time) {
        switch (this.currentStatus) {
          case 0: // idle & door is closed
            // check for floor requests
            for (i=numFloors-1; i>=0; i--) {
              if (floorRequests[i]) {
                if (i == this.curFloor) {
                  this.currentStatus = 200;
                  cancelElevatorRequest(this.curFloor);
                  console.log(higestRequestedFloor)
                }
                else {
                  this.currentStatus = i > this.curFloor ? 100 : 101;
                  this.direction = i > this.curFloor ? 1 : -1;
                }
              }
            }
            if (this.currentStatus == 0) {
              for (i=numFloors-1; i>=0; i--) {
                if (elev.floorRequests[i]) {
                  this.currentStatus = i > this.curFloor ? 100 : 101;
                  this.direction = i > this.curFloor ? 1 : -1;
                }
              }
            }
            break;

          case 1: // door is open, passengers are boarding and exiting
            if (this.currentlyBoardingCount == 0 && this.currentlyDepartingCount == 0) {
              if (this.doorCloseDelay >= 6 & !this.holdingDoor) {
                this.currentStatus = 300;
                this.doorCloseDelay = 0;
              } else {
                this.doorCloseDelay += 1;
              }
            }
            break;

          case 100: // going up
            // go up and stop in only two cases: riders' destination, or the highest requested floor
            this.goingUp = true; // TODO: DELETE
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
                  if (this.lastFloor != this.curFloor) {
                    this.cancelElevatorRequest(this.curFloor);
                    cancelElevatorRequest(this.curFloor);
                    this.currentStatus = 200;
                    break;
                  }
                }
              }
            }
            this.y += - (this.movSpeed*floorHeight * timeDelta/60);
            break;

          case 101: // going down
            this.goingUp = false; // TODO: DELETE
            this.curFloor = elevYToFloorIfSafe(this.y)
            if (this.curFloor > -1) {
              if (this.floorRequests[this.curFloor] || floorRequests[this.curFloor]) {
                if (this.lastFloor != this.curFloor) {
                  this.cancelElevatorRequest(this.curFloor);
                  cancelElevatorRequest(this.curFloor);
                  this.currentStatus = 200;
                  break;
                }
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
            this.lastFloor = this.curFloor;
            switch (this.direction) {
              case 1: {
                if (this.aboardCount > 0) {
                  if (this.higestRequestedFloor > this.curFloor && this.higestRequestedFloor >= 0) {
                    this.currentStatus = 100;
                    this.direction = 1;
                    break;
                  } 
                  if (this.higestRequestedFloor < this.curFloor && this.higestRequestedFloor >= 0) {
                    this.currentStatus = 101;
                    this.direction = -1;
                    break;
                  }
                }
                else {
                  if (higestRequestedFloor > this.curFloor && higestRequestedFloor >= 0) {
                    this.currentStatus = 100;
                    this.direction = 1;
                    break;
                  }
                  else if (higestRequestedFloor < this.curFloor && higestRequestedFloor >= 0) {
                    this.currentStatus = 101;
                    this.direction = -1;
                    break;
                  }
                  else {
                    this.currentStatus = 0;
                    this.direction = 0;
                  }
                }
              }
              case -1: {
                if (this.aboardCount > 0) {
                  if (this.higestRequestedFloor < this.curFloor && this.higestRequestedFloor >= 0) {
                    this.currentStatus = 101;
                    this.direction = -1;
                    break;
                  }
                  else if (this.higestRequestedFloor > this.curFloor) {
                    this.currentStatus = 100;
                    this.direction = 1;
                    break;
                  }
                }
                else {
                  if (higestRequestedFloor < this.curFloor && higestRequestedFloor >= 0) {
                    this.currentStatus = 101;
                    this.direction = -1;
                    break;
                  }
                  else if (higestRequestedFloor > this.curFloor && higestRequestedFloor >= 0) {
                    this.currentStatus = 100;
                    this.direction = 1;
                    break;
                  }
                  else {
                    this.currentStatus = 0;
                    this.direction = 0;
                  }
                }
              }
              case 0: {
                if (this.higestRequestedFloor > this.curFloor && this.higestRequestedFloor >= 0 || higestRequestedFloor > this.curFloor && higestRequestedFloor >= 0) {
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
    this.floorRequests[floor] = true;
    this.higestRequestedFloor = -1;
    for (i=numFloors-1; i>=0; i--) {
      if (this.floorRequests[i]) {
        this.higestRequestedFloor = i;
        break;
      }
    }
  }

  this.cancelElevatorRequest = function (floor) {
    this.floorRequests[floor] = false;
  
    this.higestRequestedFloor = -1;
    for (i=numFloors-1; i>=0; i--) {
      //console.log('here here ' + i)
      if (this.floorRequests[i]) {
        //console.log('true')
        this.higestRequestedFloor = i;
        break;
      }
    }
    //console.log(this.higestRequestedFloor)
  }
}

//#endregion
/////////////////////////////////////////////////////////////////////////////////
//#region Logic

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
function createNewPerson(currentTime, forceFloor=-1) {
  /**
   * 0909v
   * Randomly picks starting and destination floors and creates new person.
   * Adds the person to spritesByFloor array.
   * Calculates nextArrivalsTime.
   */
  let startingFloor = 0;
  if (forceFloor >=0) {
    startingFloor = forceFloor;
  }
  else {
    startingFloor = Math.random() >= 0.5 ? startingFloor : Math.floor(Math.random()*numFloors);
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
  nextArrivalsTime = elapsed + randPoisson(poissonLambda);
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

function requestElevator(floor) {
  /**
   * Simulates person requesting an elevator on a given floor.
   * 
   * Updates the floorRequests array to true for a given floor integer.
   */
  if (!floorRequests[floor] && floor!=null) {
    floorRequests[floor] = true;
    console.log('Requested elevator on floor '+floor);

    higestRequestedFloor = -1;
    for (i=numFloors-1; i>=0; i--) {
      if (floorRequests[i]) {
        higestRequestedFloor = i;
        break;
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
let personsMovementSpeed = 10 * SPEED;
let passengers = [];

class Person {
  constructor(currentTime, floor, destinationFloor) {
    this.color = pickPersonsColor(floor);
    this.birthTime = currentTime;
    this.startingFloor = floor;
    this.destinationFloor = destinationFloor;
    this.direction = this.destinationFloor > this.startingFloor ? 1 : -1;
    this.requestedElevator = false;

    this.x = Math.min(floorZeroX - 10 * (queueLengthByFloor[floor] + 1),floorZeroX - Math.random()*80 - 20);
    this.x = this.startingFloor==0 ? 0 : this.x;
    this.y = floorZeroY - floorHeight * floor + 15;
    this.exitDoorNum = Math.floor(Math.random()*3)
    this.exitDoorXLoc = floorZeroX + (this.destinationFloor==0 ? maxX : Math.random()*95);
    this.currentStatus = 0;

    this.movementSpeedModifier = Math.random()*0.6+0.9;
    /**
     * 0   = waiting for the elevator.
     * 1   = in process of boarding the elevator.
     * 100 = on the elevator.
     * 101 = in process of exiting the elevator.
     * 200 = walking to the exit (departed elevator).
     * 999 = awaiting destruction.
     */
    this.positionInQueue = queueLengthByFloor[floor] + 1;
    queueLengthByFloor[floor] ++;
    queuePositionsByFloor[this.startingFloor][this.positionInQueue] = true;

    this.destroy = function () {
      container.removeChild(this.sprite);
    };

    // Movement
    this.move = function (time, timeDelta) {
      if (this.startingFloor==0 && this.positionInQueue==0) {
        //console.log(this.currentStatus)
      }
      switch (this.currentStatus) {
        case 0: // Waiting for an elevator // ! 0909
            // Adjust position in queue
            if (queuePositionsByFloor[this.startingFloor][this.positionInQueue-1] == false) {
              // if space to the right freed up, move right
              queuePositionsByFloor[this.startingFloor][this.positionInQueue] = false;
              this.positionInQueue -- ;
              queuePositionsByFloor[this.startingFloor][this.positionInQueue] = true;
            }
            
            // If x-coordinate different from positionInQueue's x-coord, move towards the correct x
            if (this.x < floorZeroX - 10 * (this.positionInQueue + 1)) {
                this.x += this.movementSpeedModifier*personsMovementSpeed * timeDelta / 60;
                // randomly change speed
                if (Math.random()>.9) {
                  this.movementSpeedModifier = Math.random()*0.6+0.9;
                }
            }
            else if (this.positionInQueue == 0) { // first in queue...
                if (! this.requestedElevator && !(elev.curFloor == this.startingFloor && elev.currentStatus == 1) || (! floorRequests[this.startingFloor] && elev.curFloor != this.startingFloor)) {
                  requestElevator(this.startingFloor);
                  this.requestedElevator = true;
                }
                if (elev.curFloor == this.startingFloor) { // ... and elevator is here - consider boarding.
                    if (elev.currentStatus==1) {
                        // if going in the same direction as the elevator, board
                        // or if elevator is empty, board
                        //if (elev.aboardCount==0 || elev.direction*this.direction >= 0) { // Unnecessary with the current approach where sprite queue is like a stack b/c sprites can't skip line.  So, waiting until elev. is going in the correct direction blocks all sprites behind
                          if (elev.aboardCount < MAX_PASSENGERS) {
                            elev.currentlyBoardingCount ++;
                            this.currentStatus = 1;
                            queuePositionsByFloor[this.startingFloor][this.positionInQueue] = false;
                            this.positionInQueue = -1;
                            queueLengthByFloor[this.startingFloor] --;
                          }
                        //}
                    }
                }
            }
            break;

        case 1: // Boarding the elevator // ! 0909
            // walk towards the elevator until on it
            // *remember: elevator's passenger count was already increased in case 0
            if (this.x < floorZeroX + eleWidth/2-1) {
                this.x += personsMovementSpeed * timeDelta / 60;
            } else {
                this.currentStatus = 100;
                elev.aboardCount ++;
                elev.pushButtonOnElev(this.destinationFloor);
                elev.currentlyBoardingCount --;
            }
            break;

        case 100: // Aboard the elevator // ! 0909
            // If the elevator is still boarding, hold the door if there is still room
            if (elev.currentStatus == 1) {
              if (elev.aboardCount < MAX_PASSENGERS & queueLengthByFloor[elev.curFloor] > 0) {
                elev.holdingDoor = true;
              } else {
                elev.holdingDoor = false;
              }
            }
            // Arrived at the destination floor?
            if (elev.curFloor == this.destinationFloor) {
                if (elev.currentStatus==1) {
                    this.currentStatus = 101;
                    elev.currentlyDepartingCount ++ ;
                    elev.aboardCount -- ;
                }
            }
            // Move rider sprites together with the elevator
            this.x = elev.sprite.x + eleWidth/2 - 1;
            this.y = elev.sprite.y + 15;
            break;

        case 101: // Exiting the elevator // ! 0909
            if (this.x < floorZeroX + 10) {
                this.x += personsMovementSpeed * timeDelta / 60;
            } else {
                this.currentStatus = 200;
                elev.currentlyDepartingCount --;
            }

            break;
        case 200: // Walking towards "exit" // ! 0909
            // move sprite to the right until reaching exitDoorXLoc
            if (this.x < this.exitDoorXLoc) {
                this.x += this.movementSpeedModifier*personsMovementSpeed * timeDelta / 60;
            } else {
                this.currentStatus = 999;
            }
            // randomly change speed
            if (Math.random()>.9) {
              this.movementSpeedModifier = Math.random()*0.6+0.9;
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
    this.graphic = new PIXI.Graphics();
    this.graphic.beginFill(this.color);
    this.graphic.lineStyle(0);
    this.pers_height = 3 + 2 * Math.random();
    this.graphic.drawCircle(0, -this.pers_height, 2);
    this.graphic.drawEllipse(0,5 - this.pers_height,1 + Math.random(),this.pers_height);
    this.graphic.endFill();

    this.texture = app.renderer.generateTexture(this.graphic);
    this.sprite = new PIXI.Sprite(this.texture);
    this.sprite.x = this.x;
    this.sprite.y = this.y;
    this.sprite.anchor.set(0,0.5);

    // Label person with their destination floor
    this.label = new PIXI.Text(this.destinationFloor, stat_style);
    this.label.x = -2;
    this.label.y = -14;
    this.label.interactive = true;
    this.label.on('pointerdown', (event) => { console.log('clicked!'); });
    //this.sprite.addChild(this.label);

    // Interactivity
    this.sprite.interactive = true;
    this.sprite.on('pointerdown', (event) =>  {
      if (sprite_status.sprite_ref != null) {sprite_status.sprite_ref.sprite.tint =  0xFFFFFF;}
      sprite_status.sprite_ref = this; 
      this.sprite.tint = 0xff0000;
    })

    container.addChild(this.sprite);
  }
}

//#endregion
/////////////////////////////////////////////////////////////////////////////////
//#region Game loop
elev = new Elevator();
elevConsole = new ElevatorConsole();
floors = new Floors();
//testWindow = new BackgroundWindow();
bgBuilding1 = new BackgroundBuilding(400,300);
bgBuilding2 = new BackgroundBuilding(500,260)
bgBuilding2 = new BackgroundBuilding(620,320)
xmasWindow = new BackgroundWindowXmas();
sprite_status = new SpriteStatusBox();

app.stage.addChild(container);
/**
 * *Game Loop
 */

// Add a ticker callback to move the sprites
let elapsed = 0.0;
let nextArrivalsTime = elapsed + randPoisson(60);
// temporary for test
createNewPerson(elapsed,0);
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

    // Move people, destroy if needed
    for (let i=0; i<numFloors; i++) {
      for (let j = 0; j < spritesByFloor[i].length; j++) {
        spritesByFloor[i][j].move(elapsed,delta);
      }
    }

    // Move elevator
    elev.move(delta, elapsed);

    if (elevatorsLastStatus != elev.currentStatus) {
      console.log("*** Elevator's status changed to " + elev.currentStatus);
      console.log(elev);  
      //console.log("aboard: " + elev.aboardCount);
      elevatorsLastStatus = elev.currentStatus;
    }

    //console.log(elev.direction)

    stats_aboardCount.text = 'Aboard: ' + elev.aboardCount;

    // Redraw other elements
    elevConsole.update();
    floors.update();
    sprite_status.update()

});
//#endregion