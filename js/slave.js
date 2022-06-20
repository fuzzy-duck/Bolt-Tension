
import Socket, {EVENT_DATA_RECEIVED} from './sockets.js'

const socketPort = 5555

const socket = new Socket( socketPort )
const body = document.documentElement

// fetch the default state
const settings = '/game'

const drawTable = (faultyBoltChoices, actuallyFaultyBolts) =>{
    let output = '<table>'
    output += `<thead>
    <tr><th>User Choice</th><th>Bolt Status</th></tr>
    </thead>`
    for (let i=0, l=faultyBoltChoices.length; i < l; ++i)
    {
        const userChoice = faultyBoltChoices[i]
        const boltStatus = actuallyFaultyBolts[i]
        output += `<tr><td>${userChoice}</td><td>${boltStatus}</td></tr>`
    }
    output += '</table>'
    body.innerHTML = output
}

const start = async() => {
    
    const request = await fetch(settings)
    const response = await request.json()


     console.log("[Fecth] data:", {response} )
   

    let {
        faultyBoltChoices,
        actuallyFaultyBolts,
        activeBolt
    } = response

    console.log("[Fecth] parsed:", {faultyBoltChoices, actuallyFaultyBolts} )
    drawTable( faultyBoltChoices, actuallyFaultyBolts )

    // so that we get data in realtime
    socket.on(EVENT_DATA_RECEIVED, data => {
        const snapshot = JSON.parse(data)
        console.log("[Socket] snapshot:", {data, snapshot} )
   
        // if this is all null if means the game is beginning...
       if (snapshot.activeBolt < 0){
            console.log("[Socket] GAME STARTED:", snapshot )
            faultyBoltChoices = snapshot.faultyBoltChoices
            actuallyFaultyBolts = snapshot.actuallyFaultyBolts
            body.classList.toggle("completed", false)

        }else{

            console.log("[Socket] GAME ENDED:", snapshot )
            faultyBoltChoices = snapshot.faultyBoltChoices
            actuallyFaultyBolts = snapshot.actuallyFaultyBolts
            body.classList.toggle("completed", true)
            drawTable( faultyBoltChoices, actuallyFaultyBolts )
       }
    })  
}

start()