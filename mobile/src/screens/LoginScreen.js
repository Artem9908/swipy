import React, { useState } from 'react';
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
  SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { COLORS, FONTS, SIZES, SHADOWS } from '../styles/theme';

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
      
      const apiUrl = Platform.OS === 'web' 
        ? `http://localhost:5001/api/users/${isLogin ? 'login' : 'register'}` 
        : `http://localhost:5001/api/users/${isLogin ? 'login' : 'register'}`;
      
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

  const login = async () => {
    console.log('login function called with:', { email, password });
    
    if (!email || !password) {
      console.log('Missing email/username or password');
      setError('Please enter both username/email and password');
      return;
    }
    
    try {
      console.log('Setting loading state to true');
      setLoading(true);
      // Use localhost for web or IP for devices
      const apiUrl = Platform.OS === 'web' 
        ? 'http://localhost:5001/api/users/login' 
        : 'http://localhost:5001/api/users/login';
      
      console.log('API URL:', apiUrl);
      
      const userData = { username: email, password };
      console.log('Sending request with data:', JSON.stringify(userData));
      
      const res = await axios.post(apiUrl, userData);
      
      console.log('Response received:', JSON.stringify(res.data));
      
      setLoading(false);
      
      // Navigate to Main instead of Restaurants
      console.log('Navigation to Main screen');
      navigation.reset({
        index: 0,
        routes: [{ name: 'Main', params: { user: res.data } }],
      });
    } catch (e) {
      console.log('Error in login:', e);
      console.log('Error details:', e.response?.data);
      
      setLoading(false);
      console.error('Login error:', e);
      const errorMessage = e.response?.data?.message || 
                          e.response?.data?.error || 
                          'Invalid credentials';
      setError(errorMessage);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
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
                    value={name}
                    onChangeText={setName}
                  />
                </View>
                
                <View style={styles.inputContainer}>
                  <Ionicons name="person-circle" size={20} color={COLORS.text.secondary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Username"
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
                  value={loginIdentifier}
                  onChangeText={setLoginIdentifier}
                  autoCapitalize="none"
                />
              </View>
            )}
            
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed" size={20} color={COLORS.text.secondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
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
            
            {isLogin && (
              <TouchableOpacity style={styles.forgotPassword}>
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity 
              style={styles.authButton}
              onPress={handleAuth}
              disabled={loading}
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
          
          <Text style={styles.hint}>
            Try username "artem2" or email "artem@example.com", password "yourpass"
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
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
    paddingTop: SIZES.padding.xl,
    paddingBottom: SIZES.padding.xl,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: SIZES.padding.xl,
  },
  logoPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SIZES.padding.md,
  },
  appName: {
    ...FONTS.h1,
    color: COLORS.primary,
    marginBottom: SIZES.padding.lg,
  },
  tagline: {
    ...FONTS.body,
    color: COLORS.text.secondary,
    textAlign: 'center',
  },
  formContainer: {
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radius.lg,
    padding: SIZES.padding.lg,
    ...SHADOWS.medium,
  },
  formTitle: {
    ...FONTS.h2,
    color: COLORS.text.primary,
    marginBottom: SIZES.padding.lg,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: SIZES.radius.md,
    marginBottom: SIZES.padding.md,
    paddingHorizontal: SIZES.padding.md,
    backgroundColor: COLORS.background,
  },
  inputIcon: {
    marginRight: SIZES.padding.sm,
  },
  input: {
    flex: 1,
    height: 50,
    ...FONTS.body,
    color: COLORS.text.primary,
  },
  passwordToggle: {
    padding: SIZES.padding.sm,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: SIZES.padding.lg,
  },
  forgotPasswordText: {
    ...FONTS.small,
    color: COLORS.primary,
  },
  authButton: {
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radius.md,
    padding: SIZES.padding.md,
    alignItems: 'center',
    ...SHADOWS.small,
  },
  authButtonText: {
    ...FONTS.h3,
    color: COLORS.text.inverse,
    fontWeight: 'bold',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SIZES.padding.lg,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dividerText: {
    ...FONTS.small,
    color: COLORS.text.light,
    marginHorizontal: SIZES.padding.md,
  },
  guestButton: {
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: SIZES.radius.md,
    padding: SIZES.padding.md,
    alignItems: 'center',
  },
  guestButtonText: {
    ...FONTS.body,
    color: COLORS.primary,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: SIZES.padding.xl,
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
  hint: {
    ...FONTS.small,
    color: COLORS.text.light,
    textAlign: 'center',
    marginTop: SIZES.padding.md,
  }
});