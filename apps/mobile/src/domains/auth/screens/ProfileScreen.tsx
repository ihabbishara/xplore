import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import {useSelector, useDispatch} from 'react-redux';
import {SafeAreaView} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import {RootState, AppDispatch} from '../../../store';
import {logout} from '../store/authSlice';
import {logoutUser} from '../services/authService';
import Button from '../../../shared/components/Button';

const ProfileScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const {user} = useSelector((state: RootState) => state.auth);

  const handleLogout = async () => {
    await logoutUser();
    dispatch(logout());
  };

  const menuItems = [
    {icon: 'person-outline', title: 'Edit Profile', onPress: () => {}},
    {icon: 'location-outline', title: 'Weather Preferences', onPress: () => {}},
    {icon: 'notifications-outline', title: 'Notifications', onPress: () => {}},
    {icon: 'shield-checkmark-outline', title: 'Privacy & Security', onPress: () => {}},
    {icon: 'help-circle-outline', title: 'Help & Support', onPress: () => {}},
    {icon: 'information-circle-outline', title: 'About', onPress: () => {}},
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.profileContainer}>
            {user?.profilePicture ? (
              <Image
                source={{uri: user.profilePicture}}
                style={styles.profileImage}
              />
            ) : (
              <View style={styles.profilePlaceholder}>
                <Text style={styles.profileInitial}>
                  {user?.firstName?.[0]?.toUpperCase() || 'U'}
                </Text>
              </View>
            )}
            <Text style={styles.userName}>
              {user?.firstName} {user?.lastName}
            </Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
          </View>
        </View>

        <View style={styles.menuContainer}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={item.onPress}>
              <View style={styles.menuItemLeft}>
                <Icon name={item.icon} size={24} color="#666" />
                <Text style={styles.menuItemText}>{item.title}</Text>
              </View>
              <Icon name="chevron-forward" size={20} color="#999" />
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.logoutContainer}>
          <Button
            title="Log Out"
            onPress={handleLogout}
            variant="outline"
            style={styles.logoutButton}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  profileContainer: {
    alignItems: 'center',
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
  },
  profilePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  profileInitial: {
    fontSize: 36,
    color: '#fff',
    fontWeight: 'bold',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: '#666',
  },
  menuContainer: {
    paddingHorizontal: 24,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 16,
  },
  logoutContainer: {
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  logoutButton: {
    borderColor: '#ef4444',
  },
});

export default ProfileScreen;