
module.exports.LightingAPI = {

};

module.exports.LightingAPI.Discover = 
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

module.exports.LightingAPI.ControlOn = 
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

module.exports.LightingAPI.ControlOff = 
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

module.exports.LightingAPI.System =  
{
  "header": {
    "namespace": "System",
    "name": "HealthCheckRequest",
    "payloadVersion": "1"
  },
  "payload": {
    "initiationTimestamp": 1435302567000
  }
}