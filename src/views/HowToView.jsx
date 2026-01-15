import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import { useI18n } from '../i18n/I18nProvider';
import ViewSelector from '../components/ViewSelector';
import '../styles/how-to.css';

function HowToView() {
  const { t, language } = useI18n();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);

  // Construct the base path dynamically to handle both dev and prod
  // import.meta.env.BASE_URL is usually '/' in dev and '/animated-llm/' in prod
  // Remove trailing slash if present to avoid double slashes
  const baseUrl = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');

  useEffect(() => {
    const fetchContent = async () => {
      setLoading(true);
      try {
        let lang = language;

        const tryFetch = async (url) => {
          try {
            const res = await fetch(url);
            if (!res.ok) return null;
            const text = await res.text();
            // Check if we got HTML back (SPA fallback)
            if (text.trim().startsWith('<!') || text.trim().startsWith('<html')) {
              return null;
            }
            return text;
          } catch {
            return null;
          }
        };

        // Try paths in order
        const pathsToTry = [
          `${baseUrl}/data/docs/how-to.${lang}.md`,
          `/data/docs/how-to.${lang}.md`, // explicit absolute fallback
        ];

        // Also add English fallbacks
        if (lang !== 'en') {
          pathsToTry.push(`${baseUrl}/data/docs/how-to.en.md`);
          pathsToTry.push(`/data/docs/how-to.en.md`); // explicit absolute fallback
        }

        let foundText = null;
        for (const path of pathsToTry) {
          foundText = await tryFetch(path);
          if (foundText) break;
        }

        if (foundText) {
          setContent(foundText);
        } else {
          console.error('Failed to load markdown content');
          setContent('# Error loading content\n\nCould not load the guide.');
        }
      } catch (e) {
        console.error('Error fetching markdown:', e);
        setContent('# Error loading content\n\nCould not load the guide.');
      } finally {
        setLoading(false);
      }
    };
    fetchContent();
  }, [language, baseUrl]);

  return (
    <div className="view-container">
      <ViewSelector />
      <div className="how-to-content">
        {loading ? (
          <div className="loading">{t('loading')}</div>
        ) : (
          <div className="markdown-body">
            <ReactMarkdown
              rehypePlugins={[rehypeRaw]}
              urlTransform={(url) => {
                if (url.startsWith('http') || url.startsWith('//') || url.startsWith('/')) {
                  return url;
                }
                return `${baseUrl}/data/docs/${url}`;
              }}
            >
              {content}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}

export default HowToView;
