const i2c = require('i2c-bus');

class Magnetometer {
    constructor(busNumber = 1, address = 0x0D) {
        this.busNumber = busNumber;
        this.address = address;
        this.i2cBus = i2c.openSync(this.busNumber);
    }

    init() {
        try {
            console.log("Initializing Magnetometer...");

            // Soft reset the sensor to ensure it's in a clean state
            this.i2cBus.writeByteSync(this.address, 0x0F, 0x80);
            this._wait(100);  // Wait for reset to complete

            // Configure the magnetometer (e.g., measurement mode, output rate)
            // Setting the mode to continuous measurement (0x00 for continuous mode)
            this.i2cBus.writeByteSync(this.address, 0x09, 0x00); // Continuous measurement
            this.i2cBus.writeByteSync(this.address, 0x08, 0x00); // Default mode (high-speed, no filtering)

            // Set output data rate to 10Hz (address 0x08, value 0x00 = 10Hz)
            this.i2cBus.writeByteSync(this.address, 0x08, 0x00);

            console.log("✅ Magnetometer initialized successfully.");
        } catch (error) {
            console.error("⚠️ Magnetometer Init Error:", error);
        }
    }

    startReading() {
        // Set up a 10Hz reading rate (100ms interval)
        this.readInterval = setInterval(() => {
            const data = this.readMagData();
            console.log("Magnetometer Data: ", data);
        }, 100); // 100ms = 10Hz
    }

    stopReading() {
        // Stop the reading loop
        if (this.readInterval) {
            clearInterval(this.readInterval);
            console.log("Stopped reading Magnetometer data.");
        }
    }

    readMagData() {
        try {
            // Read 6 bytes of magnetometer data (X, Y, Z axes)
            const buffer = Buffer.alloc(6);
            this.i2cBus.readI2cBlockSync(this.address, 0x00, 6, buffer);  // 0x00 is the data register

            // Read raw X, Y, Z data (12-bit values)
            const rawX = buffer.readInt16BE(0);
            const rawY = buffer.readInt16BE(2);
            const rawZ = buffer.readInt16BE(4);

            // Convert the raw values to the desired unit (usually in microtesla, uT)
            // Example scale factor for QMC5883L: 1 LSB = 0.92 microtesla (µT)
            const scaleFactor = 0.92;  // This is just an example and may vary for your sensor
            return {
                x: rawX * scaleFactor,
                y: rawY * scaleFactor,
                z: rawZ * scaleFactor
            };
        } catch (error) {
            console.error("⚠️ Magnetometer Read Error:", error);
            return { x: null, y: null, z: null };
        }
    }

    // Helper method to introduce a delay for stabilization
    _wait(ms) {
        const start = Date.now();
        while (Date.now() - start < ms) {
            // Blocking wait for 'ms' milliseconds
        }
    }
}

module.exports = Magnetometer;
