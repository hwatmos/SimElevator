import { Elevator, ElevatorConsole, HallButtons } from "./elevator.mjs";
import { moveSprites, createNewPerson, nextArrivalsTime } from "./passengers.mjs";

let elapsed = 0.0;

function main_loop(app, container) {
    const elev = new Elevator(app, container);
    const elevConsole = new ElevatorConsole(app, container, elev);
    const hallButtons = new HallButtons(app, container);

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
        moveSprites(elapsed, delta, elev, app);
        elev.move(delta, elapsed);
        elevConsole.update(elev);
        hallButtons.update();
    });
}

export { main_loop };