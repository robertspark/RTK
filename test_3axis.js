async function readSensors() {
    try {
        if (!accelerometer || !gyroscope || !magnetometer) {
            console.log("Sensors not initialized");
            return;
        }

        const accel = await accelerometer.readAcceleration();
        const gyro = await gyroscope.readGyroDPS();
        const mag = await magnetometer.readMicroTesla();

        console.log("Accelerometer:", accel);
        console.log("Gyroscope:", gyro);
        console.log("Magnetometer:", mag);
    } catch (error) {
        console.error("Sensor Read Error:", error);
    }
}
setInterval(readSensors, 1000);
