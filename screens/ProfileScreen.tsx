import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  ScrollView,
  StatusBar,
  Dimensions,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'userProfile';
const { width } = Dimensions.get('window');

export default function ProfileScreen({ navigation }) {
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    image: '',
    bio: '',
  });
  const [originalProfile, setOriginalProfile] = useState({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsedProfile = JSON.parse(saved);
          setProfile(parsedProfile);
          setOriginalProfile(parsedProfile);
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to load profile');
      }
    };
    loadProfile();
  }, []);

  // Check for changes whenever profile updates
  useEffect(() => {
    const hasChanges = JSON.stringify(profile) !== JSON.stringify(originalProfile);
    setHasUnsavedChanges(hasChanges);
  }, [profile, originalProfile]);

  const pickImage = async () => {
  try {
    // Request permission
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert('Permission Required', 'Camera roll permission is needed to select images');
      return;
    }

    // Launch image library
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    console.log('Image picker result:', result); // Add this for debugging

    if (!result.canceled) {
      setProfile({ ...profile, image: result.assets[0].uri });
    }
  } catch (error) {
    console.error('Error picking image:', error);
    Alert.alert('Error', 'Failed to open photo library');
  }
};

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Camera permission is needed to take photos');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setProfile({ ...profile, image: result.assets[0].uri });
    }
  };

  const showImageOptions = () => {
    Alert.alert(
      'Change Profile Photo',
      'Choose an option',
      [
        { text: 'Camera', onPress: takePhoto },
        { text: 'Photo Library', onPress: pickImage },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const updateProfile = (field, value) => {
    setProfile({ ...profile, [field]: value });
  };

  const saveProfile = async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
      setOriginalProfile(profile);
      setHasUnsavedChanges(false);
      Alert.alert('Success', 'Profile saved successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to save profile');
    }
  };

  const discardChanges = () => {
    Alert.alert(
      'Discard Changes',
      'Are you sure you want to discard your changes?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Discard', 
          style: 'destructive',
          onPress: () => {
            setProfile(originalProfile);
            setHasUnsavedChanges(false);
          }
        },
      ]
    );
  };

  const handleLogout = () => {
  if (hasUnsavedChanges) {
    Alert.alert(
      'Unsaved Changes',
      'You have unsaved changes. Save them before logging out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Discard & Logout', 
          style: 'destructive',
          onPress: confirmLogout 
        },
        {
          text: 'Save & Logout',
          onPress: async () => {
            await saveProfile();
            confirmLogout();
          }
        }
      ]
    );
  } else {
    confirmLogout();
  }
};

const confirmLogout = async () => {
  try {
    // Clear any stored authentication data
    // await AsyncStorage.removeItem('authToken');
    // await AsyncStorage.removeItem('userInfo');
    // Or however you're storing auth data
    
    // Reset navigation stack to Login screen
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  } catch (error) {
    console.error('Logout error:', error);
    Alert.alert('Error', 'Failed to logout. Please try again.');
  }
};

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#667eea" />
      <View style={styles.container}>
        {/* Gradient Header */}
        <View style={styles.headerGradient}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>My Profile</Text>
            <Text style={styles.headerSubtitle}>Manage your personal information</Text>
          </View>
        </View>

        <ScrollView 
          style={styles.scrollView} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Profile Card */}
          <View style={styles.profileCard}>
            {/* Profile Image Section */}
            <View style={styles.imageSection}>
              <TouchableOpacity 
                onPress={showImageOptions} 
                style={styles.imageWrapper}
                activeOpacity={0.8}
              >
                <View style={styles.imageContainer}>
                  {profile.image ? (
                    <Image source={{ uri: profile.image }} style={styles.profileImage} />
                  ) : (
                    <View style={styles.imagePlaceholder}>
                      <View style={styles.avatarIcon}>
                        <Text style={styles.avatarText}>👤</Text>
                      </View>
                    </View>
                  )}
                  <View style={styles.cameraButton}>
                    <Text style={styles.cameraIcon}>📸</Text>
                  </View>
                </View>
              </TouchableOpacity>
              <Text style={styles.imageHint}>Tap to update photo</Text>
            </View>

            {/* Form Section */}
            <View style={styles.formSection}>
              <View style={styles.inputGroup}>
                <View style={styles.labelContainer}>
                  <View style={styles.iconContainer}>
                    <Text style={styles.iconLabel}>👤</Text>
                  </View>
                  <Text style={styles.label}>Full Name</Text>
                </View>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    value={profile.name}
                    onChangeText={(text) => updateProfile('name', text)}
                    placeholder="Enter your full name"
                    placeholderTextColor="#a0aec0"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <View style={styles.labelContainer}>
                  <View style={styles.iconContainer}>
                    <Text style={styles.iconLabel}>📧</Text>
                  </View>
                  <Text style={styles.label}>Email Address</Text>
                </View>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    value={profile.email}
                    onChangeText={(text) => updateProfile('email', text)}
                    placeholder="Enter your email address"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    placeholderTextColor="#a0aec0"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <View style={styles.labelContainer}>
                  <View style={styles.iconContainer}>
                    <Text style={styles.iconLabel}>📱</Text>
                  </View>
                  <Text style={styles.label}>Phone Number</Text>
                </View>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    value={profile.phone}
                    onChangeText={(text) => updateProfile('phone', text)}
                    placeholder="Enter your phone number"
                    keyboardType="phone-pad"
                    placeholderTextColor="#a0aec0"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <View style={styles.labelContainer}>
                  <View style={styles.iconContainer}>
                    <Text style={styles.iconLabel}>💬</Text>
                  </View>
                  <Text style={styles.label}>Bio</Text>
                </View>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={profile.bio}
                    onChangeText={(text) => updateProfile('bio', text)}
                    placeholder="Tell us about yourself..."
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                    placeholderTextColor="#a0aec0"
                  />
                </View>
              </View>
            </View>
          </View>

          {/* Action Section */}
          <View style={styles.actionSection}>
            {hasUnsavedChanges && (
              <View style={styles.unsavedIndicator}>
                <View style={styles.pulsingDot} />
                <Text style={styles.unsavedText}>You have unsaved changes</Text>
              </View>
            )}

            <View style={styles.buttonContainer}>
              {hasUnsavedChanges && (
                <TouchableOpacity 
                  style={styles.discardButton} 
                  onPress={discardChanges}
                  activeOpacity={0.8}
                >
                  <Text style={styles.discardButtonText}>✕ Discard</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity 
                style={[
                  styles.saveButton,
                  !hasUnsavedChanges && styles.saveButtonDisabled,
                  hasUnsavedChanges && styles.saveButtonActive
                ]}
                onPress={saveProfile}
                disabled={!hasUnsavedChanges}
                activeOpacity={0.8}
              >
                <Text style={[
                  styles.saveButtonText,
                  !hasUnsavedChanges && styles.saveButtonTextDisabled
                ]}>
                  {hasUnsavedChanges ? '💾 Save Changes' : '✅ All Saved'}
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={styles.logoutButton} 
              onPress={handleLogout}
              activeOpacity={0.8}
            >
              <Text style={styles.logoutButtonText}>🚪 Logout</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7fafc',
  },
  headerGradient: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    backgroundColor: '#667eea', // Fallback for React Native
    paddingTop: 50,
    paddingBottom: 30,
    paddingHorizontal: 24,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 4,
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  profileCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    marginTop: -20,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
    overflow: 'hidden',
  },
  imageSection: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingTop: 50,
    backgroundColor: 'rgba(102, 126, 234, 0.02)',
  },
  imageWrapper: {
    marginBottom: 16,
  },
  imageContainer: {
    position: 'relative',
  },
  profileImage: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 6,
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  imagePlaceholder: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
  },
  avatarIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 36,
    color: '#667eea',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 8,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#667eea',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#ffffff',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  cameraIcon: {
    fontSize: 18,
  },
  imageHint: {
    fontSize: 15,
    color: '#667eea',
    fontWeight: '600',
    textAlign: 'center',
  },
  formSection: {
    padding: 28,
    paddingTop: 0,
  },
  inputGroup: {
    marginBottom: 28,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  iconLabel: {
    fontSize: 18,
  },
  label: {
    fontSize: 17,
    fontWeight: '700',
    color: '#2d3748',
  },
  inputWrapper: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  input: {
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 16,
    backgroundColor: '#ffffff',
    color: '#2d3748',
    fontWeight: '500',
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  actionSection: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  unsavedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    borderRadius: 50,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.3)',
  },
  pulsingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#f59e0b',
    marginRight: 10,
  },
  unsavedText: {
    fontSize: 15,
    color: '#d97706',
    fontWeight: '700',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  discardButton: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  discardButtonText: {
    color: '#64748b',
    fontSize: 16,
    fontWeight: '700',
  },
  saveButton: {
    flex: 2,
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#f1f5f9',
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  saveButtonActive: {
    backgroundColor: '#10b981',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '800',
  },
  saveButtonTextDisabled: {
    color: '#94a3b8',
  },
  logoutButton: {
    backgroundColor: '#ef4444',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  logoutButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
});