var request = require('request');
var config = require('config');
var log = require('./log.js');


var Particle = function(options) {
	this.base_url = 'https://api.particle.io/v1/devices/';
	this.particle_access_token = config.get('Particle.access_token');
	this.applicanceId = options.appliance_id;
	this.deviceID = options.device_id;
	if ( !this.particle_access_token ) {
		log('ERROR: MISSING PARTICLE TOKEN IN CONFIG');
		throw new Error('MISSING PARTICLE TOKEN IN CONFIG');
	}
	if ( !this.deviceID || !this.applicanceId ) {
		var err = 'ERROR: MISSING PARTICLE Device ('+this.deviceID+') or Applicance ID ('+this.applicanceId+')';
		log(err);
		throw new Error(err);
	}
};

Particle.prototype.makeURL = function(particleDeviceId, function_name) {
	var u = this.base_url + particleDeviceId;
	if ( function_name ) {
		u += '/'+ function_name;
	}
	return u;
};

Particle.prototype.appendAccessTokenForGetRequest = function(url) {
	return url + '?access_token='+this.particle_access_token;
};

Particle.prototype.healthCheck = function(callback) {
	
	if ( !callback ) {
    	callback = function emptyCallback() {};
    }

    var url =  this.makeURL(this.deviceID, undefined);	// GET request w/ no function name
    url = this.appendAccessTokenForGetRequest(url);

    log('making GET request to '+url);

    // Make request to Particle server
	request.get( {
		
		url: url

	}, function(error, response, body){

		log('GET finished. Response = '+JSON.stringify(response)+', and Body='+JSON.stringify(JSON.parse(body)));			
		var error;
		var error_description;
		var is_connected = false;
		// pull out some meaningful error code from Particle response if possible.
		if ( body ) {
			body = JSON.parse(body);	// body is not JSON from particle. Parse it into JS object
			error = body.error;
			error_description = body.error_description ? body.error_description : error;	// use error if no description
			is_connected = body.connected;
		}
		if ( error ) {
			// nothing for now
		} else if ( response.statusCode == 200 ) {
			callback(undefined, {connected:is_connected});
			return;
		} else {
			error = new Error('Particle cloud responded with status Code: '+response.statusCode +': '+error_description);
		}

		if ( error && !error.description ) {
			error.description = error_description;
		}
		callback(error);
	});
};


// curl https://api.particle.io/v1/devices/2d0038000247343337373738/setBright -d access_token=95f709384a855869194d62cd76ed95f9480303e2 -d arg="A100"
Particle.prototype.setBrightness = function(value, type, callback) {

    if ( !callback ) {
    	callback = function emptyCallback() {};
    }

	var url =  this.makeURL(this.deviceID, 'setBright');

	var commandStr;
	if ( type === 'ABSOLUTE') {
		commandStr = 'A';
	} else {
		commandStr = 'R';	// RELATIVE
	}

	var particleFormData = {
		access_token: this.particle_access_token,
		arg: commandStr + value
    };

    log('making POST request to '+url);
	
    // Make request to Particle server
	request.post( {
		
		url: url,
		form: particleFormData

	}, function(error, response, body){
		handleResponse(error, response, body, callback);
	});

};

// Sample request via command line:
// curl https://api.particle.io/v1/devices/2d0038000247343337373738/setOnOff -d access_token=0fbbc0d0714bf6258e80f4f4bdee2f499702fc7c -d arg="00FFFF"
// also there is... FYI
// curl https://api.particle.io/v1/devices/2d0038000247343337373738/setAnimation -d access_token=0fbbc0d0714bf6258e80f4f4bdee2f499702fc7c -d arg="wheel"
Particle.prototype.turnOnOff = function(turn_on, callback) {

	// console.log('Making on off request for '+this.deviceID);

    if ( !callback ) {
    	callback = function emptyCallback() {};
    }

	var url =  this.makeURL(this.deviceID, 'setOnOff');
	var value = '000000';
	if ( turn_on ) {
	    value = '0000FF';
	}

	var particleFormData = {
		access_token: this.particle_access_token,
		arg: value
    };

    log('making POST request to '+url);
	
    // Make request to Particle server
	request.post( {
		
		url: url,
		form: particleFormData

	}, function(error, response, body){
		handleResponse(error, response, body, callback);
	});

};

var handleResponse = function(error, response, body, callback) {
	log('POST finished. Response = '+JSON.stringify(response)+', and Body='+JSON.stringify(JSON.parse(body)));			
	var error;
	var error_description;
	// pull out some meaningful error code from Particle response if possible.
	if ( body ) {
		body = JSON.parse(body);	// body is not JSON from particle. Parse it into JS object
		error = body.error;
		error_description = body.error_description ? body.error_description : error;	// use error if no description
	}
	if ( error ) {
		// nothing for now
	} else if ( response.statusCode == 200 ) {
		callback(undefined);
		return;
	} else {
		error = new Error('Particle cloud responded with status Code: '+response.statusCode +': '+error_description);
	}
	if ( error & !error.description ) {
		error.description = error_description;
	}
	callback(error);
};

module.exports = Particle;


