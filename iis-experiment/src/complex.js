
    }

    abs () {
        return Math.sqrt(this.re * this.re + this.im * this.im);
    }

    static abs (c) {
        return c.abs();
    }

    absSq() {
        return this.re * this.re + this.im * this.im;
    }

    static absSq (c) {
        return c.absSq();
    }

    eq(c) {
        assert.ok(c instanceof Complex);
        const re = this.re - c.re;
        const im = this.im - c.im;
        return (re * re + im * im) < EPSILON;
    }

    static eq(c1, c2) {
        assert.ok(c1 instanceof Complex);
        assert.ok(c2 instanceof Complex);
        const re = c1.re - c2.re;
        const im = c1.im - c2.im;
        return (re * re + im * im) < EPSILON;
    }

    static distance(c1, c2) {
        assert.ok(c1 instanceof Complex);
        assert.ok(c2 instanceof Complex);
        return c1.sub(c2).abs();
    }

    sq () {
        return new Complex((this.re * this.re) - (this.im * this.im),
                           (this.re * this.im) + (this.im * this.re));
    }

    static sq(c) {
        return c.sq();
    }

    sqrt () {
        if (this.im > 0) {
            return new Complex(Math.sqrt(this.re + Math.sqrt(this.re * this.re +
                                                             this.im * this.im)) / SQRT2,
                               Math.sqrt(-this.re + Math.sqrt(this.re * this.re +
                                                              this.im * this.im)) / SQRT2);
        } else if (this.i < 0) {
            return new Complex(Math.sqrt(this.re + Math.sqrt(this.re * this.re + this.im * this.im)) / SQRT2,
                               -Math.sqrt(-this.re + Math.sqrt(this.re * this.re + this.im * this.im)) / SQRT2);
        }

        if (this.re < 0) {
            return new Complex(0, Math.sqrt(Math.abs(this.re)));
        }

        return new Complex(Math.sqrt(this.re), 0);
    }

    static sqrt(c) {
        return c.sqrt();
    }

    isInfinity() {
        return (this.re === Number.POSITIVE_INFINITY || this.im === Number.POSITIVE_INFINITY);
    }

    isZero() {
        return (Math.abs(this.re) < EPSILON && Math.abs(this.im) < EPSILON);
    }

    isReal () {
        return Math.abs(this.im) < EPSILON;
    }

    isPureImaginary () {
        return Math.abs(this.re) < EPSILON;
    }

    hasNaN () {
        return isNaN(this.re) || isNaN(this.im);
    }

    get linearArray () {
        return [this.re, this.im];
    }

    static get ZERO() {
        return new Complex(0, 0);
    }

    static get ONE() {
        return new Complex(1, 0);
    }

    static get I() {
        return new Complex(0, 1);
    }

    static get MINUS_ONE() {
        return new Complex(-1, 0);
    }

    static get INFINITY() {
        return new Complex(Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY);
    }
}
