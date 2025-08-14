import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
  Platform
} from 'react-native';

const { width } = Dimensions.get('window');

const Toast = ({ 
  visible, 
  message, 
  type = 'success', 
  duration = 3000, 
  onHide 
}) => {
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Toast'u göster
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]).start();

      // Otomatik gizleme
      const timer = setTimeout(() => {
        hideToast();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 300,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]).start(() => {
      onHide && onHide();
    });
  };

  const getToastStyle = () => {
    switch (type) {
      case 'success':
        return { backgroundColor: '#4caf50', icon: '✅' };
      case 'error':
        return { backgroundColor: '#f44336', icon: '❌' };
      case 'warning':
        return { backgroundColor: '#ff9800', icon: '⚠️' };
      case 'info':
        return { backgroundColor: '#2196f3', icon: 'ℹ️' };
      default:
        return { backgroundColor: '#4caf50', icon: '✅' };
    }
  };

  const toastStyle = getToastStyle();

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY }],
          opacity,
          backgroundColor: toastStyle.backgroundColor,
        },
      ]}
    >
      <TouchableOpacity
        style={styles.toastContent}
        onPress={hideToast}
        activeOpacity={0.8}
      >
        <Text style={styles.icon}>{toastStyle.icon}</Text>
        <Text style={styles.message}>{message}</Text>
        <TouchableOpacity onPress={hideToast} style={styles.closeButton}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    zIndex: 9999,
    borderRadius: 12,
    elevation: 8,
  },
  toastContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingHorizontal: 20,
  },
  icon: {
    fontSize: 20,
    marginRight: 12,
  },
  message: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  closeText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default Toast;
