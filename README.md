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

## Interactions Sequence
- User touches attractor screen

- 1 of 8 bolts are randomised on the physical and front end layout : 3 bolts are faulty, 5 are normal (can this be randomised?)

- The user uses the handheld device on said bolt and a video plays on the front end (possible 4 faulty videos 8 normal video)

- The user decides if it is faulty or normal by pressing the front end buttons

- This correct or incorrect score (x or tick) is registered but only revealed by pressing the check button
    
- After pressing faulty or normal another bolt is randomised and the process continues

- However, once a bolt has been activated the user can return to it and reactivate it using the handheld device and change their answer....if it's incorrect (by pressing faulty or normal)
    
- Presumably once the user returns the handheld device to a bolt their answer is reset on the front-end?

- Once all answers are correct a signal is sent via websockets to the reward screen which marks it as complete

- Once all is complete a ten minute timer starts, giving the user enough time to complete the Moving parts exhibit and then resets (see below)

- If there is no user interaction through the AV for 5 minutes the exhibit resets



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
Human ⟷ Musuem Installation ⟷ Electronics ⟷ Arduino ⟷ WebSerial ⟷ Browser ⟷ Express (Server) ⟷ Node ⟷ WebSockets ⟷ Browsers



### Installation & running

NB. This software _requires_ nodeJS to run

1. Please intall [NodeJS](https://nodejs.org/en/)
2. Download this package and open a command prompt
3. Open your project folder as your current directory
```eg. cd ./Bolt-Tension```
3. Run the following commands and wait a while
```
npm install
```
4. To see the app and start the server run
```npm run start```
5. Open your browser at one of the following pages:

GAME
[localhost:3000/index.html](http://localhost:3000/index.html)

API (ARDUINO state snapshot - refresh to see it change)
[localhost:3000/snapshot](http://localhost:3000/snapshot

API (realtime GAME state snapshot - refresh to see it change)
[localhost:3000/game](http://localhost:3000/game


// TODO: 
SCOREBOARD
[localhost:3000/scores.html](http://localhost:3000/scores.html)
