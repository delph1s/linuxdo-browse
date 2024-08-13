import FuncIconButton from '@components/inputs/button/FuncIconButton';
import { useSettingsContext } from '@hooks/useSettingsContext';
import React from 'react';

type SettingsSectionProps = {
  changeMe?: 'changeMe';
};

function SettingsSection({ changeMe = 'changeMe', ...restProps }: SettingsSectionProps) {
  const settings = useSettingsContext();

  return (
    <section id="settings-container" style={{ display: 'inline-block', marginBottom: 0, width: '100%' }}>
      <div style={{ display: 'flex' }}>
        <h4 style={{ flex: 1 }}>Settings</h4>
        <FuncIconButton
          title="重置"
          aria-label="重置"
          onClick={settings.onReset}
          style={{ flex: 0, background: 'var(--primary-very-low)', marginBottom: '0.5rem' }}
          icon="history"
          disabled={!settings.canReset}
        />
      </div>
      <ul style={{ overflowX: 'auto', height: '500px' }}>
        <li>
          <span>
            <input
              type="checkbox"
              onChange={event => {
                console.log(event.target.checked);
                settings.onUpdateField('readAllPostsInTopic', event.target.checked);
              }}
              checked={settings.readAllPostsInTopic}
            />
          </span>
          阅读主题所有回复
        </li>
      </ul>
    </section>
  );
}

export default SettingsSection;
