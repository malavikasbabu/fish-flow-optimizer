
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          role: 'admin' | 'operator' | 'planner';
          region: string;
          phone: string | null;
          organization: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          role?: 'admin' | 'operator' | 'planner';
          region?: string;
          phone?: string | null;
          organization?: string | null;
        };
        Update: {
          full_name?: string | null;
          phone?: string | null;
          organization?: string | null;
        };
      };
      ports: {
        Row: {
          id: string;
          name: string;
          code: string;
          location_lat: number;
          location_lng: number;
          region: string;
          state: string;
          contact_person: string | null;
          phone: string | null;
          active: boolean;
          created_at: string;
        };
      };
      markets: {
        Row: {
          id: string;
          name: string;
          city: string;
          location_lat: number;
          location_lng: number;
          state: string;
          population_served: number | null;
          market_type: string;
          active: boolean;
          created_at: string;
        };
      };
      cold_storage: {
        Row: {
          id: string;
          name: string;
          location_lat: number;
          location_lng: number;
          city: string;
          state: string;
          capacity_kg: number;
          cost_per_hour: number;
          temperature_range: string;
          refrigeration_type: string;
          contact_person: string | null;
          phone: string | null;
          active: boolean;
          created_at: string;
        };
      };
      trucks: {
        Row: {
          id: string;
          license_plate: string;
          truck_type: 'refrigerated' | 'regular';
          capacity_kg: number;
          cost_per_km: number;
          max_distance_km: number;
          fuel_efficiency_kmpl: number;
          owner_name: string | null;
          phone: string | null;
          home_port_id: string | null;
          available: boolean;
          created_at: string;
        };
      };
      daily_catches: {
        Row: {
          id: string;
          port_id: string;
          user_id: string;
          catch_date: string;
          fish_type: 'tilapia' | 'pomfret' | 'mackerel' | 'sardine' | 'tuna';
          volume_kg: number;
          quality_grade: string;
          estimated_price_per_kg: number | null;
          weather_conditions: string | null;
          created_at: string;
        };
        Insert: {
          port_id: string;
          user_id: string;
          catch_date: string;
          fish_type: 'tilapia' | 'pomfret' | 'mackerel' | 'sardine' | 'tuna';
          volume_kg: number;
          quality_grade?: string;
          estimated_price_per_kg?: number | null;
          weather_conditions?: string | null;
        };
      };
      market_demand: {
        Row: {
          id: string;
          market_id: string;
          demand_date: string;
          fish_type: 'tilapia' | 'pomfret' | 'mackerel' | 'sardine' | 'tuna';
          quantity_kg: number;
          price_per_kg: number;
          seasonal_factor: number;
          created_at: string;
        };
      };
      spoilage_profiles: {
        Row: {
          id: string;
          fish_type: 'tilapia' | 'pomfret' | 'mackerel' | 'sardine' | 'tuna';
          unrefrigerated_hours: number;
          refrigerated_hours: number;
          temperature_threshold_celsius: number;
          spoilage_rate_per_hour: number;
          created_at: string;
        };
      };
      optimization_results: {
        Row: {
          id: string;
          user_id: string;
          port_id: string;
          market_id: string;
          cold_storage_id: string | null;
          truck_id: string;
          fish_type: 'tilapia' | 'pomfret' | 'mackerel' | 'sardine' | 'tuna';
          volume_kg: number;
          distance_km: number;
          travel_time_hours: number;
          spoilage_percentage: number;
          revenue: number;
          total_cost: number;
          net_profit: number;
          route_data: any;
          optimization_date: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          port_id: string;
          market_id: string;
          cold_storage_id?: string | null;
          truck_id: string;
          fish_type: 'tilapia' | 'pomfret' | 'mackerel' | 'sardine' | 'tuna';
          volume_kg: number;
          distance_km: number;
          travel_time_hours: number;
          spoilage_percentage: number;
          revenue: number;
          total_cost: number;
          net_profit: number;
          route_data?: any;
        };
      };
      forecasts: {
        Row: {
          id: string;
          forecast_type: string;
          target_date: string;
          fish_type: 'tilapia' | 'pomfret' | 'mackerel' | 'sardine' | 'tuna' | null;
          market_id: string | null;
          predicted_value: number;
          confidence_level: number;
          factors: any;
          created_at: string;
        };
      };
    };
  };
}
