export interface Performance {
  id: number;
  title: string;
  performance_date: string;
  start_time: string | null;
  event_type: string;
  venue: string;
  city: string;
  duration_minutes: number;
  conductor: string;
  description: string;
  is_published?: boolean;
}

export interface PerformanceListResponse {
  data: Performance[];
}

export interface PerformanceSingleResponse {
  data: Performance;
}
