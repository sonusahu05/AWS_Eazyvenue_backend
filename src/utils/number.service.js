function getSequentialRange(from, count) {
    return Array.from(Array(count), (x, i) => i + from);
}

function random(min, max) {
    return Math.random() * (max - min) + min;
}

function randomInt(max) {
    return Math.floor(Math.random() * max);
}

module.exports = {
    getSequentialRange,
    random,
    randomInt,
};