'use strict';

const auth = require('./auth');
const qs = require('qs');

/**
 * API client
 *
 * @param {object} config - Configuration options
 * @param {object} config.key - Object with public/private API key pair
 * @param {string} config.key.public - Public API key
 * @param {string} config.key.private - Private API key
 * @param {array} [config.locales] - Default array of locale codes to include in the `Accept-Language` header
 * @param {array} [config.phases] - Default array of phases (0-4) to filter Entries by
 * @param {string} config.project - Project ID
 * @param {string} [config.user] - User ID or authentication token
 * @param {object} http - HTTP object instance
 */
function API(config, http) {
  this.config = config;
  this.http = http.client;
}

API.prototype = {

  /***************************************************************
  * Public methods
  ****************************************************************/

  /**
   * Send a GET request.
   * @param {string} path - API endpoint path
   * @param {object} [config] - API request configuration object
   * @return {Promise}
   */
  get(path, options) {
    options = options && typeof options == 'object' ? options : {};
    return this._sendRequest(Object.assign(options, { method: 'get', url: path }));
  },

  /**
   * Alias of the `post` method
   * @return {Promise}
   */
  create(path, options) {
    return this.post(path, options);
  },

  /**
   * Send a POST request.
   * @param {string} path - API endpoint path
   * @param {object} [config] - API request configuration object
   * @return {Promise}
   */
  post(path, options) {
    options = options && typeof options == 'object' ? options : {};
    return this._sendRequest(Object.assign(options, { method: 'post', url: path }));
  },

  /**
   * Alias of the `put` method
   * @return {Promise}
   */
  update(path, options) {
    return this.put(path, options);
  },

  /**
   * Send a PUT request.
   * @param {string} path - API endpoint path
   * @param {object} [config] - API request configuration object
   * @return {Promise}
   */
  put(path, options) {
    options = options && typeof options == 'object' ? options : {};
    return this._sendRequest(Object.assign(options, { method: 'put', url: path }));
  },

  /**
   * Send a DELETE request.
   * @param {string} path - API endpoint path
   * @param {object} [config] - API request configuration object
   * @return {Promise}
   */
  delete(path, options) {
    options = options && typeof options == 'object' ? options : {};
    return this._sendRequest(Object.assign(options, { method: 'delete', url: path }));
  },

  /***************************************************************
  * Private methods
  ****************************************************************/

  async _sendRequest(options) {
    const req = this._buildRequest(options);
    const res = await this.http.request(req);
    const txn = this._buildResult(res, options);

    if (this.config.http.logging) {
      this._logResult(txn);
    }

    if (txn.err) {
      throw txn.err;
    }

    if (options.first === true && txn.res.data && Array.isArray(txn.res.data.index)) {
      txn.res.data = txn.res.data.index.length ? txn.res.data.index[0] : null;
    }

    return txn.res;
  },

  _buildRequest(options) {
    const req = {
      headers: {},
      method: options.method,
      url: options.url && typeof options.url == 'string' ? options.url.trim() : ''
    };

    if (['post', 'put'].includes(req.method)) {
      if (!options.data || typeof options.data != 'object') {
        throw new Error('Missing or invalid `data` property in request configuration object');
      }

      req.data = options.data;
    }

    if (!req.url || req.url.startsWith('http')) {
      throw new Error('Invalid API endpoint path. Examples: `/entries`, `/geo/feature/types`');
    }

    if (!req.url.startsWith('/')) {
      req.url = '/' + req.url;
    }

    if (req.url.endsWith('/')) {
      req.url = req.url.slice(0, req.url.length - 1);
    }

    const locales = Array.isArray(options.locales) ? options.locales : this.config.locales;
    const user = typeof options.user == 'string' ? options.user : this.config.user;

    req.params = options.params && typeof options.params == 'object' ? options.params : {};
    req.headers['Accept-Language'] = locales.map(loc => loc.trim()).join();
    req.headers.Authorization = auth(this.config.key, (req.data || null), user);

    if (options.headers && typeof options.headers == 'object') {
      req.headers = Object.assign(req.headers, options.headers);
    }

    if (req.url === '/entries' && !req.params.phase && this.config.phases.length) {
      req.params.phase = this.config.phases.join();
    }

    return req;
  },

  _buildResult(res, options) {
    function Request(obj) {
      const req = obj.config;

      this.config = options;

      this.headers = req.headers || {};
      for (const k in this.headers) {
        this.headers[k.toLowerCase()] = this.headers[k];
        delete this.headers[k];
      }

      this.data = req.data || null;
      this.method = req.method.toUpperCase();
      this.params = req.params || null;
      this.url = req.url;
    }

    function RequestError(obj) {
      const { id, data = null } = obj.data.error || {};
      const txt = id ? JSON.stringify({ id, data }) : 'unknown';

      this.message = `API error: ${txt}`;
      this.id = id || 'unknown';
      this.data = data;
      this.code = obj.status;
      this.headers = {};

      if (obj.headers['X-Usage-Limit-Info']) {
        this.headers['X-Usage-Limit-Info'] = obj.headers['X-Usage-Limit-Info'];
      }

      if (obj.headers['X-Usage-Limit-Time']) {
        this.headers['X-Usage-Limit-Time'] = obj.headers['X-Usage-Limit-Time'];
      }
    }

    function Response(obj) {
      this.headers = obj.headers;
      this.status = obj.status;

      const body = obj.data && typeof obj.data == 'object' ? obj.data : {};
      this.data = body.data && typeof body.data == 'object' ? body.data : body;
    }

    const txn = {
      err: res.status > 304 ? new RequestError(txn.res) : null,
      req: new Request(res),
      res: new Response(res)
    };

    return txn;
  },

  _logResult(txn) {
    let uri = txn.req.url.replace(this.config.http.baseURL, '');

    let params = '';
    if (txn.req.params && Object.keys(txn.req.params).length) {
      params = qs.stringify(txn.req.params, {
        encode: false,
        sort: (a, b) => a.localeCompare(b)
      });
    }

    uri += params ? `?${params}` : '';

    if (txn.req.data && txn.req.data.pwd) {
      txn.req.data.pwd = '***********';
    }

    console.group(`${txn.req.method} ${uri} (${txn.res.status})`);

    if (txn.err) {
      console.error(txn.err);
    } else {
      console.info(txn.req);
      console.info(txn.res);
    }

    console.groupEnd();
  }

};

module.exports = API;
