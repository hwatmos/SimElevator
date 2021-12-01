# SimElevator
Simulation of an elevator and its passengers

## Redesign Branch
I'm using this branch to re-do my code after some initial experimentation in the Main branch. 

### Elevator - floor selection logic
* Elevator object.
  * Independent of passenger objects except when:
    * Checking whether there are any passengers who are currently onboarding or departing the elevator.
  * Control logic.
    * This logic selects the next destination. It does not control the actual movement.
      * Specifically, if the elevator is headed from floor 10 to floor 0, it may still stop on floor 3 if a passanger requested the elevator there.
    * It is a sequence of rules, execute the first valid rule only.
    * The sequence's rules are:
      * If current status == DOWN or WAITING:
        * Head towards the next floor below that has been requested (requested using either the aboard control panel or using each floor's request buttons). 
      * Change status to UP:
      * Head towards the next floor above that has been requested using the aboard control panel.
      * Change status to WAITING.

### Elevator - movement logic

### Passenger - movement logic
* Passenger object.
  * Movement states.
    * 0 - Waiting for elevator and moving sprite in queue.
      * If elevator is on the same floor, consider boarding, i.e.:
        * If going in the same direction or if elevator is idle, switch to state 1.
      * Relation to elevator:
        * elev.curFloor.
        * elev.doorIsOpen.
        * elev.aboardCount (need to switch with idle).
        * elev.goingUp.
        * elev.currentlyBoardingCount ++. (need to separate this from elevator).
        * elev.aboardCount ++. (need to separate this from elevator and stop relying on it. Use elev.idle instead. In the real world, there could be a person on the elevator who just wants to enjoy going up and down ;) ).
      * Relation to global variables:
        * personsWaitingByFloor[]. This is just a bool array by floor to indicate queue positions. Used for moving sprites within the queue.
    * 1 - In process of boarding the elevator.
      * Vanilla, compare x.coord to elevator's x.coord and keep moving accordingly.
      * Once on the elevator:
        * elev.currentlyBoardingCount --. (need to move to global).
        * Change to state 100.
    * 100 - Aboard the elevator.
      * Continue adjusting y.coord to match elevator's. 
      * Once elevator's door is open.
        * If elevator.curFloor == this passenger's destination.
          * elev.AboardCount --;
          * elev.currentlyDeparting ++;
          * Switch to state 101;
    * 101 - Exiting the elevator.
      * Keep moving sprite until x.coord matches the first queue place.
      * Once arrived, switch state to 200;
    * 200 - Walking towards exit;
      * Keep moving sprite towards the exit.
      * Once the exit is reached, changes state to 999;
    * 999 - Ready for Destruct.
  * Notes - functions
    * createNewPerson()
    * pickPersonsColor()
    * requestElevator()
    * pressButtonOnElev()
  * Notes - other objects
    * spritesByFloor - array holds arrays of references to passengers. Replacing this with passengers array.
    * passengers - array of references to passengers.
    * floorRequests - array of bools
    * elevRequests - array of bools
    * queuePositionsByFloor - array of arrays of bool. Which positions in the queue are occupied? Used to move sprites.
    * queueLengthByFloor
    * 

      

### TODO: 

[ ] write out passenger's logic.

[ ] rewrite passenger code and cleanup.

[ ] finish the rest of the code.