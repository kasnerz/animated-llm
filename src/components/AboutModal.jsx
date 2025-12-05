import { useI18n } from '../i18n/I18nProvider';
import Logo from './Logo';
import '../styles/about-modal.css';

/**
 * Modal component displaying information about the application
 * Supports HTML/Markdown-like content with internationalization
 */
function AboutModal({ isOpen, onClose }) {
  const { t } = useI18n();

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content about-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{t('about_title')}</h2>
          <button className="modal-close-button" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="modal-body about-modal-body">
          {/* Logo */}
          <div className="about-logo">
            <Logo variant="home" />
          </div>

          {/* Single combined content block - supports HTML/Markdown */}
          <div
            className="about-content-block"
            dangerouslySetInnerHTML={{ __html: t('about_content') }}
          />

          {/* Credits/Footer */}
          <div className="about-footer">
            <p dangerouslySetInnerHTML={{ __html: t('about_credits') }} />
            <p className="about-version">Version 1.0.0</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AboutModal;
