const i2c = require('i2c-bus');

cconst i2c = require('i2c-bus');

class ITG3205 {
    constructor(busNumber = 1, address = 0x68) {
        this.busNumber = busNumber;
        this.address = address;
        this.i2cBus = i2c.openSync(this.busNumber);
    }

    init() {
        try {
            console.log("Initializing ITG3205...");

            // Reset device (0x3E = reset register, 0x80 = reset command)
            this.i2cBus.writeByteSync(this.address, 0x3E, 0x80);
            this._wait(100);  // Wait for the sensor to reset

            // Wake up the sensor (0x3E = reset register, 0x00 = wake up command)
            this.i2cBus.writeByteSync(this.address, 0x3E, 0x00);
            this._wait(100);  // Allow sensor to stabilize

            // Set full-scale range to ±2000°/s (0x16 = scale register, 0x18 = ±2000dps)
            this.i2cBus.writeByteSync(this.address, 0x16, 0x18);

            // Set sample rate to 1kHz (0x15 = sample rate register, 0x07 = rate)
            this.i2cBus.writeByteSync(this.address, 0x15, 0x07);

            console.log("✅ ITG3205 initialized successfully.");
        } catch (error) {
            console.error("⚠️ ITG3205 Init Error:", error);
        }
    }

    startReading() {
        // Set up a 10Hz reading rate (100ms interval)
        this.readInterval = setInterval(() => {
            const data = this.readGyroDPS();
            console.log("Gyroscope Data: ", data);
        }, 100); // 100ms = 10Hz
    }

    stopReading() {
        // Stop the reading loop
        if (this.readInterval) {
            clearInterval(this.readInterval);
            console.log("Stopped reading ITG3205 data.");
        }
    }

    readGyroDPS() {
        try {
            const buffer = Buffer.alloc(6);
            this.i2cBus.readI2cBlockSync(this.address, 0x1D, 6, buffer);  // 0x1D is the data register

            const rawX = buffer.readInt16BE(0);
            const rawY = buffer.readInt16BE(2);
            const rawZ = buffer.readInt16BE(4);

            // Convert raw values to degrees per second (dps)
            const scaleFactor = 14.375;  // For ±2000dps
            return {
                x: rawX / scaleFactor,
                y: rawY / scaleFactor,
                z: rawZ / scaleFactor
            };
        } catch (error) {
            console.error("⚠️ ITG3205 Read Error:", error);
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

module.exports = ITG3205;
