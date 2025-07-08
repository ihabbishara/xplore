export interface LocationSearchResult {
  id: string;
  name: string;
  country: string;
  city?: string;
  state?: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  type: 'country' | 'city' | 'place';
  fullAddress?: string;
}

export interface LocationSearchRequest {
  query: string;
  types?: string[];
  limit?: number;
}