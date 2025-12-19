export interface CategoryItem {
  name: string;
  items: string[];
}

export interface Category {
  name: string;
  subcategories: CategoryItem[];
}

export const VINTED_CATEGORIES: Category[] = [
  {
    name: "Femmes",
    subcategories: [
      {
        name: "Vêtements",
        items: [
          "Robes",
          "T-shirts",
          "Tops & débardeurs",
          "Chemises & blouses",
          "Pulls, sweats & hoodies",
          "Manteaux & vestes",
          "Pantalons",
          "Jeans",
          "Shorts",
          "Jupes",
          "Ensembles & combinaisons",
          "Maillots de bain",
          "Sportswear",
          "Lingerie & sous-vêtements",
          "Pyjamas & homewear",
          "Vêtements de grossesse"
        ]
      },
      {
        name: "Chaussures",
        items: [
          "Baskets",
          "Bottes",
          "Bottines",
          "Sandales",
          "Talons",
          "Chaussures plates",
          "Chaussures de sport"
        ]
      },
      {
        name: "Sacs",
        items: [
          "Sacs à main",
          "Sacs bandoulière",
          "Sacs à dos",
          "Tote bags",
          "Sacs de sport",
          "Bagagerie"
        ]
      },
      {
        name: "Accessoires",
        items: [
          "Bijoux",
          "Montres",
          "Ceintures",
          "Écharpes & foulards",
          "Gants",
          "Bonnets & chapeaux",
          "Lunettes",
          "Portefeuilles & porte-cartes"
        ]
      },
      {
        name: "Beauté",
        items: [
          "Parfums",
          "Maquillage",
          "Soins visage",
          "Soins corps",
          "Soins cheveux",
          "Hygiène",
          "Accessoires beauté"
        ]
      },
      {
        name: "Mariage",
        items: [
          "Robes de mariée",
          "Accessoires",
          "Chaussures de cérémonie"
        ]
      }
    ]
  },
  {
    name: "Hommes",
    subcategories: [
      {
        name: "Vêtements",
        items: [
          "T-shirts",
          "Chemises",
          "Pulls & sweats",
          "Manteaux & vestes",
          "Jeans",
          "Pantalons",
          "Shorts",
          "Sportswear",
          "Sous-vêtements",
          "Pyjamas"
        ]
      },
      {
        name: "Chaussures",
        items: [
          "Baskets",
          "Boots",
          "Chaussures habillées",
          "Sandales",
          "Chaussures de sport"
        ]
      },
      {
        name: "Sacs & accessoires",
        items: [
          "Sacs à dos",
          "Sacs bandoulière",
          "Portefeuilles",
          "Ceintures",
          "Montres",
          "Lunettes",
          "Casquettes & bonnets",
          "Bijoux"
        ]
      }
    ]
  },
  {
    name: "Enfants",
    subcategories: [
      { name: "Fille 0-24 mois", items: [] },
      { name: "Garçon 0-24 mois", items: [] },
      { name: "Fille 2-14 ans", items: [] },
      { name: "Garçon 2-14 ans", items: [] },
      { name: "Chaussures enfants", items: [] },
      { name: "Jouets", items: [] },
      { name: "Jeux éducatifs", items: [] },
      {
        name: "Puériculture",
        items: [
          "Poussettes",
          "Sièges auto",
          "Équipements bébé",
          "Porte-bébés",
          "Linge bébé",
          "Accessoires repas"
        ]
      }
    ]
  },
  {
    name: "Maison",
    subcategories: [
      { name: "Décoration", items: [] },
      { name: "Art de la table", items: [] },
      { name: "Linge de maison", items: [] },
      { name: "Meubles", items: [] },
      { name: "Rangement", items: [] },
      { name: "Luminaire", items: [] },
      { name: "Accessoires cuisine", items: [] },
      { name: "Jardin & extérieur", items: [] }
    ]
  },
  {
    name: "Électronique",
    subcategories: [
      { name: "Smartphones", items: [] },
      { name: "Tablettes", items: [] },
      { name: "PC portables", items: [] },
      { name: "Accessoires téléphones", items: [] },
      { name: "Casques & écouteurs", items: [] },
      { name: "Consoles", items: [] },
      { name: "Jeux vidéo", items: [] },
      { name: "Objets connectés", items: [] },
      { name: "Appareils photo", items: [] },
      { name: "Audio & Hi-Fi", items: [] },
      { name: "Télévision", items: [] },
      { name: "Informatique", items: [] }
    ]
  },
  {
    name: "Divertissement",
    subcategories: [
      { name: "Livres", items: [] },
      { name: "BD & Comics", items: [] },
      { name: "Mangas", items: [] },
      { name: "CD", items: [] },
      { name: "Vinyles", items: [] },
      { name: "DVD & Blu-ray", items: [] },
      { name: "Jeux vidéo", items: [] },
      { name: "Instruments de musique", items: [] },
      { name: "Puzzles", items: [] },
      { name: "Jeux de société", items: [] }
    ]
  },
  {
    name: "Sport & Loisirs",
    subcategories: [
      { name: "Sportswear", items: [] },
      { name: "Chaussures de sport", items: [] },
      { name: "Fitness", items: [] },
      { name: "Vélo", items: [] },
      { name: "Ski & snowboard", items: [] },
      { name: "Randonnée", items: [] },
      { name: "Camping", items: [] },
      { name: "Sports de combat", items: [] },
      { name: "Danse & yoga", items: [] },
      { name: "Natation & plongée", items: [] },
      { name: "Sports d'équipe", items: [] }
    ]
  },
  {
    name: "Loisirs & Collections",
    subcategories: [
      { name: "Figurines", items: [] },
      { name: "Objets vintage", items: [] },
      { name: "Objets rares", items: [] },
      { name: "Miniatures", items: [] },
      { name: "Cartes à collectionner", items: [] },
      { name: "Décoration rétro", items: [] }
    ]
  },
  {
    name: "Articles de créateurs",
    subcategories: [
      { name: "Sacs de luxe", items: [] },
      { name: "Prêt-à-porter luxe", items: [] },
      { name: "Chaussures luxe", items: [] },
      { name: "Accessoires luxe", items: [] },
      { name: "Bijoux & montres", items: [] },
      { name: "Vintage designer", items: [] }
    ]
  }
];
