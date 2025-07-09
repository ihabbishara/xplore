import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {useDispatch} from 'react-redux';
import Toast from 'react-native-toast-message';
import {AuthStackParamList} from '../../../navigation/AuthNavigator';
import Input from '../../../shared/components/Input';
import Button from '../../../shared/components/Button';
import {registerUser} from '../services/authService';
import {setAuth} from '../store/authSlice';
import {AppDispatch} from '../../../store';

type RegisterScreenNavigationProp = StackNavigationProp<
  AuthStackParamList,
  'Register'
>;

const RegisterScreen: React.FC = () => {
  const navigation = useNavigation<RegisterScreenNavigationProp>();
  const dispatch = useDispatch<AppDispatch>();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);

  const updateFormData = (key: string, value: string) => {
    setFormData(prev => ({...prev, [key]: value}));
  };

  const handleRegister = async () => {
    const {firstName, lastName, email, password, confirmPassword} = formData;

    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please fill in all fields',
      });
      return;
    }

    if (password !== confirmPassword) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Passwords do not match',
      });
      return;
    }

    if (password.length < 6) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Password must be at least 6 characters',
      });
      return;
    }

    setLoading(true);
    try {
      const response = await registerUser({
        firstName,
        lastName,
        email,
        password,
      });
      dispatch(setAuth({
        user: response.user,
        token: response.token,
        isAuthenticated: true,
      }));
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Account created successfully!',
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Registration Failed',
        text2: error instanceof Error ? error.message : 'An error occurred',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Start your exploration journey</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.nameContainer}>
            <Input
              placeholder="First Name"
              value={formData.firstName}
              onChangeText={value => updateFormData('firstName', value)}
              icon="person-outline"
              style={styles.nameInput}
            />
            <Input
              placeholder="Last Name"
              value={formData.lastName}
              onChangeText={value => updateFormData('lastName', value)}
              icon="person-outline"
              style={[styles.nameInput, styles.lastNameInput]}
            />
          </View>

          <Input
            placeholder="Email"
            value={formData.email}
            onChangeText={value => updateFormData('email', value)}
            keyboardType="email-address"
            autoCapitalize="none"
            icon="mail-outline"
            style={styles.input}
          />

          <Input
            placeholder="Password"
            value={formData.password}
            onChangeText={value => updateFormData('password', value)}
            secureTextEntry
            icon="lock-closed-outline"
            style={styles.input}
          />

          <Input
            placeholder="Confirm Password"
            value={formData.confirmPassword}
            onChangeText={value => updateFormData('confirmPassword', value)}
            secureTextEntry
            icon="lock-closed-outline"
            style={styles.input}
          />

          <Button
            title={loading ? '' : 'Create Account'}
            onPress={handleRegister}
            disabled={loading}
            style={styles.button}>
            {loading && <ActivityIndicator color="#fff" />}
          </Button>

          <View style={styles.signinContainer}>
            <Text style={styles.signinText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.signinLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 48,
    justifyContent: 'center',
  },
  header: {
    marginBottom: 48,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  form: {
    width: '100%',
  },
  nameContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  nameInput: {
    flex: 1,
  },
  lastNameInput: {
    marginLeft: 8,
  },
  input: {
    marginTop: 16,
  },
  button: {
    marginTop: 24,
  },
  signinContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  signinText: {
    color: '#666',
    fontSize: 14,
  },
  signinLink: {
    color: '#3b82f6',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default RegisterScreen;