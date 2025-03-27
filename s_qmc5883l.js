// QMC5883L Magnetometer Sensor

const i2c = require('i2c-bus');

class QMC5883L {
    constructor(i2cBus = 1, address = 0x0D) {
        this.i2cBus = i2c.openSync(i2cBus);
        this.address = address;
        this.init();
    }

    // Initialize the QMC5883L sensor
    init() {
        // Soft reset
        this.i2cBus.writeByteSync(this.address, 0x0B, 0x01);
        // Set control register 1: 200Hz output rate, full-scale ±8 Gauss, continuous mode
        this.i2cBus.writeByteSync(this.address, 0x09, 0x1D);
        // Set reset period register (recommended value)
        this.i2cBus.writeByteSync(this.address, 0x0A, 0x01);
    }

    // Read raw magnetometer values
    readRawData() {
        const buffer = Buffer.alloc(6);
        this.i2cBus.readI2CBlockSync(this.address, 0x00, 6, buffer);

        return {
            x: buffer.readInt16LE(0),
            y: buffer.readInt16LE(2),
            z: buffer.readInt16LE(4)
        };
    }

    // Convert raw values to microteslas (scale factor ~12000 LSB/Gauss)
    readMicroTesla() {
        const raw = this.readRawData();
        const scale = 1.0 / 12000; // Approximate conversion factor

        return {
            x: raw.x * scale,
            y: raw.y * scale,
            z: raw.z * scale
        };
    }

    close() {
        this.i2cBus.closeSync();
    }
}

module.exports = QMC5883L;
