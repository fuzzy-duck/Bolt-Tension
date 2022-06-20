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

export const convertLEDStatus = status => {
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

const URL = `${window.location.protocol}//${window.location.hostname}:${window.location.port}`

// to send data from here back to the server..
const sendDataToServer = async ( path='serial', options={} ) => {
    const url = `${URL}/${path}`
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

const sendActiveBolt = async (path, json) => {
    sendDataToServer( path, {
        method: 'POST',
        headers: {
        'Content-Type': 'application/json;charset=utf-8'
        },
        body: json
    })
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

const sendArduinoStateToServer = (snapshot) => {
    sendJSONToServer( "snapshot", snapshot )
}

/**
 * Sends the GAME State to all clients connected by WebSockets
 * @param {Object} gameState 
 * @param {Number} activeBolt 
 */
const sendGameStateToServer = (gameState, activeBolt) => {
    sendJSONToServer( "game", JSON.stringify({...gameState, activeBolt}) )
}

/**
 * 
 */
export default class BoltGame extends EventManager {

    initialised = false
    playing = false
    activeBolt = -1
    timeStarted = -1
    
    socket
    arduino

    gameState

    constructor( socketPort=3000, boltQuantity=8 )
    {
        super()
        this.boltQuantity = boltQuantity
        this.socket = new Socket( socketPort )
        this.arduino = new BoltManager()
        this.gameState = this.createGameState()
    }
    
    /**
     * NB. *must* be called from a USER INTERACTION
     * @returns {Boolean} whether we are connected
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
            sendArduinoStateToServer( JSON.stringify(this.arduino.createSnapshot()) )
            
            // now watch for when a user interacts with a bolt
            this.arduino.on(EVENT_BOLT_SELECTED, async (boltIndex) => {
                
                console.error("BOLT SELECTED via Arduino", boltIndex )
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

            console.log("Connected to Arduino!", this.arduino)

            // test sending bolt number to all browsers
            // sendDataToServer(202)
        }else{
            console.warn("Connection to Arduino:REFUSED")
        }
        
        // remote data has changed - only use this for the slaves
        // so that we get data in realtime
        this.socket.on(EVENT_DATA_RECEIVED, data => {
            
            console.log("[Socket] data:", data )

            // 
        })  

        this.initialised = true
        return connectionEstablished
    }

    isArduinoConnected(){
        return this.arduino.connected
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
            const wasUserCorrect = this.isUserCorrect(index) 
            if (!wasUserCorrect){
                return false
            }
        }
        return true
    }

    /**
     * Compares the user's answers with the actual answers
     * @param {Number} boltIndex - bolt position
     * @returns {Boolean} whether the user was right or wrong
     */
    isUserCorrect(boltIndex){
        const answer = this.isBoltFaulty(boltIndex)
        const choice = this.isUserChoiceFaulty(boltIndex)
        return answer === choice
    }

    /**
     * 
     * @param {Number} boltIndex - bolt position
     * @returns {Boolean} return if bolt at index is faulty
     */
    isUserChoiceFaulty( boltIndex ){
        return this.gameState.faultyBoltChoices[boltIndex]
    }

     /**
     * 
     * @param {Number} boltIndex - bolt position
     * @returns {Boolean} return if bolt at index is faulty
     */
    isBoltFaulty( boltIndex ){
        return this.gameState.actuallyFaultyBolts[boltIndex]
    }

     /**
     * 
     * @param {Number} boltIndex - bolt position
     * @returns {Boolean} return if bolt at index is faulty
     */
    isBoltFunctional( boltIndex ){
        return !this.isBoltFaulty( boltIndex )
    }

     /**
     * Has the user completed all the Bolts?
      * @returns {Boolean} return if all bolts completed
     */
    haveAllBoltsBeenTested(){
        for (let i=0, l= this.boltQuantity; i < l ; ++i){
            if (this.gameState.faultyBoltChoices[i] === undefined) {
                return false
            } 
        }
        return true
    }

    /**
     * restart the game, set everything to zero
     * @returns 
     */
    async resetGame () {
        // reset and randomise
        this.gameState = this.createGameState()
        // turn all LEDs off
        return await this.arduino.resetLEDs()
    }

    /**
     * Start the game!
     */
    startGame(){
        this.playing = true
        this.timeStarted = Date.now()
        sendGameStateToServer(this.gameState, this.activeBolt)
        this.turnOffAllLEDs()
    }

    /**
     * Save the answer / choice that the user made into memory and store
     * @param {Number} boltIndex 
     * @param {Boolean} userChoseFaulty 
     * @returns 
     */
    async setUserAnswer( boltIndex, userChoseFaulty ){

        const choices = this.gameState.faultyBoltChoices

        // now check to see if the bolt was actually faulty!
        const boltFaulty = this.isBoltFaulty(boltIndex)
        const wasUserCorrect = boltFaulty === userChoseFaulty
        const hasPreviousAnswer = choices[boltIndex]
        const userChoice = userChoseFaulty ? 'faulty' : 'normal'

        choices[boltIndex] = userChoseFaulty

        // user was incorrect... presumably we change things green / red
        console.group("BOLT SELECTED")
        console.log("Bolt Index #"+boltIndex+" Activated by user")
        console.log("User guessed " +( userChoseFaulty ? "that it was faulty" : "that is was working" ))
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
            await this.illuminateLED(boltIndex, LEDStatus)
        }catch(error){
            console.warn("ISSUE: Couldn't connect to Arduino to illuminate light "+boltIndex+" to " + convertLEDStatus(LEDStatus) )
        }
        
        // send this to the server
        sendDataToServer( `serial/${boltIndex}/${userChoice}` )

        // check to see if all answers have been given
        let hasUserCompleted = this.haveAllBoltsBeenTested()
           
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

        this.activeBolt = boltIndex

        console.groupEnd()
        return wasUserCorrect
    }

    
    /**
     * Set the game state to an initial reset status
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
            faultyBoltChoices, actuallyFaultyBolts, activeBolt:this.activeBolt
        }
    }

    /**
     * Send a signal to the Arduino to activate Attract People Mode :)
     * which turns all LEDs into blinking lights to attract
     * passers by to engage them into playing (kinda like a screensaver)
     * @returns 
     */
    async showAttractMode () {
        return await this.arduino.setAttractMode()
    }

    /**
     * Send a signal to the Arduino to turn off ALL LEDs
     * @returns delayed response
     */
    async turnOffAllLEDs () {
       return await this.arduino.resetLEDs()
    }

    /**
     * Illuminate the LED in the museum
     * @param {Number} boltIndex - index of the LED
     * @param {Number} LEDStatus - status flag (see top)
     */
    async illuminateLED (boltIndex, LEDStatus) {
        return await this.arduino.illuminateLED(boltIndex, LEDStatus)
    }

    onGameOver(){
        const timeElapsed = Date.now() - this.timeStarted
        this.playing = false
        sendGameStateToServer( this.gameState, this.activeBolt )
        this.dispatch(EVENT_GAME_COMPLETED, {timeElapsed})
    }
}


