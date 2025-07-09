import {api} from '../../../services/api';
import {Location} from '../types/location.types';

export const searchLocations = async (query: string): Promise<Location[]> => {
  try {
    const response = await api.get<{data: Location[]}>('/locations/search', {
      params: {query},
    });
    return response.data.data;
  } catch (error) {
    console.error('Error searching locations:', error);
    return [];
  }
};

export const getLocationDetails = async (
  locationId: string,
): Promise<Location | null> => {
  try {
    const response = await api.get<{data: Location}>(
      `/locations/${locationId}`,
    );
    return response.data.data;
  } catch (error) {
    console.error('Error fetching location details:', error);
    return null;
  }
};

export const toggleLocationFavorite = async (
  locationId: string,
): Promise<boolean> => {
  try {
    await api.post(`/locations/${locationId}/favorite`);
    return true;
  } catch (error) {
    console.error('Error toggling favorite:', error);
    return false;
  }
};

export const getUserFavoriteLocations = async (): Promise<Location[]> => {
  try {
    const response = await api.get<{data: Location[]}>('/locations/favorites');
    return response.data.data;
  } catch (error) {
    console.error('Error fetching favorites:', error);
    return [];
  }
};