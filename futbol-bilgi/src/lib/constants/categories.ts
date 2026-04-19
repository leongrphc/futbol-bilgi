// ==========================================
// FutbolBilgi - Question Categories Taxonomy
// ==========================================

export interface CategoryInfo {
  name: string;
  subcategories: string[];
}

export interface LeagueScopeCategories {
  [key: string]: CategoryInfo;
}

export const SUBCATEGORY_LABELS: Record<string, string> = {
  transfers: 'Transferler',
  statistics: 'Istatistikler',
  championships: 'Sampiyonluklar',
  coaches: 'Teknik Direktorler',
  stadiums: 'Stadyumlar',
  derbies: 'Derbiler',
  records: 'Rekorlar',
  squads: 'Kadrolar',
  rules: 'Kurallar',
  world_cup: 'Dunya Kupasi',
  euro: 'Avrupa Sampiyonasi',
  memorable_matches: 'Unutulmaz Maclar',
  champions_league: 'Sampiyonlar Ligi',
  europa_league: 'Avrupa Ligi',
  conference_league: 'Konferans Ligi',
  top_scorers: 'Gol Krallari',
  legends: 'Efsaneler',
  national_teams: 'Milli Takimlar',
  club_history: 'Kulup Tarihi',
  awards: 'Oduller',
  ballon_dor: "Ballon d'Or",
  iconic_moments: 'Ikonik Anlar',
  managers: 'Menajerler',
};

export const CATEGORIES: Record<string, LeagueScopeCategories> = {
  turkey: {
    super_lig: {
      name: 'Super Lig',
      subcategories: [
        'transfers',
        'statistics',
        'championships',
        'coaches',
        'stadiums',
        'derbies',
        'records',
        'squads',
        'rules',
      ],
    },
    lig_1: {
      name: 'TFF 1. Lig',
      subcategories: [
        'transfers',
        'statistics',
        'championships',
        'coaches',
        'stadiums',
        'records',
        'squads',
      ],
    },
    lig_2: {
      name: 'TFF 2. Lig',
      subcategories: [
        'transfers',
        'statistics',
        'championships',
        'coaches',
        'stadiums',
        'records',
      ],
    },
    lig_3: {
      name: 'TFF 3. Lig',
      subcategories: [
        'transfers',
        'statistics',
        'championships',
        'coaches',
        'records',
      ],
    },
    turkiye_kupasi: {
      name: 'Turkiye Kupasi',
      subcategories: [
        'championships',
        'memorable_matches',
        'records',
        'statistics',
        'coaches',
      ],
    },
    super_kupa: {
      name: 'Super Kupa',
      subcategories: [
        'championships',
        'memorable_matches',
        'records',
        'statistics',
      ],
    },
    milli_takim: {
      name: 'Milli Takim',
      subcategories: [
        'world_cup',
        'euro',
        'memorable_matches',
        'coaches',
        'records',
        'squads',
        'statistics',
      ],
    },
  },

  europe: {
    champions_league: {
      name: 'Sampiyonlar Ligi',
      subcategories: [
        'championships',
        'top_scorers',
        'memorable_matches',
        'records',
        'legends',
        'statistics',
        'coaches',
      ],
    },
    europa_league: {
      name: 'Avrupa Ligi',
      subcategories: [
        'championships',
        'top_scorers',
        'memorable_matches',
        'records',
        'statistics',
      ],
    },
    conference_league: {
      name: 'Konferans Ligi',
      subcategories: [
        'championships',
        'memorable_matches',
        'records',
        'statistics',
      ],
    },
    premier_league: {
      name: 'Premier Lig',
      subcategories: [
        'transfers',
        'statistics',
        'championships',
        'coaches',
        'stadiums',
        'records',
        'legends',
        'derbies',
      ],
    },
    la_liga: {
      name: 'La Liga',
      subcategories: [
        'transfers',
        'statistics',
        'championships',
        'coaches',
        'stadiums',
        'records',
        'legends',
        'derbies',
      ],
    },
    bundesliga: {
      name: 'Bundesliga',
      subcategories: [
        'transfers',
        'statistics',
        'championships',
        'coaches',
        'stadiums',
        'records',
        'legends',
      ],
    },
    serie_a: {
      name: 'Serie A',
      subcategories: [
        'transfers',
        'statistics',
        'championships',
        'coaches',
        'stadiums',
        'records',
        'legends',
        'derbies',
      ],
    },
    ligue_1: {
      name: 'Ligue 1',
      subcategories: [
        'transfers',
        'statistics',
        'championships',
        'coaches',
        'stadiums',
        'records',
        'legends',
      ],
    },
    euro_championship: {
      name: 'Avrupa Sampiyonasi',
      subcategories: [
        'championships',
        'top_scorers',
        'memorable_matches',
        'records',
        'national_teams',
      ],
    },
  },

  world: {
    world_cup: {
      name: 'Dunya Kupasi',
      subcategories: [
        'championships',
        'top_scorers',
        'memorable_matches',
        'records',
        'national_teams',
        'legends',
        'coaches',
        'stadiums',
        'iconic_moments',
      ],
    },
    copa_america: {
      name: 'Copa America',
      subcategories: [
        'championships',
        'top_scorers',
        'memorable_matches',
        'records',
        'national_teams',
      ],
    },
    africa_cup: {
      name: 'Afrika Uluslar Kupasi',
      subcategories: [
        'championships',
        'top_scorers',
        'memorable_matches',
        'records',
        'national_teams',
      ],
    },
    club_world_cup: {
      name: 'Dunya Kulupler Kupasi',
      subcategories: [
        'championships',
        'memorable_matches',
        'records',
      ],
    },
    ballon_dor: {
      name: "Ballon d'Or & Oduller",
      subcategories: [
        'awards',
        'ballon_dor',
        'legends',
        'records',
      ],
    },
    global_legends: {
      name: 'Dunya Efsaneleri',
      subcategories: [
        'legends',
        'records',
        'iconic_moments',
        'managers',
        'club_history',
      ],
    },
  },
};

// Helper: Get all subcategories for a league scope
export function getSubcategoriesForScope(scope: string): string[] {
  const scopeCategories = CATEGORIES[scope];
  if (!scopeCategories) return [];

  const subcategories = new Set<string>();
  Object.values(scopeCategories).forEach((cat) => {
    cat.subcategories.forEach((sub) => subcategories.add(sub));
  });
  return Array.from(subcategories);
}

// Helper: Get display name for a category key
export function getCategoryName(scope: string, key: string): string {
  return CATEGORIES[scope]?.[key]?.name ?? key;
}

// Helper: Get display name for a subcategory key
export function getSubcategoryName(key: string): string {
  return SUBCATEGORY_LABELS[key] ?? key;
}
