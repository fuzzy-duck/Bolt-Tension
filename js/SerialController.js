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
    
    isWriting = false

    constructor() {
        this.encoder = new TextEncoder()
        this.decoder = new TextDecoder()
        this.textDecoder = new TextDecoderStream()
    } 
  
    async init() {
        if ('serial' in navigator) {
            try {
                const port = await navigator.serial.requestPort();
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

    async write(data) {
        if (!this.writer){
            return
            //throw Error("The SerialController is not available")
        }
        this.isWriting = true
        const dataArrayBuffer = this.encoder.encode(data)
        const output = await this.writer.write(dataArrayBuffer)
        this.isWriting = false
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
     * read data from web serial port in chunks
     * and reassemble it into a valid data string
     * @returns {string} data / error ,essage
     */
    async readCommands( callback ) {
        const commands = [];

        console.log("SerialController.readCommands(). Port readable?", this.port.readable )
   
        // pause the whole operation until the port is readable
        while ( this.port.readable ) {
            
            try {
                // pause the operation again until the "done" signal is received
                // this may take many loops but eventually the arduino will proclaim
                // the the next byte will be the last byte of the data and it will be "done"
                while (true) {

                    const { value, done } = await this.reader.read()
                    
                    if (done) {
                        // console.error("SERIAL DONE");
                        // Allow the serial port to be closed later.
                        this.reader.releaseLock()
                        // exit these loops
                        break
                    }

                    // concantenate the data into one longer string
                    if (value) 
                    {
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
            }
        }

        // console.log({rawData, cleanData});

        return rawData // cleanData
    }
}