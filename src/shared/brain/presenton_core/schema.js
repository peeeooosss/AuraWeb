import { MAX_NUMBER_OF_SLIDES, MAX_OUTLINE_CONTENT_WORDS } from './constants';

export function buildOutlineJsonSchema(nSlides) {
  const slideSchema = {
    type: 'object',
    additionalProperties: false,
    properties: {
      content: {
        type: 'string',
        description: `Audience-facing Markdown content and data for the finished slide; never slide-creation commands, visual/layout configuration, styling notes, or model instructions. Maximum ${MAX_OUTLINE_CONTENT_WORDS} words.`,
      },
    },
    required: ['content'],
  };

  if (nSlides != null) {
    const schemas = [];
    for (let i = 0; i < nSlides; i++) {
      schemas.push({ type: 'object', additionalProperties: false, properties: { content: { type: 'string' } }, required: ['content'] });
    }
    return {
      type: 'object',
      additionalProperties: false,
      properties: {
        title: { type: 'string', description: 'Concise presentation title in plain text (not markdown).' },
        slides: {
          type: 'array',
          description: 'List of slide outlines',
          items: slideSchema,
          minItems: 1,
          maxItems: nSlides,
        },
      },
      required: ['title', 'slides'],
    };
  }

  return {
    type: 'object',
    additionalProperties: false,
    properties: {
      title: { type: 'string', description: 'Concise presentation title in plain text (not markdown).' },
      slides: {
        type: 'array',
        description: 'List of slide outlines',
        items: slideSchema,
        maxItems: MAX_NUMBER_OF_SLIDES,
      },
    },
    required: ['title', 'slides'],
  };
}
