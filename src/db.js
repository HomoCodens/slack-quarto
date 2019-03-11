// To be converted into a redis store sometime

let store = {};

const set = (key, value) => {
    store[key] = value;
    console.log(JSON.stringify(store, null, 2));
    return new Promise((resolve, reject) => resolve());
}

const get = (key) => new Promise((resolve, reject) => resolve(store[key] ? store[key] : null));

const del = (key) => {
    store[key] = null;
    console.log(JSON.stringify(store, null, 2));
    return new Promise((resolve, reject) => resolve());
}

module.exports = {
    set,
    get,
    del
};