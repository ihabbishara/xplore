import React from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TextInputProps,
  ViewStyle,
  TextStyle,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

interface InputProps extends TextInputProps {
  icon?: string;
  style?: ViewStyle;
  inputStyle?: TextStyle;
  iconColor?: string;
}

const Input: React.FC<InputProps> = ({
  icon,
  style,
  inputStyle,
  iconColor = '#666',
  ...props
}) => {
  return (
    <View style={[styles.container, style]}>
      {icon && (
        <Icon name={icon} size={20} color={iconColor} style={styles.icon} />
      )}
      <TextInput
        style={[styles.input, inputStyle]}
        placeholderTextColor="#999"
        {...props}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
  },
  icon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1a1a1a',
  },
});

export default Input;