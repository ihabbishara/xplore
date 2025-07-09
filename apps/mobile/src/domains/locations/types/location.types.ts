export interface Location {
  id: string;
  name: string;
  country: string;
  region?: string;
  description?: string;
  imageUrl?: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  tags?: string[];
  isFavorite?: boolean;
  climate?: {
    type: string;
    averageTemperature: number;
  };
  population?: number;
  costOfLiving?: string;
}