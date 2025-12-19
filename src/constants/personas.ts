export interface Persona {
  id: string;
  name: string;
  description: string;
  writingStyle: string;
  emoji: string;
  color: string;
}

export const PERSONAS: Persona[] = [
  {
    id: 'minimalist',
    name: 'La Minimaliste',
    description: 'Descriptions courtes, claires et efficaces',
    writingStyle: 'Style minimaliste et direct : décris l\'article de manière concise et factuelle, en allant à l\'essentiel. Phrases courtes, informations précises, sans fioritures.',
    emoji: '✨',
    color: 'bg-slate-100 border-slate-300 hover:border-slate-500',
  },
  {
    id: 'enthusiast',
    name: 'L\'Enthousiaste',
    description: 'Dynamique, positive et pleine d\'énergie',
    writingStyle: 'Style enthousiaste et dynamique : utilise un ton enjoué et positif ! Mets en avant les points forts avec énergie, utilise des points d\'exclamation et des expressions enthousiastes. Rends l\'article irrésistible !',
    emoji: '🌟',
    color: 'bg-yellow-100 border-yellow-300 hover:border-yellow-500',
  },
  {
    id: 'fashion_pro',
    name: 'La Pro de la Mode',
    description: 'Experte, technique et détaillée',
    writingStyle: 'Style professionnel mode : démontre ton expertise avec un vocabulaire technique précis. Décris les coupes, matières, finitions avec précision. Ton expert et détaillé, mentionne les tendances actuelles si pertinent.',
    emoji: '👗',
    color: 'bg-purple-100 border-purple-300 hover:border-purple-500',
  },
  {
    id: 'friendly',
    name: 'La Copine Sympa',
    description: 'Chaleureuse, accessible et décontractée',
    writingStyle: 'Style copine sympa : parle comme à une amie ! Ton décontracté et chaleureux, tutoiement naturel, comme si tu présentais ton vêtement à une copine autour d\'un café. Accessible et convivial.',
    emoji: '💕',
    color: 'bg-pink-100 border-pink-300 hover:border-pink-500',
  },
  {
    id: 'elegant',
    name: 'L\'Élégante',
    description: 'Raffinée, sophistiquée et chic',
    writingStyle: 'Style élégant et raffiné : utilise un vocabulaire recherché et sophistiqué. Mets en valeur la qualité, l\'élégance et le raffinement de la pièce. Ton chic et distingué, comme dans un magazine haut de gamme.',
    emoji: '🎩',
    color: 'bg-amber-100 border-amber-300 hover:border-amber-500',
  },
  {
    id: 'eco_conscious',
    name: 'L\'Écolo Engagée',
    description: 'Responsable avec focus sur la durabilité',
    writingStyle: 'Style écolo engagé : mets en avant l\'aspect durable et responsable de la seconde main. Souligne la qualité qui dure, l\'impact positif de l\'achat d\'occasion. Ton conscient et authentique avec des valeurs écologiques.',
    emoji: '🌱',
    color: 'bg-green-100 border-green-300 hover:border-green-500',
  },
];
