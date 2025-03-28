const ADXL345 = require('./s_adxl345');
const sensor = new ADXL345();
sensor.init();
setInterval(() => {
    console.log(sensor.readAcceleration());
}, 1000);
