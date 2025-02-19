# SimElevator

Simulation of an elevator and its passengers, written with PixiJS. Visit my website to view live demo at https://kamilluto.com/. 

![Video of the elevator simulator](docs/simElevator01.gif)

## Description

This code aims to simulate a real-world elevator and its passenger by treating the elevator and the passengers as individual entities. This means that the elevator's movement logic should be completely independent of the passengers present in the game. To accomplish this, the elevator and each passenger are controlled by their individual state. The passengers can request the elevator by pressing a button and the elevator is able to see where the floor has been requested. The passengers can also hold the door to stop the elevator from departing (although the elevator has still two properties, currentlyBoardingCount and currentlyDepartingCount, which must be eliminated).

## Current Development

I'm currently transitioning all code to PixiJS 8 and implementing modularity using Parcel. I'm expecting this to be complete by the end of Feb 2025. Commits won't be happening until I get a good working base code in Parcel.