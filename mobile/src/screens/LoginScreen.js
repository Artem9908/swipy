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
  TouchableWithoutFeedback,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { COLORS, FONTS, SIZES, SHADOWS } from '../styles/theme';
import { API_URL } from '../config';

// Password validation regex
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

const { width, height } = Dimensions.get('window');

export default function LoginScreen({ navigation }) {
  const [isLogin, setIsLogin] = useState(true);
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [keyboardVisible, setKeyboardVisible] = useState(false);

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

  const handleAuth = async () => {
    console.log('handleAuth called with:', { 
      isLogin, 
      loginIdentifier, 
      email, 
      username, 
      password, 
      name 
    });
    
    if (isLogin) {
      // For login, require loginIdentifier (username or email) and password
      if (!loginIdentifier || !password) {
        console.log('Missing login credentials');
        Alert.alert('Error', 'Please provide username/email and password');
        return;
      }
    } else {
      // For signup, require all fields
      if (!name || !username || !email || !password) {
        console.log('Missing signup fields');
        Alert.alert('Error', 'Please fill in all required fields');
        return;
      }
    }
    
    try {
      console.log('Setting loading state to true');
      setLoading(true);
      
      const apiUrl = `${API_URL}/api/users/${isLogin ? 'login' : 'register'}`;
      
      console.log('API URL:', apiUrl);
      
      // For login, use loginIdentifier
      // For signup, send all fields
      const userData = isLogin 
        ? { 
            username: loginIdentifier, // The server handles whether this is a username or email
            password 
          } 
        : { 
            name, 
            username,
            email,
            password, 
            confirmPassword: password 
          };
      
      console.log('Sending request with data:', JSON.stringify(userData));
      
      const response = await axios.post(apiUrl, userData);
      
      console.log('Response received:', JSON.stringify(response.data));
      
      setLoading(false);
      
      if (response.data) {
        // Navigate to main screen and pass user data
        console.log('Navigation to Main screen');
        navigation.reset({
          index: 0,
          routes: [{ name: 'Main', params: { user: response.data } }],
        });
      }
    } catch (error) {
      console.log('Error in handleAuth:', error);
      console.log('Error details:', error.response?.data);
      
      setLoading(false);
      console.error('Auth error:', error);
      
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error ||
                          (isLogin ? 'Login failed' : 'Registration failed');
      
      Alert.alert('Error', errorMessage);
    }
  };

  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
    // Reset fields when switching modes
    setLoginIdentifier('');
    setEmail('');
    setUsername('');
    setPassword('');
    setName('');
    setError('');
  };

  const handleGuestLogin = () => {
    // Создаем гостевого пользователя
    const guestUser = {
      _id: 'guest',
      name: 'Guest User',
      email: 'guest@example.com',
      isGuest: true
    };
    
    // Переходим на главный экран с гостевым пользователем
    navigation.reset({
      index: 0,
      routes: [{ name: 'Main', params: { user: guestUser } }],
    });
  };

  const validateInputs = () => {
    if (!loginIdentifier.trim()) {
      setError('Please enter your username or email');
      return false;
    }
    if (!password.trim()) {
      setError('Please enter your password');
      return false;
    }
    return true;
  };

  const handleLogin = async () => {
    if (!validateInputs()) return;

    try {
      setLoading(true);
      setError('');

      const response = await axios.post(`${API_URL}/api/users/login`, {
        username: loginIdentifier,
        password
      });

      if (response.data) {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Main', params: { user: response.data } }],
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          'Invalid credentials. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

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
            <View style={styles.logoContainer}>
              <View style={styles.logoPlaceholder}>
                <Ionicons name="restaurant" size={60} color={COLORS.primary} />
              </View>
              <Text style={styles.appName}>Swipy</Text>
              <Text style={styles.tagline}>Discover and book the best restaurants</Text>
            </View>
            
            <View style={styles.formContainer}>
              <Text style={styles.formTitle}>
                {isLogin ? 'Welcome Back!' : 'Create Account'}
              </Text>
              
              {!isLogin && (
                <>
                  <View style={styles.inputContainer}>
                    <Ionicons name="person" size={20} color={COLORS.text.secondary} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Full Name"
                      placeholderTextColor={COLORS.text.light}
                      value={name}
                      onChangeText={setName}
                    />
                  </View>
                  
                  <View style={styles.inputContainer}>
                    <Ionicons name="person-circle" size={20} color={COLORS.text.secondary} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Username"
                      placeholderTextColor={COLORS.text.light}
                      value={username}
                      onChangeText={setUsername}
                      autoCapitalize="none"
                    />
                  </View>
                  
                  <View style={styles.inputContainer}>
                    <Ionicons name="mail" size={20} color={COLORS.text.secondary} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Email Address"
                      placeholderTextColor={COLORS.text.light}
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </View>
                </>
              )}
              
              {isLogin && (
                <View style={styles.inputContainer}>
                  <Ionicons name="person" size={20} color={COLORS.text.secondary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Username or Email"
                    placeholderTextColor={COLORS.text.light}
                    value={loginIdentifier}
                    onChangeText={(text) => {
                      setLoginIdentifier(text);
                      setError('');
                    }}
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="next"
                    blurOnSubmit={false}
                    onSubmitEditing={() => passwordInput.focus()}
                  />
                </View>
              )}
              
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed" size={20} color={COLORS.text.secondary} style={styles.inputIcon} />
                <TextInput
                  ref={(input) => { passwordInput = input; }}
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor={COLORS.text.light}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    setError('');
                  }}
                  secureTextEntry={!showPassword}
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                />
                <TouchableOpacity 
                  style={styles.passwordToggle}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons 
                    name={showPassword ? "eye-off" : "eye"} 
                    size={20} 
                    color={COLORS.text.secondary} 
                  />
                </TouchableOpacity>
              </View>
              
              {error ? <Text style={styles.errorText}>{error}</Text> : null}
              
              <TouchableOpacity 
                style={[styles.authButton, loading && styles.authButtonDisabled]}
                onPress={handleAuth}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color={COLORS.text.inverse} />
                ) : (
                  <Text style={styles.authButtonText}>
                    {isLogin ? 'Sign In' : 'Sign Up'}
                  </Text>
                )}
              </TouchableOpacity>
              
              <View style={styles.dividerContainer}>
                <View style={styles.divider} />
                <Text style={styles.dividerText}>OR</Text>
                <View style={styles.divider} />
              </View>
              
              <TouchableOpacity 
                style={styles.guestButton}
                onPress={handleGuestLogin}
                activeOpacity={0.8}
              >
                <Text style={styles.guestButtonText}>Continue as Guest</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                {isLogin ? "Don't have an account? " : "Already have an account? "}
              </Text>
              <TouchableOpacity onPress={toggleAuthMode}>
                <Text style={styles.footerLink}>
                  {isLogin ? 'Sign Up' : 'Sign In'}
                </Text>
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
    paddingHorizontal: SIZES.padding.lg,
    paddingTop: height * 0.05,
    paddingBottom: SIZES.padding.xl,
    minHeight: height,
  },
  scrollContentKeyboardVisible: {
    paddingBottom: SIZES.padding.md,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: height * 0.04,
  },
  logoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.green.pale,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SIZES.padding.lg,
    ...SHADOWS.medium,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: SIZES.padding.sm,
    letterSpacing: 1,
  },
  tagline: {
    fontSize: 16,
    color: COLORS.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  formContainer: {
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radius.xl,
    padding: SIZES.padding.xl,
    ...SHADOWS.large,
    marginBottom: SIZES.padding.lg,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: SIZES.padding.xl,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: SIZES.radius.lg,
    marginBottom: SIZES.padding.lg,
    paddingHorizontal: SIZES.padding.lg,
    backgroundColor: COLORS.background,
    height: 60,
    ...SHADOWS.small,
  },
  inputIcon: {
    marginRight: SIZES.padding.md,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    color: COLORS.text.primary,
    paddingVertical: 0,
    fontWeight: '500',
  },
  passwordToggle: {
    padding: SIZES.padding.sm,
  },
  errorText: {
    fontSize: 14,
    color: COLORS.error,
    marginBottom: SIZES.padding.lg,
    textAlign: 'center',
    backgroundColor: COLORS.error + '10',
    padding: SIZES.padding.md,
    borderRadius: SIZES.radius.md,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.error,
  },
  authButton: {
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radius.lg,
    padding: SIZES.padding.lg,
    alignItems: 'center',
    ...SHADOWS.medium,
    height: 60,
    justifyContent: 'center',
    marginBottom: SIZES.padding.md,
  },
  authButtonDisabled: {
    opacity: 0.7,
  },
  authButtonText: {
    fontSize: 18,
    color: COLORS.text.inverse,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SIZES.padding.xl,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dividerText: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginHorizontal: SIZES.padding.lg,
    fontWeight: '500',
  },
  guestButton: {
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderRadius: SIZES.radius.lg,
    padding: SIZES.padding.lg,
    alignItems: 'center',
    height: 60,
    justifyContent: 'center',
    backgroundColor: COLORS.primary + '05',
  },
  guestButtonText: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: SIZES.padding.xl,
    paddingBottom: SIZES.padding.lg,
  },
  footerText: {
    fontSize: 16,
    color: COLORS.text.secondary,
  },
  footerLink: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
});