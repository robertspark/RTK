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
        // Set control registers for continuous measurement mode
        this.i2cBus.writeByteSync(this.address, 0x0B, 0x01); // Control Register 2: Soft reset
        this.i2cBus.writeByteSync(this.address, 0x09, 0x1D); // Control Register 1: 200Hz, Full Scale, Continuous Mode
        this.i2cBus.writeByteSync(this.address, 0x0A, 0x00); // Set Reset Period Register
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

    // Convert raw values to microteslas (adjust
