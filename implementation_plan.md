# ⚽ FutbolBilgi — Türkiye Ligleri Bilgi Yarışması Oyunu

## Proje Tanımı & Kapsamlı Spesifikasyon

---

## 1. Vizyon, Misyon & Hedef Kitle

### 1.1 Vizyon
Türkiye futbolseverlerinin yerel bilgilerini test eden, rekabetçi ve sosyal bir uygulama oluşturarak hem eğlence hem de bilgi paylaşımı sağlayan bir ekosistem kurmak. Uzun vadede Avrupa ligleri ve uluslararası futbol bilgisini de kapsayan, dünyanın en kapsamlı futbol trivia platformuna dönüşmek.

### 1.2 Misyon
- Futbol bilgisini eğlenceye dönüştürmek
- Taraftarlar arasında sağlıklı rekabet ortamı yaratmak
- Günlük tekrar eden kullanıcı alışkanlığı oluşturmak (daily retention loop)
- Monetize edilebilir, sürdürülebilir bir oyun ekonomisi kurmak

### 1.3 Hedef Kitle

| Segment | Yaş | Profil | Motivasyon |
|---------|-----|--------|------------|
| **Hardcore Taraftar** | 18–35 | Her maçı izler, istatistikleri takip eder | Bilgisini kanıtlamak, sıralama |
| **Casual Fan** | 13–25 | Sosyal medyadan takip eder | Eğlence, arkadaşlarla yarışma |
| **Nostalji Sever** | 30–45 | Eski kadroları, transferleri hatırlar | Nostalji, zorluk |
| **Trivia Oyuncusu** | 16–40 | Genel bilgi yarışması seven | Puan toplama, ödül kazanma |

---

## 2. Oyun Mekaniği & Temel Döngü (Core Game Loop)

### 2.1 Ana Oyun Modu — "Milyoner Yarışması"

Kim Milyoner Olmak İster formatında kademeli zorluk sistemi:

```
Soru 1  →  100 puan      (Kolay)        🟢
Soru 2  →  200 puan      (Kolay)        🟢
Soru 3  →  500 puan      (Kolay)        🟢
Soru 4  →  1.000 puan    (Orta-Kolay)   🟡
Soru 5  →  2.000 puan    (Orta)         🟡
────────── GÜVENLİ NOKTA 1 ──────────   🔒 (2.000 puan garanti)
Soru 6  →  4.000 puan    (Orta)         🟡
Soru 7  →  8.000 puan    (Orta-Zor)     🟠
Soru 8  →  16.000 puan   (Zor)          🟠
Soru 9  →  32.000 puan   (Zor)          🔴
Soru 10 →  64.000 puan   (Zor)          🔴
────────── GÜVENLİ NOKTA 2 ──────────   🔒 (64.000 puan garanti)
Soru 11 →  125.000 puan  (Çok Zor)      🔴
Soru 12 →  250.000 puan  (Çok Zor)      🔴
Soru 13 →  500.000 puan  (Uzman)        💀
Soru 14 →  750.000 puan  (Uzman)        💀
Soru 15 →  1.000.000 puan (Efsane)      💀
```

**Kurallar:**
- Her soruda 4 şık (A, B, C, D)
- Yanlış cevapta güvenli noktaya düşülür
- Süre: Kolay 30sn, Orta 25sn, Zor 20sn, Uzman 15sn
- Süre dolunca yanlış sayılır

### 2.2 Jokerler (Lifelines)

| Joker | Etki | Kazanım | Mağaza Fiyatı |
|-------|------|---------|---------------|
| **%50** | 2 yanlış şıkkı eler | Seviye atladıkça | 50 coin |
| **Seyirci** | Doğru cevap olasılık dağılımı gösterir | Günlük ödül | 75 coin |
| **Telefon** | Doğru cevabı %80 ihtimalle söyler | Mağazada | 100 coin |
| **Süre Dondur** | Süreyi 15sn durdurur | Mağazada | 60 coin |
| **Pas Geç** | Soruyu değiştirir (1 kez) | Premium | 120 coin |
| **Çift Cevap** | 2 cevap hakkı verir | Reklam izle | 80 coin |

### 2.3 Ek Oyun Modları

#### 2.3.1 Hızlı Maç (Quick Play)
- 10 rastgele soru, karışık zorluk
- Süre: toplam 120 saniye
- Puan: doğru başına 100 + kalan süre bonusu
- Enerji harcamaz

#### 2.3.2 Düello Modu (PvP)
- Gerçek zamanlı 1v1 eşleşme
- 5 soru, aynı anda aynı sorular
- Hızlı ve doğru cevap veren kazanır
- ELO bazlı eşleşme sistemi
- Kazanan: 50 coin + 200 XP

#### 2.3.3 Lig Yarışması (Seasonal League)
- Haftalık sezonlar
- Bronz → Gümüş → Altın → Elmas → Şampiyon ligleri
- Her ligde ilk %20 yükselir, son %20 düşer
- Sezon sonu ödülleri (coin, özel tema, rozet)

#### 2.3.4 Günlük Meydan Okuma (Daily Challenge)
- Her gün 5 tematik soru (ör: "Galatasaray Günü", "2010'lar Özel")
- Streak sistemi (ardışık gün bonusları)
- 7 gün streak = Premium joker paketi
- 30 gün streak = Özel avatar frame

#### 2.3.5 Takım Modu
- Kullanıcı favori takımını seçer
- Takım bazlı toplam puan sıralaması
- Haftalık takım ödülleri

---

## 3. İlerleme & Ekonomi Sistemi

### 3.1 XP & Seviye Sistemi

```
Seviye 1-10:   Her seviye = 500 XP    (Çaylak)
Seviye 11-25:  Her seviye = 1.000 XP  (Amatör)
Seviye 26-50:  Her seviye = 2.000 XP  (Profesyonel)
Seviye 51-75:  Her seviye = 3.500 XP  (Yıldız)
Seviye 76-100: Her seviye = 5.000 XP  (Efsane)
```

**XP Kazanım Kaynakları:**
- Milyoner modunda doğru cevap: soru puanının %10'u kadar XP
- Hızlı Maç tamamlama: 50-200 XP
- Düello kazanma: 200 XP
- Günlük Challenge: 100 XP
- Streak bonusu: gün sayısı × 25 XP

### 3.2 Coin Ekonomisi (Soft Currency)

**Kazanım:**
- Milyoner turu tamamlama: kazanılan puanın %5'i coin
- Düello kazanma: 50 coin
- Günlük giriş: 25-200 coin (artan günlük)
- Reklam izleme: 15 coin
- Seviye atlama: seviye × 10 coin
- Achievement unlock: 50-500 coin

**Harcama:**
- Joker satın alma: 50-120 coin
- Enerji yenileme: 30 coin
- Tema/avatar satın alma: 200-2000 coin

### 3.3 Gem Ekonomisi (Hard Currency — Premium)

**Kazanım:**
- Gerçek para ile satın alma
- Nadir achievement'lar
- Sezon sonu ödülleri (üst ligler)

**Harcama:**
- Premium temalar: 50-200 gem
- Özel joker paketleri: 25-100 gem
- Enerji paketi: 10 gem
- Reklam kaldırma (1 hafta): 150 gem

### 3.4 Enerji Sistemi

```
Maksimum Enerji: 5 kalp ❤️
Milyoner modu: 1 enerji
Hızlı Maç: enerji harcamaz
Düello: 1 enerji
Günlük Challenge: enerji harcamaz

Yenilenme: Her 20 dakikada 1 enerji (otomatik)
Alternatif: Reklam izle = 1 enerji, 30 coin = 1 enerji
```

---

## 4. Soru Havuzu Yapısı & Kategorizasyon

### 4.1 Soru Veri Modeli

```json
{
  "id": "uuid",
  "league_scope": "turkey",           // "turkey" | "europe" | "world" (genişletilebilir)
  "league": "super_lig",              // enum: league identifier
  "category": "transfers",            // ana kategori
  "sub_category": "domestic",         // alt kategori
  "difficulty": 3,                    // 1-5 arası
  "season_range": ["2020-21", "2024-25"],
  "team_tags": ["galatasaray", "fenerbahce"],
  "era_tag": "modern",                // "classic" | "modern" | "golden" | "nostalgia"
  "question_text": "2023-24 sezonunda Süper Lig'in gol kralı kimdir?",
  "options": [
    { "key": "A", "text": "Mauro Icardi" },
    { "key": "B", "text": "Edin Dzeko" },
    { "key": "C", "text": "Vincent Aboubakar" },
    { "key": "D", "text": "Alexander Sörloth" }
  ],
  "correct_answer": "A",
  "explanation": "Mauro Icardi, 2023-24 sezonunda 25 golle gol krallığını kazandı.",
  "media": {                          // opsiyonel görsel/video ipucu
    "type": "image",
    "url": "/assets/questions/q_12345.webp"
  },
  "stats": {
    "times_shown": 0,
    "times_correct": 0,
    "avg_answer_time_ms": 0
  },
  "is_active": true,
  "created_at": "2024-01-15T10:00:00Z",
  "updated_at": "2024-01-15T10:00:00Z"
}
```

### 4.2 Kategori Taksonomisi

```
📁 Türkiye Ligleri (league_scope: "turkey")
├── 🏆 Süper Lig
│   ├── Transferler (iç / dış / rekortmen)
│   ├── İstatistikler (gol kralları, asist, kart)
│   ├── Şampiyonluklar & Kupalar
│   ├── Teknik Direktörler
│   ├── Stadyumlar
│   ├── Derbiler & Unutulmaz Maçlar
│   ├── Rekorlar
│   ├── Takım Kadroları (sezona göre)
│   └── Kurallar & Tüzük
├── 🥈 1. Lig (TFF 1. Lig)
│   ├── Yükselen / Düşen Takımlar
│   ├── Play-off Tarihi
│   └── Önemli Oyuncular
├── 🥉 2. Lig
├── 🏅 3. Lig
├── 🏆 Türkiye Kupası
├── 🏆 Süper Kupa
└── 🇹🇷 Milli Takım
    ├── Dünya Kupası Eleme/Turnuva
    ├── Avrupa Şampiyonası
    └── Unutulmaz Milli Maçlar

📁 Avrupa Ligleri (league_scope: "europe") — GELECEK FAZI
├── 🏴󠁧󠁢󠁥󠁮󠁧󠁿 Premier League
├── 🇪🇸 La Liga
├── 🇩🇪 Bundesliga
├── 🇮🇹 Serie A
├── 🇫🇷 Ligue 1
└── 🏆 UEFA (CL, EL, Conference)

📁 Dünya Futbolu (league_scope: "world") — GELECEK FAZI
├── 🌍 Dünya Kupası
├── 🌎 Copa America
└── 🌏 Diğer
```

### 4.3 Zorluk Seviyeleri Detayı

| Seviye | Skor | Açıklama | Örnek |
|--------|------|----------|-------|
| 1 — Kolay | ⭐ | Herkesin bildiği genel bilgi | "Galatasaray'ın renkleri nedir?" |
| 2 — Orta-Kolay | ⭐⭐ | Ligi takip eden bilir | "2023 Süper Lig şampiyonu kim?" |
| 3 — Orta | ⭐⭐⭐ | Düzenli takipçi bilgisi | "X oyuncu hangi takımdan transfer oldu?" |
| 4 — Zor | ⭐⭐⭐⭐ | Detay ve istatistik bilgisi | "2018-19 sezonunda en çok kırmızı kart gören takım?" |
| 5 — Uzman | ⭐⭐⭐⭐⭐ | Nadir bilgi, alt lig detayları | "1997'de TFF 2. Lig play-off finalini kim kazandı?" |

### 4.4 Soru Seçim Algoritması

```
1. Kullanıcının mevcut soru numarasına göre difficulty_target hesapla
2. Kullanıcının geçmişte doğru/yanlış cevapladığı soruları filtrele (tekrar önleme)
3. Kategorik çeşitlilik sağla (son 3 soru aynı kategoriden olmasın)
4. İstatistiksel zorluk dengele (doğru cevaplanma oranı %40-60 arası optimal)
5. Takım bazlı bias uygula (kullanıcının favori takımı %30 daha fazla çıksın)
6. Lig scope'a göre filtrele (aktif ligler)
7. Rastgelelik ekle (weighted random)
```

---

## 5. Teknik Mimari

### 5.1 Genel Mimari Diyagramı

```
┌─────────────────────────────────────────────────────┐
│                   CLIENT (Frontend)                  │
│  ┌───────────┐  ┌───────────┐  ┌─────────────────┐ │
│  │  Web App  │  │  Android  │  │      iOS        │ │
│  │ (React/   │  │  (React   │  │  (React Native  │ │
│  │  Next.js) │  │  Native)  │  │  / Expo)        │ │
│  └─────┬─────┘  └─────┬─────┘  └───────┬─────────┘ │
│        └───────────────┼────────────────┘           │
│                        │ REST API / WebSocket        │
└────────────────────────┼────────────────────────────┘
                         │
┌────────────────────────┼────────────────────────────┐
│                   API GATEWAY                        │
│              (Rate Limiting, Auth)                    │
└────────────────────────┼────────────────────────────┘
                         │
┌────────────────────────┼────────────────────────────┐
│              BACKEND SERVICES                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │
│  │  Auth     │  │  Game    │  │  Matchmaking     │  │
│  │  Service  │  │  Engine  │  │  Service (PvP)   │  │
│  └──────────┘  └──────────┘  └──────────────────┘  │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │
│  │ Question │  │ Economy  │  │  Leaderboard     │  │
│  │ Service  │  │ Service  │  │  Service         │  │
│  └──────────┘  └──────────┘  └──────────────────┘  │
│  ┌──────────┐  ┌──────────┐                         │
│  │ Social   │  │ Analytics│                         │
│  │ Service  │  │ Service  │                         │
│  └──────────┘  └──────────┘                         │
└────────────────────────┼────────────────────────────┘
                         │
┌────────────────────────┼────────────────────────────┐
│                  DATA LAYER                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │
│  │PostgreSQL│  │  Redis   │  │  S3 / CDN        │  │
│  │(Primary) │  │ (Cache)  │  │  (Media Assets)  │  │
│  └──────────┘  └──────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────┘
```

### 5.2 Teknoloji Seçimleri

| Katman | Teknoloji | Gerekçe |
|--------|-----------|---------|
| **Frontend Web** | Next.js 14+ (App Router) | SSR, SEO, PWA desteği |
| **Frontend Mobil** | React Native / Expo | Kod paylaşımı, hızlı geliştirme |
| **Backend** | Node.js + Express/Fastify | JavaScript ekosistemi, performans |
| **Realtime** | Socket.IO / WebSocket | Düello eşleşme, canlı skor |
| **Database** | PostgreSQL | İlişkisel veri, JSON desteği |
| **Cache** | Redis | Leaderboard, session, soru cache |
| **Auth** | JWT + Refresh Token | Stateless, ölçeklenebilir |
| **File Storage** | S3 + CloudFront CDN | Soru görselleri, avatar assets |
| **Analytics** | Custom + Firebase Analytics | Kullanıcı davranış takibi |
| **Push Notification** | Firebase Cloud Messaging | Engagement, hatırlatma |

### 5.3 Veritabanı Şeması (Core Tables)

```sql
-- Kullanıcılar
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(30) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    avatar_url VARCHAR(500),
    avatar_frame VARCHAR(100) DEFAULT 'default',
    favorite_team VARCHAR(100),
    level INTEGER DEFAULT 1,
    xp INTEGER DEFAULT 0,
    coins INTEGER DEFAULT 0,
    gems INTEGER DEFAULT 0,
    energy INTEGER DEFAULT 5,
    energy_last_refill TIMESTAMPTZ DEFAULT NOW(),
    league_tier VARCHAR(20) DEFAULT 'bronze',
    elo_rating INTEGER DEFAULT 1000,
    streak_days INTEGER DEFAULT 0,
    last_daily_claim DATE,
    total_questions_answered INTEGER DEFAULT 0,
    total_correct_answers INTEGER DEFAULT 0,
    settings JSONB DEFAULT '{}',
    is_premium BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Soru Havuzu
CREATE TABLE questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    league_scope VARCHAR(20) NOT NULL DEFAULT 'turkey',
    league VARCHAR(50) NOT NULL,
    category VARCHAR(50) NOT NULL,
    sub_category VARCHAR(50),
    difficulty SMALLINT NOT NULL CHECK (difficulty BETWEEN 1 AND 5),
    season_range VARCHAR(50),
    team_tags TEXT[],
    era_tag VARCHAR(20),
    question_text TEXT NOT NULL,
    options JSONB NOT NULL,
    correct_answer CHAR(1) NOT NULL,
    explanation TEXT,
    media JSONB,
    times_shown INTEGER DEFAULT 0,
    times_correct INTEGER DEFAULT 0,
    avg_answer_time_ms INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    reported_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Oyun Oturumları
CREATE TABLE game_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    mode VARCHAR(30) NOT NULL, -- 'millionaire', 'quick', 'duel', 'daily'
    league_scope VARCHAR(20) DEFAULT 'turkey',
    started_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    score INTEGER DEFAULT 0,
    questions_answered INTEGER DEFAULT 0,
    correct_answers INTEGER DEFAULT 0,
    jokers_used JSONB DEFAULT '[]',
    safe_point_reached INTEGER DEFAULT 0,
    result VARCHAR(20), -- 'completed', 'failed', 'timeout', 'quit'
    xp_earned INTEGER DEFAULT 0,
    coins_earned INTEGER DEFAULT 0
);

-- Soru Cevap Geçmişi
CREATE TABLE question_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES game_sessions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    question_id UUID REFERENCES questions(id),
    user_answer CHAR(1),
    is_correct BOOLEAN NOT NULL,
    answer_time_ms INTEGER,
    joker_used VARCHAR(30),
    question_number SMALLINT,
    answered_at TIMESTAMPTZ DEFAULT NOW()
);

-- Düello Eşleşmeleri
CREATE TABLE duels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player1_id UUID REFERENCES users(id),
    player2_id UUID REFERENCES users(id),
    player1_score INTEGER DEFAULT 0,
    player2_score INTEGER DEFAULT 0,
    winner_id UUID REFERENCES users(id),
    questions JSONB NOT NULL,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'active', 'completed', 'cancelled'
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Liderlik Tabloları
CREATE TABLE leaderboards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    period VARCHAR(20) NOT NULL, -- 'daily', 'weekly', 'monthly', 'alltime'
    league_scope VARCHAR(20) DEFAULT 'turkey',
    score BIGINT DEFAULT 0,
    rank INTEGER,
    period_start DATE NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, period, period_start, league_scope)
);

-- Mağaza Öğeleri
CREATE TABLE shop_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_type VARCHAR(30) NOT NULL, -- 'theme', 'avatar', 'frame', 'joker_pack', 'energy_pack'
    name VARCHAR(100) NOT NULL,
    description TEXT,
    preview_url VARCHAR(500),
    price_coins INTEGER,
    price_gems INTEGER,
    league_scope VARCHAR(20), -- NULL = evrensel
    is_premium BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Kullanıcı Envanteri
CREATE TABLE user_inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    item_id UUID REFERENCES shop_items(id),
    purchased_at TIMESTAMPTZ DEFAULT NOW(),
    is_equipped BOOLEAN DEFAULT FALSE,
    UNIQUE(user_id, item_id)
);

-- Başarımlar / Achievement
CREATE TABLE achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon_url VARCHAR(500),
    reward_coins INTEGER DEFAULT 0,
    reward_gems INTEGER DEFAULT 0,
    reward_xp INTEGER DEFAULT 0,
    condition JSONB NOT NULL, -- {"type": "total_correct", "value": 100}
    league_scope VARCHAR(20), -- NULL = evrensel
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Kullanıcı Başarımları
CREATE TABLE user_achievements (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    achievement_id UUID REFERENCES achievements(id),
    progress INTEGER DEFAULT 0,
    unlocked_at TIMESTAMPTZ,
    PRIMARY KEY (user_id, achievement_id)
);

-- Arkadaşlık Sistemi
CREATE TABLE friendships (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    friend_id UUID REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'accepted', 'blocked'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, friend_id)
);

-- Lig Scope Tanımları (genişletilebilirlik)
CREATE TABLE league_scopes (
    code VARCHAR(20) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    icon_url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lig Tanımları
CREATE TABLE leagues (
    code VARCHAR(50) PRIMARY KEY,
    scope_code VARCHAR(20) REFERENCES league_scopes(code),
    name VARCHAR(100) NOT NULL,
    country VARCHAR(50),
    tier SMALLINT DEFAULT 1,
    icon_url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0
);
```

### 5.4 Genişletilebilirlik Mimarisi (Multi-League Support)

> [!IMPORTANT]
> Tüm veri modelleri ve servisler `league_scope` ve `league` alanları ile filtrelenir. Yeni bir lig eklemek için:
> 1. `league_scopes` tablosuna yeni scope ekle (ör: "europe")
> 2. `leagues` tablosuna lig tanımlarını ekle
> 3. `questions` tablosuna ilgili scope ve lig ile soru ekle
> 4. Frontend'de lig seçici UI'ı otomatik güncellenir

**Kod yapısında scope bazlı izolasyon:**

```
src/
├── modules/
│   ├── game/
│   │   ├── services/
│   │   │   ├── question.service.ts      // league_scope parametresi alır
│   │   │   ├── session.service.ts
│   │   │   └── matchmaking.service.ts
│   │   ├── strategies/
│   │   │   ├── difficulty.strategy.ts   // scope'a göre zorluk kalibrasyonu
│   │   │   └── selection.strategy.ts
│   │   └── constants/
│   │       └── league-config.ts         // scope bazlı konfigürasyon
│   ├── economy/
│   ├── social/
│   ├── auth/
│   └── leaderboard/
├── shared/
│   ├── types/
│   │   └── league.types.ts              // LeagueScope, League enum/types
│   ├── utils/
│   └── middleware/
```

---

## 6. UI/UX Tasarım Sistemi

### 6.1 Tasarım Dili

**Ana Konsept:** "Stadium Night" — Stadyum atmosferi, ışıklar, yeşil çim renkleri ve premium spor estetiği.

**Renk Paleti:**

```css
:root {
  /* Primary — Stadyum Yeşili */
  --color-primary-50:  #e8f5e9;
  --color-primary-100: #c8e6c9;
  --color-primary-500: #2e7d32;
  --color-primary-700: #1b5e20;
  --color-primary-900: #0a3d0a;

  /* Secondary — Altın Sarısı (Ödül/Coin) */
  --color-secondary-400: #ffd54f;
  --color-secondary-500: #ffc107;
  --color-secondary-700: #ff8f00;

  /* Accent — Turuncu (Enerji/CTA) */
  --color-accent-500: #ff6d00;
  --color-accent-600: #e65100;

  /* Dark Tema (Ana Tema) */
  --bg-primary:   #0d1117;
  --bg-secondary: #161b22;
  --bg-card:      #1c2333;
  --bg-elevated:  #242d3d;

  /* Metin */
  --text-primary:   #e6edf3;
  --text-secondary: #8b949e;
  --text-muted:     #484f58;

  /* Durum Renkleri */
  --color-success: #2ea043;
  --color-danger:  #f85149;
  --color-warning: #d29922;
  --color-info:    #58a6ff;

  /* Zorluk Renkleri */
  --difficulty-easy:   #2ea043;
  --difficulty-medium: #d29922;
  --difficulty-hard:   #f85149;
  --difficulty-expert: #bc4dff;
  --difficulty-legend: #ff6d00;
}
```

**Tipografi:**
```css
/* Google Fonts: Inter + Outfit */
--font-primary: 'Inter', system-ui, sans-serif;
--font-display: 'Outfit', 'Inter', sans-serif;
--font-mono: 'JetBrains Mono', monospace;
```

### 6.2 Animasyon Sistemi

```css
/* Mikro-animasyonlar */
--transition-fast:   150ms cubic-bezier(0.4, 0, 0.2, 1);
--transition-normal: 250ms cubic-bezier(0.4, 0, 0.2, 1);
--transition-slow:   400ms cubic-bezier(0.4, 0, 0.2, 1);
--transition-bounce: 500ms cubic-bezier(0.68, -0.55, 0.265, 1.55);

/* Animasyon Listesi */
- Doğru cevap: Yeşil pulse + confetti parçacık efekti
- Yanlış cevap: Kırmızı shake + ekran titremesi
- Puan artışı: Sayı sayma animasyonu (counting up)
- Seviye atlama: Tam ekran kutlama animasyonu
- Joker kullanımı: İlgili jokere özel animasyon
- Süre azalması: Son 5 saniyede nabız efekti
- Streak: Ateş ikonu büyüme animasyonu
- Coin kazanma: Düşen coin animasyonu
```

### 6.3 Glassmorphism & Premium Bileşenler

```css
.glass-card {
  background: rgba(28, 35, 51, 0.7);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.premium-gradient {
  background: linear-gradient(135deg, #1b5e20 0%, #0d1117 50%, #ff8f00 100%);
}

.glow-effect {
  box-shadow: 0 0 20px rgba(46, 125, 50, 0.4),
              0 0 60px rgba(46, 125, 50, 0.1);
}
```

### 6.4 Ekran Akışı (Screen Flow)

```
┌──────────┐     ┌──────────┐     ┌──────────────┐
│  Splash  │────▶│  Login / │────▶│   Ana Sayfa   │
│  Screen  │     │  Register│     │  (Dashboard)  │
└──────────┘     └──────────┘     └──────┬───────┘
                                         │
                    ┌────────────────────┬┼────────────────────┐
                    │                    ││                    │
              ┌─────▼─────┐      ┌──────▼▼─────┐     ┌──────▼──────┐
              │   Oyun    │      │  Liderlik   │     │   Profil    │
              │   Modları │      │   Tablosu   │     │   & Ayarlar │
              └─────┬─────┘      └─────────────┘     └─────────────┘
                    │
     ┌──────────────┼──────────────┬──────────────┐
     │              │              │              │
┌────▼────┐  ┌─────▼─────┐ ┌─────▼─────┐ ┌─────▼─────┐
│Milyoner │  │ Hızlı Maç │ │  Düello   │ │  Günlük   │
│  Modu   │  │           │ │   (PvP)   │ │ Challenge │
└────┬────┘  └───────────┘ └───────────┘ └───────────┘
     │
┌────▼─────────────────────┐
│    Soru Ekranı            │
│  ┌─────────────────────┐ │
│  │  Soru Metni          │ │
│  │  [Görsel - opsiyonel]│ │
│  ├─────────────────────┤ │
│  │  ⏱ Süre Çubuğu      │ │
│  ├─────────────────────┤ │
│  │  [A] Şık 1          │ │
│  │  [B] Şık 2          │ │
│  │  [C] Şık 3          │ │
│  │  [D] Şık 4          │ │
│  ├─────────────────────┤ │
│  │  🃏 Joker Bar        │ │
│  └─────────────────────┘ │
└──────────────────────────┘
```

### 6.5 Responsive Breakpoint'ler

```css
--bp-mobile:  375px;   /* Temel mobil */
--bp-tablet:  768px;   /* Tablet */
--bp-desktop: 1024px;  /* Masaüstü */
--bp-wide:    1440px;  /* Geniş ekran */

/* Mobile-first yaklaşım */
/* Oyun ekranları max-width: 480px olarak merkezlenir (mobil oyun hissi) */
```

---

## 7. Monetizasyon Stratejisi

### 7.1 Gelir Modelleri

```
┌─────────────────────────────────────────────────────┐
│              GELİR KAYNAKLARI                        │
├─────────────────────────────────────────────────────┤
│                                                      │
│  1. REKLAMLAR (%40-50 tahmini gelir)                │
│     ├── Rewarded Video: Joker/enerji karşılığı      │
│     ├── Interstitial: Her 3 turda bir               │
│     ├── Banner: Lobi ve sonuç ekranlarında          │
│     └── Native: Leaderboard arasında                │
│                                                      │
│  2. IN-APP PURCHASE (%30-40 tahmini gelir)          │
│     ├── Gem Paketleri: 50/200/500/1500 gem          │
│     ├── Starter Pack: 1 kez alınabilir, indirimli   │
│     ├── Season Pass: Aylık premium erişim           │
│     ├── Reklam Kaldırma: Kalıcı veya geçici        │
│     └── Özel Tema Paketleri                         │
│                                                      │
│  3. BATTLE PASS / SEASON PASS (%10-15)              │
│     ├── Ücretsiz Track: Temel ödüller               │
│     └── Premium Track: Ekstra ödüller, özel temalar │
│                                                      │
│  4. SPONSORLUK & PARTNERSHIP (%5-10)                │
│     ├── Takım sponsorlukları                        │
│     ├── Marka temalı sorular                        │
│     └── Turnuva sponsorlukları                      │
│                                                      │
└─────────────────────────────────────────────────────┘
```

### 7.2 IAP Fiyatlandırma Tablosu

| Paket | İçerik | Fiyat (TRY) |
|-------|--------|-------------|
| Küçük Gem | 50 gem | ₺29.99 |
| Orta Gem | 200 gem (+%10 bonus) | ₺99.99 |
| Büyük Gem | 500 gem (+%20 bonus) | ₺199.99 |
| Mega Gem | 1500 gem (+%30 bonus) | ₺499.99 |
| Başlangıç Paketi | 100 gem + 5000 coin + 3x her joker | ₺49.99 |
| Season Pass (Aylık) | Reklamsız + günlük 50 gem + özel temalar | ₺79.99/ay |
| Reklam Kaldır (Kalıcı) | Tüm reklamlar kaldırılır | ₺299.99 |

### 7.3 Reklam Politikası

- **Rewarded Video:** Kullanıcı isteğiyle, net değer teklifi (enerji, coin, joker)
- **Interstitial:** Oyun akışını bozmayacak doğal geçiş noktalarında (tur sonu)
- **Frekans Limiti:** Günde max 10 interstitial, 20 rewarded
- **Premium kullanıcılar:** Sıfır reklam
- **İlk oturum:** Reklam gösterilmez (ilk izlenim korunur)

---

## 8. Sosyal Özellikler

### 8.1 Arkadaş Sistemi
- Kullanıcı adı ile arkadaş ekleme
- Arkadaş listesi ve online durumu
- Arkadaşa düello daveti gönderme
- Arkadaş sıralaması (mini leaderboard)

### 8.2 Paylaşım
- Skor kartı paylaşımı (Instagram story formatı)
- "Bu soruyu bilir misin?" arkadaşa soru gönderme
- Achievement paylaşımı
- Haftalık istatistik özeti paylaşımı

### 8.3 Bildirimler
- Günlük hatırlatma (streak koruma)
- Düello daveti
- Arkadaş isteği
- Sezon sonu ödül bildirimi
- Yeni soru paketi eklendi bildirimi

---

## 9. Achievement (Başarım) Sistemi

### 9.1 Örnek Achievement'lar

| Başarım | Koşul | Ödül |
|---------|-------|------|
| **İlk Adım** | İlk soruyu cevapla | 50 coin |
| **Müthiş 10** | 10 doğru üst üste | 200 coin |
| **Milyoner** | İlk kez 1.000.000'a ulaş | 500 coin + özel avatar |
| **Bilgi Kralı** | 1000 doğru cevap | 1000 coin + rozet |
| **Streak Ustası** | 30 gün streak | Özel frame |
| **Düello Şampiyonu** | 50 düello kazan | 500 coin |
| **Alt Lig Uzmanı** | 100 alt lig sorusu doğru | Özel tema |
| **Nostalji Avcısı** | 50 nostalji sorusu doğru | Retro tema |
| **Hız Şeytanı** | 5sn altında 10 doğru | 300 coin |
| **Sosyal Kelebek** | 10 arkadaş ekle | 200 coin |

---

## 10. Admin Panel & İçerik Yönetimi

### 10.1 CMS (Content Management System)
- Soru ekleme/düzenleme/silme arayüzü
- Toplu soru yükleme (CSV/JSON import)
- Soru istatistiklerini görüntüleme
- Raporlanan soruları inceleme
- Zorluk kalibrasyonu (otomatik + manuel)

### 10.2 Analytics Dashboard
- DAU / MAU / Retention metrikleri
- Gelir raporları (reklam + IAP)
- Soru başarı oranları
- Kullanıcı segmentasyonu
- A/B test sonuçları
- Churn prediction

### 10.3 Moderasyon
- Kullanıcı raporlarını yönetme
- Uygunsuz kullanıcı adı filtreleme
- Ban/mute yönetimi

---

## 11. Geliştirme Yol Haritası

### Faz 1 — MVP (8-10 hafta)
- [x] Proje yapısı kurulumu (Next.js 16, Tailwind v4, TypeScript, Supabase, Zustand)
- [x] Design system & UI bileşenleri (Button, Card, Badge, ProgressBar, Avatar)
- [x] Tip tanımları & oyun sabitleri (types, constants, utilities)
- [x] Supabase client/server/middleware kurulumu
- [x] Zustand store'ları (game-store, user-store)
- [x] Custom hook'lar (useTimer, useSound)
- [x] Kullanıcı kayıt/giriş (email + sosyal)
- [x] Veritabanı şeması (13 tablo, RLS, triggers, seed data)
- [x] Milyoner modu (tam akış)
- [x] Temel soru havuzu (500+ Türkiye ligi sorusu)
- [x] Joker sistemi (3 temel joker)
- [x] XP & seviye sistemi
- [x] Coin ekonomisi
- [x] Basit leaderboard
- [x] Günlük giriş ödülü
- [x] Temel profil sayfası
- [x] PWA desteği

### Faz 2 — Sosyal & Rekabet (6-8 hafta)
- [x] Düello modu (PvP)
- [x] Hızlı Maç modu
- [x] Arkadaş sistemi
- [x] Lig yarışması (seasonal)
- [x] Paylaşım özellikleri
- [x] Push notification
- [x] Achievement sistemi
- [x] Streak sistemi genişletme

### Faz 3 — Monetizasyon & Polish (4-6 hafta)
- [ ] Reklam entegrasyonu (Rewarded + Interstitial)
- [ ] IAP (Gem paketleri, Season Pass)
- [x] Tema mağazası
- [ ] Gelişmiş animasyonlar & efektler
- [x] Admin panel & CMS
- [x] Analytics entegrasyonu

### Faz 4 — Genişleme (Sürekli)
- [ ] Avrupa ligleri ekleme (Premier League, La Liga, vb.)
- [ ] Dünya Kupası özel etkinlikleri
- [ ] Turnuva modu
- [ ] Takım modu genişletme
- [ ] React Native mobil uygulama
- [ ] Yapay zeka destekli soru üretimi
- [ ] Sesli soru modu
- [ ] Canlı turnuvalar

---

## 12. Performans & Güvenlik Gereksinimleri

### 12.1 Performans
- Sayfa yükleme süresi: < 2 saniye (LCP)
- API yanıt süresi: < 200ms (p95)
- Animasyon FPS: 60fps minimum
- Offline desteği: Son oyun state'i local cache
- Bundle boyutu: < 500KB (initial load)

### 12.2 Güvenlik
- Rate limiting: API endpoint'leri korumalı
- Anti-cheat: Sunucu tarafında cevap doğrulama
- Soru şifreleme: Client'a tüm sorular aynı anda gönderilmez
- Session güvenliği: JWT + Refresh token rotasyonu
- Input validation: Tüm kullanıcı girdileri sanitize
- CORS politikası: Sadece onaylı origin'ler

### 12.3 Anti-Cheat Mekanizmaları
- Cevap süresi kontrolü (< 500ms şüpheli)
- Aynı IP'den çoklu hesap tespiti
- Anormal doğru cevap oranı tespiti
- Client-server zaman senkronizasyonu
- Soru sırası ve şıklar sunucuda karıştırılır

---

## Kullanıcı İnceleme Gereken Noktalar

> [!WARNING]
> **Platform Kararı:** İlk aşamada sadece Web (PWA) mı yoksa doğrudan React Native ile mobil de mi başlanmalı? PWA ile başlamak MVP süresini kısaltır.

> [!IMPORTANT]
> **Soru İçeriği:** Başlangıç soru havuzu için 500+ soru gerekiyor. Manuel mi oluşturulacak, yapay zeka destekli mi üretilecek, yoksa topluluk katkılı mı?

> [!IMPORTANT]
> **Backend Hosting:** Vercel (serverless) mı yoksa dedicated sunucu mu (VPS/AWS)? WebSocket gerektiren düello modu dedicated sunucu lehine bir argüman.

---

## Doğrulama Planı

### Otomatik Testler
- Unit test: Oyun mekanikleri, puan hesaplama, soru seçim algoritması
- Integration test: API endpoint'leri, veritabanı işlemleri
- E2E test: Tam oyun akışı, kullanıcı kayıt → soru cevaplama → puan kazanma

### Manuel Doğrulama
- Tüm ekranların mobil responsive kontrolü
- Animasyon performans testi (düşük performanslı cihazlar)
- Reklam akışı testi
- IAP sandbox testi
- Multi-browser uyumluluk (Chrome, Safari, Firefox)
