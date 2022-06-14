import EventManager from './EventManager.js'

export const EVENT_DATA_RECEIVED = "data-received"

export default class Socket  extends EventManager {

    constructor(address = "ws://localhost:3000" || "wss://localhost:3000")
    {
        super()
        this.socket = new WebSocket(address)
            
        // custom data to send to the server...
        // really all this should do is announce itself!
        // socket.send("I am the client, please tell me about the bolts")
        this.socket.onopen = event => {
            console.log("[open] Connection established")
            console.log("Sending to server", event)
            this.send("I am the client, please tell me about the bolts!")
            this.send("connected:device")
        }
        
        this.socket.onmessage = event => {
            // update stuff
            console.log(`[message] Data received from server: ${event.data}`, event )

            // update the state of the app...
            this.dispatch(EVENT_DATA_RECEIVED, event.data)
        }
        
        this.socket.onclose = event => {
            if (event.wasClean) {
                console.log(`[close] Connection closed cleanly, code=${event.code} reason=${event.reason}`)
            } else {
                // e.g. server process killed or network down
                // event.code is usually 1006 in this case
                console.log('[close] Connection died')
            }
        }
        
        this.socket.onerror = error => {
            console.error(`[error] ${error.message}`)
        }
    }
   
    send( data ) {
        this.socket.send(data)
    }
}
