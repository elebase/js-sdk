## Elebase JavaScript Development Kit
An isomorphic API client and development kit for the [Elebase](https://elebase.io) platform.

### Installation

#### NPM

``` bash
npm install @elebase/sdk --save
```

#### Yarn

``` bash
yarn add @elebase/sdk
```

### Usage

This package can be used in web browsers and Node.js environments.

*N.B. A module bundler such as [Webpack](https://webpack.js.org/) is required for use in a web browser.*

#### Importing the library

``` javascript
const ele = require('@elebase/sdk');
```

#### Creating API Client Instances

Create an instance of the Project API client:
``` javascript
const projectAPI = ele.api({
  key: { public: 'PUBLIC API KEY', private: 'PRIVATE API KEY' },
  locales: ['en', 'es', 'fr'],
  phases: [4],
  project: 'PROJECT ID',
  user: 'USER ID'
});
```

Create an instance of the Geo Tools API client:
``` javascript
const geoAPI = ele.geo({ token: 'API TOKEN' });
```

Both the `ele.api()` and `ele.geo()` functions accept an API client configuration object with the properties described in the table below.

Property | Type | Description | Required
---------|------|-------------|:--------:
http | object | An HTTP client configuration object with the following optional properties: <br><ul><li>`headers`: an object with HTTP headers to include with each API request</li><li>`timeout`: the number of milliseconds to wait before aborting an API request (default: `20000`)</li><li>`logging`: a boolean indicating whether or not verbose HTTP request/response logging should be enabled (default: `false`)</li></ul>
key | object | An object with `public` and `private` API keys. These keys can be generated and retrieved from the [API Keys screen](https://app.elebase.io/keys) of the web app. *Note: API keys with `POST`, `PUT`, and/or `DELETE` privileges should never be exposed in client-side code. It's also good practice to never commit them to a remote code repository (even if the repository is private). Instead, the keys can be defined as environment variables and made available in server-side code via Node's `process.env` object using a package like [dotenv](https://www.npmjs.com/package/dotenv).* **This setting is required if `token` is not defined.** |
locales | array | An array of locale codes to include in the `Accept-Language` header of each API request. See the [Localization section](https://elebase.io/learn/api#localization) of the API documentation for more details. |
phases | array | An array of integers representing the phases to filter Entries by. For example, if this configuration option is set to `[4]`, each `GET /entries` request will automatically include a `phase` parameter in the URL with a value of `4`. This can be overridden on a per-request basis. For more details on the `phase` parameter, see the description in [this table](https://elebase.io/learn/api/entries#retrieve-entries).
project | string | The ID of an Elebase Project. | ✓
token | string | An API token. An API token can be generated for any existing API key via the [API Keys screen](https://app.elebase.io/keys) of the web app. *Note: API tokens with `POST`, `PUT`, and/or `DELETE` privileges should never be exposed in client-side code. It's also good practice to never commit them to a remote code repository (even if the repository is private). Instead, tokens can be defined as environment variables and made available in server-side code via Node's `process.env` object using a package like [dotenv](https://www.npmjs.com/package/dotenv).* **This setting is required if `key` is not defined and ignored if `key` is defined.** |
user | string | The ID or authentication token of a User to include in the `Authorization` header of each API request. This can be overridden on a per-request basis. *Note: If a request requires a User ID or token, it will be indicated in the API documentation.* |
version | string | The API version to target (default: `v1`). |

#### Sending API Requests

Send a request to the Project API for the first 10 published Entries when ordering by title:
``` javascript
(async () => {
  try {
    const options = { params: { limit: 10, order: 'title', page: '1', phase: '4' } };
    const res = await api.get('/entries', options);
    console.info(res.data.index);
  } catch (err) {
    console.error(err);
  }
})();
```

Send a request to the Geo Tools API for the elevation at given location:
``` javascript
(async () => {
  try {
    const options = { data: { geometry: { type: 'Point', coordinates: [-109.80856, 45.16372] } } };
    const res = await geoAPI.post('/elevations', options);
    console.info(`Elevation: ${Math.round(res.data.coordinates[2])} meters`);
  } catch (err) {
    console.error(err);
  }
})();
```

#### API Request Methods

Verb | Method
-----|-------
GET | `api.get()`
POST | `api.create()` or `api.post()`
PUT | `api.update()` or `api.put()` (Project API only)
DELETE | `api.delete()` (Project API only)

All methods support two arguments: an API endpoint path (e.g., `/entries` or `/measurements`) and an optional Request Configuration object, which is described in the table below.

#### Request Configuration Object

Property | Type | Description
---------|------|------------
data | object | An object to encode as a JSON string and send in the body of the request. **This setting is for `POST` and `PUT` requests only.**
first | boolean | If `true` and this is a `GET` request, the first object in the `data.index` array of the response body will be returned instead of an object with `index` and `total` properties. If the `data.index` array is empty, a `null` value will be returned. Setting this option to `true` is useful when only one result is expected or desired—when filtering by ID, for example. **This setting is for Project API requests only.**
headers | object | Custom HTTP headers to include with the request.
locales | array | An array of locale codes to include in the `Accept-Language` header of the request. See the [Localization section](https://elebase.io/learn/api#localization) of the API documentation for more details. **This setting is for Project API requests only.**
params | object | A plain or [URLSearchParams](https://developer.mozilla.org/en-US/docs/Web/API/URLsearchParams) object containing query parameters to include in the URL of the request.
user | string | The ID or authentication token of a User to include in the `Authorization` header of the request. *Note: If a request requires a User ID or token, that requirement will be specified in the API documentation.* **This setting is for Project API requests only.**

#### Handling API Responses

All API request methods return [Promises](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) that either resolve with a `Response` object or reject with a `RequestError` object. Details on both of these objects are provided below.

##### Response Object

Property | Type | Description
---------|------|------------
data | object/null | The JSON-decoded response body (or `null` if the body was empty).
headers | object | The HTTP response headers.
status | integer | The HTTP response status code.

##### Project API RequestError Object

Property | Type | Description
---------|------|------------
data | mixed | The `data` property from the [Error object](https://elebase.io/learn/api#the-error-object) returned by the API endpoint.
headers | object | Response headers relevant to the error (e.g., the `X-Usage-Limit-Info` and `X-Usage-Limit-Time` headers from a 429 response).
id | string | The `id` property from the [Error object](https://elebase.io/learn/api#the-error-object) returned by the API endpoint.
message | string | A basic error message that includes the full JSON [Error object](https://elebase.io/learn/api#the-error-object) returned by the API endpoint.
status | integer | The status code of the response.

##### Geo API RequestError Object

Property | Type | Description
---------|------|------------
code | string | The `code` property from the [Error object](https://elebase.io/learn/tools/geo-tools#the-error-object) returned by the API endpoint.
headers | object | Response headers relevant to the error (e.g., the `X-Usage-Limit-Info` and `X-Usage-Limit-Time` headers from a 429 response).
info | string | The `info` property from the [Error object](https://elebase.io/learn/tools/geo-tools#the-error-object) returned by the API endpoint.
status | integer | The status code of the response.
type | string | The `type` property from the [Error object](https://elebase.io/learn/tools/geo-tools#the-error-object) returned by the API endpoint.

### API Documentation

Full API references can be found in the [Learn](https://elebase.io/learn) section of our website.

* [Project API Reference](https://elebase.io/learn/api)
* [File Tools API Reference](https://elebase.io/learn/tools/file-tools)
* [Geo Tools API Reference](https://elebase.io/learn/tools/geo-tools)
