import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '@/store/store';
import {
  fetchSafetyScore,
  fetchTravelAdvisories,
  createEmergencyKit,
  addMedicationReminder,
  addHealthCondition,
  fetchNearbyWaterSources,
  testWaterQuality,
  setActiveKit,
  updateMedicationReminder,
  removeMedicationReminder,
  updateHealthCondition,
  removeHealthCondition,
  setNextMedicationReminder,
  updateWaterSource,
  setSafetyFilters,
  addOfflineKit,
  clearError,
} from '../store/safetySlice';
import {
  EmergencyKit,
  MedicationReminder,
  HealthCondition,
  WaterSource,
  Coordinates,
  SafetyFilters,
} from '../types/emergency';

export const useSafetyStore = () => {
  const dispatch = useDispatch<AppDispatch>();
  const safetyState = useSelector((state: RootState) => state.safety);

  // Safety score actions
  const loadSafetyScore = useCallback(
    async (location: Coordinates) => {
      await dispatch(fetchSafetyScore(location));
    },
    [dispatch]
  );

  // Travel advisory actions
  const loadTravelAdvisories = useCallback(
    async (country: string) => {
      await dispatch(fetchTravelAdvisories(country));
    },
    [dispatch]
  );

  // Emergency kit actions
  const createKit = useCallback(
    async (kit: Omit<EmergencyKit, 'id'>) => {
      await dispatch(createEmergencyKit(kit));
    },
    [dispatch]
  );

  const selectKit = useCallback(
    (kit: EmergencyKit | null) => {
      dispatch(setActiveKit(kit));
    },
    [dispatch]
  );

  const saveOfflineKit = useCallback(
    (kit: EmergencyKit) => {
      dispatch(addOfflineKit(kit));
    },
    [dispatch]
  );

  // Medication actions
  const addMedication = useCallback(
    async (medication: Omit<MedicationReminder, 'id'>) => {
      await dispatch(addMedicationReminder(medication));
    },
    [dispatch]
  );

  const updateMedication = useCallback(
    (medication: MedicationReminder) => {
      dispatch(updateMedicationReminder(medication));
    },
    [dispatch]
  );

  const removeMedication = useCallback(
    (medicationId: string) => {
      dispatch(removeMedicationReminder(medicationId));
    },
    [dispatch]
  );

  const setNextReminder = useCallback(
    (reminder: MedicationReminder | null) => {
      dispatch(setNextMedicationReminder(reminder));
    },
    [dispatch]
  );

  // Health condition actions
  const addCondition = useCallback(
    async (condition: Omit<HealthCondition, 'id'>) => {
      await dispatch(addHealthCondition(condition));
    },
    [dispatch]
  );

  const updateCondition = useCallback(
    (condition: HealthCondition) => {
      dispatch(updateHealthCondition(condition));
    },
    [dispatch]
  );

  const removeCondition = useCallback(
    (conditionId: string) => {
      dispatch(removeHealthCondition(conditionId));
    },
    [dispatch]
  );

  // Water safety actions
  const loadNearbyWaterSources = useCallback(
    async (location: Coordinates, radius: number) => {
      await dispatch(fetchNearbyWaterSources({ location, radius }));
    },
    [dispatch]
  );

  const testWater = useCallback(
    async (sourceId: string, testKit?: string) => {
      await dispatch(testWaterQuality({ sourceId, testKit }));
    },
    [dispatch]
  );

  const updateWater = useCallback(
    (source: WaterSource) => {
      dispatch(updateWaterSource(source));
    },
    [dispatch]
  );

  // Filter actions
  const setFilters = useCallback(
    (filters: SafetyFilters) => {
      dispatch(setSafetyFilters(filters));
    },
    [dispatch]
  );

  // Error handling
  const clearSafetyError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  // Computed values
  const getUpcomingMedications = useCallback(() => {
    const now = new Date();
    const upcoming = safetyState.medications.filter(med => {
      if (!med.endDate || new Date(med.endDate) > now) {
        // Check if it's time for the next dose
        const nextDoseTime = new Date();
        const [hours, minutes] = med.times[0].split(':');
        nextDoseTime.setHours(parseInt(hours), parseInt(minutes));
        
        return nextDoseTime > now;
      }
      return false;
    });
    
    return upcoming.sort((a, b) => {
      const timeA = new Date();
      const [hoursA, minutesA] = a.times[0].split(':');
      timeA.setHours(parseInt(hoursA), parseInt(minutesA));
      
      const timeB = new Date();
      const [hoursB, minutesB] = b.times[0].split(':');
      timeB.setHours(parseInt(hoursB), parseInt(minutesB));
      
      return timeA.getTime() - timeB.getTime();
    });
  }, [safetyState.medications]);

  const getSafeWaterSources = useCallback(() => {
    return safetyState.waterSources.filter(source => source.quality === 'safe');
  }, [safetyState.waterSources]);

  const getKitsByType = useCallback(
    (type: EmergencyKit['type']) => {
      return safetyState.emergencyKits.filter(kit => kit.type === type);
    },
    [safetyState.emergencyKits]
  );

  const getActiveHealthConditions = useCallback(() => {
    return safetyState.healthConditions.filter(
      condition => condition.severity === 'severe' || condition.severity === 'moderate'
    );
  }, [safetyState.healthConditions]);

  const calculateOverallSafetyLevel = useCallback(() => {
    if (!safetyState.safetyScore) return 'unknown';
    
    const score = safetyState.safetyScore.overall;
    if (score >= 80) return 'safe';
    if (score >= 60) return 'moderate';
    if (score >= 40) return 'caution';
    return 'danger';
  }, [safetyState.safetyScore]);

  return {
    // State
    ...safetyState,
    
    // Safety score actions
    loadSafetyScore,
    calculateOverallSafetyLevel,
    
    // Travel advisory actions
    loadTravelAdvisories,
    
    // Emergency kit actions
    createKit,
    selectKit,
    saveOfflineKit,
    getKitsByType,
    
    // Medication actions
    addMedication,
    updateMedication,
    removeMedication,
    setNextReminder,
    getUpcomingMedications,
    
    // Health condition actions
    addCondition,
    updateCondition,
    removeCondition,
    getActiveHealthConditions,
    
    // Water safety actions
    loadNearbyWaterSources,
    testWater,
    updateWater,
    getSafeWaterSources,
    
    // Filter actions
    setFilters,
    
    // Error handling
    clearSafetyError,
  };
};