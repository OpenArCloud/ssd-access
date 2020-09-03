// (c) 2020 Open AR Cloud
// This code is licensed under MIT license (see LICENSE.md for details)

/*
    Main access point to the spatial discovery services of the Open Spatial Computing Platform.
*/

import ssrSchema from './ssr.schema.json';
import Ajv from 'ajv';
import error from "svelte/types/compiler/utils/error";


// Allows to return local JSON response
export let local = false;

const SSD_URL = 'https://dev1.ssd.oscp.cloudpose.io:7000';
const SSRS_PATH = 'ssrs';

const GET_METHOD = 'get';
const POST_METHOD = 'post';


export function getServicesAtLocation(countryCode, h3Index) {
    if (local) {
        return localServices;
    }

    if (countryCode === undefined || countryCode === ''
        || h3Index === undefined || countryCode === '') {
        throw new Error(`Check parameters: ${countryCode} ${h3Index}`);
    }

    return request(`${SSD_URL}/${countryCode}/${SSRS_PATH}?h3Index=${h3Index}`);
}

export function getServiceWithId(countryCode, id) {
    if (local) {
        return localService;
    }

    if (id === undefined || id.length < 16) {
        throw new Error(`Check parameters: ${id}`);
    }

    return request(`${SSD_URL}/${countryCode}/${SSRS_PATH}/${id}`);
}

export function postService(countryCode, ssr, token) {
    if (local) {
        return 'OK';
    }

    if (ssr === undefined || ssr.length === 0
        || token === undefined || token.length === 0) {
        throw new Error(`Check parameters: ${ssr}, ${token}`);
    }

    return request(`${SSD_URL}/${countryCode}/${SSRS_PATH}`, POST_METHOD, ssr, token);
}

export async function postSsrFile(countryCode, file, token) {
    let content;

    return getFileContent(file)
        .then(result => content = result)
        .then(data => validateSsr(content, file.name))
        .then(() => postService(countryCode, content, token))
        .then(response => response)
}

export function validateSsr(ssr, fileName) {
    return new Promise((resolve, reject) => {
        let ajv = new Ajv();
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
            reject(`Unable to get Content of ${fileName}`);
        }
    });
}

function request(url, method = GET_METHOD, body = '', token) {
    let headers = new Headers();
    headers.append('Accept', 'application/vnd.oscp+json; version=1.0;');
    headers.append('Content-Type', 'application/json');

    if (token) {
        headers.append('Authorization', `Bearer ${token}`);
    }

    return fetch(url, {
        method: method,
        headers: headers,
        body: body
    })
        .then(async (response) => {
            if (!response.ok) {
                throw new Error(`${await response.text()}, ${response.statusText}`);
            }
            return response.json();
        })
        .then((data) => {
            return data;
        })
        .catch(error => Promise.reject(`request failed ${error}`));
}

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


export const localServices =
    [{"id":"e32ca955c776ecec","type":"ssr","services":[{"type":"geopose","url":"http://geopose.geo1.example.com"},{"type":"content-discovery","url":"http://content-discovery.geo1.example.com"}],"geometry":{"type":"Polygon","coordinates":[[[-97.74437427520752,30.27830380593801],[-97.73051261901855,30.28590104010804],[-97.74703502655028,30.291014944499693],[-97.74437427520752,30.27830380593801]]]},"provider":"oscptest","timestamp":"2020-08-12T05:08:10.824Z"},{"id":"e0f25f91555e0fba","type":"ssr","services":[{"type":"geopose","url":"http://geopose.geo1.example.com"},{"type":"content-discovery","url":"http://content-discovery.geo1.example.com"}],"geometry":{"type":"Polygon","coordinates":[[[-97.73042678833008,30.283677520264256],[-97.73102760314941,30.28193572785586],[-97.72969722747803,30.2815280698483],[-97.72901058197021,30.28356634294924],[-97.73042678833008,30.283677520264256]]]},"provider":"oscptest","timestamp":"2020-08-12T05:08:36.344Z"}];

export const localService =
    {"id":"e32ca955c776ecec","type":"ssr","services":[{"type":"geopose","url":"http://geopose.geo1.example.com"},{"type":"content-discovery","url":"http://content-discovery.geo1.example.com"}],"geometry":{"type":"Polygon","coordinates":[[[-97.74437427520752,30.27830380593801],[-97.73051261901855,30.28590104010804],[-97.74703502655028,30.291014944499693],[-97.74437427520752,30.27830380593801]]]},"provider":"oscptest","timestamp":"2020-08-12T05:08:10.824Z"};
