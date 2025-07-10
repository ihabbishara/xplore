import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { WildlifeService } from '../services/wildlifeService';
import {
  SightingComment,
  SightingVerification,
  WildlifeSighting,
  VerificationStatus,
} from '../types/wildlife';

interface CommunityState {
  // Comments
  sightingComments: Record<string, SightingComment[]>;
  loadingComments: Record<string, boolean>;
  
  // Verifications
  sightingVerifications: Record<string, SightingVerification[]>;
  myVerifications: SightingVerification[];
  
  // User interactions
  likedSightings: string[];
  followedSpecies: string[];
  followedUsers: string[];
  
  // Notifications
  notifications: {
    id: string;
    type: 'comment' | 'verification' | 'like' | 'nearby_sighting';
    message: string;
    data: any;
    read: boolean;
    timestamp: Date;
  }[];
  unreadCount: number;
  
  // Expert users
  expertUsers: {
    id: string;
    name: string;
    avatar?: string;
    expertise: string[];
    verificationCount: number;
  }[];
  
  // UI state
  loading: boolean;
  error: string | null;
}

const initialState: CommunityState = {
  sightingComments: {},
  loadingComments: {},
  sightingVerifications: {},
  myVerifications: [],
  likedSightings: [],
  followedSpecies: [],
  followedUsers: [],
  notifications: [],
  unreadCount: 0,
  expertUsers: [],
  loading: false,
  error: null,
};

// Async thunks
export const fetchSightingComments = createAsyncThunk(
  'community/fetchSightingComments',
  async (sightingId: string) => {
    const response = await WildlifeService.getSightingComments(sightingId);
    return { sightingId, comments: response };
  }
);

export const addComment = createAsyncThunk(
  'community/addComment',
  async (params: { sightingId: string; text: string }) => {
    const response = await WildlifeService.addComment(params);
    return response;
  }
);

export const likeSighting = createAsyncThunk(
  'community/likeSighting',
  async (sightingId: string) => {
    await WildlifeService.likeSighting(sightingId);
    return sightingId;
  }
);

export const unlikeSighting = createAsyncThunk(
  'community/unlikeSighting',
  async (sightingId: string) => {
    await WildlifeService.unlikeSighting(sightingId);
    return sightingId;
  }
);

export const followSpecies = createAsyncThunk(
  'community/followSpecies',
  async (speciesId: string) => {
    await WildlifeService.followSpecies(speciesId);
    return speciesId;
  }
);

export const unfollowSpecies = createAsyncThunk(
  'community/unfollowSpecies',
  async (speciesId: string) => {
    await WildlifeService.unfollowSpecies(speciesId);
    return speciesId;
  }
);

export const fetchSightingVerifications = createAsyncThunk(
  'community/fetchSightingVerifications',
  async (sightingId: string) => {
    const response = await WildlifeService.getSightingVerifications(sightingId);
    return { sightingId, verifications: response };
  }
);

export const fetchExpertUsers = createAsyncThunk(
  'community/fetchExpertUsers',
  async () => {
    const response = await WildlifeService.getExpertUsers();
    return response;
  }
);

export const fetchNotifications = createAsyncThunk(
  'community/fetchNotifications',
  async () => {
    const response = await WildlifeService.getUserNotifications();
    return response;
  }
);

const communitySlice = createSlice({
  name: 'community',
  initialState,
  reducers: {
    addNotification: (state, action: PayloadAction<{
      type: 'comment' | 'verification' | 'like' | 'nearby_sighting';
      message: string;
      data: any;
    }>) => {
      state.notifications.unshift({
        id: Date.now().toString(),
        ...action.payload,
        read: false,
        timestamp: new Date(),
      });
      state.unreadCount++;
    },
    
    markNotificationRead: (state, action: PayloadAction<string>) => {
      const notification = state.notifications.find(n => n.id === action.payload);
      if (notification && !notification.read) {
        notification.read = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },
    
    markAllNotificationsRead: (state) => {
      state.notifications.forEach(n => n.read = true);
      state.unreadCount = 0;
    },
    
    clearNotifications: (state) => {
      state.notifications = [];
      state.unreadCount = 0;
    },
    
    clearError: (state) => {
      state.error = null;
    },
  },
  
  extraReducers: (builder) => {
    // Fetch comments
    builder
      .addCase(fetchSightingComments.pending, (state, action) => {
        state.loadingComments[action.meta.arg] = true;
      })
      .addCase(fetchSightingComments.fulfilled, (state, action) => {
        state.loadingComments[action.payload.sightingId] = false;
        state.sightingComments[action.payload.sightingId] = action.payload.comments;
      })
      .addCase(fetchSightingComments.rejected, (state, action) => {
        state.loadingComments[action.meta.arg] = false;
        state.error = action.error.message || 'Failed to fetch comments';
      });
    
    // Add comment
    builder
      .addCase(addComment.fulfilled, (state, action) => {
        const sightingId = action.payload.sightingId;
        if (!state.sightingComments[sightingId]) {
          state.sightingComments[sightingId] = [];
        }
        state.sightingComments[sightingId].push(action.payload);
      });
    
    // Like/unlike sighting
    builder
      .addCase(likeSighting.fulfilled, (state, action) => {
        state.likedSightings.push(action.payload);
      })
      .addCase(unlikeSighting.fulfilled, (state, action) => {
        state.likedSightings = state.likedSightings.filter(id => id !== action.payload);
      });
    
    // Follow/unfollow species
    builder
      .addCase(followSpecies.fulfilled, (state, action) => {
        state.followedSpecies.push(action.payload);
      })
      .addCase(unfollowSpecies.fulfilled, (state, action) => {
        state.followedSpecies = state.followedSpecies.filter(id => id !== action.payload);
      });
    
    // Fetch verifications
    builder
      .addCase(fetchSightingVerifications.fulfilled, (state, action) => {
        state.sightingVerifications[action.payload.sightingId] = action.payload.verifications;
      });
    
    // Fetch expert users
    builder
      .addCase(fetchExpertUsers.fulfilled, (state, action) => {
        state.expertUsers = action.payload;
      });
    
    // Fetch notifications
    builder
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.notifications = action.payload;
        state.unreadCount = action.payload.filter(n => !n.read).length;
      });
  },
});

export const {
  addNotification,
  markNotificationRead,
  markAllNotificationsRead,
  clearNotifications,
  clearError,
} = communitySlice.actions;

export default communitySlice.reducer;