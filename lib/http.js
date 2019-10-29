'use strict';

const axios = require('axios');
const pkg = require('../package.json');
const qs = require('qs');

/**
 * HTTP client
 *
 * @param {object} [options] - Configuration options
 * @param {object} [options.headers] - Default HTTP headers to include with each request
 * @param {number} [options.timeout] - Number of milliseconds to wait before aborting a request
 */
function HTTP(options) {
  const headers = options.headers && typeof options.headers == 'object' ? options.headers : {};

  const config = {
    baseURL: options.baseURL,
    headers: Object.assign({}, headers, { Accept: 'application/json' }),
    httpAgent: false,
    httpsAgent: false,
    paramsSerializer: qs.stringify,
    timeout: options.timeout,
    validateStatus: false
  };

  if (typeof window == 'undefined') {
    config.headers['User-Agent'] = `elebase/js-sdk/${pkg.version}`;
  }

  this.client = axios.create(config);
}

module.exports = HTTP;
