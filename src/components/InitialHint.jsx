import { useState, useEffect } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import '../styles/initial-hint.css';

/**
 * InitialHint Component
 * Displays a helpful hint screen before animation starts
 * Shows play button instruction and basic keyboard shortcuts
 */
function InitialHint() {
  const { t } = useI18n();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const shortcuts = [
    { key: 'Space', description: t('shortcut_play_pause') },
    { key: '←', description: t('shortcut_step_backward') },
    { key: '→', description: t('shortcut_step_forward') },
    { key: 'N', description: t('shortcut_next_token') },
    { key: 'G', description: t('shortcut_skip_to_end') },
    { key: 'R', description: t('shortcut_reset') },
  ];

  return (
    <div className="initial-hint">
      <div className="initial-hint-content">
        <p className="initial-hint-main">
          {isMobile ? t('hint_press_play') : t('hint_keyboard_shortcuts')}
        </p>
        {!isMobile && (
          <div className="initial-hint-shortcuts">
            {shortcuts.map((shortcut, index) => (
              <div key={index} className="initial-hint-shortcut">
                <kbd className="initial-hint-key">{shortcut.key}</kbd>
                <span className="initial-hint-desc">{shortcut.description}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default InitialHint;
