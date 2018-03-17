window.addEventListener('load', () => {
    console.log('hello');
    abc(1, 2, "3");
    abc(1, 2, 3);
});


/**
 * 
 * @param {Number} a
 * @param {Number} b
 * @param {String} c
 */
function abc(a, b, c) {
    return a + b;
}
