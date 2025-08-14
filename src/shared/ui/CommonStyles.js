import { StyleSheet, Platform } from 'react-native';
import { Colors } from '../../../constants/Colors';
import { shadow } from './shadow';

export const CommonStyles = StyleSheet.create({
  // Container stilleri
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  
  content: {
    flex: 1,
    padding: 20,
  },
  
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  
  // Header stilleri
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  
  subtitle: {
    fontSize: 16,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  
  // Card stilleri
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
    ...shadow(1),
  },
  
  // Button stilleri
  buttonContainer: {
    gap: 12,
    marginTop: 8,
  },
  
  menuButton: {
    borderRadius: 12,
    overflow: 'hidden',
    ...shadow(1),
    marginBottom: 12,
  },
  
  buttonContent: {
    padding: 20,
    alignItems: 'center',
    borderRadius: 12,
  },
  
  buttonIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.background,
    textAlign: 'center',
    marginBottom: 4,
  },
  
  buttonSubtext: {
    fontSize: 12,
    color: Colors.background,
    opacity: 0.9,
    textAlign: 'center',
  },
  
  // Input stilleri
  inputContainer: {
    marginBottom: 20,
  },
  
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 8,
  },
  
  // List stilleri
  listContainer: {
    gap: 12,
  },
  
  listItem: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  
  listItemContent: {
    flex: 1,
  },
  
  listItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  
  listItemSubtitle: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  
  // Status stilleri
  statusContainer: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  
  // Footer stilleri
  footer: {
    marginTop: 32,
    padding: 16,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
  },
  
  footerText: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  
  // Loading stilleri
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  loadingText: {
    fontSize: 16,
    color: Colors.text.secondary,
    marginTop: 12,
  },
  
  // Empty state stilleri
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  
  emptyText: {
    fontSize: 16,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
  },
});

// Renk temaları
export const ColorThemes = {
  primary: {
    background: Colors.primary[500],
    text: Colors.background,
  },
  success: {
    background: Colors.success[500],
    text: Colors.background,
  },
  warning: {
    background: Colors.warning[500],
    text: Colors.background,
  },
  neutral: {
    background: Colors.neutral[600],
    text: Colors.background,
  },
  error: {
    background: Colors.error[500],
    text: Colors.background,
  },
};
