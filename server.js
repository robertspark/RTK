const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const os = require('os');
const SerialPort = require('serialport');
const Readline = require('@serialport/parser-readline');
const fs = require('fs');
const { networkInterfaces } = require('os');
const i2c = require('i2c-bus');

const ADXL345 = require('./adxl345.js');
const ITG3205 = require('./itg3205.js');
const QMC5883L = require('./qmc5883l.js');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const port = 3000;

const Sbaud = 115200;

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
const gpsPort = new SerialPort('/dev/serial0', { baudRate: Sbaud });
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

//setInterval(() => {
//    const data = accel.readAcceleration();
//    console.log(`X: ${data.x.toFixed(3)}g, Y: ${data.y.toFixed(3)}g, Z: ${data.z.toFixed(3)}g`);
//}, 500);

//setInterval(() => {
//    const data = magnetometer.readGauss();
//    console.log(`Magnetic Field: X=${data.x.toFixed(2)} Y=${data.y.toFixed(2)} Z=${data.z.toFixed(2)} (Gauss)`);
//}, 1000);

//setInterval(() => {
//    console.log("Gyro (°/s):", gyroscope.readGyroDPS());
//    console.log("Temp (°C):", gyroscope.readTemperature().toFixed(2));
//}, 1000);

// Close the I2C connection when done
//process.on('SIGINT', () => {
//    magnetometer.close();
//    console.log('HMC5883L sensor connection closed.');
//    process.exit();
//});

// Read sensor data and emit to client
async function readSensors() {
    try {
        const accel = await accelerometer.getAcceleration();
        const gyro = await gyroscope.getRotation();
        const mag = await magnetometer.getHeading();

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
