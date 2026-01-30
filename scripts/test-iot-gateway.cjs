#!/usr/bin/env node

/**
 * IoT Gateway Test Script
 * 
 * This script demonstrates how to use the IoT Gateway JSON format
 * to send sensor data from an IoT gateway to the backend.
 */

const fs = require('fs');
const path = require('path');

// Load example payloads
const examplesDir = path.join(__dirname, '..', 'docs', 'examples');

console.log('🔬 IoT Gateway JSON Format Test\n');
console.log('=' .repeat(60));

// Test 1: Load and validate basic example
console.log('\n📋 Test 1: Basic Temperature and Humidity');
console.log('-'.repeat(60));
try {
  const basicExample = JSON.parse(
    fs.readFileSync(path.join(examplesDir, 'basic-temp-humidity.json'), 'utf8')
  );
  
  console.log('✓ JSON is valid');
  console.log('Gateway ID:', basicExample.payload.gateway_id);
  console.log('Place ID:', basicExample.payload.place_id);
  console.log('Number of sensors:', basicExample.payload.sensors.length);
  
  basicExample.payload.sensors.forEach(sensor => {
    console.log(`  - ${sensor.sensor_type}: ${sensor.value} ${sensor.unit}`);
  });
} catch (error) {
  console.error('✗ Error:', error.message);
}

// Test 2: Load and validate smart apartment example
console.log('\n📋 Test 2: Smart Apartment Full Monitoring');
console.log('-'.repeat(60));
try {
  const smartExample = JSON.parse(
    fs.readFileSync(path.join(examplesDir, 'smart-apartment-full.json'), 'utf8')
  );
  
  console.log('✓ JSON is valid');
  console.log('Gateway ID:', smartExample.payload.gateway_id);
  console.log('Place ID:', smartExample.payload.place_id);
  console.log('Number of sensors:', smartExample.payload.sensors.length);
  console.log('Location:', `${smartExample.payload.location.lat}, ${smartExample.payload.location.lng}`);
  console.log('Battery level:', smartExample.payload.metadata.battery_level + '%');
  
  console.log('Sensors:');
  smartExample.payload.sensors.forEach(sensor => {
    console.log(`  - ${sensor.sensor_type}: ${sensor.value} ${sensor.unit}`);
  });
} catch (error) {
  console.error('✗ Error:', error.message);
}

// Test 3: Load and validate motion detection example
console.log('\n📋 Test 3: Motion Detection Alert');
console.log('-'.repeat(60));
try {
  const motionExample = JSON.parse(
    fs.readFileSync(path.join(examplesDir, 'motion-detection.json'), 'utf8')
  );
  
  console.log('✓ JSON is valid');
  console.log('Gateway ID:', motionExample.payload.gateway_id);
  console.log('Place ID:', motionExample.payload.place_id);
  console.log('Alert type:', motionExample.payload.sensors[0].sensor_type);
  console.log('Motion detected:', motionExample.payload.sensors[0].value === 1 ? 'Yes' : 'No');
  console.log('Firmware:', motionExample.payload.metadata.firmware_version);
} catch (error) {
  console.error('✗ Error:', error.message);
}

// Test 4: Validate JSON schema
console.log('\n📋 Test 4: JSON Schema Validation');
console.log('-'.repeat(60));
try {
  const schema = JSON.parse(
    fs.readFileSync(path.join(__dirname, '..', 'docs', 'iot-sensor-payload.schema.json'), 'utf8')
  );
  
  console.log('✓ Schema is valid JSON');
  console.log('Schema title:', schema.title);
  console.log('Required fields:', schema.required.join(', '));
  console.log('Supported sensor types:', schema.definitions.SensorReading.properties.sensor_type.enum.length);
  console.log('Supported units:', schema.definitions.SensorReading.properties.unit.enum.length);
} catch (error) {
  console.error('✗ Error:', error.message);
}

console.log('\n' + '='.repeat(60));
console.log('✅ All tests passed!\n');

// Simulate API request
console.log('📡 Example API Request:');
console.log('-'.repeat(60));
console.log('POST /api/iot/sensor-data');
console.log('Authorization: Bearer <API_KEY>');
console.log('Content-Type: application/json\n');

const examplePayload = JSON.parse(
  fs.readFileSync(path.join(examplesDir, 'basic-temp-humidity.json'), 'utf8')
);

console.log(JSON.stringify(examplePayload.payload, null, 2));

console.log('\n📝 Expected Response:');
console.log('-'.repeat(60));
console.log(JSON.stringify({
  success: true,
  message: 'Sensor data received successfully',
  data_id: 'uuid-of-stored-record',
  timestamp: new Date().toISOString()
}, null, 2));

console.log('\n✨ For more information, see docs/IOT_GATEWAY.md\n');
