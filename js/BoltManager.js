/**
 * This is a two part process. 
 * The arduino must send data to the 
 */

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

import EventManager from './EventManager.js'
import SerialController from './SerialController.js' 

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

export const EVENT_BOLT_SELECTED = 'bolt-selected'

export const LED_STATE_UNKNOWN = -1
export const LED_STATE_FLASHING = 0
export const LED_STATE_WHITE = 1
export const LED_STATE_GREEN = 2
export const LED_STATE_RED = 3
export const LED_STATE_OFF = 4

export default class BoltManager extends EventManager {
    
    serialController

    // BOLTS = x8 switches (on / off)
    // the system sends out this event when the bolt has been selected
    arduinoBoltSelected = -1

    internalRandomBolt = Math.ceil(Math.random() * 8)

   
    howManyBoltsActivated = 0

     // when this hits 8 we go into mode 2
    howManyBoltsAreNotFaulty = 0

    // game Mode 2



    // LEDS = x8 lights (on / off)
    leds

    //
    connected = false
    connecting = false

    constructor( ledQuantity=8 ) {
        super()
        this.serialController = new SerialController()
      
        // assume this is all turned off until we know otherwise
        this.leds = new Array(ledQuantity).fill(LED_STATE_UNKNOWN)
    }

    /**
     * get the bolt that the user is currently engaging with
     * @param {number} index - integer position of the switch
     * @returns Boolean value of is the switch on
     */
    getLEDStatus( index=0 ){
        // if unknown we return the default state
        return this.leds[index] || LED_STATE_UNKNOWN
    }

    /**
     * get the bolt that the user is currently engaging with
     * @param {number} index - integer position of the switch
     * @returns Boolean value of is the switch on
     */
    getActiveBolt(){
        // if unknown we return the default state
        return this.arduinoBoltSelected
    }

    /**
     * get the Boolean state of the plug at position x
     * eg. isPlugAtPositionInserted(0) returns true if plug at position 0 is inserted
     * @param {number} index - integer position of the plug
     * @returns Boolean value of is the switch on
     */
    isLEDAtPositionIlluminated( index ){
        return this.leds[ index ] ? this.leds[ index ] : false
    }

    /**
     * Connect this Computer to a Serial Device
     * NB. Must be called from a user event
     * @returns {Object} result data / if onnection succeeded
     */
    async connect( debug=false ){
        if (this.connected || this.connecting)
        {
            return true
        }

        this.connecting = true
        
        let result 
        try{
           result = await this.serialController.init()
        }catch(error){
            return false
        }

        if (debug)
        {
            console.warn("Connected to Serial Port", result)
        }
        
        this.connecting = false
        this.connected = true
        return result
    }

    /**
     * Pass in a command like 0 0 0 or 1 1 1 for turning 
     * all those switches to a specific state
     * @param {Array<Number>} commands - array of numbers
     * @param {Array} switchBank - array to set
     * @param {String} name - unique name for this bank of switches
     */
    parseBoolean( commands, switchBank, name="switch" ){
        return commands.map( (command, index) => {

            const status =  parseInt(command) === 0 ? false : true
            const hasChanged = switchBank[index] !== status
            
            // create a custom name for this switch swtichA, switchB etc
            const character = ALPHABET.charAt(index)
            const switchName = name + character

            // this.switchA, this.switchB, this.switchC etc
            this[switchName] = status  

            // check to see if the switch has changed
            if (hasChanged)
            {    
                switchBank[index] = status   
            }
            return hasChanged
        })
    }

    /**
     * Pass in a command that converts into a number
     * @param {Number} command - value of the setting
     * @param {Array} switchBank - array to save into
     */
    parseNumber( command, switchBank ){
        const integer = parseInt(command)
        switchBank[0] = integer || 0
        return integer
    }

    /**
     * index values go from 0-7 for each bolt
     * B index - Message from the ECU to inform the PC that a bolt has been selected. Index is the index of the bolt
     * L index val - Index is the index of the LED (the same number as the bolt). 0 is the attractor state (flashing). 1 is unselected (white). 2 is for a good bolt (green). 3 is for a bad bolt (red). 4 is for off/black (just incase this is ever needed).
     * R 1 - Reset all LEDs into attractor state
     * U 1 - Message from the ECU to inform the PC that a bolt has been selected. Index is the index of the bolt
     * Convert an Arduino command into an action
     * @param {Number} command - command to trigger
     * @returns {String} the command that was parsed
     */
    parseCommand( command ){

        const commands = command.split(" ") 
      
        // grab first part
        const commandType = String(commands.shift()).toUpperCase()

        // ensure that the command type is valid too
        switch(commandType){
            // Set the ACTIVE BOLT
            case 'B':
                const newBoltValue = parseInt( commands[0] )
                if ( newBoltValue !== this.arduinoBoltSelected )
                {
                    this.arduinoBoltSelected = newBoltValue
                    this.dispatch( EVENT_BOLT_SELECTED, newBoltValue )
                }
                break

            default:
                console.warn("Malformed arduino command:", command)
                return null
        }
        // ensure it is valid or return failure
        return command
    }

     /**
     * Convert an Arduino data into commands
     * @param {Number} data - data to read as commands
     * @returns {Array<String>} Array of commands
     */
    parseData( data ){
        // // split into commands
        const commands = data.split("\n")
        // now loop through each command and determine what it means...
        return commands.map( command => this.parseCommand(command) )
    }

    /**
     * TODO :
     * Pass in a complex object to update the entire state
     * of all of the gadgets in one operation
     * @returns {Object} Object of snapshotted data
     */
    loadSnapshot( dataObject ){
        this.leds = [...dataObject.leds],
        this.arduinoBoltSelected = dataObject.bolt
    }

    /**
     * Return the current state in one object with
     * all of the gadgets in it with their current states
     * @returns {Object} Object of snapshotted data
     */
    createSnapshot(){
        return {
            leds:this.leds.map( (e,index) => e ),
            bolt:this.arduinoBoltSelected
        }
    }

    /**
     * This allows you to turn on a specific LED
     * Index is the index of the LED (the same number as the bolt).
     * 0 is the attractor state (flashing). 
     * 1 is unselected (white). 
     * 2 is for a good bolt (green). 
     * 3 is for a bad bolt (red). 
     * 4 is for off/black (just incase this is ever needed).
     */
    async illuminateLED( index=0, state=1 ){
        if (state >= LED_STATE_FLASHING && state <= LED_STATE_OFF)
        {
            return this.sendData(`L ${index} ${state}`)
        }
        return null
    }

    /**
     * Reset all LEDs into attractor state
     * Serial Command R 1\n
     */
    async setAttractMode(){
        return this.sendData("R 1")
    }

    /**
     * Set all LEDs to the unselected state.
     * Serial Command U 1\n
     */
    async resetLEDs(){
        // FIXME: also reset the logic states of the game
        return this.sendData("U 1")
    }

    /**
     * Send any data to the Serial Bus and Arduino
     * @param {String} requestedCommand - data packet to send
     * @returns 
     */
    async sendData(requestedCommand){
        try{
            return this.serialController.write(`${requestedCommand}\n`)
        }catch(error){
            console.warn(error)
            return null
        }
    }

    /**
     * Fetch the data from the Arduino and poll it
     * @param {String} requestedCommand - command to trigger data relay
     * @param {Function} callback - callback to run on data
     * @returns 
     */
    async fetchData( requestedCommand, callback ){

        if (requestedCommand)
        {
            await this.sendData(requestedCommand)
        }
        
        // returns a long string of data but it may be cut off
        const data = await this.serialController.readCommands( (commandData)=>{
            const command = this.parseCommand(commandData)
            command && callback && callback(command)
        })

        this.parseData(data)
        // update state...
        return this.createSnapshot()
    }

    /**
     * NB. This halts all reads until it completes
     */
    async waitForUserToSelectBolt(){
        const data = await this.serialController.readCommands( (commandData)=>{
            const command = this.parseCommand(commandData)
            command && callback && callback(command)   
        }) 
        return this.parseData(data)
    }

    /**
     * Show the state of the gadgets
     * @returns {String} Easy to read string status of the gadgets
     */
    toString(){
        let output = "BOLT : Arduino Status ______________________________ \n"
        output += "Active Bolt: " + this.arduinoBoltSelected + "\n"
        output += "LEDS:        " + this.leds.map( b => b ? "LIT" : "UNLIT" ).join(", ") + "\n"
        return output
    }
}