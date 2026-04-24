# PWA vs Flutter Fark Özeti

Bu dosya mevcut duruma göre PWA/web uygulaması ile Flutter mobil uygulaması arasındaki farkları özetler.

## İkisinde de var

- Auth / login / register
- Profil ekranı
- Home / dashboard mantığı
- Millionaire modu
- Quick Play modu
- Daily Challenge modu
- Duel yüzeyi
- Tournament yüzeyi
- Leaderboard
- League görünümü
- Achievements görünümü
- Social / arkadaş / düello daveti yüzeyi
- Shop / themes / utility purchase yüzeyi
- Frame yüzeyi

## PWA'de var, Flutter'da temel karşılığı var ama birebir değil

- Home dashboard bilgi yoğunluğu ve görsel detaylar
- Shop ekranındaki premium / koleksiyon / zengin kozmetik sunumu
- Social ekranındaki ilişki durumları ve detaylı aksiyon akışı
- Duel ekranındaki geçişler, animasyonlar ve round hissi
- Tournament ekranındaki canlı akış, lobby hissi ve detay kartları
- League ekranındaki sıralama sunumu ve sezon özeti detayları
- Leaderboard ekranındaki filtre deneyimi ve podium sunumu
- Profile ekranındaki bazı sunum detayları

## PWA'de güçlü / detaylı, Flutter'da daha sade veya yaklaşık olan alanlar

- İnce animasyonlar ve motion detayları
- Share / paylaşım yüzeyleri
- Bazı overlay / reward presentation detayları
- Görsel mikro detaylar: spacing, badge davranışları, kart yoğunluğu
- Bazı state mesajları ve empty/error durumlarının zenginliği
- Bazı store / premium / collection alt deneyimleri

## PWA'de olup Flutter'da henüz tam birebir teyit edilmemiş alanlar

- Push notification abonelik akışının uçtan uca mobil UI tarafı
- IAP doğrulama ve premium claim akışlarının tam kullanıcı deneyimi
- Reklam interstitial / reward yüzeylerinin tam mobil UX karşılığı
- Bazı admin / yönetim ekranları
- Web'e özgü paylaşım / PWA davranışları

## Flutter'da olup PWA'den farklı çalışan noktalar

- Flutter mobil navigasyon yapısı doğal olarak mobil-first
- Bazı ekranlar web birebir kopya yerine mobil uyarlanmış sürüm
- Bazı veri sunumları daha kompakt / daha az yoğun
- Bazı placeholder rakip / mock akışlar mobilde sadeleştirilmiş

## Flutter tarafında hâlâ yapılması iyi olacak şeyler

- [ ] Ekran ekran görsel micro-polish
- [ ] Shop / frames / premium görünümünü web'e daha da yaklaştırma
- [ ] Social relation state ve invite yönetimini daha da detaylandırma
- [ ] Duel / tournament motion ve sonuç ekranlarını daha zenginleştirme
- [ ] Push / IAP / ad UX tarafını gerçek cihaz testine göre düzeltme
- [ ] Release signing ve store submission hazırlıkları

## Kısa yorum

Feature coverage açısından Flutter tarafı artık çok yüksek seviyede.
En büyük fark artık "özellik yok" değil, daha çok "özellik var ama web kadar rafine / birebir değil" seviyesinde.
