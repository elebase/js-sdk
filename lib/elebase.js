'use strict';

const API = require('./api');
const HTTP = require('./http');

const API_VERSIONS = ['v1'];
const ENTRY_PHASES = [0, 1, 2, 3, 4];

/**
 * Initialize and return an Elebase Project API client object.
 *
 * @param {object} [config] - Configuration options
 * @param {object} [config.http] - HTTP client configuration
 * @param {object} [config.http.headers] - Default HTTP headers to include with each request
 * @param {number} [config.http.timeout=20000] - Number of milliseconds to wait before aborting a request (default: `20000`)
 * @param {boolean} [config.http.logging=true] - Enable/disable HTTP logging
 * @param {object} [config.key] - Object with `public` and `private` API keys (required if `config.token` is not provided)
 * @param {string} [config.key.public] - Public API key
 * @param {string} [config.key.private] - Private API key
 * @param {array} [config.locales] - Default array of locale codes to include in the `Accept-Language` header of each request
 * @param {array} [config.phases] - Default array of phases (0-4) by which to filter entries
 * @param {string} [config.project] - Project ID (only required for the Project API)
 * @param {string} [config.token] - API token (required if `config.key` is not provided)
 * @param {string} [config.user] - Default User ID or authentication token to include in the `Authorization` header of each request
 * @param {string} [config.version] - API version (default: `v1`)
 *
 * @return {API} - API client object
 */
const createAPIClient = (config, target = 'api') => {
  config = config || {};

  if (config.version && !API_VERSIONS.includes(config.version)) {
    throw new Error('Unknown or unsupported API version in API client config');
  }

  if (target === 'api') {
    if (!config.key && !config.token) {
      throw new Error('Missing API key/token in API client config');
    }

    if (!config.token && (!config.key.public || !config.key.private)) {
      throw new Error('Missing public and/or private API keys in API client config');
    }

    if (!config.project || typeof config.project != 'string') {
      throw new Error('Missing or invalid project ID in API client config');
    }
  }

  if (target === 'geo' && !config.token) {
    throw new Error('Missing API token in API client config');
  }

  if (Array.isArray(config.phases)) {
    if (!config.phases.every(p => ENTRY_PHASES.includes(p))) {
      throw new Error('Invalid Entry phase in API client config');
    }

    config.phases = [...config.phases].sort();
  }

  config.version = config.version || 'v1';
  config.http = config.http && typeof config.http == 'object' ? config.http : {};
  config.http.baseURL = target === 'geo' ? 'https://geo.elebase.io' : `https://cdn.elebase.io/${config.project}/${config.version}`;
  config.http.logging = config.http.logging === true;
  config.http.timeout = Number(config.http.timeout);
  config.http.timeout = !Number.isNaN(config.http.timeout) ? Math.max(config.http.timeout, 0) : 20000;
  config.locales = Array.isArray(config.locales) ? config.locales : [];
  config.phases = Array.isArray(config.phases) ? config.phases : [];
  config.target = target;
  config.user = config.user && typeof config.user == 'string' ? config.user : null;

  return new API(config, new HTTP(config.http));
};

module.exports = {
  api: config => createAPIClient(config, 'api'),
  fn: { auth: require('./auth') },
  geo: config => createAPIClient(config, 'geo')
};
