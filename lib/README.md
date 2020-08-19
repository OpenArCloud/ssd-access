Simple library aiming to make access to the spatial service discovery as 
easy as possible. Currently verifying if it actually makes sense.

Currently available functions are:
- requestServices(countryCode, h3Index)
Requests services available around H3Index from the regional server for the provided 
countryCode

- function requestService(countryCode, id)
Requests service with provided id from the regional server for the provided countryCode

New with this version:
Json schema for the Spatial Service Record (SSR)