import EventManager from './EventManager.js'

export const EVENT_DATA_RECEIVED = "data-received"

export default class Socket extends EventManager {

    // || "wss://localhost:3000"
    constructor(port=3000, address = "ws://localhost")
    {
        super()
        this.socket = new WebSocket(address + ':' + port)
            
        // custom data to send to the server...
        // really all this should do is announce itself!
        // socket.send("I am the client, please tell me about the bolts")
        this.socket.onopen = event => {
            // console.log("[Socket] Main Client Created")
            // console.log("[Socket:open] Connection established")
            // this.send("Main Client Created")
            // this.send("connected:device")
        }
        
        this.socket.onmessage = event => {
            // update stuff
            // console.log(`[Socket:Message] Data received: ${event.data}`, event )

            // update the state of the app...
            this.dispatch(EVENT_DATA_RECEIVED, event.data)
        }
        
        this.socket.onclose = event => {
            if (event.wasClean) {
                console.log(`[Socket:close] Connection closed cleanly, code=${event.code} reason=${event.reason}`)
            } else {
                // e.g. server process killed or network down
                // event.code is usually 1006 in this case
                console.log('[Socket:close] Connection died')
            }
        }
        
        this.socket.onerror = error => {
            console.error(`[Socket:error] ${error.message}`)
        }
    }
   
    send( data ) {
        this.socket.send(data)
    }
}
