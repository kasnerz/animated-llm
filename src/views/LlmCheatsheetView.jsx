import React from 'react';
import { useI18n } from '../i18n/I18nProvider';
import ViewSelector from '../components/ViewSelector';
import '../styles/llm-cheatsheet.css';

function LlmCheatsheetView() {
  const { t, language } = useI18n();

  // Determine which PDF to show based on language
  // default to English if not 'cs'
  const isCzech = language === 'cs';
  const pdfFileName = isCzech ? 'llm_tahak.pdf' : 'llm_cheatsheet.pdf';
  const pdfPath = `/data/materials/${pdfFileName}`;

  return (
    <div className="view-container">
      <ViewSelector />
      <div className="cheatsheet-content">
        <h1>{t('cheatsheet_title')}</h1>
        <p className="cheatsheet-description">{t('cheatsheet_description')}</p>

        {!isCzech && (
          <p className="language-note">
            {/* Optional note about language if needed, user said "other languages should show English with extra note" */}
            {language !== 'en' && t('cheatsheet_english_only_note')}
          </p>
        )}

        <div className="pdf-container">
          <object
            data={pdfPath}
            type="application/pdf"
            width="100%"
            height="100%"
            className="pdf-preview"
          >
            <div className="pdf-fallback">
              <p>{t('pdf_preview_unavailable')}</p>
              <a href={pdfPath} download className="download-button error">
                {t('download_cheatsheet')}
              </a>
            </div>
          </object>
        </div>

        <div className="actions">
          <a href={pdfPath} download className="download-button">
            {t('download_cheatsheet')}
          </a>
        </div>
      </div>
    </div>
  );
}

export default LlmCheatsheetView;
