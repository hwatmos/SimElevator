import { numFloors, floorZeroX, floorZeroY, floorHeight, eleWidth, DOORS_PER_FLOOR, } from "./params.mjs";
import { maxX } from "./engine.mjs";

function draw_floors(app, container) {
    // Draw floor outlines
    this.floorGraphic = new PIXI.Graphics();
    for (let i = -1; i<numFloors; i++) {
        this.floorGraphic.moveTo(floorZeroX-100,floorZeroY - i*floorHeight);
        this.floorGraphic.lineTo(floorZeroX+100,floorZeroY - i*floorHeight);
    }
    this.floorGraphic.moveTo(floorZeroX-100,floorZeroY - (numFloors-1)*floorHeight);
    this.floorGraphic.lineTo(floorZeroX-100,floorZeroY + floorHeight);
    this.floorGraphic.moveTo(floorZeroX+100,floorZeroY - (numFloors-1)*floorHeight);
    this.floorGraphic.lineTo(floorZeroX+100,floorZeroY + floorHeight);
    this.floorGraphic.moveTo(0,floorZeroY + floorHeight);
    this.floorGraphic.lineTo(maxX,floorZeroY + floorHeight);
    this.floorGraphic.moveTo(floorZeroX+eleWidth,floorZeroY - (numFloors-1)*floorHeight)
    this.floorGraphic.lineTo(floorZeroX+eleWidth,floorZeroY + floorHeight);
    this.floorGraphic.moveTo(floorZeroX+1.5,floorZeroY - (numFloors-1)*floorHeight)
    this.floorGraphic.lineTo(floorZeroX+1.5,floorZeroY + floorHeight);
    this.floorGraphic.stroke(0xA4969B);
    // Draw doors
    //this.floorGraphics.beginFill(0x302d40);
    for (let i = 0; i<numFloors-1; i++) {
        for (let j = 0; j<DOORS_PER_FLOOR; j++) {
            let doorx = floorZeroX+22+j*30;
            let doory = floorZeroY - (i+1)*floorHeight+7;
            this.floorGraphic.rect(doorx,doory,10,18).fill(0x302d40).stroke(0xA4969B);
            this.floorGraphic.rect(- 100 + doorx,doory,10,18).fill(0x302d40).stroke(0xA4969B);
        }
    }
    container.addChild(this.floorGraphic);
    return;
}

export {draw_floors};