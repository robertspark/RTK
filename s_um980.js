const { SerialPort } = require('serialport'); // Correct import for SerialPort
const { ReadlineParser } = require('@serialport/parser-readline'); // Correct import for ReadlineParser
const EventEmitter = require('events');
const RTCMParser = require('./RTCMParser'); // Correct import for RTCMParser (make sure RTCMParser is exported as a class)

class UM980 extends EventEmitter {
    constructor(serialPort = '/dev/ttyUSB0', baudRate = 115200, mode = 'ROVER') {
        super();
        this.serialPort = serialPort;
        this.baudRate = baudRate;
        this.mode = mode; // 'BASE' or 'ROVER'
        this.latitude = null;
        this.longitude = null;
        this.altitude = null;
        this.time = null;
        this.rtcmData = [];
        
        // Set up SerialPort
        this.port = new SerialPort({
            path: this.serialPort,
            baudRate: this.baudRate,
        });

        // Use the Readline parser correctly (ReadlineParser)
        this.port.pipe(new ReadlineParser({ delimiter: '\n' })); // Correct usage with ReadlineParser

        // Set up RTCM parser
        this.rtcmParser = new RTCMParser(); // Ensure RTCMParser is properly imported as a class

        this.port.on('data', this.onDataReceived.bind(this));
        this.port.on('error', (err) => console.error("Serial Port Error:", err));
    }

    onDataReceived(data) {
        // Handle data depending on the mode
        if (this.mode === 'BASE') {
            this.handleBaseStationMode(data);
        } else if (this.mode === 'ROVER') {
            this.handleRoverMode(data);
        }
    }

    handleBaseStationMode(data) {
        // If it's RTCM data, send it to NTRIP caster
        if (data.startsWith('$RTCM')) {
            this.rtcmData.push(data);
            this.emit('rtcm', data);
            this.rtcmParser.parse(data); // Parse RTCM data using RTCMParser
            this.sendRTCMToCaster(data);
        } else if (data.startsWith('$GPGGA') || data.startsWith('$GNGGA')) {
            this.parseGNSSData(data);
        }
    }

    handleRoverMode(data) {
        // If RTCM data comes in, send to the local RTCM processing
        if (data.startsWith('$RTCM')) {
            this.rtcmData.push(data);
            this.emit('rtcm', data);
            this.rtcmParser.parse(data); // Parse RTCM data using RTCMParser
            this.sendRTCMToCaster(data);
        } else if (data.startsWith('$GPGGA') || data.startsWith('$GNGGA')) {
            this.parseGNSSData(data);
        }
    }

    parseGNSSData(data) {
        // Parse GPGGA or GNGGA strings for latitude, longitude, altitude, and time
        const parts = data.split(',');

        const latitude = this.parseCoordinate(parts[2], parts[3]);
        const longitude = this.parseCoordinate(parts[4], parts[5]);
        const altitude = parseFloat(parts[9]);
        const time = parts[1];

        if (latitude && longitude && altitude && time) {
            this.latitude = latitude;
            this.longitude = longitude;
            this.altitude = altitude;
            this.time = time;

            this.emit('gnss', {
                latitude: this.latitude,
                longitude: this.longitude,
                altitude: this.altitude,
                time: this.time
            });
        }
    }

    parseCoordinate(degreesMinutes, direction) {
        // Convert NMEA coordinate to decimal degrees
        const degrees = parseInt(degreesMinutes.substring(0, 2));
        const minutes = parseFloat(degreesMinutes.substring(2));

        let coordinate = degrees + minutes / 60;
        if (direction === 'S' || direction === 'W') {
            coordinate = -coordinate;
        }
        return coordinate;
    }

    sendRTCMToCaster(rtcmData) {
        // Send the RTCM data to an NTRIP caster (RTK2Go or a local NTRIP caster)
        const http = require('http');
        const options = {
            hostname: 'rtk2go.com',
            port: 2101, // Default port for NTRIP
            path: '/caster_url', // Replace with your NTRIP caster URL
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'Basic ' + Buffer.from('username:password').toString('base64')
            }
        };

        const req = http.request(options, (res) => {
            res.on('data', (chunk) => {
                console.log(`Received response: ${chunk}`);
            });
        });

        req.on('error', (err) => {
            console.error('Error sending RTCM:', err);
        });

        req.write(rtcmData);
        req.end();
    }

    setBaseStationMode() {
        this.mode = 'BASE';
        console.log("Switched to Base Station Mode");
        this.sendModeCommand('MODE BASE\n');
    }

    setRoverMode() {
        this.mode = 'ROVER';
        console.log("Switched to Rover Mode");
        this.sendModeCommand('MODE ROVER SURVEY\n');
    }

    sendModeCommand(command) {
        // Send the mode change command via the UART connection
        this.port.write(command, (err) => {
            if (err) {
                console.error("Error sending mode command:", err);
            } else {
                console.log(`Sent command to UM980: ${command}`);
            }
        });
    }

    getGNSSData() {
        return {
            latitude: this.latitude,
            longitude: this.longitude,
            altitude: this.altitude,
            time: this.time
        };
    }

    getRTCMData() {
        return this.rtcmData;
    }
}

module.exports = UM980; 
