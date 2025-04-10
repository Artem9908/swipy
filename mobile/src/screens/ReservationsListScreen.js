import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator, 
  Platform,
  SafeAreaView,
  Alert
} from 'react-native';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES, SHADOWS } from '../styles/theme';
import ActionButton from '../components/ActionButton';

export default function ReservationsListScreen({ navigation, route }) {
  const { user } = route.params || {};
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchReservations();
    
    // Добавляем слушатель фокуса для обновления при возврате на экран
    const unsubscribe = navigation.addListener('focus', () => {
      fetchReservations();
    });

    return unsubscribe;
  }, [navigation]);

  const fetchReservations = async () => {
    if (!user || !user._id) {
      setError('User information is missing');
      setLoading(false);
      return;
    }
    
    try {
      // Используем localhost для веб или IP для устройств
      const apiUrl = Platform.OS === 'web' 
        ? `http://localhost:5001/api/reservations/user/${user._id}` 
        : `http://192.168.0.82:5001/api/reservations/user/${user._id}`;
        
      console.log('Fetching reservations from:', apiUrl);
      const res = await axios.get(apiUrl);
      setReservations(res.data);
      setLoading(false);
      setError(null);
    } catch (e) {
      console.error('Error fetching reservations:', e);
      setError('Failed to load reservations');
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const formatTime = (dateString) => {
    const options = { hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleTimeString(undefined, options);
  };

  const cancelReservation = async (id) => {
    Alert.alert(
      "Cancel Reservation",
      "Are you sure you want to cancel this reservation?",
      [
        {
          text: "No",
          style: "cancel"
        },
        { 
          text: "Yes", 
          onPress: async () => {
            try {
              const apiUrl = Platform.OS === 'web' 
                ? `http://localhost:5001/api/reservations/${id}` 
                : `http://192.168.0.82:5001/api/reservations/${id}`;
                
              await axios.delete(apiUrl);
              fetchReservations();
            } catch (e) {
              console.error('Error canceling reservation:', e);
              Alert.alert('Error', 'Failed to cancel reservation');
            }
          }
        }
      ]
    );
  };

  const renderReservation = ({ item }) => (
    <View style={styles.reservationCard}>
      <View style={styles.cardHeader}>
        <Text style={styles.restaurantName}>{item.restaurant.name}</Text>
        <View style={[styles.statusBadge, 
          item.status === 'confirmed' ? styles.confirmedBadge : 
          item.status === 'pending' ? styles.pendingBadge : 
          styles.cancelledBadge
        ]}>
          <Text style={styles.statusText}>
            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
          </Text>
        </View>
      </View>
      
      <View style={styles.detailsContainer}>
        <View style={styles.detailRow}>
          <Ionicons name="calendar-outline" size={18} color={COLORS.text.secondary} />
          <Text style={styles.detailText}>{formatDate(item.date)}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Ionicons name="time-outline" size={18} color={COLORS.text.secondary} />
          <Text style={styles.detailText}>{formatTime(item.time)}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Ionicons name="people-outline" size={18} color={COLORS.text.secondary} />
          <Text style={styles.detailText}>{item.partySize} people</Text>
        </View>
        
        {item.specialRequests ? (
          <View style={styles.detailRow}>
            <Ionicons name="document-text-outline" size={18} color={COLORS.text.secondary} />
            <Text style={styles.detailText}>{item.specialRequests}</Text>
          </View>
        ) : null}
      </View>
      
      {item.status !== 'cancelled' && (
        <TouchableOpacity 
          style={styles.cancelButton}
          onPress={() => cancelReservation(item._id)}
        >
          <Ionicons name="close-circle-outline" size={20} color={COLORS.error} />
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading reservations...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={60} color={COLORS.error} />
        <Text style={styles.errorText}>{error}</Text>
        <ActionButton 
          title="Try Again" 
          icon="refresh-outline" 
          onPress={fetchReservations}
          style={styles.retryButton}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Reservations</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => navigation.navigate('Reservation', { user })}
        >
          <Ionicons name="add" size={24} color={COLORS.text.inverse} />
        </TouchableOpacity>
      </View>
      
      {reservations.length > 0 ? (
        <FlatList
          data={reservations}
          renderItem={renderReservation}
          keyExtractor={item => item._id}
          contentContainerStyle={styles.listContainer}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="calendar-outline" size={60} color={COLORS.inactive} />
          <Text style={styles.emptyTitle}>No Reservations</Text>
          <Text style={styles.emptyText}>You don't have any reservations yet</Text>
          <ActionButton 
            title="Make a Reservation" 
            icon="add-circle-outline" 
            onPress={() => navigation.navigate('Reservation', { user })}
            style={styles.makeReservationButton}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    ...FONTS.body,
    color: COLORS.text.primary,
    marginTop: SIZES.padding.md,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.padding.lg,
    backgroundColor: COLORS.background,
  },
  errorText: {
    ...FONTS.body,
    color: COLORS.text.primary,
    textAlign: 'center',
    marginVertical: SIZES.padding.md,
  },
  retryButton: {
    marginTop: SIZES.padding.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SIZES.padding.lg,
    paddingTop: SIZES.padding.lg,
    paddingBottom: SIZES.padding.sm,
  },
  title: {
    ...FONTS.h1,
    color: COLORS.text.primary,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.small,
  },
  listContainer: {
    padding: SIZES.padding.md,
  },
  reservationCard: {
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radius.md,
    padding: SIZES.padding.md,
    marginBottom: SIZES.padding.md,
    ...SHADOWS.medium,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.padding.sm,
  },
  restaurantName: {
    ...FONTS.h3,
    color: COLORS.text.primary,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: SIZES.padding.sm,
    paddingVertical: SIZES.padding.xs / 2,
    borderRadius: SIZES.radius.sm,
  },
  confirmedBadge: {
    backgroundColor: COLORS.success + '20',
  },
  pendingBadge: {
    backgroundColor: COLORS.warning + '20',
  },
  cancelledBadge: {
    backgroundColor: COLORS.error + '20',
  },
  statusText: {
    ...FONTS.caption,
    fontWeight: '500',
  },
  detailsContainer: {
    marginBottom: SIZES.padding.sm,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.padding.xs,
  },
  detailText: {
    ...FONTS.body,
    color: COLORS.text.secondary,
    marginLeft: SIZES.padding.xs,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SIZES.padding.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    marginTop: SIZES.padding.xs,
  },
  cancelText: {
    ...FONTS.body,
    color: COLORS.error,
    marginLeft: SIZES.padding.xs,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.padding.lg,
  },
  emptyTitle: {
    ...FONTS.h2,
    color: COLORS.text.primary,
    marginTop: SIZES.padding.lg,
    marginBottom: SIZES.padding.sm,
  },
  emptyText: {
    ...FONTS.body,
    color: COLORS.text.secondary,
    textAlign: 'center',
    marginBottom: SIZES.padding.lg,
  },
  makeReservationButton: {
    marginTop: SIZES.padding.md,
  },
});