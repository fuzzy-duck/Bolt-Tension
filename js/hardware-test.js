import SerialController from './SerialController.js' 

const testConnection = async () => {

    const serialController = new SerialController()

    console.log("HARDWARE TEST")
    console.log("Connecting to Arduino...")
    console.log("Click accept")
    const arduino = await serialController.init()

    console.log("Arduino Available", serialController.isAvailable )
    console.log("Arduino Connected", serialController.isConnected )

    //const byte = await serialController.readByte()

    console.log("Arduino byte" )

    const data = await serialController.readCommands( (commandData)=>{
        console.log("Read Command",commandData )
    })     
}


document.documentElement.addEventListener("click", testConnection, true )