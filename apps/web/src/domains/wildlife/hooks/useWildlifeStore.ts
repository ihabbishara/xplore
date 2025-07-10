import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '@/store';
import {
  fetchSpecies,
  fetchSpeciesById,
  fetchSightings,
  fetchNearbySightings,
  createSighting,
  verifySighting,
  fetchMigrationPatterns,
  fetchActivityPatterns,
  fetchNearbyHides,
  fetchSightingStatistics,
  setSelectedSpecies,
  setSelectedSighting,
  updateSighting,
  addRealtimeSighting,
  setActiveFilters,
  updateFilter,
  clearFilters,
  clearError,
} from '../store/wildlifeSlice';
import {
  WildlifeSpecies,
  WildlifeSighting,
  WildlifeFilters,
  Coordinates,
  VerificationStatus,
  Season,
  ActivityPeriod,
} from '../types/wildlife';

export const useWildlifeStore = () => {
  const dispatch = useDispatch<AppDispatch>();
  const wildlifeState = useSelector((state: RootState) => state.wildlife);

  // Species actions
  const loadSpecies = useCallback(
    async (filters?: WildlifeFilters) => {
      await dispatch(fetchSpecies(filters));
    },
    [dispatch]
  );

  const loadSpeciesById = useCallback(
    async (speciesId: string) => {
      await dispatch(fetchSpeciesById(speciesId));
    },
    [dispatch]
  );

  const selectSpecies = useCallback(
    (species: WildlifeSpecies | null) => {
      dispatch(setSelectedSpecies(species));
    },
    [dispatch]
  );

  // Sighting actions
  const loadSightings = useCallback(
    async (filters?: WildlifeFilters) => {
      await dispatch(fetchSightings(filters));
    },
    [dispatch]
  );

  const loadNearbySightings = useCallback(
    async (location: Coordinates, radius: number) => {
      await dispatch(fetchNearbySightings({ location, radius }));
    },
    [dispatch]
  );

  const reportSighting = useCallback(
    async (sighting: Omit<WildlifeSighting, 'id' | 'createdAt' | 'updatedAt'>) => {
      await dispatch(createSighting(sighting));
    },
    [dispatch]
  );

  const selectSighting = useCallback(
    (sighting: WildlifeSighting | null) => {
      dispatch(setSelectedSighting(sighting));
    },
    [dispatch]
  );

  const updateSightingData = useCallback(
    (sighting: WildlifeSighting) => {
      dispatch(updateSighting(sighting));
    },
    [dispatch]
  );

  const addRealtime = useCallback(
    (sighting: WildlifeSighting) => {
      dispatch(addRealtimeSighting(sighting));
    },
    [dispatch]
  );

  // Verification
  const verifySightingReport = useCallback(
    async (sightingId: string, status: VerificationStatus, notes?: string) => {
      await dispatch(verifySighting({ sightingId, status, notes }));
    },
    [dispatch]
  );

  // Migration actions
  const loadMigrationPatterns = useCallback(
    async (speciesId?: string) => {
      await dispatch(fetchMigrationPatterns(speciesId));
    },
    [dispatch]
  );

  // Activity patterns
  const loadActivityPatterns = useCallback(
    async (speciesId: string) => {
      await dispatch(fetchActivityPatterns(speciesId));
    },
    [dispatch]
  );

  // Wildlife hides
  const loadNearbyHides = useCallback(
    async (location: Coordinates, radius: number) => {
      await dispatch(fetchNearbyHides({ location, radius }));
    },
    [dispatch]
  );

  // Statistics
  const loadSightingStatistics = useCallback(
    async (speciesId: string, location?: Coordinates, radius?: number) => {
      await dispatch(fetchSightingStatistics({ speciesId, location, radius }));
    },
    [dispatch]
  );

  // Filter actions
  const setFilters = useCallback(
    (filters: WildlifeFilters) => {
      dispatch(setActiveFilters(filters));
    },
    [dispatch]
  );

  const updateSingleFilter = useCallback(
    (filter: Partial<WildlifeFilters>) => {
      dispatch(updateFilter(filter));
    },
    [dispatch]
  );

  const clearAllFilters = useCallback(() => {
    dispatch(clearFilters());
  }, [dispatch]);

  // Error handling
  const clearWildlifeError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  // Computed values
  const getSpeciesByConservationStatus = useCallback(
    (status: string) => {
      return wildlifeState.species.filter(s => s.conservationStatus === status);
    },
    [wildlifeState.species]
  );

  const getRecentSightings = useCallback(
    (days: number = 7) => {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      return wildlifeState.sightings.filter(s => new Date(s.timestamp) > cutoff);
    },
    [wildlifeState.sightings]
  );

  const getVerifiedSightings = useCallback(() => {
    return wildlifeState.sightings.filter(
      s => s.verificationStatus === VerificationStatus.VERIFIED ||
           s.verificationStatus === VerificationStatus.EXPERT_VERIFIED
    );
  }, [wildlifeState.sightings]);

  const getCurrentSeasonActivity = useCallback(
    (speciesId: string) => {
      const patterns = wildlifeState.activityPatterns[speciesId];
      if (!patterns) return null;

      const currentMonth = new Date().getMonth();
      const season = currentMonth >= 2 && currentMonth <= 4 ? Season.SPRING :
                    currentMonth >= 5 && currentMonth <= 7 ? Season.SUMMER :
                    currentMonth >= 8 && currentMonth <= 10 ? Season.FALL :
                    Season.WINTER;

      return patterns.map(p => ({
        ...p,
        currentProbability: p.seasonalVariation[season] || p.probability,
      }));
    },
    [wildlifeState.activityPatterns]
  );

  const getBestViewingTime = useCallback(
    (speciesId: string): ActivityPeriod | null => {
      const patterns = wildlifeState.activityPatterns[speciesId];
      if (!patterns || patterns.length === 0) return null;

      const seasonActivity = getCurrentSeasonActivity(speciesId);
      if (!seasonActivity) return null;

      const best = seasonActivity.reduce((prev, current) =>
        prev.currentProbability > current.currentProbability ? prev : current
      );

      return best.period;
    },
    [wildlifeState.activityPatterns, getCurrentSeasonActivity]
  );

  return {
    // State
    ...wildlifeState,
    
    // Species actions
    loadSpecies,
    loadSpeciesById,
    selectSpecies,
    getSpeciesByConservationStatus,
    
    // Sighting actions
    loadSightings,
    loadNearbySightings,
    reportSighting,
    selectSighting,
    updateSightingData,
    addRealtime,
    getRecentSightings,
    getVerifiedSightings,
    
    // Verification
    verifySightingReport,
    
    // Migration
    loadMigrationPatterns,
    
    // Activity
    loadActivityPatterns,
    getCurrentSeasonActivity,
    getBestViewingTime,
    
    // Hides
    loadNearbyHides,
    
    // Statistics
    loadSightingStatistics,
    
    // Filters
    setFilters,
    updateSingleFilter,
    clearAllFilters,
    
    // Error handling
    clearWildlifeError,
  };
};