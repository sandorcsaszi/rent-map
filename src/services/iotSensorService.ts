import { supabase } from '../lib/supabase';
import type {
  IoTSensorPayload,
  IoTSensorResponse,
  SensorDataFilter,
  SensorStatistics,
  IoTGatewayRegistration
} from '../types/IoTSensor';

/**
 * IoT Szenzor szolgáltatás
 * Kezeli az IoT gateway és szenzor adatok kommunikációját
 */
export class IoTSensorService {
  /**
   * Szenzor adatok küldése a backend-nek
   * @param payload IoT szenzor payload
   * @returns API válasz
   */
  static async sendSensorData(payload: IoTSensorPayload): Promise<IoTSensorResponse> {
    try {
      // Validálás
      if (!payload.gateway_id || !payload.place_id || !payload.sensors || payload.sensors.length === 0) {
        return {
          success: false,
          message: 'Invalid sensor data format',
          error: 'Missing required fields',
          details: 'gateway_id, place_id, and sensors array are required'
        };
      }

      // Ellenőrizzük, hogy a place_id létezik-e
      const { data: placeExists } = await supabase
        .from('places')
        .select('id')
        .eq('id', payload.place_id)
        .single();

      if (!placeExists) {
        return {
          success: false,
          message: 'Place not found',
          error: 'Invalid place_id',
          details: `Place with id ${payload.place_id} does not exist`
        };
      }

      // Szenzor adatok mentése (ha létezik sensor_readings tábla)
      // Ez opcionális - csak akkor működik, ha a tábla létre van hozva
      try {
        const readings = payload.sensors.map(sensor => ({
          gateway_id: payload.gateway_id,
          place_id: payload.place_id,
          sensor_id: sensor.sensor_id,
          sensor_type: sensor.sensor_type,
          value: sensor.value,
          unit: sensor.unit,
          timestamp: sensor.timestamp,
          location: payload.location ? `POINT(${payload.location.lng} ${payload.location.lat})` : null,
          metadata: payload.metadata || null
        }));

        const { data, error } = await supabase
          .from('sensor_readings')
          .insert(readings)
          .select('id')
          .single();

        if (error) {
          console.warn('Sensor readings table might not exist yet:', error.message);
          // Ha a tábla nem létezik, csak logoljuk az adatokat
          console.log('Sensor data received:', JSON.stringify(payload, null, 2));
          
          return {
            success: true,
            message: 'Sensor data received (storage pending)',
            timestamp: new Date().toISOString()
          };
        }

        return {
          success: true,
          message: 'Sensor data received successfully',
          data_id: data?.id,
          timestamp: new Date().toISOString()
        };
      } catch (storageError) {
        console.warn('Storage error:', storageError);
        console.log('Sensor data received:', JSON.stringify(payload, null, 2));
        
        return {
          success: true,
          message: 'Sensor data received (logged)',
          timestamp: new Date().toISOString()
        };
      }
    } catch (error) {
      console.error('Error processing sensor data:', error);
      return {
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Szenzor adatok lekérdezése
   * @param filter Szűrési kritériumok
   * @returns Szenzor adatok
   */
  static async getSensorData(filter: SensorDataFilter) {
    try {
      let query = supabase
        .from('sensor_readings')
        .select('*')
        .order('timestamp', { ascending: false });

      if (filter.gateway_id) {
        query = query.eq('gateway_id', filter.gateway_id);
      }
      if (filter.place_id) {
        query = query.eq('place_id', filter.place_id);
      }
      if (filter.sensor_type) {
        query = query.eq('sensor_type', filter.sensor_type);
      }
      if (filter.start_date) {
        query = query.gte('timestamp', filter.start_date);
      }
      if (filter.end_date) {
        query = query.lte('timestamp', filter.end_date);
      }

      const { data, error } = await query.limit(1000);

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching sensor data:', error);
      return [];
    }
  }

  /**
   * Szenzor statisztikák lekérése
   * @param placeId Hely azonosító
   * @param sensorType Szenzor típus
   * @returns Statisztikák
   */
  static async getSensorStatistics(
    placeId: string,
    sensorType?: string
  ): Promise<SensorStatistics[]> {
    try {
      // Ez egy komplex lekérdezés, ami aggregációt igényel
      // Jelenleg egyszerű implementáció
      const filter: SensorDataFilter = {
        place_id: placeId,
        ...(sensorType && { sensor_type: sensorType as any })
      };

      const readings = await this.getSensorData(filter);

      if (readings.length === 0) {
        return [];
      }

      // Csoportosítás szenzor típus szerint
      const grouped = readings.reduce((acc: any, reading: any) => {
        if (!acc[reading.sensor_type]) {
          acc[reading.sensor_type] = [];
        }
        acc[reading.sensor_type].push(reading.value);
        return acc;
      }, {});

      // Statisztikák számítása
      return Object.entries(grouped).map(([type, values]: [string, any]) => ({
        sensor_type: type as any,
        min: Math.min(...values),
        max: Math.max(...values),
        avg: values.reduce((a: number, b: number) => a + b, 0) / values.length,
        count: values.length,
        period: 'day' as const
      }));
    } catch (error) {
      console.error('Error fetching sensor statistics:', error);
      return [];
    }
  }

  /**
   * Gateway regisztráció
   * @param registration Gateway adatok
   * @returns Regisztrált gateway
   */
  static async registerGateway(
    registration: Omit<IoTGatewayRegistration, 'created_at' | 'updated_at'>
  ): Promise<IoTGatewayRegistration | null> {
    try {
      const { data, error } = await supabase
        .from('iot_gateways')
        .insert([registration])
        .select()
        .single();

      if (error) {
        console.error('Error registering gateway:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error registering gateway:', error);
      return null;
    }
  }

  /**
   * Gateway lekérdezése place_id alapján
   * @param placeId Hely azonosító
   * @returns Gateway adatok
   */
  static async getGatewaysByPlace(placeId: string): Promise<IoTGatewayRegistration[]> {
    try {
      const { data, error } = await supabase
        .from('iot_gateways')
        .select('*')
        .eq('place_id', placeId)
        .eq('active', true);

      if (error) {
        console.error('Error fetching gateways:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching gateways:', error);
      return [];
    }
  }
}

/**
 * Példa használat
 * 
 * // Szenzor adatok küldése
 * const payload: IoTSensorPayload = {
 *   gateway_id: 'gateway-001',
 *   timestamp: new Date().toISOString(),
 *   place_id: 'uuid-of-place',
 *   sensors: [
 *     {
 *       sensor_id: 'temp-001',
 *       sensor_type: 'temperature',
 *       value: 22.5,
 *       unit: 'celsius',
 *       timestamp: new Date().toISOString()
 *     }
 *   ]
 * };
 * 
 * const response = await IoTSensorService.sendSensorData(payload);
 * console.log(response);
 */
