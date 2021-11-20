# SimElevator
Simulation of an elevator and its passengers

## Redesign Branch
I'm using this branch to re-do my code after some initial experimentation in the Main branch. 

The following are the details of the plan for my code.
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

TODO: 
[ ] write out passenger's logic.
[ ] rewrite passenger code and cleanup.
[ ] finish the rest of the code.