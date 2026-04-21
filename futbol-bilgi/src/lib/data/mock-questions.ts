import type { Question } from '@/types';

interface ClubFact {
  name: string;
  city: string;
  colors: string;
  founded: number;
  region: string;
  stadium?: string;
  nickname?: string;
}

interface HistoricalQuestionInput {
  league: string;
  category: string;
  sub_category: string;
  difficulty: Question['difficulty'];
  season_range: string;
  team_tags: string[];
  era_tag: Question['era_tag'];
  question_text: string;
  correctText: string;
  distractors: string[];
  explanation: string;
}

const CLUBS: ClubFact[] = [
  { name: 'Adana Demirspor', city: 'Adana', colors: 'Mavi-Lacivert', founded: 1940, region: 'Akdeniz', stadium: 'Yeni Adana Stadyumu', nickname: 'Mavi Şimşekler' },
  { name: 'Antalyaspor', city: 'Antalya', colors: 'Kırmızı-Beyaz', founded: 1966, region: 'Akdeniz', nickname: 'Akrepler' },
  { name: 'Başakşehir', city: 'İstanbul', colors: 'Turuncu-Lacivert', founded: 1990, region: 'Marmara', stadium: 'Başakşehir Fatih Terim Stadyumu', nickname: 'Boz Baykuşlar' },
  { name: 'Beşiktaş', city: 'İstanbul', colors: 'Siyah-Beyaz', founded: 1903, region: 'Marmara', stadium: 'Tüpraş Stadyumu', nickname: 'Kara Kartallar' },
  { name: 'Boluspor', city: 'Bolu', colors: 'Kırmızı-Beyaz', founded: 1965, region: 'Karadeniz' },
  { name: 'Bursaspor', city: 'Bursa', colors: 'Yeşil-Beyaz', founded: 1963, region: 'Marmara', nickname: 'Timsahlar' },
  { name: 'Çaykur Rizespor', city: 'Rize', colors: 'Yeşil-Mavi', founded: 1953, region: 'Karadeniz', stadium: 'Çaykur Didi Stadyumu', nickname: 'Atmacalar' },
  { name: 'Eskişehirspor', city: 'Eskişehir', colors: 'Kırmızı-Siyah', founded: 1965, region: 'İç Anadolu' },
  { name: 'Fenerbahçe', city: 'İstanbul', colors: 'Sarı-Lacivert', founded: 1907, region: 'Marmara', stadium: 'Ülker Stadyumu', nickname: 'Sarı Kanaryalar' },
  { name: 'Galatasaray', city: 'İstanbul', colors: 'Sarı-Kırmızı', founded: 1905, region: 'Marmara', stadium: 'RAMS Park', nickname: 'Cimbom' },
  { name: 'Gençlerbirliği', city: 'Ankara', colors: 'Kırmızı-Siyah', founded: 1923, region: 'İç Anadolu' },
  { name: 'Göztepe', city: 'İzmir', colors: 'Sarı-Kırmızı', founded: 1925, region: 'Ege', stadium: 'Gürsel Aksel Stadyumu', nickname: 'Göz Göz' },
  { name: 'Kasımpaşa', city: 'İstanbul', colors: 'Lacivert-Beyaz', founded: 1921, region: 'Marmara', stadium: 'Recep Tayyip Erdoğan Stadyumu' },
  { name: 'Kayserispor', city: 'Kayseri', colors: 'Sarı-Kırmızı', founded: 1966, region: 'İç Anadolu' },
  { name: 'Kocaelispor', city: 'Kocaeli', colors: 'Yeşil-Siyah', founded: 1966, region: 'Marmara' },
  { name: 'MKE Ankaragücü', city: 'Ankara', colors: 'Sarı-Lacivert', founded: 1910, region: 'İç Anadolu', stadium: 'Eryaman Stadyumu' },
  { name: 'Samsunspor', city: 'Samsun', colors: 'Kırmızı-Beyaz', founded: 1965, region: 'Karadeniz', stadium: 'Samsun Yeni 19 Mayıs Stadyumu' },
  { name: 'Sivasspor', city: 'Sivas', colors: 'Kırmızı-Beyaz', founded: 1967, region: 'İç Anadolu', stadium: 'BG Grup 4 Eylül Stadyumu', nickname: 'Yiğidolar' },
  { name: 'Trabzonspor', city: 'Trabzon', colors: 'Bordo-Mavi', founded: 1967, region: 'Karadeniz', stadium: 'Papara Park', nickname: 'Karadeniz Fırtınası' },
  { name: 'Altay', city: 'İzmir', colors: 'Siyah-Beyaz', founded: 1914, region: 'Ege', nickname: 'Büyük Altay' },
];

const HISTORICAL_QUESTIONS: HistoricalQuestionInput[] = [
  {
    league: 'Süper Lig',
    category: 'Avrupa',
    sub_category: 'UEFA Kupası',
    difficulty: 4,
    season_range: '1999-2000',
    team_tags: ['Galatasaray'],
    era_tag: 'classic',
    question_text: 'Galatasaray 2000 UEFA Kupası finalinde hangi takımı yenmiştir?',
    correctText: 'Arsenal',
    distractors: ['Leeds United', 'Real Madrid', 'Lazio'],
    explanation: 'Galatasaray, Arsenal ile oynadığı finali penaltılarla kazanarak kupayı aldı.',
  },
  {
    league: 'Avrupa',
    category: 'Avrupa',
    sub_category: 'UEFA Süper Kupa',
    difficulty: 4,
    season_range: '2000-2001',
    team_tags: ['Galatasaray'],
    era_tag: 'classic',
    question_text: 'Galatasaray 2000 UEFA Süper Kupa finalinde hangi takımı mağlup etmiştir?',
    correctText: 'Real Madrid',
    distractors: ['Valencia', 'Arsenal', 'Juventus'],
    explanation: 'Galatasaray, UEFA Süper Kupa finalinde Real Madrid’i 2-1 yenmiştir.',
  },
  {
    league: 'Süper Lig',
    category: 'Teknik Direktörler',
    sub_category: 'Avrupa Başarıları',
    difficulty: 4,
    season_range: '1999-2000',
    team_tags: ['Galatasaray'],
    era_tag: 'classic',
    question_text: 'Galatasaray’ın 2000 yılındaki UEFA Kupası zaferindeki teknik direktörü kimdir?',
    correctText: 'Fatih Terim',
    distractors: ['Mustafa Denizli', 'Mircea Lucescu', 'Şenol Güneş'],
    explanation: 'Galatasaray, 2000 UEFA Kupası’nı Fatih Terim yönetiminde kazandı.',
  },
  {
    league: 'Avrupa',
    category: 'Avrupa',
    sub_category: 'Şampiyonlar Ligi',
    difficulty: 4,
    season_range: '2007-2008',
    team_tags: ['Fenerbahçe'],
    era_tag: 'classic',
    question_text: 'Fenerbahçe 2007-08 Şampiyonlar Ligi sezonunda hangi tura kadar yükselmiştir?',
    correctText: 'Çeyrek final',
    distractors: ['Son 16', 'Yarı final', 'Final'],
    explanation: 'Fenerbahçe, 2007-08 sezonunda Şampiyonlar Ligi çeyrek finaline kadar yükseldi.',
  },
  {
    league: 'Süper Lig',
    category: 'Tarih',
    sub_category: 'Şampiyonluklar',
    difficulty: 3,
    season_range: '2021-2022',
    team_tags: ['Trabzonspor'],
    era_tag: 'modern',
    question_text: 'Trabzonspor en son hangi sezonda Süper Lig şampiyonu olmuştur?',
    correctText: '2021-2022',
    distractors: ['2019-2020', '2020-2021', '2022-2023'],
    explanation: 'Trabzonspor, 2021-2022 sezonunda Süper Lig şampiyonluğuna ulaştı.',
  },
  {
    league: 'Süper Lig',
    category: 'Tarih',
    sub_category: 'Şampiyonluklar',
    difficulty: 4,
    season_range: '2019-2020',
    team_tags: ['Başakşehir'],
    era_tag: 'modern',
    question_text: 'Başakşehir ilk Süper Lig şampiyonluğunu hangi sezonda yaşamıştır?',
    correctText: '2019-2020',
    distractors: ['2018-2019', '2020-2021', '2021-2022'],
    explanation: 'Başakşehir, kulüp tarihindeki ilk Süper Lig şampiyonluğunu 2019-2020 sezonunda kazandı.',
  },
  {
    league: 'Süper Lig',
    category: 'Tarih',
    sub_category: 'Şampiyonluklar',
    difficulty: 4,
    season_range: '2009-2010',
    team_tags: ['Bursaspor'],
    era_tag: 'modern',
    question_text: 'Bursaspor’un Süper Lig şampiyonluğu yaşadığı sezon hangisidir?',
    correctText: '2009-2010',
    distractors: ['2008-2009', '2010-2011', '2011-2012'],
    explanation: 'Bursaspor, 2009-2010 sezonunda Süper Lig şampiyonluğuna ulaştı.',
  },
  {
    league: 'Milli Takım',
    category: 'Milli Takım',
    sub_category: 'Dünya Kupası',
    difficulty: 4,
    season_range: '2002',
    team_tags: ['Türkiye'],
    era_tag: 'classic',
    question_text: 'Türkiye 2002 FIFA Dünya Kupası’nı kaçıncı sırada tamamlamıştır?',
    correctText: 'Üçüncü',
    distractors: ['İkinci', 'Dördüncü', 'Çeyrek finalist'],
    explanation: 'Türkiye, 2002 Dünya Kupası’nı üçüncü sırada tamamladı.',
  },
  {
    league: 'Milli Takım',
    category: 'Milli Takım',
    sub_category: 'Dünya Kupası',
    difficulty: 4,
    season_range: '2002',
    team_tags: ['Türkiye'],
    era_tag: 'classic',
    question_text: 'Türkiye, 2002 Dünya Kupası üçüncülük maçında hangi takımı yenmiştir?',
    correctText: 'Güney Kore',
    distractors: ['Japonya', 'Senegal', 'ABD'],
    explanation: 'Türkiye, üçüncülük maçında Güney Kore’yi mağlup etti.',
  },
  {
    league: 'Milli Takım',
    category: 'Milli Takım',
    sub_category: 'Rekorlar',
    difficulty: 5,
    season_range: '2002',
    team_tags: ['Türkiye'],
    era_tag: 'classic',
    question_text: 'Hakan Şükür, 2002 Dünya Kupası’nda Güney Kore’ye karşı golünü kaçıncı saniyede atmıştır?',
    correctText: '11. saniye',
    distractors: ['8. saniye', '15. saniye', '22. saniye'],
    explanation: 'Hakan Şükür’ün 11. saniyede attığı gol, Dünya Kupası tarihinin en hızlı gollerindendir.',
  },
  {
    league: 'Milli Takım',
    category: 'Milli Takım',
    sub_category: 'Avrupa Şampiyonası',
    difficulty: 4,
    season_range: '2008',
    team_tags: ['Türkiye'],
    era_tag: 'classic',
    question_text: 'Türkiye, EURO 2008’de hangi aşamaya kadar yükselmiştir?',
    correctText: 'Yarı final',
    distractors: ['Çeyrek final', 'Final', 'Son 16'],
    explanation: 'Türkiye, EURO 2008’de yarı finale kadar yükseldi.',
  },
  {
    league: 'Milli Takım',
    category: 'Milli Takım',
    sub_category: 'Avrupa Şampiyonası',
    difficulty: 4,
    season_range: '2008',
    team_tags: ['Türkiye'],
    era_tag: 'classic',
    question_text: 'Türkiye’nin EURO 2008 yarı finalindeki rakibi hangi takımdı?',
    correctText: 'Almanya',
    distractors: ['Hırvatistan', 'Portekiz', 'İspanya'],
    explanation: 'Türkiye, EURO 2008 yarı finalinde Almanya ile karşılaştı.',
  },
  {
    league: 'Süper Lig',
    category: 'Tarih',
    sub_category: 'İlkler',
    difficulty: 5,
    season_range: '1959',
    team_tags: ['Fenerbahçe'],
    era_tag: 'legendary',
    question_text: 'Süper Lig’in ilk sezonunda şampiyon olan takım hangisidir?',
    correctText: 'Fenerbahçe',
    distractors: ['Galatasaray', 'Beşiktaş', 'Ankaragücü'],
    explanation: 'Süper Lig’in ilk sezonu olan 1959’da şampiyon Fenerbahçe oldu.',
  },
  {
    league: 'Avrupa',
    category: 'Avrupa',
    sub_category: 'Kupalar',
    difficulty: 4,
    season_range: '1900-2025',
    team_tags: ['Galatasaray'],
    era_tag: 'classic',
    question_text: 'UEFA Kupası kazanan ilk ve tek Türk kulübü hangisidir?',
    correctText: 'Galatasaray',
    distractors: ['Fenerbahçe', 'Beşiktaş', 'Trabzonspor'],
    explanation: 'Galatasaray, UEFA Kupası kazanan ilk ve tek Türk kulübüdür.',
  },
  {
    league: 'Avrupa',
    category: 'Avrupa',
    sub_category: 'Kupalar',
    difficulty: 4,
    season_range: '1900-2025',
    team_tags: ['Galatasaray'],
    era_tag: 'classic',
    question_text: 'UEFA Süper Kupa kazanan ilk ve tek Türk kulübü hangisidir?',
    correctText: 'Galatasaray',
    distractors: ['Fenerbahçe', 'Beşiktaş', 'Başakşehir'],
    explanation: 'Galatasaray, UEFA Süper Kupa’yı kazanan ilk ve tek Türk kulübüdür.',
  },
  {
    league: 'Süper Lig',
    category: 'Tarih',
    sub_category: 'Rekorlar',
    difficulty: 5,
    season_range: '1991-1992',
    team_tags: ['Beşiktaş'],
    era_tag: 'classic',
    question_text: 'Süper Lig’de namağlup şampiyon olan ilk takım hangisidir?',
    correctText: 'Beşiktaş',
    distractors: ['Galatasaray', 'Fenerbahçe', 'Trabzonspor'],
    explanation: 'Beşiktaş, 1991-1992 sezonunu yenilgisiz tamamlayarak şampiyon oldu.',
  },
  {
    league: 'Türkiye Kupası',
    category: 'Kupalar',
    sub_category: 'Türkiye Kupası',
    difficulty: 4,
    season_range: '2021-2022',
    team_tags: ['Sivasspor'],
    era_tag: 'modern',
    question_text: '2022 Türkiye Kupası’nı kazanan takım hangisidir?',
    correctText: 'Sivasspor',
    distractors: ['Kayserispor', 'Trabzonspor', 'Beşiktaş'],
    explanation: 'Sivasspor, 2022 Türkiye Kupası’nı kazanmıştır.',
  },
  {
    league: 'Süper Lig',
    category: 'Transferler',
    sub_category: 'Yabancı Yıldızlar',
    difficulty: 4,
    season_range: '2004',
    team_tags: ['Fenerbahçe'],
    era_tag: 'modern',
    question_text: 'Alex de Souza, Fenerbahçe’ye hangi kulüpten transfer olmuştur?',
    correctText: 'Cruzeiro',
    distractors: ['Palmeiras', 'Santos', 'Flamengo'],
    explanation: 'Alex de Souza, Fenerbahçe’ye Cruzeiro’dan transfer olmuştur.',
  },
  {
    league: 'Süper Lig',
    category: 'Transferler',
    sub_category: 'Yabancı Yıldızlar',
    difficulty: 4,
    season_range: '2013',
    team_tags: ['Galatasaray'],
    era_tag: 'modern',
    question_text: 'Didier Drogba, Galatasaray’a hangi kulüpten transfer olmuştur?',
    correctText: 'Shanghai Shenhua',
    distractors: ['Chelsea', 'Marsilya', 'Montreal Impact'],
    explanation: 'Didier Drogba, Galatasaray’a Shanghai Shenhua’dan geldi.',
  },
  {
    league: 'Süper Lig',
    category: 'Oyuncular',
    sub_category: 'Efsaneler',
    difficulty: 4,
    season_range: '1940-1960',
    team_tags: ['Fenerbahçe'],
    era_tag: 'legendary',
    question_text: 'Fenerbahçe efsanesi Lefter Küçükandonyadis hangi mevkide oynamıştır?',
    correctText: 'Forvet',
    distractors: ['Kaleci', 'Savunma', 'Orta saha'],
    explanation: 'Lefter, Türk futbolunun unutulmaz forvetlerinden biridir.',
  },
  {
    league: 'Süper Lig',
    category: 'Oyuncular',
    sub_category: 'Efsaneler',
    difficulty: 4,
    season_range: '1980-1995',
    team_tags: ['Beşiktaş'],
    era_tag: 'classic',
    question_text: 'Metin-Ali-Feyyaz üçlüsü hangi kulübün efsane hücum hattı olarak bilinir?',
    correctText: 'Beşiktaş',
    distractors: ['Fenerbahçe', 'Galatasaray', 'Trabzonspor'],
    explanation: 'Metin-Ali-Feyyaz üçlüsü, Beşiktaş tarihinin en bilinen hücum hatlarından biridir.',
  },
  {
    league: 'Milli Takım',
    category: 'Milli Takım',
    sub_category: 'İlkler',
    difficulty: 5,
    season_range: '1924',
    team_tags: ['Türkiye'],
    era_tag: 'legendary',
    question_text: 'Türkiye A Milli Takımı ilk resmi maçını hangi yıl oynamıştır?',
    correctText: '1924',
    distractors: ['1922', '1923', '1926'],
    explanation: 'Türkiye A Milli Takımı ilk resmi maçını 1924 yılında oynadı.',
  },
  {
    league: 'Milli Takım',
    category: 'Milli Takım',
    sub_category: 'İlkler',
    difficulty: 5,
    season_range: '1924',
    team_tags: ['Türkiye'],
    era_tag: 'legendary',
    question_text: 'Türkiye A Milli Takımı ilk resmi maçını hangi ülkeye karşı oynamıştır?',
    correctText: 'Romanya',
    distractors: ['Yunanistan', 'Bulgaristan', 'Macaristan'],
    explanation: 'Türkiye A Milli Takımı ilk resmi maçını Romanya’ya karşı oynadı.',
  },
  {
    league: 'Milli Takım',
    category: 'Milli Takım',
    sub_category: 'Teknik Direktörler',
    difficulty: 4,
    season_range: '2002',
    team_tags: ['Türkiye'],
    era_tag: 'classic',
    question_text: '2002 Dünya Kupası’nda Türkiye Milli Takımı’nın teknik direktörü kimdi?',
    correctText: 'Şenol Güneş',
    distractors: ['Fatih Terim', 'Mustafa Denizli', 'Mircea Lucescu'],
    explanation: 'Türkiye, 2002 Dünya Kupası’nda Şenol Güneş yönetimindeydi.',
  },
  {
    league: 'Milli Takım',
    category: 'Milli Takım',
    sub_category: 'Avrupa Şampiyonası',
    difficulty: 4,
    season_range: '1996',
    team_tags: ['Türkiye'],
    era_tag: 'classic',
    question_text: 'Türkiye Milli Takımı Avrupa Futbol Şampiyonası’na ilk kez hangi yıl katılmıştır?',
    correctText: '1996',
    distractors: ['1992', '2000', '2004'],
    explanation: 'Türkiye, Avrupa Şampiyonası’na ilk kez 1996 yılında katıldı.',
  },
  {
    league: 'Milli Takım',
    category: 'Milli Takım',
    sub_category: 'Avrupa Şampiyonası',
    difficulty: 4,
    season_range: '2008',
    team_tags: ['Türkiye'],
    era_tag: 'classic',
    question_text: 'Türkiye, EURO 2008 çeyrek finalinde hangi takımı elemiştir?',
    correctText: 'Hırvatistan',
    distractors: ['Çekya', 'İsviçre', 'Portekiz'],
    explanation: 'Türkiye, EURO 2008 çeyrek finalinde Hırvatistan’ı eledi.',
  },
  {
    league: 'Avrupa',
    category: 'Avrupa',
    sub_category: 'UEFA Kupası',
    difficulty: 5,
    season_range: '1999-2000',
    team_tags: ['Galatasaray'],
    era_tag: 'classic',
    question_text: 'Galatasaray, 2000 UEFA Kupası yarı finalinde hangi takımı elemiştir?',
    correctText: 'Leeds United',
    distractors: ['Mallorca', 'Borussia Dortmund', 'Arsenal'],
    explanation: 'Galatasaray, 2000 UEFA Kupası yarı finalinde Leeds United’ı eledi.',
  },
  {
    league: 'Avrupa',
    category: 'Avrupa',
    sub_category: 'UEFA Süper Kupa',
    difficulty: 5,
    season_range: '2000',
    team_tags: ['Galatasaray'],
    era_tag: 'classic',
    question_text: 'Galatasaray’ın 2000 UEFA Süper Kupa finalindeki iki golünü atan oyuncu kimdir?',
    correctText: 'Mario Jardel',
    distractors: ['Hakan Şükür', 'Arif Erdem', 'Hasan Şaş'],
    explanation: 'Galatasaray’ın Real Madrid karşısındaki iki golünü Mario Jardel attı.',
  },
  {
    league: 'Süper Lig',
    category: 'Oyuncular',
    sub_category: 'Efsaneler',
    difficulty: 3,
    season_range: '2004-2012',
    team_tags: ['Fenerbahçe'],
    era_tag: 'modern',
    question_text: 'Fenerbahçe efsanesi Alex de Souza hangi ülkenin futbolcusudur?',
    correctText: 'Brezilya',
    distractors: ['Arjantin', 'Uruguay', 'Portekiz'],
    explanation: 'Alex de Souza, Brezilyalı bir futbolcudur.',
  },
  {
    league: 'Süper Lig',
    category: 'Teknik Direktörler',
    sub_category: 'Şampiyonluklar',
    difficulty: 3,
    season_range: '2016-2017',
    team_tags: ['Beşiktaş'],
    era_tag: 'modern',
    question_text: 'Beşiktaş’ı 2016-17 sezonunda şampiyonluğa taşıyan teknik direktör kimdir?',
    correctText: 'Şenol Güneş',
    distractors: ['Sergen Yalçın', 'Slaven Bilić', 'Abdullah Avcı'],
    explanation: 'Beşiktaş, 2016-17 sezonunda Şenol Güneş yönetiminde şampiyon oldu.',
  },
  {
    league: 'Süper Lig',
    category: 'Tarih',
    sub_category: 'Rekorlar',
    difficulty: 5,
    season_range: '2023-2024',
    team_tags: ['Galatasaray'],
    era_tag: 'modern',
    question_text: '2023-24 sezonunda Süper Lig puan rekorunu kıran takım hangisidir?',
    correctText: 'Galatasaray',
    distractors: ['Fenerbahçe', 'Beşiktaş', 'Trabzonspor'],
    explanation: 'Galatasaray, 2023-24 sezonunda 102 puanla rekor kırdı.',
  },
  {
    league: 'Süper Lig',
    category: 'Tarih',
    sub_category: 'Rekorlar',
    difficulty: 5,
    season_range: '2023-2024',
    team_tags: ['Galatasaray'],
    era_tag: 'modern',
    question_text: 'Galatasaray 2023-24 sezonunu kaç puanla tamamlayarak rekor kırmıştır?',
    correctText: '102',
    distractors: ['99', '100', '104'],
    explanation: 'Galatasaray, 2023-24 sezonunu 102 puanla tamamladı.',
  },
  {
    league: 'Milli Takım',
    category: 'Milli Takım',
    sub_category: 'Dünya Kupası',
    difficulty: 4,
    season_range: '2002',
    team_tags: ['Türkiye'],
    era_tag: 'classic',
    question_text: 'Hakan Şükür, Dünya Kupası tarihinin en hızlı golünü hangi takıma karşı atmıştır?',
    correctText: 'Güney Kore',
    distractors: ['Brezilya', 'Japonya', 'Senegal'],
    explanation: 'Hakan Şükür, en hızlı golünü 2002 Dünya Kupası’nda Güney Kore’ye karşı attı.',
  },
  {
    league: 'Süper Lig',
    category: 'Teknik Direktörler',
    sub_category: 'Lakablar',
    difficulty: 3,
    season_range: '1980-2025',
    team_tags: ['Galatasaray'],
    era_tag: 'classic',
    question_text: 'Fatih Terim hangi lakapla anılır?',
    correctText: 'İmparator',
    distractors: ['Maestro', 'Komutan', 'Patron'],
    explanation: 'Fatih Terim, futbol kamuoyunda “İmparator” lakabıyla anılır.',
  },
  {
    league: 'Süper Lig',
    category: 'Kulüpler',
    sub_category: 'Lakablar',
    difficulty: 3,
    season_range: '1900-2025',
    team_tags: ['Trabzonspor'],
    era_tag: 'classic',
    question_text: '“Karadeniz Fırtınası” lakabıyla anılan kulüp hangisidir?',
    correctText: 'Trabzonspor',
    distractors: ['Samsunspor', 'Çaykur Rizespor', 'Sivasspor'],
    explanation: 'Trabzonspor, “Karadeniz Fırtınası” lakabıyla anılır.',
  },
  {
    league: 'Süper Lig',
    category: 'Kulüpler',
    sub_category: 'Lakablar',
    difficulty: 3,
    season_range: '1900-2025',
    team_tags: ['Beşiktaş'],
    era_tag: 'classic',
    question_text: '“Kara Kartallar” lakabıyla anılan kulüp hangisidir?',
    correctText: 'Beşiktaş',
    distractors: ['Gençlerbirliği', 'Altay', 'Bursaspor'],
    explanation: 'Beşiktaş, “Kara Kartallar” lakabıyla tanınır.',
  },
  {
    league: 'Süper Lig',
    category: 'Kulüpler',
    sub_category: 'Lakablar',
    difficulty: 3,
    season_range: '1900-2025',
    team_tags: ['Göztepe'],
    era_tag: 'classic',
    question_text: '“Göz Göz” lakabıyla bilinen kulüp hangisidir?',
    correctText: 'Göztepe',
    distractors: ['Altay', 'Kocaelispor', 'Boluspor'],
    explanation: 'Göztepe, taraftarları arasında “Göz Göz” olarak anılır.',
  },
  {
    league: 'Süper Lig',
    category: 'Kulüpler',
    sub_category: 'Lakablar',
    difficulty: 3,
    season_range: '1900-2025',
    team_tags: ['Bursaspor'],
    era_tag: 'classic',
    question_text: '“Timsahlar” lakabıyla anılan kulüp hangisidir?',
    correctText: 'Bursaspor',
    distractors: ['Sivasspor', 'Antalyaspor', 'Kayserispor'],
    explanation: 'Bursaspor, “Timsahlar” lakabıyla bilinir.',
  },
  {
    league: 'Süper Lig',
    category: 'Kulüpler',
    sub_category: 'Lakablar',
    difficulty: 3,
    season_range: '1900-2025',
    team_tags: ['Çaykur Rizespor'],
    era_tag: 'classic',
    question_text: '“Atmacalar” lakabıyla bilinen kulüp hangisidir?',
    correctText: 'Çaykur Rizespor',
    distractors: ['Trabzonspor', 'Samsunspor', 'Boluspor'],
    explanation: 'Çaykur Rizespor, “Atmacalar” lakabını kullanır.',
  },
  {
    league: 'Süper Lig',
    category: 'Kulüpler',
    sub_category: 'Lakablar',
    difficulty: 3,
    season_range: '1900-2025',
    team_tags: ['Başakşehir'],
    era_tag: 'modern',
    question_text: '“Boz Baykuşlar” lakabıyla bilinen kulüp hangisidir?',
    correctText: 'Başakşehir',
    distractors: ['Kasımpaşa', 'Gençlerbirliği', 'Galatasaray'],
    explanation: 'Başakşehir, “Boz Baykuşlar” lakabıyla anılır.',
  },
  {
    league: 'Süper Lig',
    category: 'Kulüpler',
    sub_category: 'Lakablar',
    difficulty: 3,
    season_range: '1900-2025',
    team_tags: ['Adana Demirspor'],
    era_tag: 'classic',
    question_text: '“Mavi Şimşekler” lakabıyla bilinen kulüp hangisidir?',
    correctText: 'Adana Demirspor',
    distractors: ['Samsunspor', 'Kocaelispor', 'Boluspor'],
    explanation: 'Adana Demirspor, “Mavi Şimşekler” lakabıyla anılır.',
  },
  {
    league: 'Süper Lig',
    category: 'Kulüpler',
    sub_category: 'Lakablar',
    difficulty: 3,
    season_range: '1900-2025',
    team_tags: ['Sivasspor'],
    era_tag: 'classic',
    question_text: '“Yiğidolar” lakabıyla bilinen kulüp hangisidir?',
    correctText: 'Sivasspor',
    distractors: ['Kayserispor', 'Boluspor', 'Eskişehirspor'],
    explanation: 'Sivasspor, “Yiğidolar” lakabıyla bilinir.',
  },
  {
    league: 'Süper Lig',
    category: 'Kulüpler',
    sub_category: 'Lakablar',
    difficulty: 3,
    season_range: '1900-2025',
    team_tags: ['Altay'],
    era_tag: 'classic',
    question_text: '“Büyük Altay” lakabıyla bilinen kulüp hangisidir?',
    correctText: 'Altay',
    distractors: ['Göztepe', 'Kocaelispor', 'Gençlerbirliği'],
    explanation: 'Altay, “Büyük Altay” lakabıyla anılır.',
  },
  {
    league: 'Avrupa',
    category: 'Avrupa',
    sub_category: 'UEFA Kupası',
    difficulty: 5,
    season_range: '1999-2000',
    team_tags: ['Galatasaray'],
    era_tag: 'classic',
    question_text: 'Galatasaray, 2000 UEFA Kupası finalini hangi yöntemle kazanmıştır?',
    correctText: 'Penaltılarla',
    distractors: ['Uzatmalarda altın golle', 'Normal sürede', 'Tekrar maçında'],
    explanation: 'Galatasaray, Arsenal’i penaltılar sonucunda mağlup etmiştir.',
  },
];

const ANSWER_KEYS = ['A', 'B', 'C', 'D'] as const;
const DEFAULT_STATS = {
  times_shown: 0,
  times_correct: 0,
  avg_answer_time_ms: 0,
};

function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
}

function rotate<T>(values: T[], shift: number): T[] {
  if (values.length === 0) return [];
  const safeShift = shift % values.length;
  return [...values.slice(safeShift), ...values.slice(0, safeShift)];
}

function buildOptions(correctText: string, distractors: string[], seed: number) {
  const answers = unique([correctText, ...distractors.filter((value) => value !== correctText)]).slice(0, 4);

  if (answers.length < 4) {
    throw new Error(`Not enough unique options for: ${correctText}`);
  }

  const rotated = rotate(answers, seed % 4);
  const options = rotated.map((text, index) => ({
    key: ANSWER_KEYS[index],
    text,
  }));

  const correctAnswer = options.find((option) => option.text === correctText)?.key;

  if (!correctAnswer) {
    throw new Error(`Correct answer not found in options for: ${correctText}`);
  }

  return {
    options,
    correct_answer: correctAnswer,
  };
}

function otherValues(values: string[], correct: string, seed: number, count = 3): string[] {
  return rotate(values.filter((value) => value !== correct), seed).slice(0, count);
}

function getEraTag(founded: number): Question['era_tag'] {
  if (founded <= 1920) return 'legendary';
  if (founded <= 1970) return 'classic';
  return 'modern';
}

let questionCounter = 1;

function createQuestion(input: {
  league_scope?: Question['league_scope'];
  league: string;
  category: string;
  sub_category: string;
  difficulty: Question['difficulty'];
  season_range: string;
  team_tags: string[];
  era_tag: Question['era_tag'];
  question_text: string;
  correctText: string;
  distractors: string[];
  explanation: string;
}): Question {
  const { options, correct_answer } = buildOptions(input.correctText, input.distractors, questionCounter);

  return {
    id: `q${String(questionCounter++).padStart(3, '0')}`,
    league_scope: input.league_scope ?? 'turkey',
    league: input.league,
    category: input.category,
    sub_category: input.sub_category,
    difficulty: input.difficulty,
    season_range: input.season_range,
    team_tags: input.team_tags,
    era_tag: input.era_tag,
    question_text: input.question_text,
    options,
    correct_answer,
    explanation: input.explanation,
    media: null,
    stats: { ...DEFAULT_STATS },
    is_active: true,
    created_at: '',
    updated_at: '',
  };
}

function buildClubQuestions(): Question[] {
  const questions: Question[] = [];
  const clubNames = CLUBS.map((club) => club.name);
  const cities = unique(CLUBS.map((club) => club.city));
  const colors = unique(CLUBS.map((club) => club.colors));
  const years = unique(CLUBS.map((club) => String(club.founded)));
  const regions = unique(CLUBS.map((club) => club.region));
  const stadiumClubs = CLUBS.filter((club) => club.stadium);
  const stadiums = stadiumClubs.map((club) => club.stadium as string);
  const nicknameClubs = CLUBS.filter((club) => club.nickname);
  const nicknames = nicknameClubs.map((club) => club.nickname as string);

  CLUBS.forEach((club, index) => {
    const eraTag = getEraTag(club.founded);
    const seasonRange = `${club.founded}-2025`;

    questions.push(
      createQuestion({
        league: 'Süper Lig',
        category: 'Genel',
        sub_category: 'Şehirler',
        difficulty: 1,
        season_range: seasonRange,
        team_tags: [club.name],
        era_tag: eraTag,
        question_text: `${club.name} hangi şehrin takımıdır?`,
        correctText: club.city,
        distractors: otherValues(cities, club.city, index),
        explanation: `${club.name}, ${club.city} şehrini temsil eder.`,
      }),
      createQuestion({
        league: 'Süper Lig',
        category: 'Genel',
        sub_category: 'Kulüpler',
        difficulty: 1,
        season_range: seasonRange,
        team_tags: [club.name],
        era_tag: eraTag,
        question_text: `${club.city} şehrini temsil eden kulüp hangisidir?`,
        correctText: club.name,
        distractors: otherValues(clubNames, club.name, index),
        explanation: `${club.name}, ${club.city} temsilcisidir.`,
      }),
      createQuestion({
        league: 'Süper Lig',
        category: 'Genel',
        sub_category: 'Renkler',
        difficulty: 1,
        season_range: seasonRange,
        team_tags: [club.name],
        era_tag: eraTag,
        question_text: `${club.name} kulübünün renkleri hangileridir?`,
        correctText: club.colors,
        distractors: otherValues(colors, club.colors, index),
        explanation: `${club.name}, ${club.colors} renkleriyle bilinir.`,
      }),
      createQuestion({
        league: 'Süper Lig',
        category: 'Genel',
        sub_category: 'Renkler',
        difficulty: 2,
        season_range: seasonRange,
        team_tags: [club.name],
        era_tag: eraTag,
        question_text: `${club.colors} renklerini kullanan kulüp hangisidir?`,
        correctText: club.name,
        distractors: otherValues(clubNames, club.name, index + 1),
        explanation: `${club.colors} renkleri ${club.name} ile özdeşleşmiştir.`,
      }),
      createQuestion({
        league: 'Süper Lig',
        category: 'Tarih',
        sub_category: 'Kuruluş',
        difficulty: 2,
        season_range: seasonRange,
        team_tags: [club.name],
        era_tag: eraTag,
        question_text: `${club.name} kaç yılında kurulmuştur?`,
        correctText: String(club.founded),
        distractors: otherValues(years, String(club.founded), index),
        explanation: `${club.name} kulübünün kuruluş yılı ${club.founded} olarak kabul edilir.`,
      }),
      createQuestion({
        league: 'Süper Lig',
        category: 'Tarih',
        sub_category: 'Kuruluş',
        difficulty: 2,
        season_range: seasonRange,
        team_tags: [club.name],
        era_tag: eraTag,
        question_text: `${club.founded} yılında kurulan kulüp hangisidir?`,
        correctText: club.name,
        distractors: otherValues(clubNames, club.name, index + 2),
        explanation: `${club.name}, ${club.founded} yılında kurulmuştur.`,
      }),
      createQuestion({
        league: 'Süper Lig',
        category: 'Genel',
        sub_category: 'Bölgeler',
        difficulty: 2,
        season_range: seasonRange,
        team_tags: [club.name],
        era_tag: eraTag,
        question_text: `${club.name} hangi bölgede yer alır?`,
        correctText: club.region,
        distractors: otherValues(regions, club.region, index),
        explanation: `${club.city}, ${club.region} Bölgesi’nde yer alır.`,
      }),
      createQuestion({
        league: 'Süper Lig',
        category: 'Genel',
        sub_category: 'Kulüp Kimliği',
        difficulty: 2,
        season_range: seasonRange,
        team_tags: [club.name],
        era_tag: eraTag,
        question_text: `${club.city} temsilcisi ve ${club.colors} renklere sahip kulüp hangisidir?`,
        correctText: club.name,
        distractors: otherValues(clubNames, club.name, index + 3),
        explanation: `${club.city} şehrinin ${club.colors} renkli temsilcisi ${club.name} kulübüdür.`,
      }),
      createQuestion({
        league: 'Süper Lig',
        category: 'Genel',
        sub_category: 'Kulüp Kimliği',
        difficulty: 3,
        season_range: seasonRange,
        team_tags: [club.name],
        era_tag: eraTag,
        question_text: `${club.founded} yılında kurulan ve ${club.colors} renklerini taşıyan kulüp hangisidir?`,
        correctText: club.name,
        distractors: otherValues(clubNames, club.name, index + 4),
        explanation: `${club.name}, ${club.founded} yılında kurulmuş ve ${club.colors} renkleriyle tanınmıştır.`,
      }),
      createQuestion({
        league: 'Süper Lig',
        category: 'Genel',
        sub_category: 'Kulüp Kimliği',
        difficulty: 3,
        season_range: seasonRange,
        team_tags: [club.name],
        era_tag: eraTag,
        question_text: `${club.city} şehrinin ${club.founded} yılında kurulan kulübü hangisidir?`,
        correctText: club.name,
        distractors: otherValues(clubNames, club.name, index + 5),
        explanation: `${club.name}, ${club.city} şehrinde ${club.founded} yılında kurulmuştur.`,
      }),
      createQuestion({
        league: 'Süper Lig',
        category: 'Genel',
        sub_category: 'Şehirler',
        difficulty: 2,
        season_range: seasonRange,
        team_tags: [club.name],
        era_tag: eraTag,
        question_text: `${club.region} Bölgesi ekiplerinden ${club.name} hangi şehirde yer alır?`,
        correctText: club.city,
        distractors: otherValues(cities, club.city, index + 6),
        explanation: `${club.name}, ${club.region} Bölgesi’ndeki ${club.city} şehrinin kulübüdür.`,
      }),
      createQuestion({
        league: 'Süper Lig',
        category: 'Genel',
        sub_category: 'Renkler',
        difficulty: 2,
        season_range: seasonRange,
        team_tags: [club.name],
        era_tag: eraTag,
        question_text: `${club.name} aşağıdaki renk ikililerinden hangisiyle özdeşleşir?`,
        correctText: club.colors,
        distractors: otherValues(colors, club.colors, index + 7),
        explanation: `${club.name} denince akla gelen renk ikilisi ${club.colors} olur.`,
      }),
      createQuestion({
        league: 'Süper Lig',
        category: 'Genel',
        sub_category: 'Kulüp Kimliği',
        difficulty: 3,
        season_range: seasonRange,
        team_tags: [club.name],
        era_tag: eraTag,
        question_text: `${club.city} şehrinin ${club.colors} renklere sahip takımı hangisidir?`,
        correctText: club.name,
        distractors: otherValues(clubNames, club.name, index + 8),
        explanation: `${club.city} şehrinin ${club.colors} renklere sahip takımı ${club.name} kulübüdür.`,
      }),
      createQuestion({
        league: 'Süper Lig',
        category: 'Tarih',
        sub_category: 'Kuruluş',
        difficulty: 3,
        season_range: seasonRange,
        team_tags: [club.name],
        era_tag: eraTag,
        question_text: `${club.region} Bölgesi’nde yer alan ${club.name} kaç yılında kurulmuştur?`,
        correctText: String(club.founded),
        distractors: otherValues(years, String(club.founded), index + 9),
        explanation: `${club.name}, ${club.region} Bölgesi’nde bulunan bir kulüp olup ${club.founded} yılında kurulmuştur.`,
      }),
      createQuestion({
        league: 'Süper Lig',
        category: 'Genel',
        sub_category: 'Bölgeler',
        difficulty: 3,
        season_range: seasonRange,
        team_tags: [club.name],
        era_tag: eraTag,
        question_text: `Aşağıdaki kulüplerden hangisi ${club.region} Bölgesi takımıdır?`,
        correctText: club.name,
        distractors: rotate(
          CLUBS.filter((item) => item.region !== club.region).map((item) => item.name),
          index,
        ).slice(0, 3),
        explanation: `${club.name}, ${club.region} Bölgesi’nde yer alır.`,
      }),
    );

    if (club.stadium) {
      questions.push(
        createQuestion({
          league: 'Süper Lig',
          category: 'Stadyumlar',
          sub_category: 'İç Saha',
          difficulty: 3,
          season_range: seasonRange,
          team_tags: [club.name],
          era_tag: eraTag,
          question_text: `${club.name} iç saha maçlarını hangi statta oynar?`,
          correctText: club.stadium,
          distractors: otherValues(stadiums, club.stadium, index),
          explanation: `${club.name} iç saha maçlarını ${club.stadium}’nda oynar.`,
        }),
        createQuestion({
          league: 'Süper Lig',
          category: 'Stadyumlar',
          sub_category: 'Kulüpler',
          difficulty: 3,
          season_range: seasonRange,
          team_tags: [club.name],
          era_tag: eraTag,
          question_text: `${club.stadium} hangi kulübün evidir?`,
          correctText: club.name,
          distractors: otherValues(stadiumClubs.map((item) => item.name), club.name, index),
          explanation: `${club.stadium}, ${club.name} kulübünün iç saha stadyumudur.`,
        }),
      );
    }

    if (club.nickname) {
      questions.push(
        createQuestion({
          league: 'Süper Lig',
          category: 'Kulüpler',
          sub_category: 'Lakablar',
          difficulty: 3,
          season_range: seasonRange,
          team_tags: [club.name],
          era_tag: eraTag,
          question_text: `${club.name} hangi lakapla anılır?`,
          correctText: club.nickname,
          distractors: otherValues(nicknames, club.nickname, index),
          explanation: `${club.name} taraftarları arasında “${club.nickname}” lakabıyla bilinir.`,
        }),
        createQuestion({
          league: 'Süper Lig',
          category: 'Kulüpler',
          sub_category: 'Lakablar',
          difficulty: 3,
          season_range: seasonRange,
          team_tags: [club.name],
          era_tag: eraTag,
          question_text: `“${club.nickname}” lakabıyla anılan kulüp hangisidir?`,
          correctText: club.name,
          distractors: otherValues(nicknameClubs.map((item) => item.name), club.name, index),
          explanation: `“${club.nickname}” lakabı ${club.name} için kullanılır.`,
        }),
      );
    }
  });

  for (let i = 0; i < CLUBS.length; i += 1) {
    const group = [
      CLUBS[i],
      CLUBS[(i + 5) % CLUBS.length],
      CLUBS[(i + 10) % CLUBS.length],
      CLUBS[(i + 15) % CLUBS.length],
    ];

    const oldest = [...group].sort((a, b) => a.founded - b.founded)[0];
    const newest = [...group].sort((a, b) => b.founded - a.founded)[0];

    questions.push(
      createQuestion({
        league: 'Süper Lig',
        category: 'Tarih',
        sub_category: 'Kuruluş Karşılaştırması',
        difficulty: 4,
        season_range: '1903-2025',
        team_tags: group.map((club) => club.name),
        era_tag: 'classic',
        question_text: 'Aşağıdaki kulüplerden hangisi daha önce kurulmuştur?',
        correctText: oldest.name,
        distractors: group.filter((club) => club.name !== oldest.name).map((club) => club.name),
        explanation: `Bu seçenekler arasında en eski kuruluş yılı ${oldest.founded} ile ${oldest.name} kulübüne aittir.`,
      }),
      createQuestion({
        league: 'Süper Lig',
        category: 'Tarih',
        sub_category: 'Kuruluş Karşılaştırması',
        difficulty: 4,
        season_range: '1903-2025',
        team_tags: group.map((club) => club.name),
        era_tag: 'modern',
        question_text: 'Aşağıdaki kulüplerden hangisi daha sonra kurulmuştur?',
        correctText: newest.name,
        distractors: group.filter((club) => club.name !== newest.name).map((club) => club.name),
        explanation: `Bu seçenekler arasında en yeni kuruluş yılı ${newest.founded} ile ${newest.name} kulübüne aittir.`,
      }),
    );
  }

  for (let i = 0; i < CLUBS.length; i += 1) {
    const group = [
      CLUBS[i],
      CLUBS[(i + 3) % CLUBS.length],
      CLUBS[(i + 7) % CLUBS.length],
      CLUBS[(i + 11) % CLUBS.length],
    ];

    const oldest = [...group].sort((a, b) => a.founded - b.founded)[0];
    const newest = [...group].sort((a, b) => b.founded - a.founded)[0];

    questions.push(
      createQuestion({
        league: 'Süper Lig',
        category: 'Tarih',
        sub_category: 'Kuruluş Karşılaştırması',
        difficulty: 4,
        season_range: '1903-2025',
        team_tags: group.map((club) => club.name),
        era_tag: 'classic',
        question_text: 'Bu kulüpler arasında en erken kurulan hangisidir?',
        correctText: oldest.name,
        distractors: group.filter((club) => club.name !== oldest.name).map((club) => club.name),
        explanation: `Bu grup içinde en erken kuruluş yılı ${oldest.founded} olup bu kulüp ${oldest.name}’dir.`,
      }),
      createQuestion({
        league: 'Süper Lig',
        category: 'Tarih',
        sub_category: 'Kuruluş Karşılaştırması',
        difficulty: 4,
        season_range: '1903-2025',
        team_tags: group.map((club) => club.name),
        era_tag: 'modern',
        question_text: 'Bu kulüpler arasında en geç kurulan hangisidir?',
        correctText: newest.name,
        distractors: group.filter((club) => club.name !== newest.name).map((club) => club.name),
        explanation: `Bu grup içinde en geç kuruluş yılı ${newest.founded} olup bu kulüp ${newest.name}’dir.`,
      }),
    );
  }

  CLUBS.forEach((club, index) => {
    const earlier = CLUBS.filter((item) => item.founded < club.founded);
    const later = CLUBS.filter((item) => item.founded > club.founded);

    if (earlier.length >= 1 && later.length >= 3) {
      const correct = earlier[index % earlier.length];
      questions.push(
        createQuestion({
          league: 'Süper Lig',
          category: 'Tarih',
          sub_category: 'Kuruluş Karşılaştırması',
          difficulty: 4,
          season_range: '1903-2025',
          team_tags: [club.name, correct.name],
          era_tag: 'classic',
          question_text: `Aşağıdaki kulüplerden hangisi ${club.name} kulübünden daha önce kurulmuştur?`,
          correctText: correct.name,
          distractors: rotate(later.map((item) => item.name), index).slice(0, 3),
          explanation: `${correct.name}, ${club.name} kulübünden daha erken kurulmuştur.`,
        }),
      );
    }

    if (later.length >= 1 && earlier.length >= 3) {
      const correct = later[index % later.length];
      questions.push(
        createQuestion({
          league: 'Süper Lig',
          category: 'Tarih',
          sub_category: 'Kuruluş Karşılaştırması',
          difficulty: 4,
          season_range: '1903-2025',
          team_tags: [club.name, correct.name],
          era_tag: 'modern',
          question_text: `Aşağıdaki kulüplerden hangisi ${club.name} kulübünden daha sonra kurulmuştur?`,
          correctText: correct.name,
          distractors: rotate(earlier.map((item) => item.name), index).slice(0, 3),
          explanation: `${correct.name}, ${club.name} kulübünden daha geç kurulmuştur.`,
        }),
      );
    }
  });

  return questions;
}

function buildHistoricalQuestions(): Question[] {
  return HISTORICAL_QUESTIONS.map((question) =>
    createQuestion({
      league_scope: question.league === 'Avrupa' ? 'europe' : 'turkey',
      league: question.league,
      category: question.category,
      sub_category: question.sub_category,
      difficulty: question.difficulty,
      season_range: question.season_range,
      team_tags: question.team_tags,
      era_tag: question.era_tag,
      question_text: question.question_text,
      correctText: question.correctText,
      distractors: question.distractors,
      explanation: question.explanation,
    }),
  );
}

export const MOCK_QUESTIONS: Question[] = [
  ...buildClubQuestions(),
  ...buildHistoricalQuestions(),
];

export function getQuestionsByDifficulty(difficulty: number, leagueScope?: Question['league_scope']): Question[] {
  return MOCK_QUESTIONS.filter((question) => question.difficulty === difficulty && (!leagueScope || question.league_scope === leagueScope));
}

function shuffle<T>(items: T[]): T[] {
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function getMillionaireQuestions(leagueScope: Question['league_scope'] = 'turkey'): Question[] {
  const d1 = shuffle(getQuestionsByDifficulty(1, leagueScope)).slice(0, 3);
  const d2 = shuffle(getQuestionsByDifficulty(2, leagueScope)).slice(0, 2);
  const d3 = shuffle(getQuestionsByDifficulty(3, leagueScope)).slice(0, 2);
  const d4 = shuffle(getQuestionsByDifficulty(4, leagueScope)).slice(0, 5);
  const d5 = shuffle(getQuestionsByDifficulty(5, leagueScope)).slice(0, 3);

  return [...d1, ...d2, ...d3, ...d4, ...d5];
}

function getQuestionsByPattern(pattern: readonly number[], leagueScope: Question['league_scope'] = 'turkey'): Question[] {
  const usedIds = new Set<string>();

  return pattern.map((difficulty, index) => {
    const pool = shuffle(getQuestionsByDifficulty(difficulty, leagueScope)).filter((question) => !usedIds.has(question.id));
    const fallbackPool = shuffle(MOCK_QUESTIONS).filter((question) => !usedIds.has(question.id) && question.league_scope === leagueScope);
    const picked = pool[0] ?? fallbackPool[index];

    if (picked) {
      usedIds.add(picked.id);
    }

    return picked;
  }).filter(Boolean) as Question[];
}

export function getQuickPlayQuestions(leagueScope: Question['league_scope'] = 'turkey'): Question[] {
  const pattern = [1, 1, 2, 2, 3, 3, 4, 4, 5, 5] as const;
  return shuffle(getQuestionsByPattern(pattern, leagueScope)).slice(0, 10);
}

export function getDailyChallengeQuestions(leagueScope: Question['league_scope'] = 'turkey'): Question[] {
  const pattern = [1, 2, 3, 4, 5] as const;
  return getQuestionsByPattern(pattern, leagueScope);
}

export function getQuestionsByIds(questionIds: string[]): Question[] {
  const questionMap = new Map(MOCK_QUESTIONS.map((question) => [question.id, question]));
  return questionIds.map((id) => questionMap.get(id)).filter(Boolean) as Question[];
}

export function getDuelChallengeQuestionIds(): string[] {
  const pattern = [1, 2, 3, 4, 5] as const;
  return getQuestionsByPattern(pattern).map((question) => question.id);
}
