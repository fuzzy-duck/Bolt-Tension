/**
 * This is the game logic and state management
 * 
 * Game play :
 * User clicks screen to stop attract mode and start game
 * 
 */
import EventManager from './EventManager.js'
import BoltManager, {
    EVENT_BOLT_SELECTED,
    LED_STATE_UNKNOWN,
    LED_STATE_FLASHING,
    LED_STATE_WHITE,
    LED_STATE_GREEN,
    LED_STATE_RED,
    LED_STATE_OFF
} from './BoltManager.js'

import Socket, {EVENT_DATA_RECEIVED} from './sockets.js'

const convertLEDStatus = status => {
    switch(status) {
        case LED_STATE_UNKNOWN: return "LED:Unknown"
        case LED_STATE_FLASHING: return "LED:Flash"
        case LED_STATE_WHITE: return "LED:White"
        case LED_STATE_GREEN: return "LED:Green"
        case LED_STATE_RED: return "LED:Red"
        case LED_STATE_OFF: return "LED:Off"
    }
}

export const EVENT_BOLT_ACTIVATED = "bolt-selected-by-arduino"
export const EVENT_ALL_BOLTS_COMPLETED = "bolt-all-selected-by-human"
export const EVENT_GAME_COMPLETED = "bolt-all-correct"

// to send data from here back to the server..
const sendDataToServer = async ( path='serial', options={} ) => {
    const url = `${window.location.protocol}//${window.location.hostname}:${window.location.port}/${path}`
    const response = await fetch(url, options)
    if (response.ok) 
    { 
        // if HTTP-status is 200-299
        const json = await response.json()
        // const json = await response.json()
        return json
    } else {
        console.error("HTTP-Error: " + response.status)
    }
}

const sendJSONToServer = async (path, json) => {
    sendDataToServer( path, {
        method: 'POST',
        headers: {
        'Content-Type': 'application/json;charset=utf-8'
        },
        body: json
    })
}

const sendArduinoStateToServer = () => {
    sendJSONToServer( "snapshot", JSON.stringify(arduino.createSnapshot()) )
}

const sendGameStateToServer = (gameState) => {
    sendJSONToServer( "snapshot", JSON.stringify(gameState) )
}


export default class BoltGame extends EventManager {

    initialised = false
    playing = false
    activeBolt = -1
    
    socket
    arduino

    gameState

    constructor( boltQuantity=8 )
    {
        super()
        this.boltQuantity = boltQuantity
        this.socket = new Socket()
        this.arduino = new BoltManager()
        this.gameState = this.createGameState()
    }
    
    /**
     * NB. *must* be called from a USER INTERACTION
     * @returns 
     */
    async initialise (){

        if (this.initialised) 
        {
            return false
        }
      
        // try to connect to the arduino
        // NB  This *must* be triggered by a user interaction...
        const connectionEstablished = await this.arduino.connect()
        if (connectionEstablished)
        {
            // synchronise this browser with the others by sending out the default
            // state right now to the API endpoint in ~Express
            sendArduinoStateToServer()
            
            // now watch for when a user interacts with a bolt
            this.arduino.on(EVENT_BOLT_SELECTED, async (boltIndex) => {
                
                // user has selected a bolt!
                // boltIndex or arduino.getActiveBolt() at any time
                //  const boltUserIsEngagedWith = this.arduino.getActiveBolt()
        
                this.activeBolt = boltIndex

                // do something with that knowledge
                sendDataToServer( `serial/${boltIndex}` )

                // set the LED to white or flashing?
                await arduino.illuminateLED( boltIndex, LED_STATE_FLASHING )
        
                // A user has selected a bolt -> dispatch to game?
                this.dispatch( EVENT_BOLT_ACTIVATED, boltIndex )
            })

            // test sending bolt number to all browsers
            // sendDataToServer(202)
        }
        
        // remote data has changed - only use this for the slaves
        // so that we get data in realtime
        this.socket.on(EVENT_DATA_RECEIVED, data => {
            console.log("[Socket] data:", data )
        })  

        this.initialised = true
        return connectionEstablished
    }
    
    /**
     * 
     * @returns boltIndex or -1 if all bolt choices completed
     */
    getRandomBoltIndexWithNoSelection(){
        const unknown = []
        this.gameState.faultyBoltChoices.forEach( (bolt, index) => bolt === undefined ? unknown.push(index) : false )
        return unknown ? unknown[Math.floor(Math.random() * unknown.length)] : -1
    }

    getCorrectAnswers(){
        return this.gameState.faultyBoltChoices.map( (bolt, index) => {
            return bolt === this.isUserChoiceFaulty(index)
        } )
    }

    areAllAnswersCorrect(){
        for (let index=0, l=this.boltQuantity; index<l; ++index)
        {
            const answer = this.isBoltFaulty(index)
            const choice = this.isUserChoiceFaulty(index)
            if (answer !== choice){
                return false
            }
        }
        return true
    }

    /**
     * 
     * @param {*} boltIndex 
     * @returns {Number} return the status number -1 -> 6
     */
    isUserChoiceFaulty( boltIndex ){
        return this.gameState.faultyBoltChoices[boltIndex]
    }
    
    isBoltFaulty( boltIndex ){
        return this.gameState.actuallyFaultyBolts[boltIndex]
    }

    isBoltFunctional( boltIndex ){
        return !this.isBoltFaulty( boltIndex )
    }

    hasGameCompleted(){
        for (let i=0, l= this.boltQuantity; i < l ; ++i){
            if (this.gameState.faultyBoltChoices[i] === undefined) {
                return false
            } 
        }
        return true
    }

    /**
     * Start the game!
     */
    startGame(){
        this.playing = true
        sendGameStateToServer(this.gameState)
    }

    /**
     * Save the answer / choice that the user made into memory and store
     * @param {Number} boltIndex 
     * @param {Boolean} isFaulty 
     * @returns 
     */
    async setUserAnswer( boltIndex, isFaulty ){

        const choices = this.gameState.faultyBoltChoices

        // now check to see if the bolt was actually faulty!
        const boltFaulty = this.isBoltFaulty(boltIndex)
        const wasUserCorrect = boltFaulty === isFaulty
        const hasPreviousAnswer = choices[boltIndex]

        choices[boltIndex] = isFaulty

        // user was incorrect... presumably we change things green / red
        console.group("BOLT SELECTED")
        console.log("Bolt Index #"+boltIndex+" Activated by user")
        console.log("User guessed " +( isFaulty ? "that it was faulty" : "that is was working" ))
        console.log("Bolt is actually " + (boltFaulty ? "faulty" : "working") )
        console.log("User guessed " + (wasUserCorrect ? "correctly :)" : "incorrectly :(") )
        if (hasPreviousAnswer)
        {
           console.log("Bolt overwriting previous index of", hasPreviousAnswer )
        }
        console.log("All User choices ", {choices}  )
        
        // Index is the index of the LED (the same number as the bolt). 
        // 0 is the attractor state (flashing). 
        // 1 is unselected (white). 
        // 2 is for a good bolt (green).
        // 3 is for a bad bolt (red). 
        // 4 is for off/black (just incase this is ever needed). 
       // const LEDStatus = boltFaulty ? LED_STATE_GREEN : LED_STATE_RED 
        const LEDStatus = wasUserCorrect ? LED_STATE_GREEN : LED_STATE_RED 

        // activate the LED appropriately
        try{
            await this.arduino.illuminateLED(boltIndex, LEDStatus)
        }catch(error){
            console.warn("ISSUE: Couldn't connect to Arduino to illuminate light "+boltIndex+" to " + convertLEDStatus(LEDStatus) )
        }
       
        // check to see if all answers have been given
        let hasUserCompleted = this.hasGameCompleted()
           
        if (hasUserCompleted)
        {
            if (this.areAllAnswersCorrect())
            {
                console.log("User Completed all Bolts Correctly!", {choices} )
                this.onGameOver()
            }else{
                console.warn("User answered some incorrectly", {choices} )
                // TODO: Show answers?
                this.dispatch(EVENT_ALL_BOLTS_COMPLETED)
            }

        }else{
            // user still working on it...
        }

        console.groupEnd()
        return wasUserCorrect
    }

    
    /**
     * 1 of 8 bolts are randomised on the physical and front end layout 
     * 3 bolts are faulty, 5 are normal (randomised!)
     * @param {Boolean} random - should the data be randomised?
     */
    createGameState (random=true) {
        const faultyBoltChoices = []
        const actuallyFaultyBolts = []
        for (let i=0, l=this.boltQuantity; i<l; ++i)
        {
            faultyBoltChoices[i] = undefined
            actuallyFaultyBolts[i] = random ? Math.random() < 0.5 ? true : false : false
        }
        return {
            faultyBoltChoices, actuallyFaultyBolts
        }
    }

    /*
    // tell the arduino to do stuff...
    await arduino.illuminateLED(0, LED_STATE_FLASHING)
    await arduino.illuminateLED(1, LED_STATE_WHITE)
    await arduino.illuminateLED(2, LED_STATE_FLASHING)
    await arduino.illuminateLED(3, LED_STATE_WHITE)
    await arduino.illuminateLED(4, LED_STATE_GREEN)
    await arduino.illuminateLED(5, LED_STATE_RED)
    await arduino.illuminateLED(6, LED_STATE_OFF)
    await arduino.illuminateLED(7, LED_STATE_OFF)
    arduino.getLEDStatus(0) // LED_STATE_FLASHING
    */

    async showAttractMode () {
        // installation is in Attract People Mode :)
        // turn all LEDs into blinking lights to attract
        // passers by the engage (kinda like a screensaver)
        return await this.aarduino.setAttractMode()
    }

    async showEndScreen () {

        // turn all LEDs off
        return await this.aarduino.resetLEDs()
    }

    // restart the game
    async restartGame () {
        this.gameState = this.createGameState()
        // turn all LEDs off
        return await this.arduino.resetLEDs()
    }

    onGameOver(){
        this.playing = false
        this.dispatch(EVENT_GAME_COMPLETED)
    }
}


