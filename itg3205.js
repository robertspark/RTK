// ITG3205 Gyroscope Sensor

const i2c = require('i2c-bus');

class ITG3205 {
    constructor(i2cBusNumber = 1, address = 0x68) {
        this.i2cBus = i2c.openSync(i2cBusNumber);
        this.address = address;
        this.init();
    }

    init() {
        // Power Management Register - Wake up the sensor
        this.i2cBus.writeByteSync(this.address, 0x3E, 0x00);
        
        // Set DLPF (Digital Low Pass Filter) and sample rate divider
        this.i2cBus.writeByteSync(this.address, 0x15, 0x07); // Sample Rate Divider
        this.i2cBus.writeByteSync(this.address, 0x16, 0x1A); // DLPF 1 (42Hz) & Full Scale ±2000°/s
    }

    readRawGyroData() {
        const buffer = Buffer.alloc(6);
        this.i2cBus.readI2cBlockSync(this.address, 0x1D, 6, buffer);

        return {
            x: buffer.readInt16BE(0),
            y: buffer.readInt16BE(2),
            z: buffer.readInt16BE(4)
        };
    }

    readGyroDPS() {
        const rawData = this.readRawGyroData();
        const sensitivity = 14.375; // ITG3205 has 14.375 LSB per °/s

        return {
            x: rawData.x / sensitivity,
            y: rawData.y / sensitivity,
            z: rawData.z / sensitivity
        };
    }

    readTemperature() {
        const buffer = Buffer.alloc(2);
        this.i2cBus.readI2cBlockSync(this.address, 0x1B, 2, buffer);
        const tempRaw = buffer.readInt16BE(0);
        
        // Convert to degrees Celsius (as per ITG3205 datasheet)
        return (tempRaw + 13200) / 280;
    }

    close() {
        this.i2cBus.closeSync();
    }
}

// Example Usage
const gyro = new ITG3205();
setInterval(() => {
    console.log("Gyro (°/s):", gyro.readGyroDPS());
    console.log("Temp (°C):", gyro.readTemperature().toFixed(2));
}, 1000);
