// QMC5883L Magnetometer Sensor

const i2c = require('i2c-bus');

class QMC5883L {
    constructor(i2cBusNumber = 1, address = 0x0D) {
        this.i2cBusNumber = i2cBusNumber;
        this.address = address;
        this.i2cBus = null;
    }

    // Initialize the I2C connection and configure the sensor
    async init() {
        try {
            this.i2cBus = await i2c.openPromisified(this.i2cBusNumber);
            
            // Soft reset
            await this.i2cBus.writeByte(this.address, 0x0B, 0x01);
            // Set control register 1: 200Hz, full-scale ±8 Gauss, continuous mode
            await this.i2cBus.writeByte(this.address, 0x09, 0x1D);
            // Set reset period register (recommended value)
            await this.i2cBus.writeByte(this.address, 0x0A, 0x01);
            
            console.log('QMC5883L initialized successfully.');
        } catch (error) {
            console.error('Error initializing QMC5883L:', error);
        }
    }

    // Read raw magnetometer values
    async readRawData() {
        try {
            const buffer = Buffer.alloc(6);
            await this.i2cBus.readI2CBlock(this.address, 0x00, 6, buffer);

            return {
                x: buffer.readInt16LE(0),
                y: buffer.readInt16LE(2),
                z: buffer.readInt16LE(4)
            };
        } catch (error) {
            console.error('Error reading QMC5883L data:', error);
            return { x: 0, y: 0, z: 0 };
        }
    }

    // Convert raw values to microteslas
    async readMicroTesla() {
        const raw = await this.readRawData();
        const scale = 1.0 / 12000; // Approximate conversion factor

        return {
            x: raw.x * scale,
            y: raw.y * scale,
            z: raw.z * scale
        };
    }

    // Close the I2C connection
    async close() {
        if (this.i2cBus) {
            try {
                await this.i2cBus.close();
                console.log('QMC5883L sensor connection closed.');
            } catch (error) {
                console.error('Error closing QMC5883L connection:', error);
            }
        }
    }
}

module.exports = QMC5883L;
