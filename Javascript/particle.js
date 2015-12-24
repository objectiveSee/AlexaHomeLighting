var request = require('request');
var config = require('config');
var log = require('./log.js');


var Particle = function() {
	this.base_url = 'https://api.particle.io/v1/devices/';
	this.particle_access_token = config.get('Particle.access_token');
	if ( !this.particle_access_token ) {
		log('ERROR: MISSING PARTICLE TOKEN IN CONFIG');
		throw new Error('MISSING PARTICLE TOKEN IN CONFIG');
	}
};

Particle.prototype.istanbulLampDeviceApplianceID = config.get('Particle.istanbul_lamp_appliance_id')
Particle.prototype.istanbulLampDeviceID = config.get('Particle.istanbul_lamp_device_id');

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

Particle.prototype.healthCheck = function(particleDeviceId, callback) {
	
	if ( !callback ) {
    	callback = function emptyCallback() {};
    }

    var url =  this.makeURL(particleDeviceId, undefined);	// GET request w/ no function name
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

// Sample request via command line:
// curl https://api.particle.io/v1/devices/400025000647343339373536/setColor -d access_token=95f709384a855869194d62cd76ed95f9480303e2 -d arg="00FFFF"
Particle.prototype.turnOnOff = function(particleDeviceId, turn_on, callback) {

    if ( !callback ) {
    	callback = function emptyCallback() {};
    }

	var url =  this.makeURL(particleDeviceId, 'setColor');
	var color = '';
	if ( turn_on ) {
	    color = '330033';
	} else {
	    color = '000000'
	}

	var particleFormData = {
		access_token: this.particle_access_token,
		arg: color
    };

    log('making POST request to '+url);
	
    // Make request to Particle server
	request.post( {
		
		url: url,
		form: particleFormData

	}, function(error, response, body){

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
			callback(undefined, {ok:true});
			return;
		} else {
			error = new Error('Particle cloud responded with status Code: '+response.statusCode +': '+error_description);
		}
		if ( error & !error.description ) {
			error.description = error_description;
		}
		callback(error);
	});

};

module.exports = new Particle();