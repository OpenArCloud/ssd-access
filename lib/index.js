// (c) 2020 Open AR Cloud
// This code is licensed under MIT license (see LICENSE.md for details)

/**
    Main access point to the spatial discovery services of the Open Spatial Computing Platform.
*/

import ssrSchema from './ssr.schema.json';
import ssrEmpty from './ssr.empty.json';
import ssrService from './ssr.service.json';

import Ajv from 'ajv';
import addFormats from "ajv-formats"; // note: introduced in Ajv 8, see https://github.com/ajv-validator/ajv-formats

// Allows to return local JSON response (only for debugging)
export let local = false;

export const ssr_schema = ssrSchema;
export const ssr_empty = ssrEmpty;
export const ssr_service = ssrService;

// TODO: this list should be queried from the actual server
export const supportedCountries = `
    <datalist id="supported-countries">
        <option value="us">
        <option value="it">
        <option value="fi">
        <option value="se">
        <option value="hu">
        <option value="de">
        <option value="uk">
        <option value="hk">
        <option value="tr">
    </datalist>`

export const availableServiceTypes = [
    "GeoPose",
    "Content-Discovery",
    "P2P-Master",
	"Message-Broker"
]


const SSD_URL_DEFAULT = 'https://dev1.ssd.oscp.cloudpose.io:7000';
const SSRS_PATH_DEFAULT = 'ssrs';

let ssdUrl = SSD_URL_DEFAULT; // base URL of Spatial Service Discovery
let ssrsPath = SSRS_PATH_DEFAULT; // subpath of Spatial Content Records on the SSD URL

const GET_METHOD = 'get';
const POST_METHOD = 'post';
const PUT_METHOD = 'put';
const DELETE_METHOD = 'delete';


/**
 * Sets the base URL for Spatial Service Discovery
 *
 * @param {string} url  URL for spatial service discovery
 */
export function setSsdUrl(url) {
    ssdUrl = url;
}

/**
 * Sets the sub-path for Spatial Content Records on the SSD URL
 *
 * @param {string} path  subpath for spatial service records on the SSD
 */
 export function setSsrsPath(path) {
    ssrsPath = path;
}

/**
 * Requests the available services in the provided region and location
 *
 * The location to provide should be approximate, to prevent exposing exact client locations.
 *
 * When the global variable `local` is set to true, no server access is done, but a local result is returned instead.
 *
 * @param {string} countryCode  Short code for the region (country) to get the services for
 * @param {string} h3Index  Location based on the h3 [grid system]{https://eng.uber.com/h3/}
 * @returns {Promise<SSR[]> | Promise<string>} Server response Promise
 */
export function getServicesAtLocation(countryCode, h3Index) {
    if (local) {
        return Promise.resolve(localServices);
    }

    if (countryCode === undefined || countryCode === ''
        || h3Index === undefined || countryCode === '') {
        throw new Error(`Check parameters: ${countryCode} ${h3Index}`);
    }

    return request(`${ssdUrl}/${countryCode}/${ssrsPath}?h3Index=${h3Index}`)
        .then(async (response) => await response.json())
}

/**
 * Requests the service with the provided id from the provided region
 *
 * When the global variable `local` is set to true, no server access is done, but a local result is returned instead.
 *
 * @param {string} countryCode  Short code for the region (country) to get the services for
 * @param {string} id  ID of a SSR record stored on the regional server
 * @returns {Promise<SSR> | Promise<string>} Server response Promise
 */
export function getServiceWithId(countryCode, id) {
    if (local) {
        return Promise.resolve(localService);
    }

    if (id === undefined || id.length < 16) {
        throw new Error(`Check parameters: ${id}`);
    }

    return request(`${ssdUrl}/${countryCode}/${ssrsPath}/${id}`)
        .then(async (response) => await response.json())
}

/**
 * Request all services in the provided region.
 *
 * @param {string} countryCode  Short code for the region (country) to get the services for
 * @param {string} token  security token for API access authorization
 * @returns {Promise<SSR[]>}  Array of the services in SSR format
 */
export function searchServicesForProducer(countryCode, token) {
    return request(`${ssdUrl}/${countryCode}/provider/${ssrsPath}`, GET_METHOD, '', token)
        .then((response) => response.json())
        .then((data) => data);
}

/**
 * Post a single service record (SSR) to the server in the provided region
 *
 * When the global variable `local` is set to true, no server access is done, but an immediate ok returned.
 *
 * @param {string} countryCode  Short code for the region (country) to get the services for
 * @param {string} ssr  The service record to post
 * @param {string} token  security token for API access authorization
 * @returns {Promise<string>}  Server response Promise
 */
export function postService(countryCode, ssr, token) {
    if (local) {
        return Promise.resolve('OK');
    }

    if (ssr === undefined || ssr.length === 0
        || token === undefined || token.length === 0) {
        throw new Error(`Check parameters: ${ssr}, ${token}`);
    }

    return request(`${ssdUrl}/${countryCode}/${ssrsPath}`, POST_METHOD, ssr, token)
        .then(async (response) => await response.text())
}

/**
 * Post the content of a .json file to the server in the provided region
 *
 * Reads the contents of the file, validates it against a json schema and posts it to the server.
 *
 * @param {string} countryCode  Short code for the region (country) to get the services for
 * @param {File} file  The file with the contents in SSR format to post
 * @param {string} token  security token for API access authorization
 * @returns {Promise<string>}  Server response Promise
 */
export async function postSsrFile(countryCode, file, token) {
    let content;

    return getFileContent(file)
        .then(result => content = result)
        .then(() => validateSsr(content, file.name))
        .then(async () => await postService(countryCode, content, token))
}

/**
 * Put a single service record (SSR) to the server in the provided region
 *
 * @param {string} countryCode  Short code for the region (country) to get the services for
 * @param {string} ssr  The service record to post
 * @param {string} id  ID of the edited record
 * @param {string} token  security token for API access authorization
 * @returns {Promise<string>}
 */
export async function putService(countryCode, ssr, id, token) {
    if (local) {
        return Promise.resolve('OK');
    }

    if (ssr === undefined || ssr.length === 0
        || id === undefined || id.length === 0
        || token === undefined || token.length === 0) {
        throw new Error(`Check parameters: ${ssr}, ${id} ${token}`);
    }

    return request(`${ssdUrl}/${countryCode}/${ssrsPath}/${id}`, PUT_METHOD, ssr, token)
        .then(async (response) => await response.text());
}

/**
 * Delete service with provided ID
 *
 * @param {string} countryCode  Short code for the region (country) to get the services for
 * @param {string} id  ID of a SSR record stored on the regional server
 * @param {string} token  security token for API access authorization
 * @returns {Promise<*>}  Server response Promise
 */
export function deleteWithId(countryCode, id, token) {
    return request(`${ssdUrl}/${countryCode}/${ssrsPath}/${id}`, DELETE_METHOD, '', token)
        .then(async (response) => await response.text())
}

/**
 * Validate the provided SSR against a json schema
 *
 * @param {string} ssr  The SSR record to validate
 * @param {string} fileName  When the SSR record was loaded from a file, the respective file name
 * @returns {Promise<boolean> | Promise<string>}  The validation result or exception message
 */
export function validateSsr(ssr, fileName = '') {
    return new Promise((resolve, reject) => {
        let ajv = new Ajv();
        addFormats(ajv);
        let parsed;

        try {
            parsed = JSON.parse(ssr);
        } catch (error) {
            reject(`Unable to parse file content: ${fileName}, ${error}`);
        }

        let isValid = ajv.validate(ssrSchema, parsed);

        if (isValid) {
            resolve(isValid);
        } else {
            reject(`Validation of ${fileName}: ${ajv.errorsText()}`);
        }
    });
}

/**
 * Executes the actual request
 *
 * @param {string} url  The url to connect to
 * @param {string} method  The rest method to use
 * @param {string} body  The body payload if needed
 * @param {string} token  security token for API access authorization
 * @returns {Promise<string>}  Server response Promise
 */
function request(url, method = GET_METHOD, body = '', token) {
    let headers = new Headers();
    headers.append('accept', 'application/vnd.oscp+json; version=1.0;');
    headers.append('content-type', 'application/json');

    if (token) {
        headers.append('authorization', `Bearer ${token}`);
    }

    let options = {
        method: method,
        headers: headers
    }

    if (method === POST_METHOD || method === PUT_METHOD) {
        options.body = body;
    }

    return fetch(url, options)
        .then(async (response) => {
            if (!response.ok) {
                throw new Error(`${await response.text()}, ${response.statusText}`);
            }
            return response;
        });
}

/**
 * Read the contents of the provided text file
 *
 * @param {File} file  The file to read the contents from
 * @returns {Promise<string>}  The file's contents
 */
function getFileContent(file) {
    return new Promise((resolve, reject) => {
        if (file === undefined) {
            reject('Undefined file provided')
        }

        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => {
            reader.abort();
            reject(`Unable to get Content of ${file.name}: ${reader.error}`);
        };

        reader.readAsText(file);
    });
}


/** Local SSR records for testing */
export const localServices =
    [{"id":"e32ca955c776ecec","type":"ssr","services":[{"type":"geopose","url":"http://geopose.geo1.example.com"},{"type":"content-discovery","url":"http://content-discovery.geo1.example.com"}],"geometry":{"type":"Polygon","coordinates":[[[-97.74437427520752,30.27830380593801],[-97.73051261901855,30.28590104010804],[-97.74703502655028,30.291014944499693],[-97.74437427520752,30.27830380593801]]]},"provider":"oscptest","timestamp":"2020-08-12T05:08:10.824Z"},{"id":"e0f25f91555e0fba","type":"ssr","services":[{"type":"geopose","url":"http://geopose.geo1.example.com"},{"type":"content-discovery","url":"http://content-discovery.geo1.example.com"}],"geometry":{"type":"Polygon","coordinates":[[[-97.73042678833008,30.283677520264256],[-97.73102760314941,30.28193572785586],[-97.72969722747803,30.2815280698483],[-97.72901058197021,30.28356634294924],[-97.73042678833008,30.283677520264256]]]},"provider":"oscptest","timestamp":"2020-08-12T05:08:36.344Z"}];

/** Local SSR record for testing */
export const localService =
    {"id":"e32ca955c776ecec","type":"ssr","services":[{"type":"geopose","url":"http://geopose.geo1.example.com"},{"type":"content-discovery","url":"http://content-discovery.geo1.example.com"}],"geometry":{"type":"Polygon","coordinates":[[[-97.74437427520752,30.27830380593801],[-97.73051261901855,30.28590104010804],[-97.74703502655028,30.291014944499693],[-97.74437427520752,30.27830380593801]]]},"provider":"oscptest","timestamp":"2020-08-12T05:08:10.824Z"};
