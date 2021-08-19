'use strict';

const H = require('jshashes');

/**
 * Generate an Authorization header for an Elebase API request using the Basic method.
 *
 * @param {string} token - API token
 * @param {object} [data] - Object to be encoded as JSON and sent in the request body
 * @param {string} [user] - User ID or authentication token
 *
 * @return {string}
 */
const basic = (token, data = null, user = null) => {
  if (!token) return '';

  data = data ? JSON.stringify(data) : null;
  user = typeof user == 'string' ? user : '';

  const b64 = new H.Base64();
  const hash = b64.encode(`${user}:${token}`);

  return `Basic ${hash}`;
};

/**
 * Generate an Authorization header for an Elebase API request using the HMAC method.
 *
 * @param {object} key - Object with `public` and `private` API keys
 * @param {string} key.public - Public API key
 * @param {string} key.private - Private API key
 * @param {object} [data] - Object to be encoded as JSON and sent in the request body
 * @param {string} [user] - User ID or authentication token
 *
 * @return {string}
 */
const hmac = (key, data = null, user = null) => {
  if (!key.public || !key.private) return '';

  data = data ? JSON.stringify(data) : null;
  user = typeof user == 'string' ? user : '';

  const time = Math.round(Date.now() / 1000).toString();
  const sha256 = new H.SHA256();
  const hash = sha256.hex_hmac(key.private, data !== null ? data + time : time);

  return 'Elebase ' + [key.public, hash, time, user].filter(s => s).join(':');
};

module.exports = { basic, hmac };
