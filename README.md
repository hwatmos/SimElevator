# SimElevator
Simulation of an elevator and its passengers.

![Video of a elevator simulator](docs/simElevator01.gif)

## Issues

- Sometimes sims wait for the elevator, i.e. have status 0 but the global floor request for that floor is false.  Elevator will only pick them up if another sim goes to that floor.
  - Fix added, need to test more to see if it work properly (added delay before closing door to allow additional iterations and sims to begin boarding).
- Sometimes when picking sims from the highest floor and going down, it seems that the button is still on on that floor.

# API

This documentation still needs more work. The following is a cheatsheet used during development process.

## Global

* floorZeroX - location of the center of the elevator
* personsMovementSpeed
* passengers - unused?
* spritesByFloor[startingFloor] - newly created sprites appended here
* numFloors
* floorHeight
* higestRequestedFloor

## Person

* startingFLoor
* destinationFLoor
* x
* y
* exitDoorXLoc
* currentStatus
* positionInQueue
  * -1 if on the elevator

## Floor

* queueLengthByFloor[floor] - int
* queuePositionsByFloor[floor][position_in_queue] - bool
* floorRequests[floor] - bool

## Elevator#

* goingUp
* curFloor
* doorIsOpen
* currentlyBoardingCount
* currentlyDepartingCount
* aboardCount
* currentStatus
* floorRequests
* higestRequestedFloor