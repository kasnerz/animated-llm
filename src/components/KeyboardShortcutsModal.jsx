import { useI18n } from '../i18n/I18nProvider';
import '../styles/keyboard-shortcuts-modal.css';

/**
 * Modal component displaying keyboard shortcuts
 */
function KeyboardShortcutsModal({ isOpen, onClose }) {
  const { t } = useI18n();

  if (!isOpen) return null;

  const shortcuts = [
    { key: 'Space', description: t('shortcut_play_pause') },
    { key: '→', description: t('shortcut_step_forward') },
    { key: '←', description: t('shortcut_step_backward') },
    { key: 'N', description: t('shortcut_next_token') },
    { key: 'G', description: t('shortcut_skip_to_end') },
    { key: 'R', description: t('shortcut_reset') },
    { key: 'T', description: t('shortcut_toggle_theme') },
    { key: 'L', description: t('shortcut_toggle_language') },
    { key: 'H', description: t('shortcut_show_shortcuts') },
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{t('keyboard_shortcuts')}</h2>
          <button className="modal-close-button" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="modal-body">
          <div className="shortcuts-list">
            {shortcuts.map((shortcut, index) => (
              <div key={index} className="shortcut-item">
                <div className="shortcut-keys">
                  {shortcut.key.includes(' or ') ? (
                    <>
                      {shortcut.key.split(' or ').map((part, partIndex) => (
                        <span key={partIndex}>
                          {part.split(' + ').map((key, keyIndex) => (
                            <span key={keyIndex}>
                              <kbd className="keyboard-key">{key}</kbd>
                              {keyIndex < part.split(' + ').length - 1 && (
                                <span className="key-separator">+</span>
                              )}
                            </span>
                          ))}
                          {partIndex < shortcut.key.split(' or ').length - 1 && (
                            <span className="key-or"> or </span>
                          )}
                        </span>
                      ))}
                    </>
                  ) : (
                    <>
                      {shortcut.key.split(' + ').map((key, keyIndex) => (
                        <span key={keyIndex}>
                          <kbd className="keyboard-key">{key}</kbd>
                          {keyIndex < shortcut.key.split(' + ').length - 1 && (
                            <span className="key-separator">+</span>
                          )}
                        </span>
                      ))}
                    </>
                  )}
                </div>
                <div className="shortcut-description">{shortcut.description}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default KeyboardShortcutsModal;
