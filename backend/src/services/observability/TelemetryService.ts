export type MetricType = 'gauge' | 'counter' | 'histogram';

export interface TelemetryEvent {
  metricName: string;
  type: MetricType;
  value: number;
  tags: Record<string, string | number | boolean>;
}

export class TelemetryService {
  // In a real enterprise system, this would push to a Prometheus pushgateway or DogStatsD.
  // We mock the generic abstraction layer here.
  
  private static pushMetric(event: TelemetryEvent) {
    // We suppress console output for metrics unless in debug mode, 
    // to keep logs strictly JSON-focused.
    if (process.env.DEBUG_METRICS === 'true') {
      console.log(`[METRIC] ${event.type.toUpperCase()} ${event.metricName}=${event.value} tags=${JSON.stringify(event.tags)}`);
    }
  }

  public static recordCounter(name: string, value: number, tags: Record<string, any> = {}) {
    this.pushMetric({ metricName: name, type: 'counter', value, tags });
  }

  public static recordGauge(name: string, value: number, tags: Record<string, any> = {}) {
    this.pushMetric({ metricName: name, type: 'gauge', value, tags });
  }

  public static recordHistogram(name: string, value: number, tags: Record<string, any> = {}) {
    this.pushMetric({ metricName: name, type: 'histogram', value, tags });
  }
}
