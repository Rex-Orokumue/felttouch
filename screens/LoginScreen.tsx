import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  Platform,
  StatusBar,
  Dimensions,
  Animated,
  BackHandler
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { RootStackParamList } from '../App';

type LoginScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Login'
>;

const { width, height } = Dimensions.get('window');

export default function LoginScreen() {
  const navigation = useNavigation<LoginScreenNavigationProp>();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [secureText, setSecureText] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  // Animation values
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(30));

  // Prevent back navigation when user is on login screen
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        // Return true to prevent default back action
        return true;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription?.remove();
    }, [])
  );

  // Hide the header back button
  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false, // Hide entire header
      // Or if you want to keep header but hide back button:
      // headerLeft: () => null,
      // gestureEnabled: false, // Disable swipe back on iOS
    });
  }, [navigation]);

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const validateEmail = (value: string) => {
    return /\S+@\S+\.\S+/.test(value);
  };

  const handleLogin = () => {
    setError('');

    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);

    // Fake API delay
    setTimeout(() => {
      setLoading(false);

      // Mock authentication (you'll replace with API later)
      if (email === 'test@company.com' && password === 'password123') {
        // Use reset instead of replace to clear navigation stack
        navigation.reset({
          index: 0,
          routes: [{ name: 'Home' }],
        });
      } else {
        setError('Invalid email or password.');
      }
    }, 1500);
  };

  const EyeIcon = ({ visible }: { visible: boolean }) => (
    <View style={styles.iconContainer}>
      <View style={[styles.eyeBase, !visible && styles.eyeClosed]}>
        {visible && <View style={styles.eyePupil} />}
      </View>
      {!visible && <View style={styles.eyeSlash} />}
    </View>
  );

  const EmailIcon = () => (
    <View style={styles.iconContainer}>
      <View style={styles.emailIcon}>
        <View style={styles.emailBody} />
        <View style={styles.emailFlap} />
      </View>
    </View>
  );

  const LockIcon = () => (
    <View style={styles.iconContainer}>
      <View style={styles.lockContainer}>
        <View style={styles.lockShackle} />
        <View style={styles.lockBody} />
      </View>
    </View>
  );

  const CompanyLogo = () => (
    <View style={styles.logoContainer}>
      <View style={styles.logoOuter}>
        <View style={styles.logoInner}>
          <View style={styles.logoIcon}>
            <View style={styles.chartBar1} />
            <View style={styles.chartBar2} />
            <View style={styles.chartBar3} />
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0066AA" />
      <View style={styles.background}>
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          bounces={false}
        >
          <Animated.View 
            style={[
              styles.container,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            {/* Geometric Background Elements */}
            <View style={styles.geometricElements}>
              <View style={[styles.geometricShape, styles.shape1]} />
              <View style={[styles.geometricShape, styles.shape2]} />
              <View style={[styles.geometricShape, styles.shape3]} />
            </View>

            {/* Header Section */}
            <View style={styles.header}>
              <CompanyLogo />
              <Text style={styles.title}>Welcome Back</Text>
              <Text style={styles.subtitle}>Sign in to your account</Text>
            </View>

            {/* Form Section */}
            <View style={styles.formContainer}>
              {error ? (
                <View style={styles.errorContainer}>
                  <View style={styles.errorIcon}>
                    <View style={styles.exclamationMark} />
                  </View>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              {/* Email Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email Address</Text>
                <View style={[
                  styles.inputContainer,
                  emailFocused && styles.inputContainerFocused,
                  error && email === '' && styles.inputContainerError
                ]}>
                  <EmailIcon />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your email address"
                    placeholderTextColor="#999999"
                    value={email}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    onChangeText={setEmail}
                    onFocus={() => setEmailFocused(true)}
                    onBlur={() => setEmailFocused(false)}
                  />
                </View>
              </View>

              {/* Password Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Password</Text>
                <View style={[
                  styles.inputContainer,
                  passwordFocused && styles.inputContainerFocused,
                  error && password === '' && styles.inputContainerError
                ]}>
                  <LockIcon />
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="Enter your password"
                    placeholderTextColor="#999999"
                    secureTextEntry={secureText}
                    value={password}
                    onChangeText={setPassword}
                    onFocus={() => setPasswordFocused(true)}
                    onBlur={() => setPasswordFocused(false)}
                  />
                  <TouchableOpacity 
                    onPress={() => setSecureText(!secureText)}
                    style={styles.eyeButton}
                  >
                    <EyeIcon visible={!secureText} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Forgot Password */}
              <TouchableOpacity style={styles.forgotPassword}>
                <Text style={styles.forgotPasswordText}>Forgot your password?</Text>
              </TouchableOpacity>

              {/* Login Button */}
              <TouchableOpacity 
                style={[
                  styles.loginButton, 
                  loading && styles.loginButtonLoading,
                  (!email || !password) && styles.loginButtonDisabled
                ]} 
                onPress={handleLogin}
                disabled={loading || !email || !password}
                activeOpacity={0.9}
              >
                <View style={styles.loginButtonContent}>
                  {loading ? (
                    <ActivityIndicator color="#ffffff" size="small" />
                  ) : (
                    <>
                      <Text style={styles.loginButtonText}>Sign In</Text>
                      <View style={styles.arrowIcon}>
                        <View style={styles.arrowLine} />
                        <View style={styles.arrowHead} />
                      </View>
                    </>
                  )}
                </View>
              </TouchableOpacity>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                Don't have an account?{' '}
                <Text style={styles.signupText}>Contact Administrator</Text>
              </Text>
            </View>
          </Animated.View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  background: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollContainer: {
    flexGrow: 1,
    minHeight: height,
  },
  container: {
    flex: 1,
    paddingHorizontal: 32,
    paddingVertical: 20,
    position: 'relative',
  },
  
  // Geometric Elements
  geometricElements: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  geometricShape: {
    position: 'absolute',
    borderRadius: 8,
  },
  shape1: {
    width: 100,
    height: 100,
    backgroundColor: 'rgba(0, 129, 215, 0.05)',
    transform: [{ rotate: '15deg' }],
    top: '12%',
    right: '10%',
  },
  shape2: {
    width: 60,
    height: 60,
    backgroundColor: 'rgba(0, 102, 170, 0.08)',
    transform: [{ rotate: '-20deg' }],
    bottom: '25%',
    left: '8%',
  },
  shape3: {
    width: 40,
    height: 40,
    backgroundColor: 'rgba(0, 129, 215, 0.06)',
    transform: [{ rotate: '45deg' }],
    top: '35%',
    right: '25%',
  },

  // Header Styles
  header: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 50,
    zIndex: 1,
  },
  logoContainer: {
    marginBottom: 32,
    shadowColor: '#0066AA',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  logoOuter: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: '#0081D7',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#0066AA',
  },
  logoInner: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoIcon: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
  },
  chartBar1: {
    width: 6,
    height: 12,
    backgroundColor: '#0081D7',
    borderRadius: 3,
  },
  chartBar2: {
    width: 6,
    height: 20,
    backgroundColor: '#0066AA',
    borderRadius: 3,
  },
  chartBar3: {
    width: 6,
    height: 16,
    backgroundColor: '#0081D7',
    borderRadius: 3,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 8,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 22,
  },

  // Form Styles
  formContainer: {
    flex: 1,
    zIndex: 1,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  inputContainer: {
    height: 54,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#E5E5E5',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  inputContainerFocused: {
    borderColor: '#0081D7',
    shadowColor: '#0081D7',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  inputContainerError: {
    borderColor: '#DC2626',
    backgroundColor: '#FEF2F2',
  },
  input: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#000000',
    fontWeight: '400',
  },
  passwordInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#000000',
    fontWeight: '400',
  },

  // Icon Styles
  iconContainer: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Email Icon
  emailIcon: {
    width: 18,
    height: 14,
    position: 'relative',
  },
  emailBody: {
    width: 18,
    height: 14,
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#666666',
    borderRadius: 2,
  },
  emailFlap: {
    position: 'absolute',
    top: 0,
    left: 1.5,
    width: 0,
    height: 0,
    borderLeftWidth: 7.5,
    borderRightWidth: 7.5,
    borderTopWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#666666',
  },

  // Lock Icon
  lockContainer: {
    width: 16,
    height: 18,
    position: 'relative',
  },
  lockShackle: {
    position: 'absolute',
    top: 0,
    left: 3,
    width: 10,
    height: 8,
    borderWidth: 1.5,
    borderColor: '#666666',
    borderBottomWidth: 0,
    borderRadius: 5,
    backgroundColor: 'transparent',
  },
  lockBody: {
    position: 'absolute',
    bottom: 0,
    width: 16,
    height: 10,
    backgroundColor: '#666666',
    borderRadius: 2,
  },

  // Eye Icon
  eyeBase: {
    width: 18,
    height: 12,
    borderRadius: 9,
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#666666',
    justifyContent: 'center',
    alignItems: 'center',
  },
  eyeClosed: {
    height: 2,
    borderRadius: 1,
    backgroundColor: '#666666',
    borderWidth: 0,
  },
  eyePupil: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#666666',
  },
  eyeSlash: {
    position: 'absolute',
    width: 20,
    height: 1.5,
    backgroundColor: '#666666',
    transform: [{ rotate: '45deg' }],
  },
  eyeButton: {
    paddingLeft: 12,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Error Styles
  errorContainer: {
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#DC2626',
    flexDirection: 'row',
    alignItems: 'center',
  },
  errorIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#DC2626',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  exclamationMark: {
    width: 2,
    height: 10,
    backgroundColor: '#ffffff',
    borderRadius: 1,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },

  // Button Styles
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 32,
  },
  forgotPasswordText: {
    color: '#0081D7',
    fontSize: 14,
    fontWeight: '600',
  },
  loginButton: {
    height: 54,
    borderRadius: 12,
    marginBottom: 32,
    shadowColor: '#0066AA',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  loginButtonContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: '#0081D7',
    flexDirection: 'row',
  },
  loginButtonLoading: {
    opacity: 0.8,
  },
  loginButtonDisabled: {
    shadowOpacity: 0,
    elevation: 0,
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  arrowIcon: {
    marginLeft: 8,
    width: 16,
    height: 12,
    position: 'relative',
  },
  arrowLine: {
    position: 'absolute',
    left: 0,
    top: 5,
    width: 12,
    height: 2,
    backgroundColor: '#ffffff',
    borderRadius: 1,
  },
  arrowHead: {
    position: 'absolute',
    right: 0,
    top: 2,
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderTopWidth: 4,
    borderBottomWidth: 4,
    borderLeftColor: '#ffffff',
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
  },

  // Footer Styles
  footer: {
    alignItems: 'center',
    paddingBottom: 40,
    zIndex: 1,
  },
  footerText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
  },
  signupText: {
    color: '#0081D7',
    fontWeight: '600',
  },
});