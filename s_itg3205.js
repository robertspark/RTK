// ITG3205 Gyroscope Sensor

const i2c = require('i2c-bus');

class ITG3205 {
    constructor(i2cBusNumber = 1, address = 0x68) {
        this.i2cBusNumber = i2cBusNumber;
        this.address = address;
        this.i2cBus = null;
    }

    async init() {
        try {
            this.i2cBus = await i2c.openPromisified(this.i2cBusNumber);

            // Power Management Register - Wake up the sensor
            await this.i2cBus.writeByte(this.address, 0x3E, 0x00);

            // Set DLPF (Digital Low Pass Filter) and sample rate divider
            await this.i2cBus.writeByte(this.address, 0x15, 0x07); // Sample Rate Divider
            await this.i2cBus.writeByte(this.address, 0x16, 0x1A); // DLPF 1 (42Hz) & Full Scale ±2000°/s

            console.log("ITG3205 initialized successfully.");
        } catch (error) {
            console.error("Error initializing ITG3205:", error);
        }
    }

    async readRawGyroData() {
        try {
            const buffer = Buffer.alloc(6);
            await this.i2cBus.readI2cBlock(this.address, 0x1D, 6, buffer);

            return {
                x: buffer.readInt16BE(0),
                y: buffer.readInt16BE(2),
                z: buffer.readInt16BE(4)
            };
        } catch (error) {
            console.error("Error reading gyro data:", error);
            return { x: 0, y: 0, z: 0 };
        }
    }

    async readGyroDPS() {
        try {
            const rawData = await this.readRawGyroData();
            const sensitivity = 14.375; // ITG3205 has 14.375 LSB per °/s

            return {
                x: rawData.x / sensitivity,
                y: rawData.y / sensitivity,
                z: rawData.z / sensitivity
            };
        } catch (error) {
            console.error("Error converting gyro data to DPS:", error);
            return { x: 0, y: 0, z: 0 };
        }
    }

    async readTemperature() {
        try {
            const buffer = Buffer.alloc(2);
            await this.i2cBus.readI2cBlock(this.address, 0x1B, 2, buffer);
            const tempRaw = buffer.readInt16BE(0);

            // Convert to degrees Celsius (as per ITG3205 datasheet)
            return (tempRaw + 13200) / 280;
        } catch (error) {
            console.error("Error reading temperature:", error);
            return null;
        }
    }

    async close() {
        try {
            if (this.i2cBus) {
                await this.i2cBus.close();
                this.i2cBus = null;
                console.log("I2C connection closed.");
            }
        } catch (error) {
            console.error("Error closing I2C connection:", error);
        }
    }
}
