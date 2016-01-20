/**
 * For additional details, please refer to the Alexa Lighting API developer documentation 
 * https://developer.amazon.com/public/binaries/content/assets/html/alexa-lighting-api.html
 */
var particle = require('./particle.js');
var log = require('./log.js');


var lightingApiNamespaces = ['Discovery','Control','System'];

var isLightingAPIRequest = function(event, context) {
	if (event && event.header && event.header.namespace ) {
		var i = lightingApiNamespaces.indexOf(event.header.namespace);
		return (i==-1)?false:true;
	}
	return false;
};

/**
 * Main entry point.
 * Incoming events from Alexa Lighting APIs are processed via this method.
 * Support for Alexa Skills Kit handlers too.
 */
exports.handler = function(event, context) {

    myLog('API Input', 'Handler Called. Event: '+ JSON.stringify(event) + ', Context:' + JSON.stringify(context));

    if ( isLightingAPIRequest(event,context) ) {

	    switch (event.header.namespace) {
	        
	        /**
	         * The namespace of "Discovery" indicates a request is being made to the lambda for
	         * discovering all appliances associated with the customer's appliance cloud account.
	         * can use the accessToken that is made available as part of the payload to determine
	         * the customer.
	         */
	        case 'Discovery':
	            handleDiscovery(event, context);
	            break;

	            /**
	             * The namespace of "Control" indicates a request is being made to us to turn a
	             * given device on, off or brighten. This message comes with the "appliance"
	             * parameter which indicates the appliance that needs to be acted on.
	             */
	        case 'Control':
	            handleControl(event, context);
	            break;


	        case 'System':
	        	handleSystem(event, context);
		        break;

	            /**
	             * We received an unexpected message
	             */
	        default:
	            myLog('Error', 'No supported namespace: ' + event.header.namespace);
	            context.fail('Something went wrong');
	            break;
	    }
	} else {
		// Assume it's an Alexa Skills Kit request
		myLog('Alexa Skills Kit API Call', 'Not handling... but event='+JSON.stringify(event));
		context.fail('Unrecognized Event');
	}
};

/**
 * Calls any API in the Particle cloud and see whether the cloud is responsive. Whether the actual light we 
 * are running the health check on is connected in not a concern.
*/
exports.testHealthCheck = function() {
	particle.healthCheck(particle.istanbulLampDeviceID, function(err,response) {
		if ( response && !err ) {
			log('health check done. Connected='+response.connected);
		} else {
			log('health check error! '+err.description);
		}
	});
};

/**
 * This method is invoked when we receive a "Discovery" message from Alexa Connected Home Skill.
 * We are expected to respond back with a list of appliances that we have discovered for a given
 * customer. 
 */
function handleDiscovery(event, context) {

    /**
     * Crafting the response header
     */
    var headers = {
        namespace: 'Discovery',
        name: 'DiscoverAppliancesResponse',
        payloadVersion: '1'
    };

    /**
     * Response body will be an array of discovered devices.
     */
    var appliances = [];

    var applianceDiscovered = {
        applianceId: particle.istanbulLampDeviceApplianceID,
        manufacturerName: 'KurodaLightingCompany',
        modelName: 'ST01',
        version: 'VER01',
        friendlyName: 'Chandelier',
        friendlyDescription: 'The Istanbul Light Chandelier',
        isReachable: true,
        additionalApplianceDetails: {
            /**
             * OPTIONAL:
             * We can use this to persist any appliance specific metadata.
             * This information will be returned back to the driver when user requests
             * action on this appliance.
             */
            'particle_device_id' : particle.istanbulLampDeviceID
        }
    };
    appliances.push(applianceDiscovered);

    /**
     * Craft the final response back to Alexa Connected Home Skill. This will include all the 
     * discoverd appliances.
     */
    var payloads = {
        discoveredAppliances: appliances
    };
    var result = {
        header: headers,
        payload: payloads
    };

    myLog('Discovery', result);

    context.succeed(result);
}


// helper to validate name in handleControl()
function isValidControlEventName(name) {
	if ( name === 'SwitchOnOffRequest' || name === 'AdjustNumericalSettingRequest' ) {
		return true;
	}
	return false;
}

/**
 * Control events are processed here.
 * This is called when Alexa requests an action (IE turn off appliance).
 */
function handleControl(event, context) {

    /**
     * Fail the invocation if the header is unexpected. This example only demonstrates
     * turn on / turn off, hence we are filtering on anything that is not SwitchOnOffRequest.
     */

    if (!event || !event.header || event.header.namespace !== 'Control' || !isValidControlEventName(event.header.name)) {
    	var name = 'Unknown Event Name';
    	if ( event && event.header && event.header.name ) {
    		name = event.header.name;
    	}
        context.fail(generateControlError(name, 'UNSUPPORTED_OPERATION', 'Unrecognized operation'));
        return;
    }

    /**
     * Retrieve the appliance id and accessToken from the incoming message.
     */
    var requestType = event.header.name;
	var applianceId = event.payload.appliance.applianceId;
    // var amazonAccessToken = event.payload.accessToken.trim(); // Amazon access token
    var particleDeviceId = event.payload.appliance.additionalApplianceDetails.particle_device_id;


    if ( !applianceId || !particleDeviceId ) {
        context.fail(generateControlError(event.header.name, 'NO_SUCH_TARGET', 'Missing Appliance or Particle ID'));
        return;
    }

    if (event.header.namespace === 'Control' && event.header.name === 'SwitchOnOffRequest') {     
        /**
         * Make a remote call to execute the action based on accessToken and the particleDeviceId and the switchControlAction
         * Some other examples of checks:
         *	validate the appliance is actually reachable else return TARGET_OFFLINE error
         *	validate the authentication has not expired else return EXPIRED_ACCESS_TOKEN error
         * Please see the technical documentation for detailed list of errors
         */
         var make_on = false;
        if (event.payload.switchControlAction === 'TURN_ON') {
        	make_on = true;
        } else if (event.payload.switchControlAction === 'TURN_OFF') {
        	make_on = false;
        }

        particle.turnOnOff(particleDeviceId, make_on, function(err) {

        	if ( err ) {

        		var description = err.description;
				if ( !description ) {
        	     	description = '[onoff] Generic Error reaching the device';
             	}
 	        	myLog('Error', description);
    	        context.fail(generateControlError(requestType, 'DEPENDENT_SERVICE_UNAVAILABLE', description));

        	} else {

				var headers = {
	                namespace: 'Control',
	                name: 'SwitchOnOffResponse',
	                payloadVersion: '1'
            	};
	            var payloads = {
	                success: true
	            };
	            var result = {
	                header: headers,
	                payload: payloads
	            };
	            myLog('sending success with result', result);
	            context.succeed(result);
        	}
        });
    } else if (event.header.namespace === 'Control' && event.header.name === 'AdjustNumericalSettingRequest') {     
        /**
         * Make a remote call to execute the action based on accessToken and the particleDeviceId
         * Some other examples of checks:
         *	validate the appliance is actually reachable else return TARGET_OFFLINE error
         *	validate the authentication has not expired else return EXPIRED_ACCESS_TOKEN error
         * Please see the technical documentation for detailed list of errors
         */
        var value = event.payload.adjustmentValue;
        var unit = event.payload.adjustmentUnit;
        var type = event.payload.adjustmentType;
        if ((typeof value === 'undefined')||(typeof unit === 'undefined')||(typeof type === 'undefined')) {
	     	var description = '[brightness] Error with function input values';
	     	myLog('Error', description);
        	context.fail(generateControlError(requestType, 'UNEXPECTED_INFORMATION_RECEIVED', description));
        	return;
        }
        if ( unit !== 'PERCENTAGE' ) {
	        var description = '[brightness] unsuported adjustment unit: '+unit;
        	myLog('Error', description);
        	context.fail(generateControlError(requestType, 'UNSUPPORTED_TARGET_SETTING', description));
        	return;
        }

        particle.setBrightness(particleDeviceId, value, type, function(err) {

        	if ( err ) {

        		var description = err.description;
				if ( !description ) {
        	     	description = '[brightness] Generic Error reaching the device';
             	}
 	        	myLog('Error', description);
    	        context.fail(generateControlError(requestType, 'DEPENDENT_SERVICE_UNAVAILABLE', description));

        	} else {

				var headers = {
	                namespace: 'Control',
	                name: 'AdjustNumericalSettingResponse',
	                payloadVersion: '1'
            	};
	            var payloads = {
	                success: true
	            };
	            var result = {
	                header: headers,
	                payload: payloads
	            };
	            myLog('sending success with result', result);
	            context.succeed(result);
        	}
        });
    }
}

/**
 * System events are processed here.
 */
function handleSystem(event, context) {

    var requestType = event.header.name;
    if (!event || !event.header || event.header.namespace != 'System' || requestType != 'HealthCheckRequest') {
        context.fail(generateControlError(requestType, 'UNSUPPORTED_OPERATION', 'Unrecognized operation'));
    }

    if (event.header.namespace === 'System' && event.header.name === 'HealthCheckRequest') {     

        particle.healthCheck(particle.istanbulLampDeviceID, function(err, is_connected) {

        	// Health checks always respond with success. If we do NOT get an error, then Particle Cloud is healthy.
        	// This is a check of the Particle Cloud, not of the particular device(s) we use
			var headers = {
                namespace: 'System',
                name: 'HealthCheckRequest',
                payloadVersion: '1'
        	};
        	var healthy = false;
        	if ( !err ) {
        		healthy = true;
        	}
            var payloads = {
                "isHealthy": healthy,
                "description" : healthy ? 'The Particle cloud is responsive' : 'Failed to speak to the Particle cloud'
            };
            var result = {
                header: headers,
                payload: payloads
            };
            myLog('Health Check', 'Result is: '+JSON.stringify(result));
            context.succeed(result);
        });
    }
}

/**
 * Utility functions.
 */
function myLog(title, msg) {
    log('*************** ' + title + ' *************');
    log(msg);
    log('*************** ' + title + ' End*************');
}

function generateControlError(name, code, description) {
    var headers = {
        namespace: 'Control',
        name: name,
        payloadVersion: '1'
    };

    var payload = {
        exception: {
            code: code,
            description: description
        },
        success: false
    };

    var result = {
        header: headers,
        payload: payload
    };
    
    log('GENERATING ERROR: '+name+'. Description: '+description);

    return result;
}