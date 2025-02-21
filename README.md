# SimElevator DEV Branch

Currently transitioning to PixiJS 8.0 and Parcel.

## Elevator's Direction Logic

The logic that control's elevtor's direction:
1. Always **continue** moving up if the highest request is above.
2. Only **continue** moving down if the lowest **console** request is below.
3. When moving up, always stop at the console's requested floors.
4. When moving down, always stop at the console and hall requests.