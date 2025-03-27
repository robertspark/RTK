const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const os = require('os');
const SerialPort = require('serialport');
const Readline = require('@serialport/parser-readline');
const fs = require('fs');
const { networkInterfaces } = require('os');
const i2c = require('i2c-bus');
const ADXL345 = require('adxl345-sensor');
const ITG3205 = require('itg3205-sensor');
const QMC5883L = require('qmc5883l-sensor');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const port = 3000;

// Automatically detect the Raspberry Pi's IP
function getIPAddress() {
    const nets = networkInterfaces();
    for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
            if (net.family === 'IPv4' && !net.internal) {
                return net.address;
            }
        }
    }
    return 'localhost';
}

const ipAddress = getIPAddress();

// Serve static files (index.html, CSS, client-side JavaScript)
app.use(express.static(__dirname + '/public'));

// Serial port setup for UM980 GNSS receiver
const gpsPort = new SerialPort('/dev/serial0', { baudRate: 115200 });
const gpsParser = gpsPort.pipe(new Readline({ delimiter: '\n' }));

// I2C setup for sensors
const i2cBus = i2c.openSync(1);
const accelerometer = new ADXL345({ i2cBus });
const gyroscope = new ITG3205({ i2cBus });
const magnetometer = new QMC5883L({ i2cBus });

// Handle GNSS data
let gnssStatus = 'No Fix';
gpsParser.on('data', (data) => {
    if (data.startsWith('$GNGGA')) {
        const fields = data.split(',');
        const fixStatus = fields[6];
        switch (fixStatus) {
            case '1':
                gnssStatus = 'No RTK (Red)';
                break;
            case '2':
                gnssStatus = 'RTK Float (Blue)';
                break;
            case '4':
                gnssStatus = 'RTK Fix (Green)';
                break;
            default:
                gnssStatus = 'No Fix (Red)';
        }
        io.emit('gnssStatus', gnssStatus);
    }
});

// Read sensor data and emit to client
async function readSensors() {
    try {
        const accel = await accelerometer.getAcceleration().catch(err => ({ error: err.message }));
        const gyro = await gyroscope.getRotation().catch(err => ({ error: err.message }));
        const mag = await magnetometer.getHeading().catch(err => ({ error: err.message }));

        io.emit('sensorData', { accel, gyro, mag });
    } catch (error) {
        console.error('Error reading sensors:', error);
    }
}
setInterval(readSensors, 1000);

// Handle client connections
io.on('connection', (socket) => {
    console.log('Client connected');
    socket.emit('gnssStatus', gnssStatus);

    socket.on('logGPS', (gpsData) => {
        fs.appendFile('log.csv', `${gpsData}\n`, (err) => {
            if (err) console.error('Error logging data:', err);
        });
    });

    socket.on('toggleCorrection', () => {
        console.log('Toggle GPS Correction');
    });

    socket.on('setMode', (mode) => {
        gpsPort.write(`MODE ${mode}\n`);
        console.log(`Set GNSS Mode: ${mode}`);
    });

    socket.on('toggleRTK', (rtkMode) => {
        console.log(`RTK Mode: ${rtkMode}`);
    });
});

server.listen(port, () => {
    console.log(`Server running at http://${ipAddress}:${port}/`);
});
