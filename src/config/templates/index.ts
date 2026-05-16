export type TemplateDef = {
  id: string;
  name: string;
  description: string;
  previewDescription: string;
  /** When true, the template renders its own nav and footer — AppShell renders no wrapper. */
  selfContained: boolean;
};

export const TEMPLATES: TemplateDef[] = [
  {
    id: 'vanaila',
    name: 'Vanaila',
    description: 'Default Vanaila design — animated, block-based, navy + electric blue.',
    previewDescription: 'Animated hero, value triplet, solutions grid, why-split sections.',
    selfContained: false
  },
  {
    id: 'javanesa',
    name: 'Javanesa',
    description: 'Organic skincare brand — Playfair Display serif, warm earth tones, full-page layout.',
    previewDescription: 'Custom nav + footer, hero split, categories grid, featured products.',
    selfContained: true
  }
];

export const TEMPLATE_IDS = TEMPLATES.map((t) => t.id);

export function getTemplate(id: string): TemplateDef {
  return TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[0]!;
}
