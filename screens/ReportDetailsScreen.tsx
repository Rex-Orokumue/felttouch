import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  StatusBar,
  Platform,
  Image,
  Modal,
  Dimensions,
  Linking,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { Report } from './ReportsScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Props = NativeStackScreenProps<RootStackParamList, 'ReportDetails'>;

const STORAGE_KEY = (productId: string) => `reports:${productId}`;

const { width } = Dimensions.get('window');

export default function ReportDetailsScreen({ route, navigation }: Props) {
  const { report, productId } = route.params;

  const [editing, setEditing] = useState(false);
  const [clientName, setClientName] = useState(report.clientName);
  const [clientAddress, setClientAddress] = useState(report.clientAddress || '');
  const [town, setTown] = useState(report.town || '');
  const [localGovernment, setLocalGovernment] = useState(report.localGovernment || '');
  const [state, setState] = useState(report.state || '');
  const [community, setCommunity] = useState(report.community || '');
  const [nearestLandmark, setNearestLandmark] = useState(report.nearestLandmark || '');
  const [latitude, setLatitude] = useState(report.latitude || '');
  const [longitude, setLongitude] = useState(report.longitude || '');
  const [contactPerson, setContactPerson] = useState(report.contactPerson || '');
  const [contactPhone, setContactPhone] = useState(report.contactPhone || report.contact || '');
  const [visitDate, setVisitDate] = useState(report.visitDate || report.meetingDate || '');
  const [serviceType, setServiceType] = useState(report.serviceType || '');
  const [status, setStatus] = useState<Report['status']>(report.status);
  const [notes, setNotes] = useState(report.notes);

  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [imageModalVisible, setImageModalVisible] = useState(false);

  const saveChanges = async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY(productId));
      let reports: Report[] = raw ? JSON.parse(raw) : [];

      reports = reports.map((r) =>
        r.id === report.id
          ? {
              ...r,
              clientName,
              clientAddress,
              town,
              localGovernment,
              state,
              community,
              nearestLandmark,
              latitude,
              longitude,
              contactPerson,
              contactPhone,
              visitDate,
              serviceType,
              status,
              notes,
              updatedAt: new Date().toISOString(),
            }
          : r
      );

      await AsyncStorage.setItem(STORAGE_KEY(productId), JSON.stringify(reports));
      Alert.alert('Success', 'Report updated successfully.');
      setEditing(false);
    } catch (err) {
      Alert.alert('Error', 'Failed to update report.');
    }
  };

  const deleteReport = async () => {
    Alert.alert('Delete Report', 'Are you sure you want to delete this report?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const raw = await AsyncStorage.getItem(STORAGE_KEY(productId));
            let reports: Report[] = raw ? JSON.parse(raw) : [];
            reports = reports.filter((r) => r.id !== report.id);

            await AsyncStorage.setItem(STORAGE_KEY(productId), JSON.stringify(reports));
            Alert.alert('Deleted', 'Report deleted successfully.');
            navigation.goBack();
          } catch (err) {
            Alert.alert('Error', 'Failed to delete report.');
          }
        },
      },
    ]);
  };

  const openLocationOnMap = async () => {
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    
    if (isNaN(lat) || isNaN(lng)) {
      Alert.alert('Invalid Coordinates', 'Please ensure latitude and longitude are valid numbers.');
      return;
    }

    const googleMapsUrl = Platform.select({
      ios: `http://maps.apple.com/?q=${lat},${lng}`,
      android: `https://maps.google.com/?q=${lat},${lng}`,
    });

    const fallbackUrl = `https://maps.google.com/?q=${lat},${lng}`;

    try {
      const canOpen = await Linking.canOpenURL(googleMapsUrl || fallbackUrl);
      if (canOpen) {
        await Linking.openURL(googleMapsUrl || fallbackUrl);
      } else {
        await Linking.openURL(fallbackUrl);
      }
    } catch (error) {
      Alert.alert('Error', 'Unable to open map application.');
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const openImageModal = (index: number) => {
    setSelectedImageIndex(index);
    setImageModalVisible(true);
  };

  const closeImageModal = () => {
    setImageModalVisible(false);
    setSelectedImageIndex(null);
  };

  const renderField = (label: string, value: string, onChangeText: (text: string) => void, multiline = false) => (
    <View style={styles.fieldContainer}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {editing ? (
        <TextInput
          style={[styles.input, multiline && styles.multilineInput]}
          value={value}
          onChangeText={onChangeText}
          multiline={multiline}
          textAlignVertical={multiline ? 'top' : 'center'}
          placeholderTextColor="#9CA3AF"
        />
      ) : (
        <View style={styles.valueContainer}>
          <Text style={styles.fieldValue}>{value || '—'}</Text>
        </View>
      )}
    </View>
  );

  const renderTwoColumnField = (leftLabel: string, leftValue: string, leftOnChange: (text: string) => void, rightLabel: string, rightValue: string, rightOnChange: (text: string) => void) => (
    <View style={styles.twoColumnContainer}>
      <View style={styles.halfColumn}>
        {renderField(leftLabel, leftValue, leftOnChange)}
      </View>
      <View style={styles.halfColumn}>
        {renderField(rightLabel, rightValue, rightOnChange)}
      </View>
    </View>
  );

  const renderLocationField = () => (
    <View style={styles.fieldContainer}>
      <View style={styles.coordinatesHeader}>
        <Text style={styles.fieldLabel}>Coordinates</Text>
        {!editing && latitude && longitude && (
          <TouchableOpacity style={styles.mapButton} onPress={openLocationOnMap}>
            <Image 
              source={{ uri: 'https://cdn-icons-png.flaticon.com/512/854/854878.png' }} 
              style={styles.mapButtonIcon} 
            />
            <Text style={styles.mapButtonText}>View on Map</Text>
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.twoColumnContainer}>
        <View style={styles.halfColumn}>
          {renderField('Latitude', latitude, setLatitude)}
        </View>
        <View style={styles.halfColumn}>
          {renderField('Longitude', longitude, setLongitude)}
        </View>
      </View>
    </View>
  );

  const renderStatusField = () => (
    <View style={styles.fieldContainer}>
      <Text style={styles.fieldLabel}>Status</Text>
      {editing ? (
        <TextInput
          style={styles.input}
          value={status}
          onChangeText={(text) => setStatus(text as Report['status'])}
          placeholderTextColor="#9CA3AF"
        />
      ) : (
        <View style={styles.statusContainer}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(status) }]}>
            <Image 
              source={{ uri: getStatusIconUrl(status) }} 
              style={styles.statusIcon} 
            />
            <Text style={styles.statusText}>{status}</Text>
          </View>
        </View>
      )}
    </View>
  );

  const renderImagesSection = () => {
    if (!report.images || report.images.length === 0) return null;

    return (
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionIconContainer}>
            <Image 
              source={{ uri: 'https://cdn-icons-png.flaticon.com/512/1375/1375106.png' }} 
              style={styles.sectionIconImage} 
            />
          </View>
          <Text style={styles.sectionTitle}>Images ({report.images.length})</Text>
        </View>
        <View style={styles.imagesGrid}>
          {report.images.map((imageUri, index) => (
            <TouchableOpacity
              key={`${report.id}-${index}`}
              style={styles.imageContainer}
              onPress={() => openImageModal(index)}
            >
              <Image source={{ uri: imageUri }} style={styles.gridImage} />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Contacted': return '#0d6efd';
      case 'Interested': return '#2e7d32';
      case 'Follow-up': return '#b26a00';
      case 'Closed Won': return '#1e7e34';
      case 'Closed Lost': return '#c62828';
      default: return '#6B7280';
    }
  };

  const getStatusIconUrl = (status: string) => {
    switch (status) {
      case 'Contacted': return 'https://cdn-icons-png.flaticon.com/512/561/561253.png';
      case 'Interested': return 'https://cdn-icons-png.flaticon.com/512/1828/1828640.png';
      case 'Follow-up': return 'https://cdn-icons-png.flaticon.com/512/2088/2088617.png';
      case 'Closed Won': return 'https://cdn-icons-png.flaticon.com/512/190/190411.png';
      case 'Closed Lost': return 'https://cdn-icons-png.flaticon.com/512/1828/1828843.png';
      default: return 'https://cdn-icons-png.flaticon.com/512/2331/2331966.png';
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Image 
            source={{ uri: 'https://cdn-icons-png.flaticon.com/512/271/271220.png' }} 
            style={styles.backIcon} 
          />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Report Details</Text>
          <Text style={styles.headerSubtitle}>
            ID: #{report.id.slice(-8).toUpperCase()}
          </Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          
          {/* Client Information Section */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconContainer}>
                <Image 
                  source={{ uri: 'https://cdn-icons-png.flaticon.com/512/1077/1077114.png' }} 
                  style={styles.sectionIconImage} 
                />
              </View>
              <Text style={styles.sectionTitle}>Client Information</Text>
            </View>
            {renderField('Client Name', clientName, setClientName)}
            {renderField('Client Address', clientAddress, setClientAddress, true)}
            {renderTwoColumnField('Town/City', town, setTown, 'State', state, setState)}
            {renderField('Local Government Area', localGovernment, setLocalGovernment)}
            {renderTwoColumnField('Community', community, setCommunity, 'Nearest Landmark', nearestLandmark, setNearestLandmark)}
          </View>

          {/* Location & Contact Section */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconContainer}>
                <Image 
                  source={{ uri: 'https://cdn-icons-png.flaticon.com/512/684/684908.png' }} 
                  style={styles.sectionIconImage} 
                />
              </View>
              <Text style={styles.sectionTitle}>Location & Contact</Text>
            </View>
            {renderLocationField()}
            {renderField('Contact Person', contactPerson, setContactPerson)}
            {renderField('Contact Phone', contactPhone, setContactPhone)}
          </View>

          {/* Service Details Section */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconContainer}>
                <Image 
                  source={{ uri: 'https://cdn-icons-png.flaticon.com/512/2331/2331966.png' }} 
                  style={styles.sectionIconImage} 
                />
              </View>
              <Text style={styles.sectionTitle}>Service Details</Text>
            </View>
            {renderField('Service Type', serviceType, setServiceType)}
            {renderField('Visit Date', visitDate, setVisitDate)}
            {renderStatusField()}
          </View>

          {/* Notes Section */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconContainer}>
                <Image 
                  source={{ uri: 'https://cdn-icons-png.flaticon.com/512/1055/1055687.png' }} 
                  style={styles.sectionIconImage} 
                />
              </View>
              <Text style={styles.sectionTitle}>Notes & Observations</Text>
            </View>
            {renderField('Notes', notes, setNotes, true)}
          </View>

          {/* Images Section */}
          {renderImagesSection()}

          {/* Report Metadata */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconContainer}>
                <Image 
                  source={{ uri: 'https://cdn-icons-png.flaticon.com/512/2541/2541988.png' }} 
                  style={styles.sectionIconImage} 
                />
              </View>
              <Text style={styles.sectionTitle}>Report Information</Text>
            </View>
            <View style={styles.metadataContainer}>
              <View style={styles.metadataItem}>
                <Text style={styles.metadataLabel}>Created</Text>
                <Text style={styles.metadataValue}>
                  {formatDate(report.createdAt)}
                </Text>
              </View>
              <View style={styles.metadataItem}>
                <Text style={styles.metadataLabel}>Last Updated</Text>
                <Text style={styles.metadataValue}>
                  {formatDate(report.updatedAt)}
                </Text>
              </View>
              <View style={styles.metadataItem}>
                <Text style={styles.metadataLabel}>Report ID</Text>
                <Text style={styles.metadataValue}>
                  #{report.id.slice(-8).toUpperCase()}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionContainer}>
        {editing ? (
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.actionButton, styles.cancelButton]}
              onPress={() => {
                setEditing(false);
                // Reset all fields to original values
                setClientName(report.clientName);
                setClientAddress(report.clientAddress || '');
                setTown(report.town || '');
                setLocalGovernment(report.localGovernment || '');
                setState(report.state || '');
                setCommunity(report.community || '');
                setNearestLandmark(report.nearestLandmark || '');
                setLatitude(report.latitude || '');
                setLongitude(report.longitude || '');
                setContactPerson(report.contactPerson || '');
                setContactPhone(report.contactPhone || report.contact || '');
                setVisitDate(report.visitDate || report.meetingDate || '');
                setServiceType(report.serviceType || '');
                setStatus(report.status);
                setNotes(report.notes);
              }}
            >
              <Image 
                source={{ uri: 'https://cdn-icons-png.flaticon.com/512/1828/1828843.png' }} 
                style={styles.actionButtonIcon} 
              />
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.saveButton]}
              onPress={saveChanges}
            >
              <Image 
                source={{ uri: 'https://cdn-icons-png.flaticon.com/512/190/190411.png' }} 
                style={styles.actionButtonIcon} 
              />
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton]}
              onPress={deleteReport}
            >
              <Image 
                source={{ uri: 'https://cdn-icons-png.flaticon.com/512/3096/3096673.png' }} 
                style={styles.actionButtonIcon} 
              />
              <Text style={styles.deleteButtonText}>Delete</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.editButton]}
              onPress={() => setEditing(true)}
            >
              <Image 
                source={{ uri: 'https://cdn-icons-png.flaticon.com/512/1159/1159633.png' }} 
                style={styles.actionButtonIcon} 
              />
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Image Modal */}
      <Modal
        visible={imageModalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeImageModal}
      >
        <View style={styles.imageModalOverlay}>
          <TouchableOpacity
            style={styles.imageModalClose}
            onPress={closeImageModal}
          >
            <Text style={styles.imageModalCloseText}>×</Text>
          </TouchableOpacity>
          {selectedImageIndex !== null && report.images && (
            <Image
              source={{ uri: report.images[selectedImageIndex] }}
              style={styles.fullScreenImage}
              resizeMode="contain"
            />
          )}
          <View style={styles.imageModalInfo}>
            <Text style={styles.imageModalInfoText}>
              {selectedImageIndex !== null && report.images
                ? `${selectedImageIndex + 1} of ${report.images.length}`
                : ''}
            </Text>
          </View>
        </View>
      </Modal>
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
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingRight: 8,
  },
  backIcon: {
    width: 16,
    height: 16,
    marginRight: 6,
    tintColor: '#3B82F6',
  },
  backButtonText: {
    color: '#3B82F6',
    fontSize: 16,
    fontWeight: '500',
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 2,
  },
  placeholder: {
    width: 50,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 100,
  },
  sectionContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionIconContainer: {
    backgroundColor: '#EEF2FF',
    padding: 8,
    borderRadius: 8,
    marginRight: 12,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionIconImage: {
    width: 20,
    height: 20,
    tintColor: '#3B82F6',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  fieldContainer: {
    marginBottom: 16,
  },
  coordinatesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  mapButtonIcon: {
    width: 16,
    height: 16,
    tintColor: '#FFFFFF',
    marginRight: 6,
  },
  mapButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#FAFBFC',
    color: '#1F2937',
  },
  multilineInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  valueContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  fieldValue: {
    fontSize: 16,
    color: '#1F2937',
    lineHeight: 22,
  },
  twoColumnContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  halfColumn: {
    flex: 1,
  },
  statusContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  statusIcon: {
    width: 16,
    height: 16,
    tintColor: '#FFFFFF',
    marginRight: 6,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  imagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  imageContainer: {
    width: (width - 80) / 3,
    height: (width - 80) / 3,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  metadataContainer: {
    gap: 12,
  },
  metadataItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  metadataLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
  },
  metadataValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  actionContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 8,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonIcon: {
    width: 18,
    height: 18,
    tintColor: '#FFFFFF',
  },
  editButton: {
    backgroundColor: '#3B82F6',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  editButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#EF4444',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#10B981',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#6B7280',
    shadowColor: '#6B7280',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  imageModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageModalClose: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    right: 20,
    zIndex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageModalCloseText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '300',
  },
  fullScreenImage: {
    width: width,
  },
  imageModalInfo: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 80 : 60,
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  imageModalInfoText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
});