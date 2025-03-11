import { Elevator, ElevatorConsole, HallButtons } from "./elevator.mjs";
import { moveSprites, createNewPerson, nextArrivalsTime, destroySprites, SpriteStatusBox } from "./passengers.mjs";

let elapsed = 0.0;
let delta = 0.0;
let sprite_status = null;

function main_loop() {
    const elev = new Elevator();
    const elevConsole = new ElevatorConsole(elev);
    const hallButtons = new HallButtons();
    sprite_status = new SpriteStatusBox();

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
        sprite_status.update()
    });
}

export { main_loop, sprite_status };