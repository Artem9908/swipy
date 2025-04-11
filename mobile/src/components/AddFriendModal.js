import React, { useState } from 'react';
import { 
  Modal, 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  TouchableWithoutFeedback,
  Keyboard,
  Alert,
  Platform,
  Share,
  Clipboard
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES, SHADOWS } from '../styles/theme';
import axios from 'axios';

const AddFriendModal = ({ visible, onClose, userId }) => {
  const [inviteCode, setInviteCode] = useState('');
  const [activeTab, setActiveTab] = useState('code'); // 'code' or 'link'
  const [generatedCode, setGeneratedCode] = useState('');
  const [generatedLink, setGeneratedLink] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const addFriendByCode = async () => {
    if (!inviteCode.trim()) {
      Alert.alert('Ошибка', 'Пожалуйста, введите код приглашения');
      return;
    }

    try {
      const apiUrl = Platform.OS === 'web' 
        ? 'http://localhost:5001/api/friends/add-by-code' 
        : 'http://192.168.0.82:5001/api/friends/add-by-code';
      
      const response = await axios.post(apiUrl, { 
        userId, 
        inviteCode: inviteCode.trim() 
      });
      
      if (response.data.success) {
        Alert.alert('Успех', 'Друг успешно добавлен!');
        setInviteCode('');
        onClose(true); // передаем true чтобы обновить список друзей
      } else {
        Alert.alert('Ошибка', response.data.message || 'Не удалось добавить друга');
      }
    } catch (error) {
      console.error('Error adding friend by code:', error);
      Alert.alert('Ошибка', 'Не удалось добавить друга. Проверьте код и попробуйте снова.');
    }
  };

  const generateInviteCode = async () => {
    setIsGenerating(true);
    try {
      const apiUrl = Platform.OS === 'web' 
        ? `http://localhost:5001/api/friends/generate-code/${userId}` 
        : `http://192.168.0.82:5001/api/friends/generate-code/${userId}`;
      
      const response = await axios.get(apiUrl);
      
      if (response.data.code) {
        setGeneratedCode(response.data.code);
        setGeneratedLink(`swipy.app/invite/${response.data.code}`);
      } else {
        Alert.alert('Ошибка', 'Не удалось сгенерировать код приглашения');
      }
    } catch (error) {
      console.error('Error generating invite code:', error);
      Alert.alert('Ошибка', 'Не удалось сгенерировать код приглашения');
    } finally {
      setIsGenerating(false);
    }
  };

  const shareInviteLink = async () => {
    if (!generatedLink) {
      Alert.alert('Ошибка', 'Сначала сгенерируйте код приглашения');
      return;
    }

    try {
      await Share.share({
        message: `Присоединяйся к Swipy и станем друзьями! Вот моя ссылка-приглашение: ${generatedLink}`,
        url: generatedLink // только для iOS
      });
    } catch (error) {
      console.error('Error sharing invite link:', error);
      Alert.alert('Ошибка', 'Не удалось поделиться ссылкой');
    }
  };

  const copyToClipboard = async (text) => {
    try {
      await Clipboard.setString(text);
      Alert.alert('Успех', 'Скопировано в буфер обмена');
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      Alert.alert('Ошибка', 'Не удалось скопировать в буфер обмена');
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Добавить друга</Text>
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Ionicons name="close" size={24} color={COLORS.text.primary} />
              </TouchableOpacity>
            </View>

            <View style={styles.tabContainer}>
              <TouchableOpacity 
                style={[styles.tab, activeTab === 'code' && styles.activeTab]}
                onPress={() => setActiveTab('code')}
              >
                <Text style={[styles.tabText, activeTab === 'code' && styles.activeTabText]}>
                  По коду
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.tab, activeTab === 'link' && styles.activeTab]}
                onPress={() => setActiveTab('link')}
              >
                <Text style={[styles.tabText, activeTab === 'link' && styles.activeTabText]}>
                  Создать приглашение
                </Text>
              </TouchableOpacity>
            </View>

            {activeTab === 'code' ? (
              <View style={styles.codeContainer}>
                <Text style={styles.instructionText}>
                  Введите код приглашения, полученный от друга
                </Text>
                
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="Например: swipy123"
                    value={inviteCode}
                    onChangeText={setInviteCode}
                    autoCapitalize="none"
                  />
                </View>
                
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={addFriendByCode}
                >
                  <Text style={styles.actionButtonText}>Добавить друга</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.linkContainer}>
                <Text style={styles.instructionText}>
                  Создайте код приглашения и поделитесь им с друзьями
                </Text>
                
                {!generatedCode ? (
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={generateInviteCode}
                    disabled={isGenerating}
                  >
                    <Text style={styles.actionButtonText}>
                      {isGenerating ? 'Генерация...' : 'Создать код приглашения'}
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <>
                    <View style={styles.codeDisplay}>
                      <Text style={styles.generatedCodeLabel}>Ваш код:</Text>
                      <View style={styles.codeValueContainer}>
                        <Text style={styles.generatedCodeValue}>{generatedCode}</Text>
                        <TouchableOpacity 
                          style={styles.copyButton}
                          onPress={() => copyToClipboard(generatedCode)}
                        >
                          <Ionicons name="copy-outline" size={20} color={COLORS.primary} />
                        </TouchableOpacity>
                      </View>
                    </View>
                    
                    <View style={styles.codeDisplay}>
                      <Text style={styles.generatedCodeLabel}>Ссылка-приглашение:</Text>
                      <View style={styles.codeValueContainer}>
                        <Text style={styles.generatedLinkValue} numberOfLines={1} ellipsizeMode="middle">
                          {generatedLink}
                        </Text>
                        <TouchableOpacity 
                          style={styles.copyButton}
                          onPress={() => copyToClipboard(generatedLink)}
                        >
                          <Ionicons name="copy-outline" size={20} color={COLORS.primary} />
                        </TouchableOpacity>
                      </View>
                    </View>
                    
                    <TouchableOpacity 
                      style={[styles.actionButton, styles.shareButton]}
                      onPress={shareInviteLink}
                    >
                      <Ionicons name="share-social-outline" size={20} color={COLORS.text.inverse} />
                      <Text style={styles.actionButtonText}>Поделиться ссылкой</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            )}
          </View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radius.lg,
    padding: SIZES.padding.lg,
    ...SHADOWS.large,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.padding.md,
  },
  modalTitle: {
    ...FONTS.h2,
    color: COLORS.text.primary,
  },
  closeButton: {
    padding: SIZES.padding.sm,
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: SIZES.padding.lg,
    borderRadius: SIZES.radius.md,
    backgroundColor: COLORS.background,
    ...SHADOWS.small,
  },
  tab: {
    flex: 1,
    paddingVertical: SIZES.padding.md,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    ...FONTS.body,
    color: COLORS.text.secondary,
  },
  activeTabText: {
    ...FONTS.body,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  codeContainer: {
    alignItems: 'center',
  },
  linkContainer: {
    alignItems: 'center',
  },
  instructionText: {
    ...FONTS.body,
    color: COLORS.text.secondary,
    textAlign: 'center',
    marginBottom: SIZES.padding.lg,
  },
  inputContainer: {
    width: '100%',
    backgroundColor: COLORS.background,
    borderRadius: SIZES.radius.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SIZES.padding.lg,
  },
  input: {
    ...FONTS.body,
    height: 50,
    paddingHorizontal: SIZES.padding.md,
    color: COLORS.text.primary,
  },
  actionButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SIZES.padding.md,
    paddingHorizontal: SIZES.padding.xl,
    borderRadius: SIZES.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.medium,
  },
  actionButtonText: {
    ...FONTS.body,
    color: COLORS.text.inverse,
    fontWeight: 'bold',
  },
  codeDisplay: {
    width: '100%',
    marginBottom: SIZES.padding.lg,
  },
  generatedCodeLabel: {
    ...FONTS.small,
    color: COLORS.text.secondary,
    marginBottom: SIZES.padding.xs,
  },
  codeValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: SIZES.radius.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SIZES.padding.md,
    paddingVertical: SIZES.padding.sm,
  },
  generatedCodeValue: {
    ...FONTS.h3,
    color: COLORS.text.primary,
    flex: 1,
  },
  generatedLinkValue: {
    ...FONTS.body,
    color: COLORS.text.primary,
    flex: 1,
  },
  copyButton: {
    padding: SIZES.padding.sm,
  },
  shareButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.secondary,
  },
});

export default AddFriendModal; 