
var LightingEvents = function() {
	this.Discover = 
	{
	  "header": {
	    "namespace": "Discovery",
	    "name": "DiscoverAppliancesRequest",
	    "payloadVersion": "1"
	  },
	  "payload": {
	    "accessToken": "sampleAccessToken"
		}
	};

	this.ControlOn = 
	{
	  "header": {
	    "payloadVersion": "1",
	    "namespace": "Control",
	    "name": "SwitchOnOffRequest"
	  },
	  "payload": {
	    "switchControlAction": "TURN_ON",
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
	    "payloadVersion": "1",
	    "namespace": "Control",
	    "name": "SwitchOnOffRequest"
	  },
	  "payload": {
	    "switchControlAction": "TURN_OFF",
	    "appliance": {
	      "additionalApplianceDetails": {
	        "particle_device_id" : "Is-Replaced-In-Unit-Test"
	      },
	      "applianceId": "Is-Not-Checked-Carefully"
	    },
	    "accessToken": "sampleAccessToken"
	  }
	};

	this.ControlAlphaNumeric = 
	{  
	  "header":{  
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

	this.System =  
	{
	  "header": {
	    "namespace": "System",
	    "name": "HealthCheckRequest",
	    "payloadVersion": "1"
	  },
	  "payload": {
	    "initiationTimestamp": 1435302567000
	  }
	};
};

module.exports = LightingEvents;