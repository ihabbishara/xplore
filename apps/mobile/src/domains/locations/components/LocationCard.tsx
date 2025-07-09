import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {Location} from '../types/location.types';

interface LocationCardProps {
  location: Location;
  onPress: () => void;
}

const LocationCard: React.FC<LocationCardProps> = ({location, onPress}) => {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      {location.imageUrl ? (
        <Image source={{uri: location.imageUrl}} style={styles.image} />
      ) : (
        <View style={styles.imagePlaceholder}>
          <Icon name="image-outline" size={40} color="#d1d5db" />
        </View>
      )}
      
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.name}>{location.name}</Text>
          <TouchableOpacity style={styles.favoriteButton}>
            <Icon
              name={location.isFavorite ? 'heart' : 'heart-outline'}
              size={20}
              color={location.isFavorite ? '#ef4444' : '#666'}
            />
          </TouchableOpacity>
        </View>
        
        <Text style={styles.country}>{location.country}</Text>
        
        {location.description && (
          <Text style={styles.description} numberOfLines={2}>
            {location.description}
          </Text>
        )}
        
        <View style={styles.tags}>
          {location.tags?.slice(0, 3).map((tag, index) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 180,
  },
  imagePlaceholder: {
    width: '100%',
    height: 180,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    flex: 1,
  },
  favoriteButton: {
    padding: 4,
  },
  country: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: '#e5e7eb',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 12,
    color: '#4b5563',
  },
});

export default LocationCard;