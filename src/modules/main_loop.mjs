import { Elevator, ElevatorConsole, HallButtons } from "./elevator.mjs";
import { moveSprites, createNewPerson, nextArrivalsTime, destroySprites, SpriteStatusBox } from "./passengers.mjs";
// import { NaiveTalk, } from "./talk_naive_engine.mjs"; // Uncomment to enable naive talk modules

let elapsed = 0.0;
let delta = 0.0;
let sprite_status = null;

function main_loop() {
    const elev = new Elevator();
    const elevConsole = new ElevatorConsole(elev);
    const hallButtons = new HallButtons();
    sprite_status = new SpriteStatusBox();
    //const talk_floor_0 = new NaiveTalk(0, 0); // Uncomment for an example of using the NaiveTalk modules

    createNewPerson(elapsed, 0);
    app.ticker.add((delta_obj) => {
        delta = delta_obj.deltaTime;
        elapsed += delta;

        // Refresh frame
        elev.holdingDoor = false;

        // Create new sprites if enough time has passed
        if (elapsed >= nextArrivalsTime) {
            createNewPerson(elapsed);
        }

        // Move and update all objects
        destroySprites();
        moveSprites(elapsed, delta, elev);
        elev.move(delta, elapsed);
        elevConsole.update(elev);
        hallButtons.update();
        sprite_status.update();
        //talk_floor_0.update(elapsed); // Uncomment for an example of using the NaiveTalk modules
    });
}

export { main_loop, sprite_status };