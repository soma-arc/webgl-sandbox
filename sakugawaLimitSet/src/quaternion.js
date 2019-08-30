export default class Quaternion {
    /**
     *
     * @param {number} re
     * @param {number} i
     * @param {number} j
     * @param {number} k
     */
    constructor(re, i, j, k) {
        this.re = re;
        this.i = i;
        this.j = j;
        this.k = k;
    }

    /**
     *
     * @param {Quaternion} q
     * @returns {Quaternion}
     */
    add(q) {
        return new Quaternion(this.re + q.re,
                              this.i + q.i,
                              this.j + q.j,
                              this.k + q.k);
    }

    /**
     *
     * @param {Quaternion} q
     * @returns {Quaternion}
     */
    sub(q) {
        return new Quaternion(this.re - q.re,
                              this.i - q.i,
                              this.j - q.j,
                              this.k - q.k);
    }

    /**
     *
     * @param {Quaternion} q
     * @returns {Quaternion}
     */
    mult(q) {
        if (this.isZero() || q.isZero()) return Quaternion.ZERO;
        if(this.isInfinity() || q.isInfinity) return Quaternion.INFINITY;

        return new Quaternion(this.re * q.re - this.i * q.i  - this.j * q.j  - this.k * q.k, 
                              this.re * q.i  + this.i * q.re + this.j * q.k  - this.k * q.j, 
                              this.re * q.j  - this.i * q.k  + this.j * q.re + this.k * q.i, 
                              this.re * q.k  + this.i * q.j  - this.j * q.i  + this.k * q.re);
    }

    scale(k) {
        if(this.isInfinity() || k === Number.POSITIVE_INFINITY) return Number.POSITIVE_INFINITY;
		return new Quaternion(this.re * k, this.i * k, this.j * k, this.k * k);
    }

    div(k) {
        if (k === Number.POSITIVE_INFINITY || (k === 0 && this.isZero())) return Quaternion.ZERO;
        else if (k === 0) return Quaternion.INFINITY;
        return new Quaternion(this.re / k, this.i / k, this.j / k, this.k / k);
    }

    isZero() {
        return this.re === 0 &&
            this.i === 0 &&
            this.j === 0 &&
            this.k === 0;
    }

    isInfinity() {
        return this.re === Number.POSITIVE_INFINITY ||
            this.i === Number.POSITIVE_INFINITY ||
            this.j === Number.POSITIVE_INFINITY ||
            this.k === Number.POSITIVE_INFINITY;
    }

    cliffordTransposition() {
        return new Quaternion(this.re, this.i, this.j, -this.k);        
    }

    conjugation() {
        return new Quaternion(this.re, -this.i, -this.j, -this.k);
    }

    abs() {
        return this.re * this.re + this.i * this.i + this.j * this.j + this.k * this.k;
    }

    norm() {
        if(this.isInfinity()) return Number.POSITIVE_INFINITY;
        return Math.sqrt(this.re * this.re + this.i * this.i + this.j * this.j + this.k * this.k);
    }

    inverse() {
        const v = Math.pow(this.norm(), 2);
        if(v === Number.POSITIVE_INFINITY) return Quaternion.ZERO;
        else if (v === 0) return Quaternion.INFINITY;
        return this.conjugation().div(v);
    }

    //純虚四元数p = b1i + c1j + d1k と q = b2i + c2j + d2kに対して
	//p.q = b1b2 + c1c2 + d1d2
	//pxq = (c1d2 - d1c2)i + (d1b2 - b1d2)j + (b1c2 - c1b2)k
    vectorDot(q) {
        return this.i * q.i + this.j * q.j + this.k * q.k;
    }

    vectorCross(q) {
        return new Quaternion(0,
                              this.j*q.k - this.k*q.j,
                              this.k*q.i - this.i*q.k,
                              this.i*q.j - this.j*q.i);
    }

    static get ZERO() {
        return new Quaternion(0, 0, 0, 0);
    }

    static get ONE() {
        return new Quaternion(1, 0, 0, 0);
    }

    static get I () {
        return new Quaternion(0, 1, 0, 0);
    }

    static get INFINITY() {
        return new Quaternion(Number.POSITIVE_INFINITY,
                              Number.POSITIVE_INFINITY,
                              Number.POSITIVE_INFINITY,
                              Number.POSITIVE_INFINITY);
    }
}
