import {configureStore} from '@reduxjs/toolkit';
import authReducer from '../domains/auth/store/authSlice';
import locationReducer from '../domains/locations/store/locationSlice';
import tripReducer from '../domains/trips/store/tripSlice';
import journalReducer from '../domains/journal/store/journalSlice';
import propertyReducer from '../domains/properties/store/propertySlice';
import weatherReducer from '../domains/weather/store/weatherSlice';
import checklistReducer from '../domains/checklists/store/checklistSlice';
import analyticsReducer from '../domains/analytics/store/analyticsSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    locations: locationReducer,
    trips: tripReducer,
    journal: journalReducer,
    properties: propertyReducer,
    weather: weatherReducer,
    checklists: checklistReducer,
    analytics: analyticsReducer,
  },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;