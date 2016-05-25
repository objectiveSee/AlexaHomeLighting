process.env.NODE_ENV = 'test';	// See log.js

var assert 				= require('assert');
var config 				= require('config');
var fs 					= require('fs');
var _ 					= require('underscore');

var main 				= require('../index.js');
var TestEvents 			= require('./test-events-api-version-2.js');
var Particle 			= require('../particle.js');


// from http://stackoverflow.com/questions/31449000/suppress-console-log-of-successful-mocha-tests
// afterEach(function() {
//   if (this.currentTest.state !== 'failed') return;
//   console.log( fs.readFileSync('test/test.log').toString() );
// });

// // Before each test you'd remove the file to start fresh:
// // ERROR: this hook is not working.
// beforeEach(function(done) {
//   try { 
//   	fs.unlinkSync('test/test.log');
//   	fs.writeSync('test/test.log','');
//   } catch(e) {

//   } finally {
//   	done();
//   } 
// });

describe('Configuration', function(){
	it('should have expected config values',function(){
		assert(config.get('Particle.access_token'));
		assert(config.get('Particle.devices'));
		assert(config.get('Amazon.lambda-arn'));
		assert(config.get('Amazon.profile'));

		var devices = config.get('Particle.devices');
		assert(devices.length > 0);
		_.each(devices, function(device) {
			assert(device.device_id);
			assert(device.appliance_id);
			assert(device.name);
			assert(device.friendly_name);
			assert(device.friendly_description);
		});
	});
});

describe('Handler', function(){
	it('Should respond with error to missing input',function(done){
		main.handler(undefined, {
			fail: function() {
				done();
			},
			succeed: function() {
				assert.fail(1,1,'Succeed block should not be called');
			}
		})
	});
});


/**
 * Tests the test data module
 */
describe('Test Events', function() {
	it('Should return a contructor function',function(){
		assert(typeof TestEvents === 'function');
		var t = new TestEvents();
		assert(t.Discover);	// check that at least one of the expected fields is defined.
	});
});

/**
 * Tests that excersise handling requests from the Alexa Lighting API.
 * See https://developer.amazon.com/public/binaries/content/assets/html/alexa-lighting-api.html
 */
describe('Alexa Lighting API', function() {
	this.timeout(5000);
	var particle_device_id;
	var COUNT_LIGHTS = 2;
	it('Should discover all the lights', function(done) {
		var eventData = new TestEvents();
		main.handler(eventData.Discover, {
			fail: function() {
				assert.fail(1,1,'fail block should not be called');
			},
			succeed: function(response) {
				var appliances = response.payload.discoveredAppliances;
				console.log('Appliances = '+JSON.stringify(appliances,'\t','\t'));
				assert.equal(appliances.length, COUNT_LIGHTS, 'expect '+COUNT_LIGHTS+' devices to be found');
				particle_device_id = appliances[0].additionalApplianceDetails.particle_device_id;
				assert.ok(particle_device_id,'Discovery response should contain a particle device ID');
				done();
			}
		});
	});
	it('Should check health of Particle Cloud server', function(done) {
		var eventData = new TestEvents();
		main.handler(eventData.System, {
			fail: function() {
				assert.fail(1,1,'fail block should not be called');
			},
			succeed: function(response) {
				assert.ok(response.payload.isHealthy, 'should contain isHealthy field');
				assert.ok(response.payload.description, 'should contain description field');
				done();
			}
		});
	});
	it('Should turn off one light', function(done) {
		var myEvent = new TestEvents().ControlOff;
		assert.ok(myEvent, 'test event should be defined');
		assert.ok(particle_device_id, 'should be set from previous test');
		myEvent.payload.appliance.additionalApplianceDetails.particle_device_id = particle_device_id;
		main.handler(myEvent, {
			fail: function(error) {
				console.log('Failed with error: '+JSON.stringify(error));
				assert.fail(1,1,'fail block should not be called');
			},
			succeed: function(response) {
				done();
			}
		});
	});
	it('Should turn on one light', function(done) {
		var myEvent = new TestEvents().ControlOn;
		assert.ok(particle_device_id, 'should be set from previous test');
		myEvent.payload.appliance.additionalApplianceDetails.particle_device_id = particle_device_id;
		main.handler(myEvent, {
			fail: function() {
				assert.fail(1,1,'fail block should not be called');
			},
			succeed: function(response) {
				done();
			}
		});
	});
	it('Should handle missing particle_device_id in control command', function(done) {
		var myEvent = new TestEvents().ControlOff;
		delete myEvent.payload.appliance.additionalApplianceDetails.particle_device_id;
		main.handler(myEvent, {
			fail: function(response) {
				// console.log('****************'+JSON.stringify(response));
				assert.strictEqual(response.payload.success, false, 'should have success set to false');
				assert.ok(response.payload.exception.code, 'should have an exception code');
				assert.ok(response.payload.exception.description, 'should have an exception description');
				done();				
			},
			succeed: function(response) {
				assert.fail(1,1,'success block should not be called');
			}
		});
	});
	/**
	it('Should handle unsupported Control command', function(done) {
		var testEvents = new TestEvents();
		var myEvent = testEvents.ControlAlphaNumeric;
		myEvent.header.name = 'Unsupported Test Command';
		main.handler(myEvent, {
			fail: function(response) {
				var expected = testEvents.ControlAlphaNumericErrorResponse;
				expected.header.name = myEvent.header.name;
				assert.deepEqual(response, testEvents.ControlAlphaNumericErrorResponse, 'generates an unsupported operation error');
				done();				
			},
			succeed: function(response) {
				assert.fail(1,1,'success block should not be called');
			}
		});
	});

	it('Should return error if missing parameters for brightness command', function(done) {
		var eventData = new TestEvents();
		var myEvent = eventData.ControlAlphaNumeric;
		myEvent.payload.appliance.additionalApplianceDetails.particle_device_id = particle_device_id;
		delete myEvent.payload.adjustmentValue;
		main.handler(myEvent, {
			fail: function(response) {
				assert.strictEqual(response.payload.success, false, 'should have success set to false');
				assert.strictEqual(response.payload.exception.code, 'UNEXPECTED_INFORMATION_RECEIVED');
				assert.ok(response.payload.exception.description, 'should have an exception description');
				done();				
			},
			succeed: function(response) {
				assert.fail(1,1,'success block should not be called');
			}
		});
	});
	it('Should return error if unit type is unsupported for brightness command', function(done) {
		var eventData = new TestEvents();
		var myEvent = eventData.ControlAlphaNumeric;
		myEvent.payload.appliance.additionalApplianceDetails.particle_device_id = particle_device_id;
		myEvent.payload.adjustmentUnit = 'Snickers Bar';
		main.handler(myEvent, {
			fail: function(response) {
				assert.strictEqual(response.payload.success, false, 'should have success set to false');
				assert.strictEqual(response.payload.exception.code, 'UNSUPPORTED_TARGET_SETTING');
				assert.ok(response.payload.exception.description, 'should have an exception description');
				done();				
			},
			succeed: function(response) {
				assert.fail(1,1,'success block should not be called');
			}
		});
	});
	it('Should set brightness to absolute 100%', function(done) {
		var eventData = new TestEvents();
		var myEvent = eventData.ControlAlphaNumeric;
		assert.strictEqual(myEvent.payload.adjustmentType, 'ABSOLUTE');
		assert.strictEqual(myEvent.payload.adjustmentValue, 100.0);
		assert.strictEqual(myEvent.payload.adjustmentUnit, 'PERCENTAGE');
		myEvent.payload.appliance.additionalApplianceDetails.particle_device_id = particle_device_id;
		main.handler(myEvent, {
			fail: function() {
				assert.fail(1,1,'fail block should not be called');
			},
			succeed: function(response) {
				assert.strictEqual(response.payload.success, true, 'should have success set to true');
				done();
			}
		});
	});
	it('Should set brightness relative -50%', function(done) {
		var eventData = new TestEvents();
		var myEvent = eventData.ControlAlphaNumeric;
		myEvent.payload.adjustmentType = 'RELATIVE';
		myEvent.payload.adjustmentValue = -50.0;
		assert.strictEqual(myEvent.payload.adjustmentUnit, 'PERCENTAGE');
		myEvent.payload.appliance.additionalApplianceDetails.particle_device_id = particle_device_id;
		main.handler(myEvent, {
			fail: function() {
				assert.fail(1,1,'fail block should not be called');
			},
			succeed: function(response) {
				assert.strictEqual(response.payload.success, true, 'should have success set to true');
				done();
			}
		});
	});
	*/

	// write tests for missing value/unit/type for brightness 
});

/**
 * Tests the particle.js module
 */
describe('Particle Module', function() {
	var particle_device_id;
	var devices = config.get('Particle.devices');
	var firstDevice = devices[0];
	var device = new Particle(firstDevice);

	it('Should build particle cloud function URLs', function(done) {
		var urlWithoutFunction = device.makeURL('XXX');
		var urlWithFunction = device.makeURL('XXX', 'dog');
		assert.strictEqual('https://api.particle.io/v1/devices/XXX', urlWithoutFunction);
		assert.strictEqual('https://api.particle.io/v1/devices/XXX/dog', urlWithFunction);
		var withToken = device.appendAccessTokenForGetRequest(urlWithoutFunction);
		assert.strictEqual('https://api.particle.io/v1/devices/XXX?access_token='+device.particle_access_token, withToken);
		done();
	});

});

