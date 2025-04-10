// Основная цветовая палитра приложения
export const COLORS = {
  primary: '#4ecdc4',       // Основной цвет (бирюзовый)
  secondary: '#ff6b6b',     // Акцентный цвет (коралловый)
  background: '#ffffff',    // Фон
  card: '#ffffff',          // Фон карточек
  text: {
    primary: '#333333',     // Основной текст
    secondary: '#666666',   // Вторичный текст
    light: '#999999',       // Светлый текст
    inverse: '#ffffff'      // Текст на темном фоне
  },
  border: '#f0f0f0',        // Цвет границ
  success: '#2ecc71',       // Зеленый (успех)
  warning: '#f39c12',       // Оранжевый (предупреждение)
  error: '#e74c3c',         // Красный (ошибка)
  inactive: '#d1d1d1',      // Неактивные элементы
  overlay: 'rgba(0,0,0,0.5)' // Затемнение для модальных окон
};

// Типографика
export const FONTS = {
  h1: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  h2: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  h3: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  body: {
    fontSize: 16,
  },
  caption: {
    fontSize: 14,
  },
  small: {
    fontSize: 12,
  }
};

// Отступы и размеры
export const SIZES = {
  padding: {
    xs: 5,
    sm: 10,
    md: 15,
    lg: 20,
    xl: 25
  },
  radius: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    round: 50
  }
};

// Тени
export const SHADOWS = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 4,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  }
}; 