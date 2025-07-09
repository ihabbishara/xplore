import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {createStackNavigator} from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/Ionicons';
import {Platform} from 'react-native';

// Import screens (to be created)
import LocationSearchScreen from '../domains/locations/screens/LocationSearchScreen';
import WishlistScreen from '../domains/locations/screens/WishlistScreen';
import LocationDetailsScreen from '../domains/locations/screens/LocationDetailsScreen';
import TripsScreen from '../domains/trips/screens/TripsScreen';
import JournalScreen from '../domains/journal/screens/JournalScreen';
import ProfileScreen from '../domains/auth/screens/ProfileScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Location Stack
const LocationStack = () => (
  <Stack.Navigator>
    <Stack.Screen
      name="LocationSearch"
      component={LocationSearchScreen}
      options={{title: 'Explore'}}
    />
    <Stack.Screen
      name="LocationDetails"
      component={LocationDetailsScreen}
      options={{title: 'Location Details'}}
    />
    <Stack.Screen
      name="Wishlist"
      component={WishlistScreen}
      options={{title: 'My Wishlist'}}
    />
  </Stack.Navigator>
);

const MainNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={({route}) => ({
        tabBarIcon: ({focused, color, size}) => {
          let iconName: string = '';

          switch (route.name) {
            case 'Explore':
              iconName = focused ? 'compass' : 'compass-outline';
              break;
            case 'Trips':
              iconName = focused ? 'map' : 'map-outline';
              break;
            case 'Journal':
              iconName = focused ? 'book' : 'book-outline';
              break;
            case 'Profile':
              iconName = focused ? 'person' : 'person-outline';
              break;
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          paddingBottom: Platform.OS === 'ios' ? 20 : 5,
          height: Platform.OS === 'ios' ? 80 : 60,
        },
        headerShown: false,
      })}>
      <Tab.Screen name="Explore" component={LocationStack} />
      <Tab.Screen name="Trips" component={TripsScreen} />
      <Tab.Screen name="Journal" component={JournalScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

export default MainNavigator;