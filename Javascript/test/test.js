process.env.NODE_ENV = 'test';	// See log.js

var assert = require('assert');
var config = require('config');
var fs = require('fs');

var main = require('../index.js');
var TestEvents = require('./test-events.js');
var particle = require('../particle.js');


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
		assert(config.get('Particle.istanbul_lamp_device_id'));
		assert(config.get('Particle.istanbul_lamp_appliance_id'));
		assert(config.get('Amazon.lambda-arn'));
		assert(config.get('Amazon.profile'));
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
 * Tests that excersise handling requests from the Alexa Lighting API.
 * See https://developer.amazon.com/public/binaries/content/assets/html/alexa-lighting-api.html
 */
describe('Alexa Lighting API', function() {
	this.timeout(5000);
	var particle_device_id;
	it('Should discover one light', function(done) {
		main.handler(TestEvents.LightingAPI.Discover, {
			fail: function() {
				assert.fail(1,1,'fail block should not be called');
			},
			succeed: function(response) {
				var appliances = response.payload.discoveredAppliances;
				assert.equal(appliances.length, 1, 'expect 1 device to be found');
				particle_device_id = appliances[0].additionalApplianceDetails.particle_device_id;
				assert.ok(particle_device_id,'Discovery response should contain a particle device ID');
				done();
			}
		});
	});
	it('Should check health of Particle Cloud server', function(done) {
		main.handler(TestEvents.LightingAPI.System, {
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
	it('Should turn on one light', function(done) {
		var myEvent = TestEvents.LightingAPI.ControlOn;
		assert.ok(particle_device_id, 'should be set from previous test');
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
	it('Should turn off one light', function(done) {
		var myEvent = TestEvents.LightingAPI.ControlOff;
		assert.ok(particle_device_id, 'should be set from previous test');
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
	it('Should handle missing particle_device_id in control command', function(done) {
		var myEvent = TestEvents.LightingAPI.ControlOff;
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
	it('Should handle unsupported AdjustNumericalSettingResponse command', function(done) {
		var myEvent = TestEvents.LightingAPI.ControlAlphaNumeric;
		main.handler(myEvent, {
			fail: function(response) {
				assert.deepEqual(response, TestEvents.LightingAPI.ControlAlphaNumericErrorResponse, 'generates an unsupported operation error');
				done();				
			},
			succeed: function(response) {
				assert.fail(1,1,'success block should not be called');
			}
		});
	});
});

/**
 * Tests the particle.js module
 */
describe('Particle Module', function() {
	this.timeout(5000);
	var particle_device_id;
	it('Should build particle cloud function URLs', function() {
		var urlWithoutFunction = particle.makeURL('XXX');
		var urlWithFunction = particle.makeURL('XXX', 'dog');
		assert.strictEqual('https://api.particle.io/v1/devices/XXX', urlWithoutFunction);
		assert.strictEqual('https://api.particle.io/v1/devices/XXX/dog', urlWithFunction);
		var withToken = particle.appendAccessTokenForGetRequest(urlWithoutFunction);
		assert.strictEqual('https://api.particle.io/v1/devices/XXX?access_token='+particle.particle_access_token, withToken);
	});
});

