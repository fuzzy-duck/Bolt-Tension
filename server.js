import { parse } from 'url'
import Express from 'express'
import { WebSocketServer, WebSocket } from 'ws'

const PING_TEST_TIME = 10000

let address = "localhost"

// singelton state
let apiState = {
    bolt:-1,
    leds: new Array(8).fill(-1)
}

let gameState = {
    bolt:-1,
    leds: new Array(8).fill(-1)
}

export const startServer = (serverPort = 3000, websocketServerPort = 8080) => {

    //initialize the Static & WebSocket server instance
    const app = Express()

    // port: websocketServerPort
    const webSocketServer = new WebSocketServer( { 
        noServer: true
    } )

    const clients = new Set()
    const sendToAllClients = (data, isBinary=false) => {
        let i=0
        for(let client of clients) 
        {
            console.log("Sending to client #"+(i++) + ' / ' + clients.size, data, {isBinary} , client.readyState, WebSocket.OPEN )  
            if (client.readyState === WebSocket.OPEN) 
            {
                client.send(data, { binary: isBinary })
            }
        }
    }

    const sendToAllClientsExceptThisOne = (thisOne, data, isBinary=false ) => {
        for(let client of clients) 
        {       
            console.log("Sending to all clients "+clients.size)  
            if (client !== thisOne && client.readyState === WebSocket.OPEN) 
            {
                client.send(data, { binary: isBinary })
            }
        }
    }

    // serve all the files in the root directory as static elements
    app.use(Express.static('./'))
    app.use(Express.json())

    app.get('/', (req, res) => {
        res.send('Open index.html to begin')
    })

    app.get('/serial/', (req, res) => {
        //console.log("Data being passed in from arduino")
        res.send('Serial Comms API')
    })
  
    // example: http://localhost:3000/state
    app.get('/snapshot', function(req, res, next){
        res.header("Content-Type",'application/json')
        res.end(JSON.stringify(apiState, null, 3))
    })

    app.get('/serial/:bolt', function(req, res, next){
        
        // you can pass data into it
        const bolt = req.params.bolt

        console.log("Data being passed in from arduino", bolt)

        // send out to connected clients
        sendToAllClients("bolt:"+bolt, true)

        if (bolt) res.send(bolt)
        else next()
    })

      
    app.get('/game/', (req, res) => {
        //console.log("Data being passed in from arduino")
        res.header("Content-Type",'application/json')
        res.end(JSON.stringify(gameState, null, 3))
    })

    // example: http://localhost:3000/game/
    app.post('/game/', function(req, res, next){

        const snapshot = req.body // || req.params.snapshot
        const json = JSON.stringify(snapshot, null, 3)
        gameState = snapshot
        console.log("GAME Data being passed in from arduino", json)

        // send out to connected clients
        sendToAllClients("game:"+json, false)

        if (snapshot)
        {
            res.header("Content-Type",'application/json')
            res.end(json)
        } else { 
            next()
        }
    })



    app.post('/snapshot/', function(req, res, next){
        // res.json()
        const snapshot = req.body // || req.params.snapshot
        const json = JSON.stringify(snapshot, null, 3)
        apiState = snapshot

        console.log("ARDUINO Data being passed in from arduino", json)

        // send out to connected clients
        sendToAllClients("snapshot:"+json, false)

        if (snapshot)
        {
            res.header("Content-Type",'application/json')
            res.end(json)
        } else { 
            next()
        }
    })


    
    const server = app.listen(serverPort, () => {
        console.log(`BOLT Tension => Check it out at https://localhost:${serverPort}`)
    })    

    // Proxy websockets through HTTP server
    server.on('upgrade', function upgrade(request, socket, head) {
        const { pathname } = parse(request.url)
        console.log(`BOLT Tension => Data ${pathname}`)
        webSocketServer.handleUpgrade(request, socket, head, function done(ws) {
            webSocketServer.emit('connection', ws, request)
        })
        // socket.destroy()
    })

    // create the sockets
    
   
        
    webSocketServer.on('connection', (ws, req) => {

        // When the server runs behind a proxy like NGINX, the de-facto standard is to use the X-Forwarded-For header.
        // const ip = req.headers['x-forwarded-for'].split(',')[0].trim();
        const ip = req.socket.remoteAddress
        address = ip
        console.log({ip})
        
        // Alive tests for connected clients
        ws.isAlive = true

        clients.add(ws)
        ws.on('close', () => {
            clients.delete(ws)
        })

        ws.on('pong', () => {
            ws.isAlive = true
        })
        
        // //connection is up, let's add a simple simple event
        // ws.on('message', (message) => {

        //     //log the received message and send it back to the client
        //     console.log('received: %s', message)
        //     ws.send(`Hello, you sent -> ${message}`)
        // })
            
        //connection is up, let's add a simple simple event
        // if the command has prefix broadcast: send it to all 
        // connected clients
        ws.on('message', (message, isBinary) => {

            if (!isBinary){

            }

            const commands = String(message||[]).split(":")
            //log the received message and send it back to the client
            console.log('received: %s', message, {commands} )

            // change what to do depending on the data...

            const broadcastRegex = /^broadcast\:/

            if (broadcastRegex.test(message)) {
                message = message.replace(broadcastRegex, '')

                //send back the message to the other clients
                sendToAllClientsExceptThisOne( message )
                
            } else {

                //sendToAllClientsExceptThisOne( ws, message )
                ws.send( message )
            }
        })

        //send immediatly a feedback to the incoming connection    
        // ws.send('Hi there, I am a WebSocket server')
    })


    /*
    // Ping tests every X ms
    setInterval(() => {
        webSocketServer.clients.forEach((ws) => {
            if (!ws.isAlive){ 
                return ws.terminate()
            }
            ws.isAlive = false
            ws.ping(null, false, true)
        })
    }, PING_TEST_TIME)
    */
}

