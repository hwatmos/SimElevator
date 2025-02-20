import { Elevator, ElevatorConsole} from "./elevator.mjs";
import { moveSprites, createNewPerson, nextArrivalsTime } from "./passengers.mjs";

let elapsed = 0.0;

function main_loop(app, container) {
    elev = new Elevator(app, container);
    elevConsole = new ElevatorConsole(app, container, elev);
    
    createNewPerson(elapsed,0);
    app.ticker.add((delta_obj) => {
        delta = delta_obj.deltaTime;
        elapsed += delta;
        if (elapsed >= nextArrivalsTime) {
            createNewPerson(elapsed);
        }
        moveSprites(elapsed, delta, elev, app);
        elev.move(delta, elapsed);
        elevConsole.update(elev);
    });
}

export {main_loop};