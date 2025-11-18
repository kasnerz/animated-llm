import { mdiTextBoxEditOutline, mdiAbacus, mdiCogPlay } from '@mdi/js';

export const VIEW_TYPES = {
  TEXT_GENERATION: 'text-generation',
  TRAINING: 'training',
  DECODING: 'decoding',
};

export const VIEW_CATEGORIES = {
  TRAINING: 'training-category',
  TEXT_GENERATION: 'text-generation-category',
};

export const VIEW_INFO = {
  [VIEW_TYPES.TEXT_GENERATION]: {
    id: VIEW_TYPES.TEXT_GENERATION,
    category: VIEW_CATEGORIES.TEXT_GENERATION,
    icon: mdiTextBoxEditOutline,
    labelKey: 'view_text_generation',
    defaultLabel: 'Model',
    descriptionKey: 'view_text_generation_desc',
    defaultDescription: 'Visualize how LLMs generate text token by token',
  },
  [VIEW_TYPES.TRAINING]: {
    id: VIEW_TYPES.TRAINING,
    category: VIEW_CATEGORIES.TRAINING,
    icon: mdiAbacus,
    labelKey: 'view_training',
    defaultLabel: 'Model',
    descriptionKey: 'view_training_desc',
    defaultDescription: 'Understand the training process of language models',
  },
  [VIEW_TYPES.DECODING]: {
    id: VIEW_TYPES.DECODING,
    category: VIEW_CATEGORIES.TEXT_GENERATION,
    icon: mdiCogPlay,
    labelKey: 'view_decoding',
    defaultLabel: 'Algorithms',
    descriptionKey: 'view_decoding_desc',
    defaultDescription: 'Explore different decoding strategies and algorithms',
  },
};

export const CATEGORY_INFO = {
  [VIEW_CATEGORIES.TRAINING]: {
    id: VIEW_CATEGORIES.TRAINING,
    icon: mdiAbacus,
    labelKey: 'category_training',
    defaultLabel: 'Training',
    descriptionKey: 'category_training_desc',
    defaultDescription: 'Understand the training process of language models',
  },
  [VIEW_CATEGORIES.TEXT_GENERATION]: {
    id: VIEW_CATEGORIES.TEXT_GENERATION,
    icon: mdiTextBoxEditOutline,
    labelKey: 'category_text_generation',
    defaultLabel: 'Text generation',
    descriptionKey: 'category_text_generation_desc',
    defaultDescription: 'Visualize how LLMs generate text token by token',
  },
};
