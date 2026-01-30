# IoT Gateway Integration

## 🌐 Overview

The IoT Gateway integration allows smart sensors in rental properties to send data to the backend system. This enables monitoring of apartment conditions, improving the rental experience with real-time environmental data.

## 📡 JSON Format Specification

### Gateway to Backend - Sensor Data Payload

The IoT gateway sends sensor data from apartments to the backend using the following JSON structure:

```json
{
  "gateway_id": "gateway-001-budapest",
  "timestamp": "2026-01-30T23:25:00.000Z",
  "place_id": "uuid-of-the-rental-place",
  "sensors": [
    {
      "sensor_id": "temp-001",
      "sensor_type": "temperature",
      "value": 22.5,
      "unit": "celsius",
      "timestamp": "2026-01-30T23:25:00.000Z"
    },
    {
      "sensor_id": "hum-001",
      "sensor_type": "humidity",
      "value": 45.2,
      "unit": "percent",
      "timestamp": "2026-01-30T23:25:00.000Z"
    },
    {
      "sensor_id": "air-001",
      "sensor_type": "air_quality",
      "value": 350,
      "unit": "ppm",
      "timestamp": "2026-01-30T23:25:00.000Z"
    },
    {
      "sensor_id": "noise-001",
      "sensor_type": "noise_level",
      "value": 42,
      "unit": "decibels",
      "timestamp": "2026-01-30T23:25:00.000Z"
    },
    {
      "sensor_id": "light-001",
      "sensor_type": "light_level",
      "value": 450,
      "unit": "lux",
      "timestamp": "2026-01-30T23:25:00.000Z"
    }
  ],
  "location": {
    "lat": 47.4979,
    "lng": 19.0402
  },
  "metadata": {
    "firmware_version": "1.0.0",
    "battery_level": 85,
    "signal_strength": -65
  }
}
```

## 📋 Field Descriptions

### Root Level Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `gateway_id` | string | Yes | Unique identifier for the IoT gateway device |
| `timestamp` | string (ISO 8601) | Yes | Timestamp when the data was collected |
| `place_id` | string (UUID) | Yes | Reference to the rental place/apartment |
| `sensors` | array | Yes | Array of sensor readings |
| `location` | object | No | GPS coordinates of the gateway |
| `metadata` | object | No | Additional gateway information |

### Sensor Object Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `sensor_id` | string | Yes | Unique identifier for the sensor |
| `sensor_type` | string | Yes | Type of sensor (see supported types below) |
| `value` | number | Yes | Sensor reading value |
| `unit` | string | Yes | Unit of measurement |
| `timestamp` | string (ISO 8601) | Yes | When this specific reading was taken |

### Supported Sensor Types

| Sensor Type | Description | Common Units |
|-------------|-------------|--------------|
| `temperature` | Indoor temperature | celsius, fahrenheit |
| `humidity` | Relative humidity | percent |
| `air_quality` | Air quality index | ppm, aqi |
| `noise_level` | Sound level | decibels |
| `light_level` | Ambient light | lux |
| `motion` | Motion detection | boolean, count |
| `door_window` | Door/window status | open, closed |
| `smoke` | Smoke detection | boolean |
| `co2` | CO2 levels | ppm |
| `pressure` | Atmospheric pressure | hPa, mbar |

## 🔄 API Endpoint

### POST /api/iot/sensor-data

Endpoint for receiving sensor data from IoT gateways.

**Authentication**: API Key required in header
```
Authorization: Bearer <API_KEY>
```

**Request Body**: JSON payload as specified above

**Response**:
```json
{
  "success": true,
  "message": "Sensor data received successfully",
  "data_id": "uuid-of-stored-record",
  "timestamp": "2026-01-30T23:25:00.000Z"
}
```

**Error Response**:
```json
{
  "success": false,
  "error": "Invalid sensor data format",
  "details": "Missing required field: gateway_id"
}
```

## 📊 Example Use Cases

### 1. Basic Temperature and Humidity Monitoring
```json
{
  "gateway_id": "gateway-apt-101",
  "timestamp": "2026-01-30T14:30:00.000Z",
  "place_id": "abc123-def456-ghi789",
  "sensors": [
    {
      "sensor_id": "dht22-living",
      "sensor_type": "temperature",
      "value": 21.5,
      "unit": "celsius",
      "timestamp": "2026-01-30T14:30:00.000Z"
    },
    {
      "sensor_id": "dht22-living",
      "sensor_type": "humidity",
      "value": 48.0,
      "unit": "percent",
      "timestamp": "2026-01-30T14:30:00.000Z"
    }
  ]
}
```

### 2. Comprehensive Smart Apartment Monitoring
```json
{
  "gateway_id": "smart-home-hub-202",
  "timestamp": "2026-01-30T20:00:00.000Z",
  "place_id": "xyz789-abc123-def456",
  "sensors": [
    {
      "sensor_id": "temp-bedroom",
      "sensor_type": "temperature",
      "value": 19.8,
      "unit": "celsius",
      "timestamp": "2026-01-30T20:00:00.000Z"
    },
    {
      "sensor_id": "hum-bedroom",
      "sensor_type": "humidity",
      "value": 52.3,
      "unit": "percent",
      "timestamp": "2026-01-30T20:00:00.000Z"
    },
    {
      "sensor_id": "air-living",
      "sensor_type": "air_quality",
      "value": 420,
      "unit": "ppm",
      "timestamp": "2026-01-30T20:00:00.000Z"
    },
    {
      "sensor_id": "noise-street",
      "sensor_type": "noise_level",
      "value": 55,
      "unit": "decibels",
      "timestamp": "2026-01-30T20:00:00.000Z"
    },
    {
      "sensor_id": "door-main",
      "sensor_type": "door_window",
      "value": 0,
      "unit": "boolean",
      "timestamp": "2026-01-30T20:00:00.000Z"
    }
  ],
  "location": {
    "lat": 47.4979,
    "lng": 19.0402
  },
  "metadata": {
    "firmware_version": "2.1.0",
    "battery_level": 92,
    "signal_strength": -58
  }
}
```

### 3. Motion Detection Alert
```json
{
  "gateway_id": "security-gateway-303",
  "timestamp": "2026-01-30T02:15:30.000Z",
  "place_id": "motion-alert-place",
  "sensors": [
    {
      "sensor_id": "pir-hallway",
      "sensor_type": "motion",
      "value": 1,
      "unit": "boolean",
      "timestamp": "2026-01-30T02:15:30.000Z"
    }
  ],
  "metadata": {
    "firmware_version": "1.5.2",
    "battery_level": 78,
    "signal_strength": -72
  }
}
```

## 🔐 Security Considerations

1. **Authentication**: All requests must include a valid API key
2. **Rate Limiting**: Maximum 100 requests per minute per gateway
3. **Data Validation**: All fields are validated server-side
4. **Encryption**: HTTPS required for all communications
5. **Gateway Registration**: Gateways must be registered before sending data

## 📈 Data Storage

Sensor data is stored in the `sensor_readings` table with the following retention policy:
- **Raw data**: 30 days
- **Hourly aggregates**: 1 year
- **Daily aggregates**: Indefinite

## 🛠️ Integration Steps

1. **Register your IoT gateway** in the system
2. **Obtain API key** from the dashboard
3. **Configure gateway** with the API endpoint
4. **Start sending data** using the JSON format specified above
5. **Monitor** data reception in the dashboard

## 📞 Support

For IoT gateway integration support, please contact:
- Email: support@albiterkep.hu
- GitHub Issues: https://github.com/sandorcsaszi/rent-map/issues

## 🔗 Related Documentation

- [BKK Megállók Integration](./BKK_MEGALLOK.md)
- [Supabase Setup](../SUPABASE_SETUP.md)
- [API Documentation](./API.md)
