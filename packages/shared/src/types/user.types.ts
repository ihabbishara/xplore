export type UserType = 'relocation_explorer' | 'weekend_traveler' | 'outdoor_adventurer';

export type ExplorationTimeline = '1-3 months' | '3-6 months' | '6-12 months' | '1+ years';

export interface CurrentLocation {
  country: string;
  city: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface UserInterests {
  work?: string[];
  lifestyle?: string[];
  climate?: string[];
}

export interface PrivacySettings {
  profileVisible: boolean;
  locationVisible: boolean;
}

export interface UserProfile {
  id: string;
  userId: string;
  firstName?: string;
  lastName?: string;
  currentLocation?: CurrentLocation;
  targetCountries?: string[];
  explorationTimeline?: ExplorationTimeline;
  userType?: UserType;
  interests?: UserInterests;
  privacySettings?: PrivacySettings;
  bio?: string;
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProfileRequest {
  firstName?: string;
  lastName?: string;
  currentLocation?: CurrentLocation;
  targetCountries?: string[];
  explorationTimeline?: ExplorationTimeline;
  userType?: UserType;
  interests?: UserInterests;
  privacySettings?: PrivacySettings;
  bio?: string;
  avatarUrl?: string;
}

export interface UpdateProfileRequest extends Partial<CreateProfileRequest> {}