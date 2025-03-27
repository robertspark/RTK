// ADXL345 Accelerometer Sensor

const i2c = require('i2c-bus');

class ADXL345 {
    constructor(i2cBus = 1, address = 0x53) {
        this.i2cBus = i2cBus;
        this.address = address;
        this.init();
    }

    // Initialize the sensor
    init() {
        this.i2c.writeByteSync(this.address, 0x2D, 0x08); // Enable measurement mode
        this.i2c.writeByteSync(this.address, 0x31, 0x0B); // Set data format (Full resolution, ±16g)
    }

    // Read raw acceleration data
    readRawData() {
        const buffer = Buffer.alloc(6);
        this.i2c.readI2cBlockSync(this.address, 0x32, 6, buffer);
        
        return {
            x: buffer.readInt16LE(0),
            y: buffer.readInt16LE(2),
            z: buffer.readInt16LE(4)
        };
    }

    // Convert raw data to g-forces
    readAcceleration() {
        const raw = this.readRawData();
        const scaleFactor = 0.0039; // ±16g, 13-bit mode (3.9 mg/LSB)

        return {
            x: raw.x * scaleFactor,
            y: raw.y * scaleFactor,
            z: raw.z * scaleFactor
        };
    }

    // Close the I2C connection
    close() {
        this.i2c.closeSync();
    }
}

module.exports = ADXL345;
