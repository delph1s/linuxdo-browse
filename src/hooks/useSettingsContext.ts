import { SettingsContext } from '@store/context/settings/settingsProvider';
import { useContext } from 'react';

export function useSettingsContext() {
  const context = useContext(SettingsContext);

  if (!context) throw new Error('useSettingsContext must be use inside SettingsProvider');

  return context;
}
