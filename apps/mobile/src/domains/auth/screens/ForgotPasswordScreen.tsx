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
import Toast from 'react-native-toast-message';
import Icon from 'react-native-vector-icons/Ionicons';
import {AuthStackParamList} from '../../../navigation/AuthNavigator';
import Input from '../../../shared/components/Input';
import Button from '../../../shared/components/Button';
import {resetPassword} from '../services/authService';

type ForgotPasswordScreenNavigationProp = StackNavigationProp<
  AuthStackParamList,
  'ForgotPassword'
>;

const ForgotPasswordScreen: React.FC = () => {
  const navigation = useNavigation<ForgotPasswordScreenNavigationProp>();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleResetPassword = async () => {
    if (!email) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please enter your email',
      });
      return;
    }

    setLoading(true);
    try {
      await resetPassword(email);
      setEmailSent(true);
      Toast.show({
        type: 'success',
        text1: 'Email Sent',
        text2: 'Check your email for password reset instructions',
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error instanceof Error ? error.message : 'Failed to send email',
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
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.title}>Reset Password</Text>
          <Text style={styles.subtitle}>
            {emailSent
              ? 'Check your email for reset instructions'
              : 'Enter your email to receive reset instructions'}
          </Text>
        </View>

        {!emailSent ? (
          <View style={styles.form}>
            <Input
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              icon="mail-outline"
            />

            <Button
              title={loading ? '' : 'Send Reset Email'}
              onPress={handleResetPassword}
              disabled={loading}
              style={styles.button}>
              {loading && <ActivityIndicator color="#fff" />}
            </Button>

            <View style={styles.signinContainer}>
              <Text style={styles.signinText}>Remember your password? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.signinLink}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.successContainer}>
            <Icon name="checkmark-circle" size={80} color="#10b981" />
            <Text style={styles.successText}>Email sent successfully!</Text>
            <Button
              title="Back to Login"
              onPress={() => navigation.navigate('Login')}
              style={styles.button}
            />
          </View>
        )}
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
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
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
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  form: {
    width: '100%',
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
  successContainer: {
    alignItems: 'center',
    marginTop: 48,
  },
  successText: {
    fontSize: 18,
    color: '#333',
    marginTop: 16,
    marginBottom: 32,
  },
});

export default ForgotPasswordScreen;