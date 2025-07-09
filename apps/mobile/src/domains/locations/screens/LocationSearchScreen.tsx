import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import Input from '../../../shared/components/Input';
import LocationCard from '../components/LocationCard';
import {searchLocations} from '../services/locationService';
import {Location} from '../types/location.types';

const LocationSearchScreen: React.FC = () => {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    setHasSearched(true);
    try {
      const results = await searchLocations(searchQuery);
      setLocations(results);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderEmptyState = () => {
    if (!hasSearched) {
      return (
        <View style={styles.emptyState}>
          <Icon name="compass-outline" size={80} color="#d1d5db" />
          <Text style={styles.emptyStateTitle}>Discover New Places</Text>
          <Text style={styles.emptyStateText}>
            Search for cities, countries, or regions to start exploring
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyState}>
        <Icon name="search-outline" size={80} color="#d1d5db" />
        <Text style={styles.emptyStateTitle}>No Results Found</Text>
        <Text style={styles.emptyStateText}>
          Try searching for a different location
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Explore Locations</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('Wishlist' as never)}>
          <Icon name="heart-outline" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Input
          placeholder="Search cities, countries..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
          icon="search-outline"
        />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      ) : (
        <FlatList
          data={locations}
          keyExtractor={item => item.id}
          renderItem={({item}) => (
            <LocationCard
              location={item}
              onPress={() =>
                navigation.navigate('LocationDetails' as never, {
                  locationId: item.id,
                } as never)
              }
            />
          )}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  searchContainer: {
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 48,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});

export default LocationSearchScreen;