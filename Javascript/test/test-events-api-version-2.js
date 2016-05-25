
var LightingEvents = function() {
	this.Discover = 
	{
	  "header": {
	  	"messageId": "6d6d6e14-8aee-473e-8c24-0d31ff9c17a2",
	    "namespace": "Alexa.ConnectedHome.Discovery",
	    "name": "DiscoverAppliancesRequest",
	    "payloadVersion": "2"
	  },
	  "payload": {
	    "accessToken": "sampleAccessToken"
		}
	};

	this.ControlOn = 
	{
	  "header": {
	  	"messageId": "6d6d6e14-8aee-473e-8c24-0d31ff9c17a2",
	    "payloadVersion": "2",
	    "namespace": "Alexa.ConnectedHome.Control",
	    "name": "TurnOnRequest"
	  },
	  "payload": {
	    "appliance": {
	      "additionalApplianceDetails": {
	        "particle_device_id" : "Is-Replaced-In-Unit-Test"
	      },
	      "applianceId": "Is-Not-Checked-Carefully"
	    },
	    "accessToken": "sampleAccessToken"
	  }
	};

	this.ControlOff = 
	{
	  "header": {
	  	"messageId": "6d6d6e14-8aee-473e-8c24-0d31ff9c17a2",
	    "payloadVersion": "2",
	    "namespace": "Alexa.ConnectedHome.Control",
	    "name": "TurnOffRequest"
	  },
	  "payload": {
	    "appliance": {
	      "additionalApplianceDetails": {
	        "particle_device_id" : "Is-Replaced-In-Unit-Test"
	      },
	      "applianceId": "Is-Not-Checked-Carefully"
	    },
	    "accessToken": "sampleAccessToken"
	  }
	};

/**
	this.ControlAlphaNumeric = 
	{  
	  "header":{  
	  	"messageId": "6d6d6e14-8aee-473e-8c24-0d31ff9c17a2",
	    "namespace":"Control",
	    "name":"AdjustNumericalSettingRequest",
	    "payloadVersion":"1"
	  },
	  "payload":{  
	    "accessToken":"sample-access-token",
	    "adjustmentType":"ABSOLUTE",
	    "adjustmentUnit":"PERCENTAGE",
	    "adjustmentValue":100.0,
	    "appliance": {
	      "additionalApplianceDetails": {
	        "particle_device_id" : "Is-Replaced-In-Unit-Test"
	      },
	      "applianceId": "Is-Not-Checked-Carefully"
	    }
	  }
	};

	this.ControlAlphaNumericErrorResponse = 
	{
	  "header": {
	  	"messageId": "6d6d6e14-8aee-473e-8c24-0d31ff9c17a2",
	    "namespace": "Control",
	    "name": "AdjustNumericalSettingResponse",
	    "payloadVersion": "1"
	  },
	  "payload": {
	    "success": false,
	    "exception": {
	      "code": "UNSUPPORTED_OPERATION",
	      "description": "Unrecognized operation"
	    }
	  }
	};
	*/

	this.System =  
	{
	  "header": {
	  	"messageId": "6d6d6e14-8aee-473e-8c24-0d31ff9c17a2",
	    "namespace": "Alexa.ConnectedHome.System",
	    "name": "HealthCheckRequest",
	    "payloadVersion": "2"
	  },
	  "payload": {
	    "initiationTimestamp": 1435302567000
	  }
	};
};

module.exports = LightingEvents;