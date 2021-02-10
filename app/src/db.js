// To be converted into a redis store sometime
const clone = require('clone');
const logger = require('./logger');

let store = {};

const set = (key, value) => {
    logger.debug(`db - setting ${key}: ${value}`)
    store[key] = clone(value);
    return new Promise((resolve, reject) => resolve());
}

const get = (key) => {
    const value = store[key] ? clone(store[key]) : null;
    logger.debug(`db - getting ${key}: ${value}`);
    return new Promise((resolve, reject) => resolve(value));
}

const del = (key) => {
    logger.debug(`db - deleting key ${key}`);
    store[key] = null;
     return new Promise((resolve, reject) => resolve());
}

module.exports = {
    set,
    get,
    del
};