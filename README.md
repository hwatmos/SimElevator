# SimElevator
Simulation of an elevator and its passengers

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