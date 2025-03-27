// ADXL345 Accelerometer Sensor

const i2c = require('i2c-bus');

class ADXL345 {
    constructor(i2cBus = 1, address = 0x53) {
        this.i2cBus = i2cBus;
        this.address = address;

        try {
            this.i2c = i2c.openSync(i2cBus);
        } catch (error) {
            console.error("Error opening I2C bus:", error);
            this.i2c = null; // Ensure we don't try using an invalid instance
        }
    }

    init() {
        if (!this.i2c) {
            console.error("I2C bus not initialized.");
            return;
        }

        try {
            this.i2c.writeByteSync(this.address, 0x2D, 0x08); // Enable measurement mode
            this.i2c.writeByteSync(this.address, 0x31, 0x0B); // Set data format (Full resolution, ±16g)
        } catch (error) {
            console.error("Error initializing ADXL345:", error);
        }
    }

    readAcceleration() {
        if (!this.i2c) {
            console.error("I2C bus not initialized.");
            return { x: 0, y: 0, z: 0 };
        }

        try {
            const buffer = Buffer.alloc(6);
            this.i2c.readI2cBlockSync(this.address, 0x32, 6, buffer);
            
            const scaleFactor = 0.0039;
            return {
                x: buffer.readInt16LE(0) * scaleFactor,
                y: buffer.readInt16LE(2) * scaleFactor,
                z: buffer.readInt16LE(4) * scaleFactor
            };
        } catch (error) {
            console.error("Error reading acceleration data:", error);
            return { x: 0, y: 0, z: 0 };
        }
    }

    close() {
        if (this.i2c) {
            this.i2c.closeSync();
        }
    }
}

module.exports = ADXL345;
