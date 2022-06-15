# Fuzzy Duck - Bolt Tension

A setwork representation of the root of a wind turbine blade depicting the bolts holding it to the blade hub Wind turbine technicians use Non Destructive Testing, "NDT" equipment to test the bolts that hold the blades onto the rest of the wind turbine, critically important from a safety and operational point of view, the bolts are tested on a regular basis for invisible cracks that might develop through fatigue or the result of an extreme stress event like a severe storm.

The NDT test equipment used by technicians is a portable box with a built in monitor to view the results and an ultrasonic transducer on a long flexible cable that is placed upon the head of each bolt in turn to perform the test.

## Gameplay
On approaching the interactive the central screen displays a
welcome splash screen inviting the user to interact
As per the on screen instructions, the user picks up the blue NDT test
device which triggers the screen to display an explanation on how
to test each bolt and how to tell the difference between a
damaged bolt and a healthy bolt.

At this point the user is instructed to hold the NDT transducer to each bolt in turn, listening & observing the test results displayed on screen before being asked to decide, based on the test results, if the bolt is healthy or not & identifying it as such by pressing the appropriate cross or tick button Once a button has been pressed, the opal ring underneath the bolt head illuminates either red or green.

When all of the bolt heads have been tested, the system reveals the correct answers by extinguishing all of the lights, any bolts marked as damaged will turn to green & flash, if a bolt was identified incorrectly, the red light will flash along with a green light around the actual correct answer.


## Hardware

Arduino using serial protocol to communicate with PC

### Protocol

| Command        	| Source 	|     	| Values 	|     	| Notes                                                                                                                                                                                                                                     	|
|----------------	|--------	|-----	|--------	|-----	|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------	|
|                	|        	| Min 	| Reset  	| Max 	|                                                                                                                                                                                                                                           	|
| B index \n     	| ECU    	| 0   	| -      	| 7   	| Message from the ECU to inform the PC that a bolt has been selected. Index is the index of the bolt                                                                                                                                       	|
| L index val \n 	| PC     	| 0   	| -      	| 7   	| Index is the index of the LED (the same number as the bolt). 0 is the attractor state (flashing). 1 is unselected (white). 2 is for a good bolt (green). 3 is for a bad bolt (red). 4 is for off/black (just incase this is ever needed). 	|
| R 1\n          	| PC     	| -   	| -      	| -   	| Reset all LEDs into attractor state                                                                                                                                                                                                       	|
| U 1\n          	| PC     	| -   	| -      	| -   	| Set all LEDs to the unselected state.                                                                                                                                                                                                     	|

### Stack
Human ⟷ Musuem Installation ⟷ Electronics ⟷ Arduino ⟷ WebSerial ⟷ Browser ⟷ Express ⟷ Node ⟷ WebSockets ⟷ Browsers



### Installation & running

```
npm install
npm run start
```

then open your browser :

GAME
[localhost:3000/index.html](http://localhost:3000/index.html)

API (realtime state snapshot - refresh to see it change)
[localhost:3000/snapshot](http://localhost:3000/snapshot
