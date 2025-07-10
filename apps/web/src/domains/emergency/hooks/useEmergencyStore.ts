import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '@/store/store';
import {
  fetchEmergencyProtocols,
  fetchNearbyContacts,
  sendSOSMessage,
  fetchWildlifeHazards,
  fetchPlantHazards,
  fetchWeatherHazards,
  assessRisk,
  setActiveProtocol,
  toggleSOS,
  addEmergencyContact,
  removeEmergencyContact,
  setOfflineMode,
  setActiveFilters,
  addEnvironmentalAlert,
  dismissEnvironmentalAlert,
  updateRiskAssessment,
  clearError,
  syncOfflineData,
} from '../store/emergencySlice';
import {
  EmergencyProtocol,
  EmergencyContact,
  EmergencyType,
  EmergencyFilters,
  Coordinates,
  EnvironmentalAlert,
  RiskAssessment,
} from '../types/emergency';

export const useEmergencyStore = () => {
  const dispatch = useDispatch<AppDispatch>();
  const emergencyState = useSelector((state: RootState) => state.emergency);

  // Protocol actions
  const loadProtocols = useCallback(
    async (filters?: EmergencyFilters) => {
      await dispatch(fetchEmergencyProtocols(filters));
    },
    [dispatch]
  );

  const selectProtocol = useCallback(
    (protocol: EmergencyProtocol | null) => {
      dispatch(setActiveProtocol(protocol));
    },
    [dispatch]
  );

  // Contact actions
  const loadNearbyContacts = useCallback(
    async (location: Coordinates) => {
      await dispatch(fetchNearbyContacts(location));
    },
    [dispatch]
  );

  const addContact = useCallback(
    (contact: EmergencyContact) => {
      dispatch(addEmergencyContact(contact));
    },
    [dispatch]
  );

  const removeContact = useCallback(
    (contactId: string) => {
      dispatch(removeEmergencyContact(contactId));
    },
    [dispatch]
  );

  // SOS actions
  const activateSOS = useCallback(
    async (data: {
      location: Coordinates;
      message: string;
      type: EmergencyType;
      contacts: string[];
      mediaFiles?: string[];
    }) => {
      dispatch(toggleSOS(true));
      await dispatch(sendSOSMessage(data));
    },
    [dispatch]
  );

  const deactivateSOS = useCallback(() => {
    dispatch(toggleSOS(false));
  }, [dispatch]);

  // Hazard actions
  const loadWildlifeHazards = useCallback(
    async (location: Coordinates) => {
      await dispatch(fetchWildlifeHazards(location));
    },
    [dispatch]
  );

  const loadPlantHazards = useCallback(
    async (location: Coordinates) => {
      await dispatch(fetchPlantHazards(location));
    },
    [dispatch]
  );

  const loadWeatherHazards = useCallback(
    async (location: Coordinates) => {
      await dispatch(fetchWeatherHazards(location));
    },
    [dispatch]
  );

  // Risk assessment
  const performRiskAssessment = useCallback(
    async (location: Coordinates, radius: number) => {
      await dispatch(assessRisk({ location, radius }));
    },
    [dispatch]
  );

  const updateRisk = useCallback(
    (assessment: RiskAssessment) => {
      dispatch(updateRiskAssessment(assessment));
    },
    [dispatch]
  );

  // Alert actions
  const addAlert = useCallback(
    (alert: EnvironmentalAlert) => {
      dispatch(addEnvironmentalAlert(alert));
    },
    [dispatch]
  );

  const dismissAlert = useCallback(
    (alertId: string) => {
      dispatch(dismissEnvironmentalAlert(alertId));
    },
    [dispatch]
  );

  // Offline actions
  const setOffline = useCallback(
    (offline: boolean) => {
      dispatch(setOfflineMode(offline));
    },
    [dispatch]
  );

  const syncOffline = useCallback(
    async (data: {
      protocols: EmergencyProtocol[];
      contacts: EmergencyContact[];
      timestamp: Date;
    }) => {
      dispatch(syncOfflineData(data));
    },
    [dispatch]
  );

  // Filter actions
  const setFilters = useCallback(
    (filters: EmergencyFilters) => {
      dispatch(setActiveFilters(filters));
    },
    [dispatch]
  );

  // Error handling
  const clearEmergencyError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  // Computed values
  const getProtocolsByType = useCallback(
    (type: EmergencyType) => {
      return emergencyState.protocols.filter(protocol => protocol.type === type);
    },
    [emergencyState.protocols]
  );

  const getActiveAlerts = useCallback(() => {
    const now = new Date();
    return emergencyState.environmentalAlerts.filter(alert => {
      if (alert.duration) {
        const endTime = new Date(alert.timestamp);
        endTime.setHours(endTime.getHours() + parseInt(alert.duration));
        return endTime > now;
      }
      return true;
    });
  }, [emergencyState.environmentalAlerts]);

  const getEmergencyContactsByType = useCallback(
    (type: EmergencyContact['type']) => {
      return emergencyState.emergencyContacts.filter(contact => contact.type === type);
    },
    [emergencyState.emergencyContacts]
  );

  return {
    // State
    ...emergencyState,
    
    // Protocol actions
    loadProtocols,
    selectProtocol,
    getProtocolsByType,
    
    // Contact actions
    loadNearbyContacts,
    addContact,
    removeContact,
    getEmergencyContactsByType,
    
    // SOS actions
    activateSOS,
    deactivateSOS,
    
    // Hazard actions
    loadWildlifeHazards,
    loadPlantHazards,
    loadWeatherHazards,
    
    // Risk assessment
    performRiskAssessment,
    updateRisk,
    
    // Alert actions
    addAlert,
    dismissAlert,
    getActiveAlerts,
    
    // Offline actions
    setOffline,
    syncOffline,
    
    // Filter actions
    setFilters,
    
    // Error handling
    clearEmergencyError,
  };
};