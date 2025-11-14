import { useI18n } from '../i18n/I18nProvider';

/**
 * DecodingView Component
 * View for decoding algorithms visualization
 */
function DecodingView() {
  const { t } = useI18n();

  return (
    <div className="decoding-placeholder">
      <p className="placeholder-text">
        {t('decoding_view_placeholder') ||
          'Decoding algorithms visualization will be displayed here.'}
      </p>
    </div>
  );
}

export default DecodingView;
