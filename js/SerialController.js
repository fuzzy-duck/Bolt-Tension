class LineBreakTransformer {
    // A container for holding stream data until a new line.
    constructor() {
        this.chunks = "";
    }
  
    transform(chunk, controller) {
        // Append new chunks to existing chunks.
        this.chunks += chunk;
        // For each line breaks in chunks, send the parsed lines out.
        const lines = this.chunks.split("\n\r");  // 
        // kill empty line
        this.chunks = lines.pop();
        lines.forEach((line, i) =>{ 
            // console.log(i, "Adding chunk", chunk, "->", line );
            controller.enqueue(line)
        });
    }
  
    flush(controller) {
        // When the stream is closed, flush any remaining chunks out.
        console.log("Finished chunking", controller);
        controller.enqueue(this.chunks);
    }
}

/**
 * debug:
 * about://device-log
 * 
 * docs:
 * https://wicg.github.io/serial
 * 
 */
export default class SerialController {
    
    isReading = false
    isWriting = false
    isContinuouslyReading = false

    get isAvailable(){
        return 'serial' in navigator
    }

    get isConnected(){
        return this.port && ( this.port.readable ||  this.port.writable )
    }

    constructor() {
        this.encoder = new TextEncoder()
        this.decoder = new TextDecoder()
        this.textDecoder = new TextDecoderStream()
    } 
  
    async init() {
        if (this.isAvailable) {
            try {
                const port = await navigator.serial.requestPort()
                await port.open({ 

                    // A positive, non-zero value indicating the baud rate 
                    // at which serial communication should be established.
                    baudRate: 115200, //9600,

                    // The number of data bits per frame
                    // dataBits:8 (either 7 or 8).

                    // The number of stop bits at the end of a frame 
                    // stopBits:1 (either 1 or 2).

                    // The parity mode for pairing data
                    // parity:none (either "none", "even" or "odd").

                    // The size of the read and write buffers that should be created
                    // bufferSize:255 (must be less than 16MB).

                    // The flow control mode 
                    // flowControl:none (either "none" or "hardware").
                 });
                 
                //const [appPort, devPort] = port.readable.tee();
                const signals = await port.getSignals();        
                const readableStreamClosed = port.readable.pipeTo(this.textDecoder.writable)
                this.reader = this.textDecoder.readable
                                .pipeThrough(new TransformStream(new LineBreakTransformer()))
                                .getReader()
                //this.reader = port.readable.getReader()

                this.writer = port.writable.getWriter()
                this.port = port

                

                // these are useful to connect to if multiple devices are connected
                // as you can target them directly by id on refresh :)
                const { usbProductId, usbVendorId } = port.getInfo()
                // console.log( { usbProductId, usbVendorId, signals} );
                return {
                    connected:true,
                    usbProductId, 
                    usbVendorId
                }
            }
            catch (err) {
                throw Error('There was an error opening the serial port:'+ err)
            }
        }
        else {
            console.error('Web serial doesn\'t seem to be enabled in your browser. Try enabling it by visiting:')
            console.error('chrome://flags/#enable-experimental-web-platform-features')
            console.error('opera://flags/#enable-experimental-web-platform-features')
            console.error('edge://flags/#enable-experimental-web-platform-features')
            throw Error('Web serial doesn\'t seem to be enabled in your browser')
        }
    }

    // once reading has completed, you will want to release the read lock
    unlock(){
        console.error("SERIAL port Unlocked")
        this.reader.releaseLock()
        this.isReading = false
    }

    async write(data) {
        if (!this.writer){
            return
            //throw Error("The SerialController is not available")
        }
        this.isWriting = true
        const dataArrayBuffer = this.encoder.encode(data)
        const output = await this.writer.write(dataArrayBuffer)
        console.log("Serial WRITE : ", data )
        this.onWritingCompleted()
        return output
    }

    async readByte(){
        try {
            const readerData = await this.reader.read()
            return this.decoder.decode(readerData.value)
        }
        catch (err) {
            const errorMessage = `error reading data: ${err}`
            console.error(errorMessage)
            return errorMessage
        }
    }

    /**
     * This forces a re-read once writing has completed...
     */
    continuouslyRead( callback ){
        this.isContinuouslyReading = true
        this.continuousCallback = callback
        // commence reading
        if (!this.isReading)
        {
            console.log("Attempting to monitor Serial bus reads")
            this.readCommands( this.continuousCallback )
        }else{
            console.log("Tried to read Serial but serial port is busy reading")
        }
    }

    cancelContinuousRead(){
        this.isContinuouslyReading = false
        this.continuousCallback = null
        this.abortController.abort()
    }

    /**
     * read data from web serial port in chunks
     * and reassemble it into a valid data string
     * @returns {string} data / error ,essage
     */
    async readCommands( callback ) {
      
        if (!this.port || !this.port.readable)
        {
            console.warn("SerialController.readCommands() Failed : Port not readable" )
            return
        }

        const commands = []
        let cancelling = false
        
        this.isReading = true
        // allow us to cancel it if needed
        this.abortController = new AbortController()
        
        const signal = this.abortController.signal
        // allow us to exit prematurely
        signal.addEventListener('abort', () => {
            // This wait was interupted by the user selecting another bolt
            // before making a decision about the previous bolt
            cancelling = true
        })

        // pause the whole operation until the port is readable
        while ( this.port.readable && !signal.aborted && !cancelling ) {
            
            try {
                // pause the operation again until the "done" signal is received
                // this may take many loops but eventually the arduino will proclaim
                // the the next byte will be the last byte of the data and it will be "done"
                while (!signal.aborted && !cancelling) {

                    const { value, done } = await this.reader.read()
                    
                    if (done) {
                        this.unlock()
                        // exit these loops
                        break
                    }

                    // concantenate the data into one longer string
                    if (value) 
                    {
                        console.log("Serial RECEIVED COMMAND : ", value )
        
                        commands.push( value )
                 
                        // send only last packet
                        callback && callback(value)
                    }
                }

            } catch (error) {

                // Handle non-fatal read error.  
                const errorMessage = `error reading data: ${error}`
                console.error(errorMessage)
                // if you want to catch the error higher up with try catch...
                // but this may not be what you want as the error will not prevent
                // the loop repeating
                // throw Error(error);
                return errorMessage

            } finally {
                this.unlock()
            }
        }

        if (cancelling){
            console.log("Cancelled Serial reading!")
            this.unlock()
        }
    }

    // writing has completed
    onWritingCompleted(){
        
        this.isWriting = false
        if (this.isContinuouslyReading)
        {
            console.log("Serial WRITE complete - now remonitoring read...",  {isReading:this.isReading} )
            // if we want to start reading again...
            this.readCommands(this.continuousCallback)
        }else{
            console.log("Serial WRITE completed",  {isReading:this.isReading} )
        }
    }
}