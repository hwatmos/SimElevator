import { Elevator, ElevatorConsole, HallButtons } from "./elevator.mjs";
import { moveSprites, createNewPerson, nextArrivalsTime } from "./passengers.mjs";

let elapsed = 0.0;
    let delta = 0.0;

function main_loop() {
    const elev = new Elevator();
    const elevConsole = new ElevatorConsole(elev);
    const hallButtons = new HallButtons();

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
        moveSprites(elapsed, delta, elev);
        elev.move(delta, elapsed);
        elevConsole.update(elev);
        hallButtons.update();
    });
}

export { main_loop };