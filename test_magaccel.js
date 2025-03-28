const ADXL345 = require('./s_adxl345.js');
const QMC5883L = require('./s_qmc5883l.js');

async function testSensors() {
    const accel = new ADXL345();
    await accel.init();
    console.log(await accel.readAcceleration());

    const mag = new QMC5883L();
    await mag.init();
    console.log(await mag.readRawData());
}

testSensors();
