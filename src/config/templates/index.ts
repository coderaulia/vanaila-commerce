export type TemplateDef = {
  id: string;
  name: string;
  version: string;
  author: string;
  description: string;
  previewDescription: string;
  preview: string;
  /** When true, the template renders its own nav and footer — AppShell renders no wrapper. */
  selfContained: boolean;
};

export const TEMPLATES: TemplateDef[] = [
  {
    id: 'vanaila',
    name: 'Vanaila',
    version: '1.0',
    author: 'Vanaila',
    description: 'Digital agency — animated, block-based, navy + electric blue.',
    previewDescription: 'Animated hero, value triplet, solutions grid, why-split sections.',
    preview: '/templates/vanaila.svg',
    selfContained: false
  },
  {
    id: 'javanesa',
    name: 'Javanesa',
    version: '1.0',
    author: 'Vanaila',
    description: 'Organic skincare brand — Playfair Display serif, warm earth tones.',
    previewDescription: 'Custom nav + footer, hero split, categories grid, featured products.',
    preview: '/templates/javanesa.svg',
    selfContained: true
  },
  {
    id: 'volta',
    name: 'Volta',
    version: '1.0',
    author: 'Vanaila',
    description: 'Consumer electronics store — Manrope sans-serif, paper white + signal blue.',
    previewDescription: 'Announce bar, glass nav, hero with specs pill, product rails, dark spotlights.',
    preview: '/templates/volta.svg',
    selfContained: true
  }
];

export const TEMPLATE_IDS = TEMPLATES.map((t) => t.id);

export function getTemplate(id: string): TemplateDef {
  return TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[0]!;
}
