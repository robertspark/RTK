const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const fs = require('fs');
const { networkInterfaces } = require('os');
const Madgwick = require('./madgwick');

const ADXL345 = require('./s_adxl345');
const ITG3205 = require('./s_itg3205');
const QMC5883L = require('./s_qmc5883l');
const UM980 = require('./s_um980');  // Ensure the path is correct

const app = express();
const server = http.createServer(app);
const io = socketIo(server);
const port = 3000;

const serialPort = '/dev/Serial0';  // Serial port for UM980
const baudRate = 115200;   // Baud rate for UM980

let gpsData = {
    time: "--",
    latitude: "--",
    longitude: "--",
    altitude: "--",
    satellites: "--",
    status: "No Fix" // Default GNSS status
};

// Initialize WebSocket server for real-time communication
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
app.use(express.static(__dirname + '/public'));

// Initialize the UM980 GNSS Receiver
const gnssReceiver = new UM980(serialPort, baudRate);

// Listen for GNSS data from UM980
gnssReceiver.on('gnss', (data) => {
    console.log('GNSS Data:', data);
    gpsData = {
        time: data.time || "--",
        latitude: data.latitude || "--",
        longitude: data.longitude || "--",
        altitude: data.altitude || "--",
        satellites: data.satellites || "--",
        status: data.status || "No Fix"
    };
    // Emit GNSS data to front-end via WebSocket
    io.emit('gpsData', gpsData);
});

// Switch UM980 to Base Station Mode
function setBaseStationMode() {
    gnssReceiver.setBaseStationMode();  // Sends "MODE BASE" to UM980
}

// Switch UM980 to Rover Mode
function setRoverMode() {
    gnssReceiver.setRoverMode();  // Sends "MODE ROVER SURVEY" to UM980
}

// Initialize IMU Sensors
let accelerometer, gyroscope, magnetometer;
const madgwick = new Madgwick(0.1, 100);

async function initSensors(retryCount = 3) {
    try {
        accelerometer = new ADXL345();
        await accelerometer.init();
        
        gyroscope = new ITG3205();
        await gyroscope.init();
        
        magnetometer = new QMC5883L();
        await magnetometer.init();
        
        console.log("✅ Sensors initialized successfully.");
    } catch (error) {
        console.error("⚠️ Error initializing sensors:", error);
        if (retryCount > 0) {
            console.log(`Retrying sensor initialization (${retryCount} attempts left)...`);
            setTimeout(() => initSensors(retryCount - 1), 2000);
        }
    }
}
initSensors();

// Parse GPS Data (GPGGA / GNGGA strings)
const gpsParser = new ReadlineParser({ delimiter: '\r\n' });
const gpsSerialPort = new SerialPort({ path: serialPort, baudRate });
gpsSerialPort.pipe(gpsParser);

gpsParser.on('data', (data) => {
    if (!data.startsWith('$GNGGA') && !data.startsWith('$GPGGA')) return;

    const parts = data.split(',');
    if (parts.length < 10) return;

    let rawLat = parseFloat(parts[2]);
    let rawLon = parseFloat(parts[4]);
    let satellites = parseInt(parts[7], 10);

    if (!isNaN(rawLat) && !isNaN(rawLon)) {
        const latHemisphere = parts[3] === 'S' ? -1 : 1;
        const lonHemisphere = parts[5] === 'W' ? -1 : 1;

        gpsData = {
            time: parts[1] || "--",
            latitude: (rawLat / 100) * latHemisphere,
            longitude: (rawLon / 100) * lonHemisphere,
            altitude: parseFloat(parts[9]) || "--",
            satellites: satellites || "--",
            status: satellites > 6 ? "RTK Fix" : satellites > 4 ? "RTK Float" : "No Fix"
        };

        // Emit GNSS data to front-end via WebSocket
        io.emit('gpsData', gpsData);
    }
});

// Serve GPS Data via REST
app.get('/gps', (req, res) => {
    res.json(gpsData);
});

// Read IMU Sensors (accelerometer, gyroscope, magnetometer)
async function readSensors() {
    try {
        if (!accelerometer || !gyroscope || !magnetometer) return;

        const accel = await accelerometer.readAcceleration();
        const gyro = await gyroscope.readGyroDPS();
        const mag = await magnetometer.readMicroTesla();

        // Update Madgwick filter with IMU data
        madgwick.update(gyro.x, gyro.y, gyro.z, accel.x, accel.y, accel.z, mag.x, mag.y, mag.z);
        const fusedOrientation = madgwick.getQuaternion();

        // Emit sensor data to front-end via WebSocket
        io.emit('sensorData', { gpsData, accel, gyro, mag, fusedOrientation });
    } catch (error) {
        console.error('⚠️ Error reading sensors:', error);
    }
}

// Periodic Sensor Read (every 500ms)
setInterval(readSensors, 500); 

// WebSocket Communication for Client-Side
io.on('connection', (socket) => {
    console.log('✅ Client connected');
    socket.on('disconnect', () => console.log('⚠️ Client disconnected'));
});

// Start Server
server.listen(port, () => {
    console.log(`🚀 Server running at http://${ipAddress}:${port}/`);
});
