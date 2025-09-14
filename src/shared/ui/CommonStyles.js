// src/shared/ui/CommonStyles.js
import { StyleSheet } from 'react-native';
import { Colors } from '../../constants/Colors';

export const ColorThemes = {
  primary:   { background: Colors.primary[500], foreground: '#fff' },
  success:   { background: Colors.success[600], foreground: '#fff' },
  warning:   { background: Colors.warning[600], foreground: '#fff' },
  neutral:   { background: Colors.neutral[200], foreground: Colors.text.primary },
  error:     { background: Colors.error[600],   foreground: '#fff' },
  info:      { background: Colors.info[600],    foreground: '#fff' },
};

export const CommonStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.text.primary,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.text.secondary,
  },

  // Cards
  card: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },

  // Inputs
  inputContainer: {
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 6,
  },

  // Buttons (menu style)
  menuButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  buttonContent: {
    padding: 14,
    borderRadius: 12,
    alignItems: 'flex-start',
  },
  buttonIcon: {
    fontSize: 20,
    marginBottom: 6,
    color: '#fff',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  buttonSubtext: {
    fontSize: 12,
    marginTop: 2,
    color: 'rgba(255,255,255,0.9)',
  },

  // Lists
  listContainer: {
    gap: 6,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[200],
  },
  listItemContent: {
    flex: 1,
  },
  listItemTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  listItemSubtitle: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginTop: 2,
  },

  // Empty
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 28,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.text.secondary,
  },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: Colors.text.secondary,
  },
});
