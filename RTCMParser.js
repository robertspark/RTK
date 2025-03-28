class RTCMParser {
    constructor() {
        this.buffer = Buffer.alloc(0);
    }

    parse(data) {
        // Append incoming data to the buffer
        this.buffer = Buffer.concat([this.buffer, data]);

        // Loop through and extract RTCM messages
        while (this.buffer.length > 3) {
            // Find the RTCM sync word (0xD3)
            if (this.buffer[0] === 0xD3) {
                // Get message length (including header)
                const messageLength = (this.buffer[1] << 8) + this.buffer[2];
                if (this.buffer.length >= messageLength + 3) {
                    const message = this.buffer.slice(0, messageLength + 3);
                    this.buffer = this.buffer.slice(messageLength + 3);

                    // Process the RTCM message
                    this.processMessage(message);
                } else {
                    // Wait for more data
                    break;
                }
            } else {
                // Sync word not found, discard the first byte and try again
                this.buffer = this.buffer.slice(1);
            }
        }
    }

    processMessage(message) {
        const messageType = message[3] & 0x3F; // Message type (6 bits)
        console.log(`Received RTCM message type: ${messageType}`);

        // Process based on message type
        switch (messageType) {
            case 1005:
                this.processRTKReferenceStationMessage(message);
                break;
            case 1033:
                this.processReceiverAntennaDescriptorsMessage(message);
                break;
            case 1077:
                this.processGPSMessage(message);
                break;
            case 1087:
                this.processGLONASSMessage(message);
                break;
            case 1097:
                this.processGalileoMessage(message);
                break;
            case 1107:
                this.processSBASMessage(message);
                break;
            case 1127:
                this.processBeiDouMessage(message);
                break;
            case 1230:
                this.processGLONASSL1L2BiasesMessage(message);
                break;
            default:
                console.log(`Unknown or unsupported RTCM message type: ${messageType}`);
        }
    }

    processRTKReferenceStationMessage(message) {
        // RTCM message type 1005: Stationary RTK Reference Station ARP
        console.log('Processing RTCM 1005: Stationary RTK Reference Station ARP');
        // Example: Extract relevant fields from message and log them
    }

    processReceiverAntennaDescriptorsMessage(message) {
        // RTCM message type 1033: Receiver and Antenna Descriptors
        console.log('Processing RTCM 1033: Receiver and Antenna Descriptors');
        // Example: Extract relevant fields from message and log them
    }

    processGPSMessage(message) {
        // RTCM message type 1077: GPS, Pseudorange, PhaseRange, Doppler, CNR with high resolution
        console.log('Processing RTCM 1077: GPS, Pseudorange, PhaseRange, Doppler, CNR');
        // Extract and display data, for example:
        const pseudorange = this.getInt32(message, 6);
        console.log(`GPS Pseudorange: ${pseudorange}`);
    }

    processGLONASSMessage(message) {
        // RTCM message type 1087: GLONASS, Pseudorange, PhaseRange, Doppler, CNR with high resolution
        console.log('Processing RTCM 1087: GLONASS, Pseudorange, PhaseRange, Doppler, CNR');
        // Extract and display data
    }

    processGalileoMessage(message) {
        // RTCM message type 1097: Galileo, Pseudorange, PhaseRange, Doppler, CNR with high resolution
        console.log('Processing RTCM 1097: Galileo, Pseudorange, PhaseRange, Doppler, CNR');
        // Extract and display data
    }

    processSBASMessage(message) {
        // RTCM message type 1107: SBAS, Pseudorange, PhaseRange, Doppler, CNR with high resolution
        console.log('Processing RTCM 1107: SBAS, Pseudorange, PhaseRange, Doppler, CNR');
        // Extract and display data
    }

    processBeiDouMessage(message) {
        // RTCM message type 1127: BeiDou, Pseudorange, PhaseRange, Doppler, CNR with high resolution
        console.log('Processing RTCM 1127: BeiDou, Pseudorange, PhaseRange, Doppler, CNR');
        // Extract and display data
    }

    processGLONASSL1L2BiasesMessage(message) {
        // RTCM message type 1230: GLONASS L1 and L2 Code-Phase Biases
        console.log('Processing RTCM 1230: GLONASS L1 and L2 Code-Phase Biases');
        // Extract and display data
    }

    // Helper methods to read values from message buffer
    getInt16(buffer, offset) {
        return buffer.readInt16BE(offset);
    }

    getInt32(buffer, offset) {
        return buffer.readInt32BE(offset);
    }
}

// Example usage
const rtcParser = new RTCMParser();

// Simulate receiving RTCM data in chunks
const chunk1 = Buffer.from([0xD3, 0x00, 0x24, 0x05, 0x00, 0x01, 0x00, 0x00, 0x00, 0xF0, 0x00, 0x00, 0x00, 0x00, 0x00]);
const chunk2 = Buffer.from([0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00]);
rtcParser.parse(chunk1);
rtcParser.parse(chunk2);
