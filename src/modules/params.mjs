export let
    poissonLambda = 333, // average time between new sprite arrivals
    SPEED = 10, //10 and above causes moon-shot or hell-ride
    ELEV_SPEED = .5,
    MAX_PASSENGERS = 6,
    MAX_QUEUE_LENGTH = 10, //won't create a new person if adding the person exceeds max
    // queue lengths for that person's starting floor. This helps to keep spillage beyond
    // the building's walls and makes the simulation a bit prettier.
    DOORS_PER_FLOOR = 3 // 0..3
    ;

export let
    numFloors = 10,
    floorZeroX = 200,
    floorZeroY = 350,
    floorHeight = 25,
    eleWidth = 15,
    elevOpen = true,
    elevOnboardingPauseTime = 100,

    ridersQueue = [];
