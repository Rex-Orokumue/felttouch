import React, { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  StyleSheet,
  TextInput,
  StatusBar,
  Image,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RootStackParamList } from '../App';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

const STORAGE_KEY = 'userProfile';

// Clean product data for digital agency
const products = [
  { 
    id: '1', 
    name: 'Edufelt', 
    description: 'Comprehensive school management software with student tracking, grade management, and parent communication tools.',
    category: 'Education',
    color: '#10b981',
    icon: '🎓'
  },
  { 
    id: '2', 
    name: 'Fetem', 
    description: 'Complete event management solution for planning, booking, and executing successful events.',
    category: 'Events',
    color: '#ec4555',
    icon: '🎪'
  },
  { 
    id: '3', 
    name: 'Adfelt', 
    description: 'Advertising solutions helping businesses reach their target audience and achieve measurable growth.',
    category: 'Advertising',
    color: '#1f2937',
    icon: '📊'
  },
  { 
    id: '4', 
    name: 'General Services', 
    description: 'Comprehensive business solutions offering support in operations, management, and growth strategy',
    category: 'Growth',
    color: '#0066AA',
    icon: '☁️'
  },
];

export default function HomeScreen({ navigation }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    image: '',
    bio: '',
  });

  // Load profile data when screen is focused
  const loadProfile = async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) {
        setProfile(JSON.parse(saved));
      }
    } catch (error) {
      console.log('Error loading profile:', error);
    }
  };

  // Use useFocusEffect to reload profile when screen is focused
  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [])
  );

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderProductCard = ({ item }: { item: typeof products[0] }) => (
    <View style={[styles.productCard, { borderLeftColor: item.color }]}>
      <View style={styles.cardHeader}>
        <View style={[styles.productIcon, { backgroundColor: item.color + '15' }]}>
          <Text style={styles.iconText}>{item.icon}</Text>
        </View>
        <View style={styles.productInfo}>
          <Text style={styles.productName}>{item.name}</Text>
          <Text style={styles.productCategory}>{item.category}</Text>
        </View>
      </View>
      
      <Text style={styles.productDesc}>{item.description}</Text>
      
      <TouchableOpacity
        style={[styles.viewReportsBtn, { backgroundColor: item.color }]}
        onPress={() => navigation.navigate('Reports', { productId: item.id, productName: item.name })}
        activeOpacity={0.8}
      >
        <Text style={styles.viewReportsText}>View Reports</Text>
      </TouchableOpacity>
    </View>
  );

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerStyle: {
        backgroundColor: '#1f2937',
        elevation: 0,
        shadowOpacity: 0,
      },
      headerTintColor: '#fff',
      headerTitle: '',
      headerRight: () => (
        <TouchableOpacity 
          onPress={() => navigation.navigate('Profile')}
          style={styles.profileBtn}
        >
          {profile.image ? (
            <Image 
              source={{ uri: profile.image }} 
              style={styles.profileImage}
            />
          ) : (
            <Text style={styles.profileIcon}>👤</Text>
          )}
        </TouchableOpacity>
      ),
    });
  }, [navigation, profile.image]);

  // Get display name - use profile name if available, otherwise show "User"
  const getDisplayName = () => {
    return profile.name ? profile.name : 'User';
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#1f2937" barStyle="light-content" />
      
      {/* Header Section */}
      <View style={styles.headerSection}>
        <Text style={styles.userName}>Hello, {getDisplayName()}</Text>
        <Text style={styles.headerSubtext}>Your Marketing Reports</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search products..."
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Products Section */}
      <View style={styles.productsSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Company Products</Text>
          <Text style={styles.productCount}>{filteredProducts.length} products</Text>
        </View>
        
        <FlatList
          data={filteredProducts}
          renderItem={renderProductCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.productsList}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  headerSection: {
    backgroundColor: '#1f2937',
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  userName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtext: {
    fontSize: 16,
    color: '#9ca3af',
    fontWeight: '400',
  },
  searchSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: '#f9fafb',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 12,
    color: '#6b7280',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '400',
  },
  productsSection: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  productCount: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  productsList: {
    paddingBottom: 20,
  },
  productCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  productIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconText: {
    fontSize: 20,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 2,
  },
  productCategory: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  productDesc: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
    marginBottom: 16,
  },
  viewReportsBtn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  viewReportsText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  profileBtn: {
    marginRight: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  profileIcon: {
    fontSize: 18,
    color: '#fff',
  },
  profileImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#fff',
  },
});