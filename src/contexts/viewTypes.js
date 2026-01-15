import { mdiTextBoxEditOutline, mdiAbacus, mdiCogPlay, mdiSchool } from '@mdi/js';

export const VIEW_TYPES = {
  TEXT_GENERATION: 'text-generation',
  TRAINING: 'training',
  DECODING: 'decoding',
  PRETRAINING_SIMPLE: 'pretraining-simple',
  CHEATSHEET: 'cheatsheet',
  HOW_TO: 'how-to',
};

export const VIEW_CATEGORIES = {
  TRAINING: 'training-category',
  TEXT_GENERATION: 'text-generation-category',
  MATERIALS: 'materials-category',
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
  [VIEW_TYPES.PRETRAINING_SIMPLE]: {
    id: VIEW_TYPES.PRETRAINING_SIMPLE,
    category: VIEW_CATEGORIES.TRAINING,
    icon: mdiAbacus,
    labelKey: 'view_pretraining_simple',
    defaultLabel: 'Simple',
    descriptionKey: 'view_pretraining_simple_desc',
    defaultDescription: 'Simplified pretraining visualization',
  },
  [VIEW_TYPES.HOW_TO]: {
    id: VIEW_TYPES.HOW_TO,
    category: VIEW_CATEGORIES.MATERIALS,
    icon: mdiSchool,
    labelKey: 'home_how_to_title',
    defaultLabel: 'How-to',
    descriptionKey: 'home_how_to_use_app_desc',
    defaultDescription: 'Learn how to use the app',
  },
  [VIEW_TYPES.CHEATSHEET]: {
    id: VIEW_TYPES.CHEATSHEET,
    category: VIEW_CATEGORIES.MATERIALS,
    icon: mdiSchool,
    labelKey: 'view_cheatsheet',
    defaultLabel: 'Cheatsheet',
    descriptionKey: 'view_cheatsheet_desc',
    defaultDescription: 'LLM Cheatsheet',
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
  [VIEW_CATEGORIES.MATERIALS]: {
    id: VIEW_CATEGORIES.MATERIALS,
    icon: mdiSchool,
    labelKey: 'category_materials',
    defaultLabel: 'Materials',
    descriptionKey: 'category_materials_desc',
    defaultDescription: 'Educational materials and guides',
  },
};
