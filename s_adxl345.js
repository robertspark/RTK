const i2c = require('i2c-bus');

class ADXL345 {
    constructor(i2cBus = 1, address = 0x53) {
        this.i2cBus = i2cBus;
        this.address = address;
        this.i2c = null;
    }

    async init() {
        let attempts = 0;
        const maxAttempts = 3;

        while (attempts < maxAttempts) {
            try {
                if (!this.i2c) {
                    this.i2c = await i2c.openPromisified(this.i2cBus);
                }

                // Enable measurement mode (0x2D is the power control register)
                await this.i2c.writeByte(this.address, 0x2D, 0x08);
                console.log("ADXL345 Measurement mode enabled.");

                // Set data format (Full resolution, ±16g)
                await this.i2c.writeByte(this.address, 0x31, 0x0B);
                console.log("ADXL345 Data format set: Full resolution, ±16g");

                return; // Exit loop if successful
            } catch (error) {
                console.error(`Error initializing ADXL345 (Attempt ${attempts + 1}):`, error);
                attempts++;
                await new Promise((resolve) => setTimeout(resolve, 500)); // Wait before retrying
            }
        }
    }

    async readAcceleration() {
        try {
            const buffer = Buffer.alloc(6);
            await this.i2c.readI2cBlock(this.address, 0x32, 6, buffer);

            const scaleFactor = 0.00390625; // 1g = 256 counts
            const x = buffer.readInt16LE(0) * scaleFactor;
            const y = buffer.readInt16LE(2) * scaleFactor;
            const z = buffer.readInt16LE(4) * scaleFactor;

            console.log(`ADXL345 Raw Acceleration: X=${x}, Y=${y}, Z=${z}`);
            return { x, y, z };
        } catch (error) {
            console.error("Error reading ADXL345 acceleration data:", error);
            return { x: 0, y: 0, z: 0 };
        }
    }

    async close() {
        if (this.i2c) {
            await this.i2c.close();
            console.log("ADXL345 I2C connection closed.");
        }
    }
}

module.exports = ADXL345;
