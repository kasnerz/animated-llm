import { useEffect, useRef, useState } from 'react';
import MdiIcon from '@mdi/react';
import { mdiHelpCircleOutline } from '@mdi/js';
import { Icon } from '@iconify/react';
import { useI18n } from '../i18n/I18nProvider';
import {
  BASE_MODEL_ICON,
  INSTRUCTION_TUNED_ICON,
  REASONING_ICON,
  SOURCE_ICON,
} from '../config/modelIcons';

/**
 * Build the list of properties to show for a model.
 *
 * Only properties the model actually has are listed - a model that does not
 * reason simply says nothing about reasoning. A model that was never
 * instruction-tuned is a base model, which is itself the property worth naming.
 *
 * @param {object} model - Registry entry or getModelInfo() result
 * @param {function} t - Translation function
 * @returns {Array<{key: string, icon: object, label: string}>}
 */
function getCapabilities(model, t) {
  if (!model.instruction_tuned) {
    return [{ key: 'base', icon: BASE_MODEL_ICON, label: t('capability_base_model') }];
  }

  const capabilities = [
    {
      key: 'instruction_tuned',
      icon: INSTRUCTION_TUNED_ICON,
      label: t('capability_instruction_tuned'),
    },
  ];

  if (model.reasoning) {
    capabilities.push({
      key: 'reasoning',
      icon: REASONING_ICON,
      label: t('capability_reasoning'),
    });
  }

  return capabilities;
}

/**
 * A hint marker next to the model selector that reveals the model's repository
 * link and properties on hover or click.
 *
 * @param {object} props
 * @param {object|null} props.model - Registry entry or getModelInfo() result
 */
function ModelCapabilities({ model }) {
  const { t } = useI18n();
  const [isHovered, setIsHovered] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const wrapperRef = useRef(null);

  // A click pins the popover open; clicking elsewhere unpins it.
  useEffect(() => {
    if (!isPinned) return undefined;

    const handleWindowClick = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsPinned(false);
      }
    };

    window.addEventListener('pointerdown', handleWindowClick);
    return () => window.removeEventListener('pointerdown', handleWindowClick);
  }, [isPinned]);

  if (!model) return null;

  const capabilities = getCapabilities(model, t);
  const isOpen = isHovered || isPinned;

  return (
    <div
      className="model-hint"
      ref={wrapperRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <button
        type="button"
        className={`model-hint-btn ${isOpen ? 'is-open' : ''}`}
        aria-label={t('model_capabilities')}
        aria-expanded={isOpen}
        onClick={() => setIsPinned((pinned) => !pinned)}
        onFocus={() => setIsHovered(true)}
        onBlur={() => setIsHovered(false)}
      >
        <MdiIcon path={mdiHelpCircleOutline} size={0.75} />
      </button>

      {isOpen && (
        <div className="model-hint-popover" role="tooltip">
          <div className="model-hint-section">
            <div className="model-hint-heading">{t('model_capabilities')}</div>
            {capabilities.map(({ key, icon, label }) => (
              <div key={key} className="model-hint-item">
                <Icon icon={icon} width={14} height={14} />
                <span>{label}</span>
              </div>
            ))}
          </div>

          {model.repo && (
            <div className="model-hint-section">
              <div className="model-hint-heading">{t('model_source')}</div>
              <a
                className="model-hint-item model-hint-link"
                href={model.repo}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Icon icon={SOURCE_ICON} width={14} height={14} />
                <span>{model.id}</span>
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ModelCapabilities;
