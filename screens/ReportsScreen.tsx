import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { useFocusEffect } from '@react-navigation/native';

type Props = NativeStackScreenProps<RootStackParamList, 'Reports'>;

type ReportStatus = 'Contacted' | 'Interested' | 'Follow-up' | 'Closed Won' | 'Closed Lost';

export type Report = {
  id: string;
  productId: string;
  clientName: string;
  clientAddress?: string;
  town?: string;
  localGovernment?: string;
  state?: string;
  community?: string;
  nearestLandmark?: string;
  latitude?: string;
  longitude?: string;
  contactPerson?: string;
  contactPhone?: string;
  visitDate: string; // Changed from meetingDate to visitDate to match AddReportScreen
  serviceType?: string;
  status: ReportStatus;
  notes: string;
  images?: string[];
  createdAt: string;
  updatedAt: string;
  // Legacy support for old field names
  contact?: string; // for backward compatibility
  meetingDate?: string; // for backward compatibility
};

const STORAGE_KEY = (productId: string) => `reports:${productId}`;

const STATUS_ORDER: ReportStatus[] = [
  'Contacted',
  'Interested',
  'Follow-up',
  'Closed Won',
  'Closed Lost',
];

function formatDate(iso: string) {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? '-' : d.toLocaleDateString();
}

function StatusPill({ status }: { status: ReportStatus }) {
  const bg = {
    Contacted: '#e7f1ff',
    Interested: '#e8f5e9',
    'Follow-up': '#fff8e1',
    'Closed Won': '#e6ffed',
    'Closed Lost': '#ffebee',
  }[status];

  const fg = {
    Contacted: '#0d6efd',
    Interested: '#2e7d32',
    'Follow-up': '#b26a00',
    'Closed Won': '#1e7e34',
    'Closed Lost': '#c62828',
  }[status];

  return (
    <View style={[styles.pill, { backgroundColor: bg }]}>
      <Text style={[styles.pillText, { color: fg }]}>{status}</Text>
    </View>
  );
}

export default function ReportsScreen({ route, navigation }: Props) {
  const { productId, productName } = route.params;

  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | ReportStatus>('All');
  const [sortDesc, setSortDesc] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Header: title + "+ New" action
  useEffect(() => {
    navigation.setOptions({
      title: `${productName} Reports`,
      headerRight: () => (
        <TouchableOpacity
          onPress={() => navigation.navigate('AddReport', { productId })}
        >
          <Text style={styles.headerAction}>+ New</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, productName, productId]);

  const loadReports = useCallback(async () => {
    setError(null);
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY(productId));
      if (raw) {
        const parsed: Report[] = JSON.parse(raw);
        setReports(parsed);
      } else {
        setReports([]);
      }
    } catch (e) {
      setError('Failed to load reports.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [productId]);

  // Use useFocusEffect to reload when coming back from ReportDetails
  useFocusEffect(
    useCallback(() => {
      loadReports();
    }, [loadReports])
  );

  const saveReports = useCallback(
    async (next: Report[]) => {
      setReports(next);
      await AsyncStorage.setItem(STORAGE_KEY(productId), JSON.stringify(next));
    },
    [productId]
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadReports();
  }, [loadReports]);

  const filtered = useMemo(() => {
    let data = reports;
    if (statusFilter !== 'All') {
      data = data.filter((r) => r.status === statusFilter);
    }
    if (query.trim()) {
      const q = query.toLowerCase();
      data = data.filter(
        (r) =>
          r.clientName.toLowerCase().includes(q) ||
          r.notes.toLowerCase().includes(q) ||
          (r.contactPerson && r.contactPerson.toLowerCase().includes(q)) ||
          (r.contactPhone && r.contactPhone.toLowerCase().includes(q)) ||
          (r.contact && r.contact.toLowerCase().includes(q)) ||
          (r.town && r.town.toLowerCase().includes(q)) ||
          (r.state && r.state.toLowerCase().includes(q)) ||
          (r.serviceType && r.serviceType.toLowerCase().includes(q))
      );
    }
    return [...data].sort((a, b) => {
      const ta = new Date(a.updatedAt).getTime();
      const tb = new Date(b.updatedAt).getTime();
      return sortDesc ? tb - ta : ta - tb;
    });
  }, [reports, statusFilter, query, sortDesc]);

  const handleDelete = (id: string) => {
    Alert.alert('Delete report', 'Are you sure you want to delete this report?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const next = reports.filter((r) => r.id !== id);
            await saveReports(next);
          } catch {
            Alert.alert('Error', 'Failed to delete report.');
          }
        },
      },
    ]);
  };

  const getContactInfo = (item: Report) => {
    // Handle both old and new contact field formats
    const phone = item.contactPhone || item.contact || '';
    const person = item.contactPerson || '';
    if (person && phone) {
      return `${person} - ${phone}`;
    }
    return phone || person || 'No contact info';
  };

  const getMeetingDate = (item: Report) => {
    // Handle both old and new date field formats
    return item.visitDate || item.meetingDate || '';
  };

  const getLocationInfo = (item: Report) => {
    const parts = [];
    if (item.town) parts.push(item.town);
    if (item.state) parts.push(item.state);
    if (parts.length === 0 && item.clientAddress) {
      return item.clientAddress;
    }
    return parts.join(', ') || '';
  };

  const renderItem = ({ item }: { item: Report }) => (
  <TouchableOpacity
    style={styles.item}
    onPress={() => navigation.navigate('ReportDetails', { 
      report: item, 
      productId: productId 
    })}
    onLongPress={() => handleDelete(item.id)}
  >
    <View style={styles.itemHeader}>
      <Text style={styles.client}>{item.clientName}</Text>
      <StatusPill status={item.status} />
    </View>
    
    <View style={styles.itemDetails}>
      <Text style={styles.meta}>
        Visit: {formatDate(getMeetingDate(item))}
      </Text>
      
      <Text style={styles.meta}>
        Contact: {getContactInfo(item)}
      </Text>
      
      {getLocationInfo(item) && (
        <Text style={styles.location}>{getLocationInfo(item)}</Text>
      )}
    </View>
    
    <Text style={styles.updated}>Updated {formatDate(item.updatedAt)}</Text>
  </TouchableOpacity>
);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={{ marginTop: 10 }}>Loading reports…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Search + sort */}
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by client, contact, location, or service…"
          value={query}
          onChangeText={setQuery}
        />
        <TouchableOpacity onPress={() => setSortDesc((s) => !s)} style={styles.sortBtn}>
          <Text style={styles.sortText}>{sortDesc ? 'Newest' : 'Oldest'}</Text>
        </TouchableOpacity>
      </View>

      {/* Status filters */}
      <View style={styles.filterRow}>
        {(['All', ...STATUS_ORDER] as const).map((s) => {
          const active = statusFilter === s;
          return (
            <TouchableOpacity
              key={s}
              onPress={() => setStatusFilter(s)}
              style={[styles.filterChip, active && styles.filterChipActive]}
            >
              <Text style={[styles.filterText, active && styles.filterTextActive]}>{s}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Empty state */}
      {filtered.length === 0 ? (
        <View style={styles.empty}>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Text style={styles.emptyTitle}>No reports yet</Text>
          <Text style={styles.emptySubtitle}>
            Tap "+ New" to add your first report for {productName}.
          </Text>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => navigation.navigate('AddReport', { productId })}
          >
            <Text style={styles.primaryBtnText}>+ New Report</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(r) => r.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 24 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListHeaderComponent={error ? <Text style={styles.error}>{error}</Text> : null}
        />
      )}

      {/* Floating + New */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddReport', { productId })}
        activeOpacity={0.85}
      >
        <Text style={styles.fabText}>＋</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  headerAction: { color: '#007bff', fontWeight: '600', marginRight: 8 },

  container: { flex: 1, backgroundColor: '#f7f7f9', padding: 12 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  searchRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  searchInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    paddingHorizontal: 12,
    height: 44,
  },
  sortBtn: {
    paddingHorizontal: 12,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sortText: { fontWeight: '600', color: '#333' },

  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  filterChip: {
    paddingHorizontal: 10,
    height: 34,
    borderRadius: 16,
    backgroundColor: '#eef2f7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterChipActive: { backgroundColor: '#dbeafe' },
  filterText: { color: '#444' },
  filterTextActive: { color: '#0d6efd', fontWeight: '700' },

  item: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#eee',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  itemHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    marginBottom: 8,
  },
  client: { 
    fontSize: 16, 
    fontWeight: '700', 
    color: '#222',
    flex: 1,
    marginRight: 12,
  },
  itemDetails: {
    marginBottom: 8,
  },
  meta: { 
    marginBottom: 4, 
    color: '#666',
    fontSize: 14,
  },
  serviceType: {
    color: '#0d6efd',
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 4,
  },
  location: {
    color: '#666',
    fontSize: 13,
    marginBottom: 4,
  },
  imagesPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 4,
  },
  imageCount: {
    fontSize: 12,
    color: '#666',
    marginRight: 8,
  },
  thumbnailContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  thumbnail: {
    width: 24,
    height: 24,
    borderRadius: 4,
    marginRight: 4,
    backgroundColor: '#f0f0f0',
  },
  moreThumbnails: {
    width: 24,
    height: 24,
    borderRadius: 4,
    backgroundColor: '#e0e0e0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreThumbnailsText: {
    fontSize: 10,
    color: '#666',
    fontWeight: '600',
  },
  notes: { 
    marginTop: 8, 
    color: '#444',
    fontSize: 14,
    lineHeight: 18,
  },
  updated: { 
    marginTop: 8, 
    color: '#888', 
    fontSize: 12 
  },

  pill: { 
    paddingHorizontal: 8, 
    height: 24, 
    borderRadius: 999, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  pillText: { 
    fontSize: 12, 
    fontWeight: '700' 
  },

  empty: { 
    flex: 1, 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingHorizontal: 24 
  },
  emptyTitle: { 
    fontSize: 20, 
    fontWeight: '800', 
    marginTop: 8 
  },
  emptySubtitle: { 
    marginTop: 6, 
    color: '#666', 
    textAlign: 'center' 
  },
  primaryBtn: {
    marginTop: 14,
    backgroundColor: '#0d6efd',
    paddingHorizontal: 16,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: { 
    color: '#fff', 
    fontWeight: '700' 
  },

  fab: {
    position: 'absolute',
    right: 16,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0d6efd',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  fabText: { 
    color: '#fff', 
    fontSize: 28, 
    lineHeight: 28, 
    fontWeight: '900' 
  },

  error: { 
    color: '#c62828', 
    marginBottom: 10 
  },
});