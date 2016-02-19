[![Akera Logo](http://akera.io/logo.png)](http://akera.io/)

  REST Explorer module for Akera.io web service - provides a simple web interface for
  accessing CRUD REST interface on the application server.

## Installation

```bash
$ npm install akera-rest-explorer
```

## Docs

  * [Website and Documentation](http://akera.io/)

## Quick Start

  This module is designed to only be loaded as broker level service which 
  is usually done by adding a reference to it in `services` section of 
  each broker's configuration in `akera-web.json` configuration file.
   
```json
  "brokers": [
  	{	"name": "demo",
  		"host": "localhost",
		"port": 3737,
		"services": [
			{ 
				"middleware": "akera-rest-explorer",
				"config": {
					"route": "/explorer/"
				}
			}
		]
	}
  ]
```
  
  Service options available:

- `route`: the route where the service is going to be mounted (default: '/rest/explorer/')
  
  This is a simple web user-interface that allows developers to access data from 
  connected databases on the application server through the REST CRUD interface.
  
## Dependencies
  Although there is no direct dependency of those modules, in order to `mount` the 
  rest explorer on an application server web-service the following modules need to be
  mounted as well:

- [akera-rest-crud](https://www.npmjs.com/package/akera-rest-crud)
  	
  If available those will be automatically mounted, otherwise the module will also fail to load. 

## License	
[MIT](https://github.com/akera-io/akera-rest-explorer/raw/master/LICENSE)  
