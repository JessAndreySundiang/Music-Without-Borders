export interface Performance {
  id: number;
  title: string;
  performance_date: string;
  event_type: string;
  venue: string;
  city: string;
  duration_minutes: number;
  conductor: string;
  description: string;
}

export interface PerformanceListResponse {
  data: Performance[];
}

export interface PerformanceSingleResponse {
  data: Performance;
}
