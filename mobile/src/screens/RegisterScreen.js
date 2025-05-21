import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  Image, 
  KeyboardAvoidingView, 
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  Keyboard,
  TouchableWithoutFeedback
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { COLORS, FONTS, SIZES, SHADOWS } from '../styles/theme';
import { API_URL } from '../config';

// Validation regex patterns
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

export default function RegisterScreen({ navigation }) {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => setKeyboardVisible(true)
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => setKeyboardVisible(false)
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const validateInputs = () => {
    const errors = {};
    
    if (!name.trim()) {
      errors.name = 'Full name is required';
    }

    if (!username.trim()) {
      errors.username = 'Username is required';
    } else if (!USERNAME_REGEX.test(username)) {
      errors.username = 'Username must be 3-20 characters and can only contain letters, numbers, and underscores';
    }

    if (!email.trim()) {
      errors.email = 'Email is required';
    } else if (!EMAIL_REGEX.test(email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!password) {
      errors.password = 'Password is required';
    } else if (!PASSWORD_REGEX.test(password)) {
      errors.password = 'Password must be at least 8 characters and include uppercase, lowercase, number, and special character';
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateInputs()) return;

    try {
      setLoading(true);
      setError('');

      const response = await axios.post(`${API_URL}/api/users/register`, {
        name,
        username,
        email,
        password,
        confirmPassword
      });

      if (response.data) {
        Alert.alert(
          'Success',
          'Registration successful! Please log in.',
          [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
        );
      }
    } catch (error) {
      console.error('Registration error:', error);
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          'Registration failed. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const renderInput = (icon, placeholder, value, onChangeText, error, props = {}) => (
    <View style={styles.inputWrapper}>
      <View style={[
        styles.inputContainer,
        error && styles.inputContainerError
      ]}>
        <Ionicons name={icon} size={20} color={COLORS.text.secondary} style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          value={value}
          onChangeText={(text) => {
            onChangeText(text);
            setError('');
            setValidationErrors(prev => ({ ...prev, [props.name]: '' }));
          }}
          {...props}
        />
      </View>
      {error ? <Text style={styles.validationError}>{error}</Text> : null}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
        >
          <ScrollView 
            contentContainerStyle={[
              styles.scrollContent,
              keyboardVisible && styles.scrollContentKeyboardVisible
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.header}>
              <TouchableOpacity 
                style={styles.backButton}
                onPress={() => navigation.goBack()}
                activeOpacity={0.8}
              >
                <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Create Account</Text>
            </View>
            
            <View style={styles.formContainer}>
              {renderInput(
                'person-outline',
                'Full Name',
                name,
                setName,
                validationErrors.name,
                {
                  autoCapitalize: 'words',
                  returnKeyType: 'next',
                  blurOnSubmit: false,
                  onSubmitEditing: () => usernameInput.focus()
                }
              )}
              
              {renderInput(
                'person-circle-outline',
                'Username',
                username,
                setUsername,
                validationErrors.username,
                {
                  autoCapitalize: 'none',
                  returnKeyType: 'next',
                  blurOnSubmit: false,
                  onSubmitEditing: () => emailInput.focus(),
                  ref: (input) => { usernameInput = input; }
                }
              )}
              
              {renderInput(
                'mail-outline',
                'Email Address',
                email,
                setEmail,
                validationErrors.email,
                {
                  keyboardType: 'email-address',
                  autoCapitalize: 'none',
                  returnKeyType: 'next',
                  blurOnSubmit: false,
                  onSubmitEditing: () => passwordInput.focus(),
                  ref: (input) => { emailInput = input; }
                }
              )}
              
              {renderInput(
                'lock-closed-outline',
                'Password',
                password,
                setPassword,
                validationErrors.password,
                {
                  secureTextEntry: !showPassword,
                  returnKeyType: 'next',
                  blurOnSubmit: false,
                  onSubmitEditing: () => confirmPasswordInput.focus(),
                  ref: (input) => { passwordInput = input; }
                }
              )}
              
              {renderInput(
                'lock-closed-outline',
                'Confirm Password',
                confirmPassword,
                setConfirmPassword,
                validationErrors.confirmPassword,
                {
                  secureTextEntry: !showPassword,
                  returnKeyType: 'done',
                  onSubmitEditing: handleRegister,
                  ref: (input) => { confirmPasswordInput = input; }
                }
              )}
              
              <TouchableOpacity 
                style={styles.passwordToggle}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons 
                  name={showPassword ? "eye-off-outline" : "eye-outline"} 
                  size={20} 
                  color={COLORS.text.secondary} 
                />
                <Text style={styles.passwordToggleText}>
                  {showPassword ? 'Hide Password' : 'Show Password'}
                </Text>
              </TouchableOpacity>
              
              {error ? <Text style={styles.errorText}>{error}</Text> : null}
              
              <TouchableOpacity 
                style={[styles.registerButton, loading && styles.registerButtonDisabled]}
                onPress={handleRegister}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color={COLORS.text.inverse} />
                ) : (
                  <Text style={styles.registerButtonText}>Create Account</Text>
                )}
              </TouchableOpacity>
            </View>
            
            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <TouchableOpacity 
                onPress={() => navigation.navigate('Login')}
                activeOpacity={0.8}
              >
                <Text style={styles.footerLink}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: SIZES.padding.lg,
  },
  scrollContentKeyboardVisible: {
    paddingBottom: SIZES.padding.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.padding.xl,
  },
  backButton: {
    padding: SIZES.padding.sm,
  },
  headerTitle: {
    ...FONTS.h1,
    color: COLORS.text.primary,
    marginLeft: SIZES.padding.md,
  },
  formContainer: {
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radius.lg,
    padding: SIZES.padding.lg,
    ...SHADOWS.medium,
  },
  inputWrapper: {
    marginBottom: SIZES.padding.md,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: SIZES.radius.md,
    paddingHorizontal: SIZES.padding.md,
    backgroundColor: COLORS.background,
    height: 56,
  },
  inputContainerError: {
    borderColor: COLORS.error,
  },
  inputIcon: {
    marginRight: SIZES.padding.sm,
  },
  input: {
    flex: 1,
    height: '100%',
    ...FONTS.body,
    color: COLORS.text.primary,
    paddingVertical: 0,
  },
  validationError: {
    ...FONTS.small,
    color: COLORS.error,
    marginTop: SIZES.padding.xs,
    marginLeft: SIZES.padding.sm,
  },
  passwordToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    marginBottom: SIZES.padding.lg,
    padding: SIZES.padding.sm,
  },
  passwordToggleText: {
    ...FONTS.small,
    color: COLORS.text.secondary,
    marginLeft: SIZES.padding.xs,
  },
  errorText: {
    ...FONTS.small,
    color: COLORS.error,
    marginBottom: SIZES.padding.md,
    textAlign: 'center',
  },
  registerButton: {
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radius.md,
    padding: SIZES.padding.md,
    alignItems: 'center',
    ...SHADOWS.small,
    height: 56,
    justifyContent: 'center',
  },
  registerButtonDisabled: {
    opacity: 0.7,
  },
  registerButtonText: {
    ...FONTS.h3,
    color: COLORS.text.inverse,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: SIZES.padding.xl,
    paddingBottom: SIZES.padding.lg,
  },
  footerText: {
    ...FONTS.body,
    color: COLORS.text.secondary,
  },
  footerLink: {
    ...FONTS.body,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
}); 