import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '@/store/store';
import {
  fetchSightingComments,
  addComment,
  likeSighting,
  unlikeSighting,
  followSpecies,
  unfollowSpecies,
  fetchSightingVerifications,
  fetchExpertUsers,
  fetchNotifications,
  addNotification,
  markNotificationRead,
  markAllNotificationsRead,
  clearNotifications,
  clearError,
} from '../store/communitySlice';

export const useCommunityStore = () => {
  const dispatch = useDispatch<AppDispatch>();
  const communityState = useSelector((state: RootState) => state.community);

  // Comment actions
  const loadSightingComments = useCallback(
    async (sightingId: string) => {
      await dispatch(fetchSightingComments(sightingId));
    },
    [dispatch]
  );

  const postComment = useCallback(
    async (sightingId: string, text: string) => {
      await dispatch(addComment({ sightingId, text }));
    },
    [dispatch]
  );

  // Like actions
  const toggleLike = useCallback(
    async (sightingId: string) => {
      const isLiked = communityState.likedSightings.includes(sightingId);
      if (isLiked) {
        await dispatch(unlikeSighting(sightingId));
      } else {
        await dispatch(likeSighting(sightingId));
      }
    },
    [dispatch, communityState.likedSightings]
  );

  const isLiked = useCallback(
    (sightingId: string) => {
      return communityState.likedSightings.includes(sightingId);
    },
    [communityState.likedSightings]
  );

  // Follow actions
  const toggleFollowSpecies = useCallback(
    async (speciesId: string) => {
      const isFollowing = communityState.followedSpecies.includes(speciesId);
      if (isFollowing) {
        await dispatch(unfollowSpecies(speciesId));
      } else {
        await dispatch(followSpecies(speciesId));
      }
    },
    [dispatch, communityState.followedSpecies]
  );

  const isFollowingSpecies = useCallback(
    (speciesId: string) => {
      return communityState.followedSpecies.includes(speciesId);
    },
    [communityState.followedSpecies]
  );

  // Verification actions
  const loadSightingVerifications = useCallback(
    async (sightingId: string) => {
      await dispatch(fetchSightingVerifications(sightingId));
    },
    [dispatch]
  );

  // Expert users
  const loadExpertUsers = useCallback(async () => {
    await dispatch(fetchExpertUsers());
  }, [dispatch]);

  // Notifications
  const loadNotifications = useCallback(async () => {
    await dispatch(fetchNotifications());
  }, [dispatch]);

  const pushNotification = useCallback(
    (type: 'comment' | 'verification' | 'like' | 'nearby_sighting', message: string, data: any) => {
      dispatch(addNotification({ type, message, data }));
    },
    [dispatch]
  );

  const markRead = useCallback(
    (notificationId: string) => {
      dispatch(markNotificationRead(notificationId));
    },
    [dispatch]
  );

  const markAllRead = useCallback(() => {
    dispatch(markAllNotificationsRead());
  }, [dispatch]);

  const clearAllNotifications = useCallback(() => {
    dispatch(clearNotifications());
  }, [dispatch]);

  // Error handling
  const clearCommunityError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  // Computed values
  const getCommentsForSighting = useCallback(
    (sightingId: string) => {
      return communityState.sightingComments[sightingId] || [];
    },
    [communityState.sightingComments]
  );

  const getVerificationsForSighting = useCallback(
    (sightingId: string) => {
      return communityState.sightingVerifications[sightingId] || [];
    },
    [communityState.sightingVerifications]
  );

  const getExpertVerifications = useCallback(
    (sightingId: string) => {
      const verifications = getVerificationsForSighting(sightingId);
      return verifications.filter(v => v.isExpert);
    },
    [getVerificationsForSighting]
  );

  const getUnreadNotifications = useCallback(() => {
    return communityState.notifications.filter(n => !n.read);
  }, [communityState.notifications]);

  const getNotificationsByType = useCallback(
    (type: 'comment' | 'verification' | 'like' | 'nearby_sighting') => {
      return communityState.notifications.filter(n => n.type === type);
    },
    [communityState.notifications]
  );

  return {
    // State
    ...communityState,
    
    // Comment actions
    loadSightingComments,
    postComment,
    getCommentsForSighting,
    
    // Like actions
    toggleLike,
    isLiked,
    
    // Follow actions
    toggleFollowSpecies,
    isFollowingSpecies,
    
    // Verification actions
    loadSightingVerifications,
    getVerificationsForSighting,
    getExpertVerifications,
    
    // Expert users
    loadExpertUsers,
    
    // Notifications
    loadNotifications,
    pushNotification,
    markRead,
    markAllRead,
    clearAllNotifications,
    getUnreadNotifications,
    getNotificationsByType,
    
    // Error handling
    clearCommunityError,
  };
};