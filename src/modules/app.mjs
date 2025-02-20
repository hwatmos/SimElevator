
/**
 * *Scratchpad 
 * 
 */

/////////////////////////////////////////////////////////////////////////////////
//#region Helper functions

  
// #endregion
/////////////////////////////////////////////////////////////////////////////////
//#region PixiJs setup
/**
 * * PixiJS setup.
 */




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
richText.y = 410;//375;
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
//#region Dynamic Foreground
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
    this.statusText.x = 10;
    this.statusText.y = 375;
    app.stage.addChild(this.statusText);

    this.update = function () {
      if (this.sprite_ref != null) {
        this.statusText.text = "Status: " + this.sprite_ref.currentStatus +
        ", Queue: " + (this.sprite_ref.enteredQueue ? this.sprite_ref.positionInQueue : "not yet") +
        ", Dest: " + this.sprite_ref.destinationFloor +
        (this.sprite_ref.holdingDoor ? ", holding door" : "");
      }
    }
  }
}

/**
 * *Elevator stats
 */
class ElevatorStatusBox {
  constructor(elev) {
    this.elev_ref = elev;
    const style_elev_status_text = new PIXI.TextStyle({
      fontFamily: 'Courier New',
      fontSize: 13,
      fontStyle: 'italic',
      fill: '#33ff00',
      strokeThickness: 0,
      lineJoin: 'round',
    });
    this.statusText = new PIXI.Text("",style_elev_status_text);
    this.statusText.x = 10;
    this.statusText.y = 390;
    app.stage.addChild(this.statusText);

    this.update = function () {
      if (this.elev_ref != null) {
        this.statusText.text = "Status: " + this.elev_ref.currentStatus +
        (this.elev_ref.currentStatus == 100 ? ", Going up" : "") +
        (this.elev_ref.currentStatus == 101 ? ", Going dn" : "") +
        ", Aboard: " + this.elev_ref.aboardCount + 
        (this.elev_ref.holdingDoor ? ", Door blocked" : "")
        ;
      }
    }
  }
}

// #endregion
/////////////////////////////////////////////////////////////////////////////////
//#region Dynamic Background
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

class BackgroundWindow {
  constructor(locX,locY,bright,elapsed) {
    this.poissonLamba = Math.random()*5000+500;
    this.nextLightSwitchTime = elapsed + Math.random()*500000;//randPoisson(this.poissonLamba);
    this.isBright = bright;
    this.windowGlass = new PIXI.Sprite(this.isBright ? windowBrightTexture : windowDarkTexture);
    this.windowGlass.x = locX;
    this.windowGlass.y = locY;

    this.windowGlass.interactive = true;
    this.windowGlass.on('pointertap', (event) => { 
      this.isBright = ! this.isBright;
      this.windowGlass.texture = this.isBright ? windowBrightTexture : windowDarkTexture;
    });
  this.update = function(elapsed) {
    if (elapsed >= this.nextLightSwitchTime) {
      console.log("Switch light")
      this.isBright = ! this.isBright;
      this.windowGlass.texture = this.isBright ? windowBrightTexture : windowDarkTexture;
      this.nextLightSwitchTime = elapsed + Math.random()*5000+500;//randPoisson(this.poissonLamba);
    }
  }

    container.addChild(this.windowGlass);
  }
}

class BackgroundBuilding {
  constructor(buildX,buildY,elapsed) {
    this.windows = new Array(70);
    this.col = 0;
    for (let i=69; i>=0; i--) {
      this.brightWindow = Math.random()>0.8 ? 1 : 0;
      this.x = buildX + 20*this.col;
      this.y = buildY + (Math.ceil(10/7) - Math.floor(i/7) -1) * 20;
      this.windows[i] = new BackgroundWindow(this.x,this.y,this.brightWindow,elapsed);
      this.col += 1;
      this.col = this.col>6 ? 0 : this.col;
    }
    this.update = function(elapsed) {
      this.windows.forEach(win => win.update(elapsed))
    }
  }
}

// #endregion
/////////////////////////////////////////////////////////////////////////////////
//#region People


/**
 * TODO: Move these elsewhere.
 */



//#endregion
/////////////////////////////////////////////////////////////////////////////////
//#region Game loop
elev = new Elevator();
elevConsole = new ElevatorConsole();
floors = new Floors();
//testWindow = new BackgroundWindow();
bgBuilding1 = new BackgroundBuilding(400,300,0);
bgBuilding2 = new BackgroundBuilding(500,260,0)
bgBuilding3 = new BackgroundBuilding(620,320,0)
sprite_status = new SpriteStatusBox();
elevator_status = new ElevatorStatusBox(elev);

app.stage.addChild(container);
/**
 * *Game Loop
 */

// Add a ticker callback to move the sprites
let elapsed = 0.0;
let nextArrivalsTime = elapsed + randPoisson(60);
// temporary for test
createNewPerson(elapsed,0);
app.ticker.add((delta_obj) => {
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
      //console.log("*** Elevator's status changed to " + elev.currentStatus);
      //console.log(elev);  
      //console.log("aboard: " + elev.aboardCount);
      elevatorsLastStatus = elev.currentStatus;
    }

    //console.log(elev.direction)

    stats_aboardCount.text = 'Aboard: ' + elev.aboardCount;

    // Redraw other elements
    elevConsole.update();
    floors.update();
    sprite_status.update();
    elevator_status.update();
    bgBuilding1.update(elapsed);
    bgBuilding2.update(elapsed);
    bgBuilding3.update(elapsed);

});
//#endregion