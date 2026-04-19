import type { LeagueTier } from '@/types';

export interface MockSocialPlayer {
  id: string;
  username: string;
  avatar: string;
  league_tier: LeagueTier;
  score: number;
  elo_rating: number;
  favorite_team: string | null;
}

export const MOCK_SOCIAL_PLAYERS: MockSocialPlayer[] = [
  { id: 'p1', username: 'FutbolKrali', avatar: 'F', league_tier: 'champion', score: 125000, elo_rating: 2140, favorite_team: 'Galatasaray' },
  { id: 'p2', username: 'GalatasarayFan', avatar: 'G', league_tier: 'champion', score: 118000, elo_rating: 2095, favorite_team: 'Galatasaray' },
  { id: 'p3', username: 'BesiktasAski', avatar: 'B', league_tier: 'diamond', score: 112000, elo_rating: 1940, favorite_team: 'Beşiktaş' },
  { id: 'p4', username: 'FenerliYildiz', avatar: 'F', league_tier: 'diamond', score: 105000, elo_rating: 1895, favorite_team: 'Fenerbahçe' },
  { id: 'p5', username: 'TrabzonGucu', avatar: 'T', league_tier: 'diamond', score: 98000, elo_rating: 1820, favorite_team: 'Trabzonspor' },
  { id: 'p6', username: 'AnkaraSpor', avatar: 'A', league_tier: 'gold', score: 92000, elo_rating: 1680, favorite_team: 'MKE Ankaragücü' },
  { id: 'p7', username: 'IzmirAslan', avatar: 'I', league_tier: 'gold', score: 87000, elo_rating: 1620, favorite_team: 'Göztepe' },
  { id: 'p8', username: 'BursaYesil', avatar: 'B', league_tier: 'gold', score: 81000, elo_rating: 1560, favorite_team: 'Bursaspor' },
  { id: 'p9', username: 'KonyaKaplan', avatar: 'K', league_tier: 'gold', score: 76000, elo_rating: 1495, favorite_team: 'Konyaspor' },
  { id: 'p10', username: 'AdanaGuru', avatar: 'A', league_tier: 'silver', score: 71000, elo_rating: 1410, favorite_team: 'Adana Demirspor' },
  { id: 'p11', username: 'GaziantepPro', avatar: 'G', league_tier: 'silver', score: 67000, elo_rating: 1350, favorite_team: 'Gaziantep FK' },
  { id: 'p12', username: 'SamsunYildiz', avatar: 'S', league_tier: 'silver', score: 63000, elo_rating: 1310, favorite_team: 'Samsunspor' },
  { id: 'p13', username: 'KayseriFan', avatar: 'K', league_tier: 'silver', score: 59000, elo_rating: 1270, favorite_team: 'Kayserispor' },
  { id: 'p14', username: 'DenizliSpor', avatar: 'D', league_tier: 'silver', score: 55000, elo_rating: 1230, favorite_team: 'Denizlispor' },
  { id: 'p15', username: 'EskisehirLi', avatar: 'E', league_tier: 'bronze', score: 51000, elo_rating: 1180, favorite_team: 'Eskişehirspor' },
  { id: 'p16', username: 'ManisaGuru', avatar: 'M', league_tier: 'bronze', score: 48000, elo_rating: 1130, favorite_team: 'Manisaspor' },
  { id: 'p17', username: 'BalikesirFan', avatar: 'B', league_tier: 'bronze', score: 45000, elo_rating: 1090, favorite_team: 'Balıkesirspor' },
  { id: 'p18', username: 'TekirDagPro', avatar: 'T', league_tier: 'bronze', score: 42000, elo_rating: 1050, favorite_team: 'Tekirdağspor' },
  { id: 'p19', username: 'EdirneSpor', avatar: 'E', league_tier: 'bronze', score: 39000, elo_rating: 1010, favorite_team: 'Edirnespor' },
  { id: 'p20', username: 'CanakkaleAski', avatar: 'C', league_tier: 'bronze', score: 36000, elo_rating: 980, favorite_team: 'Çanakkalespor' },
];
