import EventManager from './EventManager.js'
import {SerialController} from './SerialController.js' 

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

// Booleans
export const EVENT_SWITCH_CHANGED = 'switch-changed'
export const EVENT_PLUG_CHANGED = 'window-changed'
export const EVENT_WINDOW_CHANGED = 'window-changed'

// Numbers
export const EVENT_DIMMER_CHANGED = 'dimmer-changed'
export const EVENT_RADIATOR_CHANGED = 'radiator-changed'
export const EVENT_THERMOSTAT_CHANGED = 'thermostat-changed'

export class Gadgets extends EventManager {
    
    serialController

    // SWIT = x3 switches (on / off)
    switches

    // PLUG = x3 plugs (on / off)
    plugs

    // DIMM = Dimmer 0-100
    dimmers
   
    // RADI = Radiator 0-100
    radiators
    
    // WIN = Window (open or closed)
    windows
    
    // THER = Thermostat 8-32
    thermostats

    connected = false
    connecting = false

    constructor( switchQuantity=3, plugQuantity=3, dimmerQuantity=1, radiatorQuantity=1, windowQuantity=1, thermostatQuantity=1 ) {
        super()
        // assume this is all turned off until we know otherwise
        this.serialController = new SerialController()
        this.switches = new Array(switchQuantity).fill(undefined)
        this.plugs = new Array(plugQuantity).fill(undefined)
        this.windows = new Array(windowQuantity).fill(undefined)
        this.dimmers = new Array(dimmerQuantity).fill(-1)
        this.radiators = new Array(radiatorQuantity).fill(-1)
        this.thermostats = new Array(thermostatQuantity).fill(-1)
    }

    /**
     * get the Boolean state of a switch at position x
     * eg. isSwitchAtPositionOn(0) returns true if switch at position 0 is on
     * @param {number} index - integer position of the switch
     * @returns Boolean value of is the switch on
     */
     isSwitchAtPositionOn( index ){
        // if unknown we return the default state
        return this.switches[ index ] ? this.switches[ index ] : false
    }

    /**
     * get the Boolean state of the plug at position x
     * eg. isPlugAtPositionInserted(0) returns true if plug at position 0 is inserted
     * @param {number} index - integer position of the plug
     * @returns Boolean value of is the switch on
     */
    isPlugAtPositionInserted( index ){
        return this.plugs[ index ] ? this.plugs[ index ] : false
    }

    /**
     * get the Boolean state of the window at position x
     * eg. isWindowAtPositionOpen(0) returns true if window at position 0 is open
     * @param {number} index - integer position of the plug
     * @returns Boolean value of is the switch on
     */
    isWindowAtPositionOpen( index ){
        return this.windows[ index ] ? this.windows[ index ] : false
    }

    /**
     * get the Dimmer value
     * @param {number} index - integer position of the dimmer (defaults to the first)
     * @returns Number value of the dimmer
     */
    getDimmerValue( index=0 ){
        return this.dimmers[ index ] > -1 ? this.dimmers[ index ] : 0
    }

    /**
     * get the Radiator value
     * @param {number} index - integer position of the radiator (defaults to the first)
     * @returns Number value of the radiator
     */
    getRadiatorSetting( index=0 ){
        return this.radiators[ index ] > -1 ? this.radiators[ index ] : 0
    }

    /**
     * get the Thermostat reading
     * @param {number} index - integer position of the thermostat (defaults to the first)
     * @returns Temperature value of the thermostat
     */
    getThermostatTemp( index=0 ){
        return this.thermostats[ index ] > -1 ? this.thermostats[ index ] : 8
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
        const result = await this.serialController.init()
        if (debug)
        {
            console.warn("Connected to Serial Gadget", result)
        }
        
        this.connecting = false
        this.connected = true
        return result
    }

    /**
     * Pass in a command like 0 0 0 or 1 1 1 for turning 
     * all those switches to a specific state
     * @param {Array<Number>} commands - array of numbers
     * @param {Array} switchBank - 
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
     * Convert an Arduino command into an action
     * @param {Number} command - command to trigger
     * @returns {String} the command that was parsed
     */
    parseCommand( command ){

        const commands = command.split(" ") 
       
        // ensure it is valid or return failure
        if (commands.length < 2)
        {
            // failure in comms
            return null
        }

        // grab first letter
        const commandType = String(commands.shift() || '').toUpperCase()

        // ensure that the command type is valid too
        switch(commandType){
            case 'S':
                const switchChanges = this.parseBoolean( commands, this.switches, "switch" ) 
                // console.log("switchChanges", switchChanges, {command, commandType, commands})
                // if any of these are true then we send a change event
                switchChanges.forEach( (hasChanged, index) => {
                    if (hasChanged)
                    {
                        this.dispatch( EVENT_SWITCH_CHANGED, index, this.switches[index] )
                    }
                })
                break

            case 'P':
                const plugChanges = this.parseBoolean( commands, this.plugs, "plug" )
                // console.log("plugChanges", plugChanges, {command, commandType, commands})
                // the switch has changed so fire an event  
                plugChanges.forEach( (hasChanged, index) => {
                    if (hasChanged)
                    {
                        this.dispatch( EVENT_PLUG_CHANGED, index, this.plugs[index] )
                    }
                })
                break

            case 'W':
                const windowChanges = this.parseBoolean( commands, this.windows, "window" )
                // console.log("windowChanges", windowChanges, {command, commandType, commands})
                windowChanges.forEach( (hasChanged, index) => {
                    if (hasChanged)
                    {
                        this.dispatch( EVENT_WINDOW_CHANGED, index, this.windows[index] )
                    }
                })
                break

            case 'D':
                const newDimmerValue = this.parseNumber( commands[0], this.dimmers )
                // console.log("Dimmer", newDimmerValue, {command, commandType, commands})
                if ( newDimmerValue !== this.dimmerValue )
                {
                    this.dimmers[0] = newDimmerValue
                    this.dispatch( EVENT_DIMMER_CHANGED, newDimmerValue )
                }
                break

            case 'R':
                const newRadiatorValue = this.parseNumber( commands[0], this.radiators )
                if ( newRadiatorValue !== this.radiatorValue )
                {
                    this.radiators[0] = newRadiatorValue
                    this.dispatch( EVENT_RADIATOR_CHANGED, newRadiatorValue )
                }
                break

            case 'T':
                const newThermostatValue = this.parseNumber( commands[0], this.thermostats )
                if ( newThermostatValue !== this.thermostatValue )
                {
                    this.thermostats[0] = newThermostatValue
                    this.dispatch( EVENT_THERMOSTAT_CHANGED, newThermostatValue )
                }
                break

            default:
                console.error("Malformed arduino command:", command)
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
        this.switches = [ ...dataObject.switches],
        this.plugs = [...dataObject.plugs],
        this.windows = [...dataObject.windows],
        this.dimmers = [...dataObject.dimmers],
        this.radiators = [...dataObject.radiators],
        this.thermostats = [...dataObject.thermostats]
    }

    /**
     * Return the current state in one object with
     * all of the gadgets in it with their current states
     * @returns {Object} Object of snapshotted data
     */
    createSnapshot(){
        return {
            switches:this.switches.map( (e,index) => this.isSwitchAtPositionOn(index) ),
            plugs:this.plugs.map( (e,index) => this.isPlugAtPositionInserted(index) ),
            windows: this.windows.map( (e,index) => this.isWindowAtPositionOpen(index) ),
            dimmers:this.dimmers.map( (e,index) => this.getDimmerValue(index) ),
            radiators: this.radiators.map( (e,index) => this.getRadiatorSetting(index) ),
            thermostats: this.thermostats.map( (e,index) => this.getThermostatTemp(index) )
        }
    }

    /**
     * Fetch the data from the Arduino and poll it
     * @param {String} requestedCommand - command to trigger data relay
     * @param {Function} callback - callback to run on data
     * @returns 
     */
    async fetchData( requestedCommand, callback ){

        await this.serialController.write(requestedCommand)
       
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
     * Show the state of the gadgets
     * @returns {String} Easy to read string status of the gadgets
     */
    toString(){
        let output = "EUREKA! Arduino Status ______________________________ \n"
        output += "Switches:    " + this.switches.map( b => b ? "ON" : "OFF" ).join(", ") + "\n"
        output += "Plugs:       " + this.plugs.map( b => b ? "PLUGGED" : "UNPLUGGED" ).join(", ") + "\n"
        output += "Windows:     " + this.windows.map( b => b ? "OPEN" : "CLOSED" ).join(", ") + "\n"
        output += "Dimmer:      " + this.dimmers.join(", ") + "\n"
        output += "Radiator:    " + this.radiators.join(", ") + " (0-100) \n"
        output += "Thermostat:  " + this.thermostats.join(", ") + " (8-32) \n"
        return output
    }
}