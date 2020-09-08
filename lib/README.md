Simple library aiming to make access to the spatial service discovery as 
easy as possible. Currently verifying if it actually makes sense.


This module will very likely only run in a browser using rollup right now. 
Compatibility with other packagers and with Node on the server side is planned.


Currently available functions are:
- getServicesAtLocation(countryCode, h3Index)
Requests services available around H3Index from the regional server for the provided 
countryCode

- function getServiceWithId(countryCode, id)
Requests service with provided id from the regional server for the provided countryCode

- function postService(countryCode, ssr, token)
Post a service to Spatial Services Discovery server of provided region

- function postSsrFile(countryCode, file, token)
Post the content of a .json file to Spatial Services Discovery server of provided region

- function validateSsr(ssr, fileName = '')
Validate the provided Spatial Services Record against the SSR json schema 


New with this version:
- Renaming of the function names
- Post request
- SSR schema update


More information about the discovery services used can be found here:

Spatial Service Discovery
- https://github.com/OpenArCloud/oscp-spatial-service-discovery/

Spatial Content Discovery
- https://github.com/OpenArCloud/oscp-spatial-content-discovery