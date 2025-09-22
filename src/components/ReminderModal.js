import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Calendar from 'expo-calendar';
import { Linking } from 'react-native';

export default function ReminderModal({ visible, movie, onClose }) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [mode, setMode] = useState('date');

  const handleDateChange = (event, date) => {
    setShowDatePicker(false);
    if (date) {
      setSelectedDate(date);
    }
  };

  const handleTimeChange = (event, time) => {
    setShowTimePicker(false);
    if (time) {
      setSelectedTime(time);
    }
  };

  const showDateTimePicker = (pickerMode) => {
    setMode(pickerMode);
    if (pickerMode === 'date') {
      setShowDatePicker(true);
    } else {
      setShowTimePicker(true);
    }
  };

  const scheduleWithExpoCalendar = async () => {
    try {
      // Solicita permissão
      const { status } = await Calendar.requestCalendarPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissão negada', 'Precisamos de acesso ao calendário para criar lembretes');
        return;
      }

      // Pega os calendários
      const calendars = await Calendar.getCalendarsAsync();
      const defaultCalendar = calendars.find(cal => cal.isPrimary) || calendars[0];

      if (!defaultCalendar) {
        Alert.alert('Erro', 'Nenhum calendário disponível');
        return;
      }

      // Combina data e hora
      const eventDateTime = new Date(selectedDate);
      eventDateTime.setHours(selectedTime.getHours());
      eventDateTime.setMinutes(selectedTime.getMinutes());
      
      const endDateTime = new Date(eventDateTime.getTime() + (2 * 60 * 60 * 1000)); // +2 horas

      // Cria o evento
      const eventId = await Calendar.createEventAsync(defaultCalendar.id, {
        title: `🎬 Assistir: ${movie.title}`,
        startDate: eventDateTime,
        endDate: endDateTime,
        notes: movie.overview || 'Lembrete para assistir este filme',
        alarms: [
          { relativeOffset: -30 }, // 30 min antes
          { relativeOffset: -5 }    // 5 min antes
        ],
      });

      Alert.alert(
        '✅ Lembrete Criado!',
        `O filme "${movie.title}" foi agendado para ${eventDateTime.toLocaleDateString('pt-BR')} às ${eventDateTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
        [{ text: 'OK', onPress: onClose }]
      );

    } catch (error) {
      console.error('Erro ao criar evento:', error);
      Alert.alert('Erro', 'Não foi possível criar o lembrete no calendário');
    }
  };

  // Função alternativa usando deep linking para calendário nativo
  const scheduleWithNativeCalendar = () => {
    try {
      const eventDateTime = new Date(selectedDate);
      eventDateTime.setHours(selectedTime.getHours());
      eventDateTime.setMinutes(selectedTime.getMinutes());
      
      const startDate = eventDateTime.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      const endDate = new Date(eventDateTime.getTime() + (2 * 60 * 60 * 1000))
        .toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

      const title = encodeURIComponent(`🎬 Assistir: ${movie.title}`);
      const details = encodeURIComponent(movie.overview || 'Lembrete para assistir este filme');
      
      let calendarUrl;
      
      if (Platform.OS === 'ios') {
        // iOS Calendar
        calendarUrl = `calshow:?title=${title}&startDate=${startDate}&endDate=${endDate}&notes=${details}`;
      } else {
        // Android Calendar
        calendarUrl = `content://com.android.calendar/events?title=${title}&dtstart=${eventDateTime.getTime()}&dtend=${eventDateTime.getTime() + (2 * 60 * 60 * 1000)}&description=${details}`;
      }

      Linking.canOpenURL(calendarUrl).then((supported) => {
        if (supported) {
          Linking.openURL(calendarUrl);
          Alert.alert(
            '📅 Abrindo Calendário',
            'Complete o agendamento no seu aplicativo de calendário',
            [{ text: 'OK', onPress: onClose }]
          );
        } else {
          // Fallback para Google Calendar web
          const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startDate}/${endDate}&details=${details}`;
          Linking.openURL(googleCalendarUrl);
        }
      });

    } catch (error) {
      console.error('Erro ao abrir calendário:', error);
      Alert.alert('Erro', 'Não foi possível abrir o calendário');
    }
  };

  const handleSchedule = () => {
    const now = new Date();
    const eventDateTime = new Date(selectedDate);
    eventDateTime.setHours(selectedTime.getHours());
    eventDateTime.setMinutes(selectedTime.getMinutes());

    if (eventDateTime <= now) {
      Alert.alert('Data Inválida', 'Por favor, selecione uma data e hora futura');
      return;
    }

    Alert.alert(
      'Criar Lembrete',
      `Deseja agendar "${movie.title}" para ${eventDateTime.toLocaleDateString('pt-BR')} às ${eventDateTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Agendar', 
          onPress: () => {
            // Tenta primeiro com Expo Calendar, depois fallback
            if (Calendar.createEventAsync) {
              scheduleWithExpoCalendar();
            } else {
              scheduleWithNativeCalendar();
            }
          }
        }
      ]
    );
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (time) => {
    return time.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>⏰ Agendar Lembrete</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Movie Info */}
          <View style={styles.movieInfo}>
            <Text style={styles.movieTitle}>🎬 {movie.title}</Text>
            <Text style={styles.movieSubtitle}>
              {movie.release_date ? new Date(movie.release_date).getFullYear() : ''}
              {movie.vote_average > 0 && ` • ⭐ ${movie.vote_average.toFixed(1)}`}
            </Text>
          </View>

          {/* Date and Time Selection */}
          <View style={styles.dateTimeSection}>
            
            {/* Date Picker */}
            <View style={styles.pickerSection}>
              <Text style={styles.pickerLabel}>📅 Data</Text>
              <TouchableOpacity 
                style={styles.pickerButton}
                onPress={() => showDateTimePicker('date')}
              >
                <Text style={styles.pickerButtonText}>
                  {formatDate(selectedDate)}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Time Picker */}
            <View style={styles.pickerSection}>
              <Text style={styles.pickerLabel}>🕒 Horário</Text>
              <TouchableOpacity 
                style={styles.pickerButton}
                onPress={() => showDateTimePicker('time')}
              >
                <Text style={styles.pickerButtonText}>
                  {formatTime(selectedTime)}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Info Box */}
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              💡 O lembrete será criado no seu aplicativo de calendário com alertas de 30 e 5 minutos antes
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.scheduleButton} onPress={handleSchedule}>
              <Text style={styles.scheduleButtonText}>📅 Agendar</Text>
            </TouchableOpacity>
          </View>

          {/* Date/Time Pickers */}
          {showDatePicker && (
            <DateTimePicker
              value={selectedDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleDateChange}
              minimumDate={new Date()}
            />
          )}

          {showTimePicker && (
            <DateTimePicker
              value={selectedTime}
              mode="time"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleTimeChange}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  
  modal: {
    backgroundColor: '#2a2a2a',
    borderRadius: 20,
    width: '100%',
    maxWidth: 400,
    padding: 24,
  },
  
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  
  movieInfo: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  
  movieTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  
  movieSubtitle: {
    fontSize: 14,
    color: '#999',
  },
  
  dateTimeSection: {
    marginBottom: 20,
  },
  
  pickerSection: {
    marginBottom: 16,
  },
  
  pickerLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  
  pickerButton: {
    backgroundColor: '#444',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#555',
  },
  
  pickerButtonText: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
  },
  
  infoBox: {
    backgroundColor: '#1a4d1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderLeft: 4,
    borderLeftColor: '#4ade80',
  },
  
  infoText: {
    fontSize: 14,
    color: '#ccc',
    lineHeight: 20,
  },
  
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#444',
    alignItems: 'center',
  },
  
  cancelButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  
  scheduleButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#E50914',
    alignItems: 'center',
  },
  
  scheduleButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
});