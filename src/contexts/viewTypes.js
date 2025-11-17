import { mdiTextBoxEditOutline, mdiAbacus, mdiCogPlay } from '@mdi/js';

export const VIEW_TYPES = {
  TEXT_GENERATION: 'text-generation',
  TRAINING: 'training',
  DECODING: 'decoding',
};

export const VIEW_INFO = {
  [VIEW_TYPES.TEXT_GENERATION]: {
    id: VIEW_TYPES.TEXT_GENERATION,
    icon: mdiTextBoxEditOutline,
    labelKey: 'view_text_generation',
    defaultLabel: 'Text generation',
    descriptionKey: 'view_text_generation_desc',
    defaultDescription: 'Visualize how LLMs generate text token by token',
  },
  [VIEW_TYPES.TRAINING]: {
    id: VIEW_TYPES.TRAINING,
    icon: mdiAbacus,
    labelKey: 'view_training',
    defaultLabel: 'Training',
    descriptionKey: 'view_training_desc',
    defaultDescription: 'Understand the training process of language models',
  },
  [VIEW_TYPES.DECODING]: {
    id: VIEW_TYPES.DECODING,
    icon: mdiCogPlay,
    labelKey: 'view_decoding',
    defaultLabel: 'Decoding algorithms',
    descriptionKey: 'view_decoding_desc',
    defaultDescription: 'Explore different decoding strategies and algorithms',
  },
};
