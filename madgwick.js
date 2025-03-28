class Madgwick {
    constructor(beta = 0.1, sampleFreq = 100) {
        this.beta = beta;
        this.sampleFreq = sampleFreq;
        this.q = [1.0, 0.0, 0.0, 0.0]; // Quaternion
    }

    update(ax, ay, az, gx, gy, gz, mx, my, mz) {
        let q1 = this.q[0], q2 = this.q[1], q3 = this.q[2], q4 = this.q[3];

        const radPerSec = Math.PI / 180;
        gx *= radPerSec;
        gy *= radPerSec;
        gz *= radPerSec;

        const recipNorm = Math.sqrt(ax * ax + ay * ay + az * az);
        if (recipNorm === 0) return;
        ax /= recipNorm;
        ay /= recipNorm;
        az /= recipNorm;

        const mxNorm = Math.sqrt(mx * mx + my * my + mz * mz);
        if (mxNorm === 0) return;
        mx /= mxNorm;
        my /= mxNorm;
        mz /= mxNorm;

        const _2q1mx = 2.0 * q1 * mx;
        const _2q1my = 2.0 * q1 * my;
        const _2q1mz = 2.0 * q1 * mz;
        const _2q2mx = 2.0 * q2 * mx;
        const _2bx = Math.sqrt((_2q1mx + q3 * my - q4 * mz) ** 2 + (_2q1my + q4 * mx - q2 * mz) ** 2);
        const _2bz = Math.sqrt((_2q1mz + q2 * my - q3 * mx) ** 2);

        const s1 = -2.0 * (q3 * (2.0 * q2 * q4 - _2q1my) - q2 * (2.0 * q1 * q2 + _2q1mx) - q1 * (_2bx * (0.5 - q3 * q3 - q4 * q4) + _2bz * (q2 * q4 - q1 * q3))) + gx;
        const s2 = 2.0 * (q4 * (2.0 * q2 * q4 - _2q1my) - q1 * (2.0 * q1 * q2 + _2q1mx) + q2 * (_2bx * (0.5 - q2 * q2 - q4 * q4) + _2bz * (q1 * q4 - q2 * q3))) + gy;
        const s3 = -2.0 * (q1 * (2.0 * q1 * q2 + _2q1mx) + q2 * (_2bx * (q2 * q3 - q1 * q4) + _2bz * (q1 * q2 + q3 * q4)) - q3 * (_2bx * (q1 * q3 + q2 * q4) - _2bz * (0.5 - q1 * q1 - q2 * q2))) + gz;
        const s4 = 2.0 * (q2 * (2.0 * q1 * q2 + _2q1mx) - q1 * (_2bx * (q1 * q4 - q2 * q3) - _2bz * (0.5 - q2 * q2 - q3 * q3)) + q4 * (_2bx * (q2 * q4 - q1 * q3) + _2bz * (q1 * q2 + q3 * q4)));

        const norm = 1.0 / Math.sqrt(s1 * s1 + s2 * s2 + s3 * s3 + s4 * s4);
        this.q = [q1 - this.beta * s1 * norm, q2 - this.beta * s2 * norm, q3 - this.beta * s3 * norm, q4 - this.beta * s4 * norm];

        return this.q;
    }
}

module.exports = Madgwick;
