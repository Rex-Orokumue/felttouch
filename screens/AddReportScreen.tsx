import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  Dimensions,
  StatusBar,
  Platform,
  Image,
  KeyboardAvoidingView,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { Report } from './ReportsScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import uuid from 'react-native-uuid';
import * as ImagePicker from 'expo-image-picker';
import { Picker } from '@react-native-picker/picker';
import * as Location from 'expo-location';
import { syncReports, createReport } from '../src/services/api';

// ✅ Import Nigeria states + LGAs from your local dataset
import { nigerianStatesAndLGAs } from '../src/components/nigerianStatesLgas';

type Props = NativeStackScreenProps<RootStackParamList, 'AddReport'>;

const STORAGE_KEY = (productId: string, userId: string) => `reports:${userId}:${productId}`;

const statuses: Report['status'][] = [
  'Contacted',
  'Interested',
  'Follow-up',
  'Closed Won',
  'Closed Lost',
  'Other',
];

const { width } = Dimensions.get('window');

// --------------------- Calendar Picker ---------------------
const CalendarPicker = ({
  visible,
  onClose,
  onDateSelect,
  selectedDate,
}: {
  visible: boolean;
  onClose: () => void;
  onDateSelect: (date: string) => void;
  selectedDate: string;
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthNames = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December',
  ];

  const getDaysInMonth = (date: Date) =>
    new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();

  const getFirstDayOfMonth = (date: Date) =>
    new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  const navigateMonth = (direction: number) => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + direction, 1),
    );
  };

  const handleDateSelect = (day: number) => {
    const newDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      day,
    );
    const year = newDate.getFullYear();
    const month = String(newDate.getMonth() + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    const formattedDate = `${year}-${month}-${dayStr}`;
    onDateSelect(formattedDate);
    onClose();
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(<View key={`empty-${i}`} style={styles.calendarDay} />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const selectedObj = selectedDate
        ? new Date(selectedDate + 'T00:00:00')
        : null;

      const isSelected =
        selectedObj &&
        selectedObj.getDate() === day &&
        selectedObj.getMonth() === currentDate.getMonth() &&
        selectedObj.getFullYear() === currentDate.getFullYear();

      const today = new Date();
      const isToday =
        today.getDate() === day &&
        today.getMonth() === currentDate.getMonth() &&
        today.getFullYear() === currentDate.getFullYear();

      days.push(
        <TouchableOpacity
          key={day}
          style={[
            styles.calendarDay,
            isSelected && styles.selectedDay,
            isToday && !isSelected && styles.todayDay,
          ]}
          onPress={() => handleDateSelect(day)}
        >
          <Text
            style={[
              styles.calendarDayText,
              isSelected && styles.selectedDayText,
              isToday && !isSelected && styles.todayDayText,
            ]}
          >
            {day}
          </Text>
        </TouchableOpacity>,
      );
    }
    return days;
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.calendarContainer}>
          <View style={styles.calendarHeader}>
            <TouchableOpacity
              onPress={() => navigateMonth(-1)}
              style={styles.navButton}
            >
              <Text style={styles.navButtonText}>‹</Text>
            </TouchableOpacity>
            <Text style={styles.monthText}>
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </Text>
            <TouchableOpacity
              onPress={() => navigateMonth(1)}
              style={styles.navButton}
            >
              <Text style={styles.navButtonText}>›</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.weekDays}>
            {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(day => (
              <Text key={day} style={styles.weekDayText}>
                {day}
              </Text>
            ))}
          </View>

          <View style={styles.calendarGrid}>{renderCalendar()}</View>

          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// --------------------- Input Field ---------------------
const InputField = ({
  label,
  value,
  onChangeText,
  placeholder,
  required = false,
  multiline = false,
  keyboardType = 'default',
}) => (
  <View style={styles.inputContainer}>
    {label && (
      <Text style={styles.label}>
        {label} {required && <Text style={styles.required}>*</Text>}
      </Text>
    )}
    <TextInput
      style={[styles.input, multiline && styles.multilineInput]}
      placeholder={placeholder}
      value={value}
      onChangeText={onChangeText}
      multiline={multiline}
      keyboardType={keyboardType}
      placeholderTextColor="#94A3B8"
      autoCorrect={false}
      autoCapitalize={multiline ? 'sentences' : 'words'}
      returnKeyType={multiline ? 'default' : 'next'}
      blurOnSubmit={!multiline}
    />
  </View>
);

// --------------------- Select Field ---------------------
type SelectFieldProps = {
  label: string;
  selectedValue: string;
  onValueChange: (val: string) => void;
  items: string[];
  placeholder?: string;
  required?: boolean;
};

const SelectField: React.FC<SelectFieldProps> = ({
  label,
  selectedValue,
  onValueChange,
  items,
  placeholder = 'Select…',
  required = false,
}) => (
  <View style={styles.inputContainer}>
    {!!label && (
      <Text style={styles.label}>
        {label} {required && <Text style={styles.required}>*</Text>}
      </Text>
    )}
    <View style={styles.pickerContainer}>
      <Picker
        selectedValue={selectedValue}
        onValueChange={(v) => onValueChange(String(v))}
        style={styles.picker}
        dropdownIconColor="#E2E8F0"
      >
        <Picker.Item label={placeholder} value="" />
        {items.map((it) => (
          <Picker.Item key={it} label={it} value={it} />
        ))}
      </Picker>
    </View>
  </View>
);

// --------------------- Main Screen ---------------------
export default function AddReportScreen({ route, navigation }: Props) {
  const { productId } = route.params;

  const [clientName, setClientName] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [town, setTown] = useState('');
  const [localGovernment, setLocalGovernment] = useState('');
  const [state, setState] = useState('');
  const [community, setCommunity] = useState('');
  const [nearestLandmark, setNearestLandmark] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [visitDate, setVisitDate] = useState('');
  const [serviceType, setServiceType] = useState('');
  const [status, setStatus] = useState<Report['status']>('Contacted');
  const [customStatus, setCustomStatus] = useState('');
  const [notes, setNotes] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);

  // ✅ Fixed: load states + LGAs properly
  const [allStates, setAllStates] = useState<string[]>([]);
  const [lgasForState, setLgasForState] = useState<string[]>([]);
  const [locLoading, setLocLoading] = useState(false);

  useEffect(() => {
    if (nigerianStatesAndLGAs && typeof nigerianStatesAndLGAs === 'object') {
      setAllStates(Object.keys(nigerianStatesAndLGAs));
    } else {
      console.warn('Invalid Nigeria dataset:', nigerianStatesAndLGAs);
    }
  }, []);

  useEffect(() => {
    if (state && nigerianStatesAndLGAs[state]) {
      setLgasForState(nigerianStatesAndLGAs[state]);
    } else {
      setLgasForState([]);
    }
  }, [state]);

  // --------------------- Location ---------------------
  const getAndFillLocation = async () => {
    try {
      setLocLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Needed',
          'Location permission is required to auto-fill coordinates.',
        );
        return;
      }
      const { coords } = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setLatitude(coords.latitude.toFixed(6));
      setLongitude(coords.longitude.toFixed(6));
    } catch (e) {
      console.log('Location error:', e);
      Alert.alert('Error', 'Could not fetch your current location.');
    } finally {
      setLocLoading(false);
    }
  };

  // --------------------- Image Picker ---------------------
  const requestPermissions = async () => {
    try {
      const cameraStatus = await ImagePicker.requestCameraPermissionsAsync();
      const mediaStatus = await ImagePicker.requestMediaLibraryPermissionsAsync();
      return {
        camera: cameraStatus.status === 'granted',
        mediaLibrary: mediaStatus.status === 'granted',
      };
    } catch {
      return { camera: false, mediaLibrary: false };
    }
  };

  const showImagePicker = async () => {
    const permissions = await requestPermissions();
    const options: any[] = [];
    if (permissions.camera) options.push({ text: 'Camera', onPress: openCamera });
    if (permissions.mediaLibrary) options.push({ text: 'Photo Library', onPress: openGallery });
    if (options.length === 0) {
      Alert.alert('Permissions Required', 'Enable camera and photo library in settings.');
      return;
    }
    options.push({ text: 'Cancel', style: 'cancel' });
    Alert.alert('Select Image', 'Choose how you want to add an image', options);
  };

  const openCamera = async () => {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    if (!result.canceled && result.assets?.length > 0) {
      setImages((prev) => [...prev, result.assets[0].uri]);
    }
  };

  const openGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    if (!result.canceled && result.assets?.length > 0) {
      setImages((prev) => [...prev, result.assets[0].uri]);
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const getMarketerIdFromStorage = async (): Promise<string> => {
  try {
    // Try the direct user_id first (most reliable)
    let userId = await AsyncStorage.getItem('user_id');
    if (userId) return userId;
    
    // Fallback to user object
    const userData = await AsyncStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      userId = parsedUser.id || parsedUser.user_id;
      if (userId) {
        // Save it as user_id for consistency
        await AsyncStorage.setItem('user_id', userId);
        return userId;
      }
    }
    return 'unknown';
  } catch (error) {
    console.error('Error getting marketer ID:', error);
    return 'unknown';
  }
};

const handleSave = async () => {
  if (!clientName.trim()) return Alert.alert('Validation Error', 'Client Name is required.');
  if (!contactPerson.trim()) return Alert.alert('Validation Error', 'Contact Person is required.');
  if (!contactPhone.trim()) return Alert.alert('Validation Error', 'Contact Phone is required.');
  if (!visitDate.trim()) return Alert.alert('Validation Error', 'Visit Date is required.');
  if (status === 'Other' && !customStatus.trim())
    return Alert.alert('Validation Error', 'Please specify the custom status.');
  if (!state.trim()) return Alert.alert('Validation Error', 'State is required.');
  if (!localGovernment.trim())
    return Alert.alert('Validation Error', 'Local Government Area is required.');
  if (!contactPhone.trim() || !phoneValidation.isValid) 
    return Alert.alert('Validation Error', 'Please enter a valid phone number.');

  try {
    setSaving(true);
    
    const userId = await getMarketerIdFromStorage();
    if (userId === 'unknown') {
      Alert.alert('Error', 'Unable to identify user. Please log in again.');
      return;
    }
    
    const now = new Date().toISOString();
    const finalStatus = status === 'Other' ? customStatus.trim() : status;
    const reportId = String(uuid.v4());

    // Create report data for server
    const serverReportData = {
      reportId,
      marketerId: userId,
      productId: productId,
      schoolName: clientName.trim(),
      schoolAddress: clientAddress.trim(),
      town: town.trim(),
      localGovernment: localGovernment.trim(),
      state: state.trim(),
      community: community.trim(),
      nearestBusStop: nearestLandmark.trim(),
      benchmark: serviceType.trim(),
      latitude: latitude.trim() ? parseFloat(latitude.trim()) : null,
      longitude: longitude.trim() ? parseFloat(longitude.trim()) : null,
      contactPerson: contactPerson.trim(),
      contactPhone: contactPhone.trim(),
      reportDate: visitDate,
      imageUrl: images.length > 0 ? images[0] : null,
    };

    // Create report immediately on server
    let serverId = null;
    try {
      const serverResponse = await createReport(serverReportData);
      serverId = serverResponse.reportId || reportId;
      console.log('Report created on server with ID:', serverId);
    } catch (apiError) {
      console.error('Failed to create report on server:', apiError);
      // Continue with local save, will sync later
    }

    // Create local report
    const localReport: Report = {
      id: reportId,
      serverId: serverId,
      productId,
      clientName: clientName.trim(),
      clientAddress: clientAddress.trim(),
      town: town.trim(),
      localGovernment: localGovernment.trim(),
      state: state.trim(),
      community: community.trim(),
      nearestLandmark: nearestLandmark.trim(),
      latitude: latitude.trim(),
      longitude: longitude.trim(),
      contactPerson: contactPerson.trim(),
      contactPhone: contactPhone.trim(),
      visitDate,
      serviceType: serviceType.trim(),
      status: finalStatus as Report['status'],
      notes: notes.trim(),
      images: [...images],
      createdAt: now,
      updatedAt: now,
    };

    // Save locally
    const storageKey = STORAGE_KEY(productId, userId);
    const existingRaw = await AsyncStorage.getItem(storageKey);
    const existing: Report[] = existingRaw ? JSON.parse(existingRaw) : [];
    const updated = [localReport, ...existing];
    await AsyncStorage.setItem(storageKey, JSON.stringify(updated));

    if (serverId) {
      Alert.alert('Success', 'Report created and synced successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } else {
      Alert.alert('Saved Locally', 'Report saved locally. Will sync when connection is available.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    }

  } catch (error) {
    console.error('Save error:', error);
    Alert.alert('Error', 'Failed to save report. Please try again.');
  } finally {
    setSaving(false);
  }
};

  const handleStatusSelect = (selectedStatus: Report['status']) => {
    setStatus(selectedStatus);
    if (selectedStatus !== 'Other') setCustomStatus('');
  };

  // Add this function after your existing functions
const validatePhoneNumber = (phone) => {
  // Remove all non-digit characters except +
  const cleaned = phone.replace(/[^\d+]/g, '');
  
  // Check for valid formats
  if (cleaned.match(/^\+234\d{10}$/)) {
    return { isValid: true, message: 'Valid Nigerian number with country code' };
  } else if (cleaned.match(/^\d{11}$/)) {
    return { isValid: true, message: 'Valid Nigerian number' };
  } else if (cleaned.length === 0) {
    return { isValid: false, message: '' };
  } else if (cleaned.startsWith('+')) {
    return { isValid: false, message: 'Invalid format. Use +234xxxxxxxxxx' };
  } else {
    return { isValid: false, message: 'Invalid format. Use 11 digits or +234xxxxxxxxxx' };
  }
};

// Add this state after your existing states
const [phoneValidation, setPhoneValidation] = useState({ isValid: false, message: '' });

// Replace your existing setContactPhone calls with this function
const handlePhoneChange = (phone) => {
  setContactPhone(phone);
  const validation = validatePhoneNumber(phone);
  setPhoneValidation(validation);
};

  // --------------------- Render ---------------------
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1E293B" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Report</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Form */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
      >
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContentImproved}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.formContainer}>
            {/* Client Info */}
            <View style={styles.sectionHeader}>
              <View style={styles.iconContainer}>
                <Text style={styles.sectionIcon}>👤</Text>
              </View>
              <Text style={styles.sectionTitle}>Client Information</Text>
            </View>

            <InputField
              label="Client Name"
              value={clientName}
              onChangeText={setClientName}
              placeholder="Enter client or business name"
              required
            />

            <InputField
              label="Client Address"
              value={clientAddress}
              onChangeText={setClientAddress}
              placeholder="Enter complete address"
              multiline
            />

            <View style={styles.row}>
              <View style={styles.halfWidth}>
                <InputField
                  label="Town/City"
                  value={town}
                  onChangeText={setTown}
                  placeholder="Enter town or city"
                />
              </View>
              <View style={styles.halfWidth}>
                <SelectField
                  label="State"
                  selectedValue={state}
                  onValueChange={(val) => {
                    setState(val);
                    setLocalGovernment('');
                  }}
                  items={allStates}
                  placeholder="Select state"
                  required
                />
              </View>
            </View>

            <SelectField
              label="Local Government Area"
              selectedValue={localGovernment}
              onValueChange={setLocalGovernment}
              items={lgasForState}
              placeholder={state ? 'Select LGA' : 'Select a state first'}
              required
            />

            {/* Community & Landmark */}
            <View style={styles.row}>
              <View style={styles.halfWidth}>
                <InputField
                  label="Community"
                  value={community}
                  onChangeText={setCommunity}
                  placeholder="Enter community"
                />
              </View>
              <View style={styles.halfWidth}>
                <InputField
                  label="Nearest Landmark"
                  value={nearestLandmark}
                  onChangeText={setNearestLandmark}
                  placeholder="Bus stop, market, etc."
                />
              </View>
            </View>

            <View style={styles.sectionDivider} />

            {/* Location & Contact */}
            <View style={styles.sectionHeader}>
              <View style={styles.iconContainer}>
                <Text style={styles.sectionIcon}>⚐</Text>
              </View>
              <Text style={styles.sectionTitle}>Location & Contact</Text>
            </View>

            <View style={styles.row}>
              <View style={styles.halfWidth}>
                <InputField
                  label="Latitude"
                  value={latitude}
                  onChangeText={setLatitude}
                  placeholder="e.g. 6.5244"
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.halfWidth}>
                <InputField
                  label="Longitude"
                  value={longitude}
                  onChangeText={setLongitude}
                  placeholder="e.g. 3.3792"
                  keyboardType="numeric"
                />
              </View>
            </View>

            {/* Single centered location button */}
            <TouchableOpacity
              onPress={getAndFillLocation}
              style={[styles.locationButtonCentered, locLoading && styles.locationButtonDisabled]}
              disabled={locLoading}
            >
              <Text style={styles.locationButtonText}>
                {locLoading ? 'Getting location…' : 'Use Current Location'}
              </Text>
            </TouchableOpacity>

            <InputField
              label="Contact Person"
              value={contactPerson}
              onChangeText={setContactPerson}
              placeholder="Full name of contact person"
              required
            />

          <View style={styles.inputContainer}>
            <Text style={styles.label}>
              Contact Phone <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[
                styles.input,
                contactPhone && !phoneValidation.isValid && styles.inputError,
                contactPhone && phoneValidation.isValid && styles.inputSuccess,
              ]}
              placeholder="+234 xxx xxxx xxx or 080xxxxxxxx"
              value={contactPhone}
              onChangeText={handlePhoneChange}
              keyboardType="phone-pad"
              placeholderTextColor="#94A3B8"
              autoCorrect={false}
            />
            {contactPhone && phoneValidation.message && (
              <Text
                style={[
                  styles.validationText,
                  phoneValidation.isValid ? styles.validationSuccess : styles.validationError,
                ]}
              >
                {phoneValidation.message}
              </Text>
            )}
          </View>

            <View style={styles.sectionDivider} />

            {/* Service Details Section */}
            <View style={styles.sectionHeader}>
              <View style={styles.iconContainer}>
                <Text style={styles.sectionIcon}>▤</Text>
              </View>
              <Text style={styles.sectionTitle}>Service Details</Text>
            </View>

            <InputField
              label="Service Type"
              value={serviceType}
              onChangeText={setServiceType}
              placeholder="e.g. Marketing, Consultation, Training, etc."
            />

            {/* Visit Date */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>
                Visit Date <Text style={styles.required}>*</Text>
              </Text>
              <TouchableOpacity 
                style={styles.dateInput}
                onPress={() => setShowCalendar(true)}
              >
                <Text style={[styles.dateText, !visitDate && styles.placeholderText]}>
                  {visitDate ? new Date(visitDate + 'T00:00:00').toLocaleDateString() : 'Select visit date'}
                </Text>
                <Text style={styles.calendarIcon}>▤</Text>
              </TouchableOpacity>
            </View>

            {/* Status Selection */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Status</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.statusContainer}
              >
                {statuses.map((s) => (
                  <TouchableOpacity
                    key={s}
                    style={[styles.statusChip, status === s && styles.statusChipActive]}
                    onPress={() => handleStatusSelect(s)}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        status === s && styles.statusTextActive,
                      ]}
                    >
                      {s}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              
              {/* Custom Status Input */}
              {status === 'Other' && (
                <View style={styles.customStatusContainer}>
                  <TextInput
                    style={styles.customStatusInput}
                    placeholder="Enter custom status"
                    value={customStatus}
                    onChangeText={setCustomStatus}
                    placeholderTextColor="#94A3B8"
                    autoCorrect={false}
                    autoCapitalize="words"
                  />
                </View>
              )}
            </View>

            <View style={styles.sectionDivider} />

            {/* Images & Notes Section */}
            <View style={styles.sectionHeader}>
              <View style={styles.iconContainer}>
                <Text style={styles.sectionIcon}>▢</Text>
              </View>
              <Text style={styles.sectionTitle}>Images & Notes</Text>
            </View>

            {/* Image Picker */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Images ({images.length}/5)</Text>
              <TouchableOpacity 
                style={[
                  styles.imageButton,
                  images.length >= 5 && styles.imageButtonDisabled
                ]}
                onPress={showImagePicker}
                disabled={images.length >= 5}
              >
                <Text style={styles.imageButtonIcon}>▢</Text>
                <Text style={[
                  styles.imageButtonText,
                  images.length >= 5 && styles.imageButtonTextDisabled
                ]}>
                  {images.length >= 5 ? 'Maximum Images Added' : 'Add Images'}
                </Text>
              </TouchableOpacity>
              
              {/* Image Preview */}
              {images.length > 0 && (
                <View style={styles.imagesContainer}>
                  {images.map((image, index) => (
                    <View key={`${index}-${Date.now()}`} style={styles.imagePreview}>
                      <Image 
                        source={{ uri: image }} 
                        style={styles.previewImage} 
                        resizeMode="cover"
                      />
                      <TouchableOpacity 
                        style={styles.removeImageButton}
                        onPress={() => removeImage(index)}
                      >
                        <Text style={styles.removeImageText}>×</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Notes */}
            <InputField
              label="Notes & Observations"
              value={notes}
              onChangeText={setNotes}
              placeholder="Enter visit details, client feedback, next steps, etc."
              multiline
            />

            {/* Save Button */}
            <TouchableOpacity
              style={[styles.saveButton, saving && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={saving}
            >
              <Text style={styles.saveButtonText}>
                {saving ? 'Saving Report...' : 'Save Report'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Calendar Modal */}
      <CalendarPicker
        visible={showCalendar}
        onClose={() => setShowCalendar(false)}
        onDateSelect={setVisitDate}
        selectedDate={visitDate}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: '#1E293B',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '500',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  placeholder: {
    width: 50,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContentImproved: {
  paddingBottom: 100, // Increased padding for better keyboard handling
  },
  formContainer: {
    margin: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 8,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  sectionIcon: {
    fontSize: 20,
    fontWeight: '600',
    color: '#3B82F6',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  sectionDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 32,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  required: {
    color: '#EF4444',
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#FAFBFC',
    color: '#1F2937',
  },
  multilineInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  dateInput: {
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#FAFBFC',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateText: {
    fontSize: 16,
    color: '#1F2937',
  },
  placeholderText: {
    color: '#94A3B8',
  },
  calendarIcon: {
    fontSize: 20,
    color: '#3B82F6',
    fontWeight: '600',
  },
  statusContainer: {
    gap: 8,
    paddingVertical: 4,
  },
  statusChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: '#F1F5F9',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  statusChipActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  statusTextActive: {
    color: '#FFFFFF',
  },
  customStatusContainer: {
    marginTop: 12,
  },
  customStatusInput: {
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#FAFBFC',
    color: '#1F2937',
  },
  imageButton: {
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#FAFBFC',
    marginBottom: 12,
  },
  imageButtonDisabled: {
    borderColor: '#F3F4F6',
    backgroundColor: '#F9FAFB',
  },
  imageButtonIcon: {
    fontSize: 32,
    marginBottom: 8,
    color: '#6B7280',
    fontWeight: '600',
  },
  imageButtonText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '500',
  },
  imageButtonTextDisabled: {
    color: '#D1D5DB',
  },
  imagesContainer: {
    gap: 12,
    paddingVertical: 8,
  },
  imagePreview: {
    position: 'relative',
  },
  previewImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#EF4444',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  removeImageText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 16,
  },
  saveButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 32,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#94A3B8',
    shadowOpacity: 0,
    elevation: 0,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  
  // Calendar Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  calendarContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    width: width * 0.9,
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 20,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  navButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  navButtonText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#3B82F6',
  },
  monthText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  weekDays: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  weekDayText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
    paddingVertical: 8,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDay: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  selectedDay: {
    backgroundColor: '#3B82F6',
  },
  todayDay: {
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  calendarDayText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  selectedDayText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  todayDayText: {
    color: '#3B82F6',
    fontWeight: '700',
  },
  closeButton: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  closeButtonText: {
    color: '#3B82F6',
    fontSize: 16,
    fontWeight: '600',
  },
  pickerContainer: {
  borderWidth: 1,
  borderColor: '#334155',
  borderRadius: 12,
  backgroundColor: '#F1F5F9',
  paddingHorizontal: 8,
  marginTop: 6,
},
picker: {
  color: '#000',
  height: 48,
},

locationButton: {
  marginTop: 8,
  alignSelf: 'flex-start',
  backgroundColor: '#0EA5E9',
  paddingVertical: 10,
  paddingHorizontal: 14,
  borderRadius: 10,
  marginBottom: 25,
},
locationButtonDisabled: {
  opacity: 0.6,
},
locationButtonText: {
  color: '#0B1220',
  fontWeight: '600',
},
locationButtonCentered: {
  alignSelf: 'center',
  backgroundColor: '#0EA5E9',
  paddingVertical: 12,
  paddingHorizontal: 20,
  borderRadius: 12,
  marginTop: 0,
  marginBottom: 18,
  flexDirection: 'row',
  alignItems: 'center',
},

inputError: {
  borderColor: '#EF4444',
  backgroundColor: '#FEF2F2',
},

inputSuccess: {
  borderColor: '#10B981',
  backgroundColor: '#F0FDF4',
},

validationText: {
  fontSize: 14,
  marginTop: 6,
  fontWeight: '500',
},

validationError: {
  color: '#EF4444',
},

validationSuccess: {
  color: '#10B981',
},
});