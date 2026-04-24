# Flutter Mobile Migration Status

## Tamamlananlar

- [x] Flutter mobil proje iskeleti kuruldu
- [x] Android/iOS bundle ve app kimlikleri güncellendi
- [x] Mobil app shell ve router kuruldu
- [x] Supabase auth entegrasyonu yapıldı
- [x] Login / register / sign out akışı eklendi
- [x] Profile hydration `/api/me` ile bağlandı
- [x] Home dashboard Flutter tarafında kuruldu
- [x] Millionaire modu Flutter'a taşındı
- [x] Millionaire joker / safe point / finalize akışı bağlandı
- [x] Quick Play modu Flutter'a taşındı
- [x] Daily Challenge modu Flutter'a taşındı
- [x] Leaderboard ekranı Flutter'a taşındı
- [x] League ekranı Flutter'a taşındı
- [x] Achievements ekranı Flutter'a taşındı
- [x] Social ekranı Flutter'a taşındı
- [x] Duel ekranı Flutter'a taşındı
- [x] Shop / Themes ekranı Flutter'a taşındı
- [x] Shop utility purchase akışı bağlandı
- [x] Frame desteği eklendi
- [x] Tournament ekranı Flutter'a taşındı
- [x] Ana kullanıcı-facing web feature setinin büyük kısmı Flutter tarafına geçirildi
- [x] Mobil auth için bearer-aware backend helper kuruldu
- [x] Millionaire / Quick / Daily / Duel / Tournament route'ları mobil auth ile uyumlu hale getirildi
- [x] Shop / Social / Achievement / Ads / Notification subscription route'larının önemli kısmı mobil auth ile uyumlu hale getirildi
- [x] Android emulator üzerinde Flutter app çalıştırıldı
- [x] `flutter analyze` temiz geçti

## Pushlanan commitler

- [x] `511006c feat: connect Flutter mobile auth and millionaire flow`
- [x] `f371788 chore: prepare flutter mobile release configuration`
- [x] `19cd350 feat: add quick daily and leaderboard mobile parity`
- [x] `cea824f feat: add league achievement and social mobile surfaces`
- [x] `679776c feat: add duel and shop mobile parity`
- [x] `36e8d2e feat: add tournament mobile parity`
- [x] `73011a4 feat: polish shop and social mobile parity`
- [x] `ce61234 chore: finish mobile parity auth routes`
- [x] `f7b407a style: polish core Flutter presentation surfaces`
- [x] `986670e style: polish high-traffic Flutter screens`
- [x] `cae45e9 chore: apply final mobile parity fixes`
- [x] `921c4ec chore: finish remaining mobile auth compatibility`

## Hâlâ To Do olanlar

- [ ] Manuel QA ile ekran ekran parity kontrolü
- [ ] Gerçek cihazlarda iOS ve Android smoke test
- [ ] Store submission için signing / keystore / certificates ayarları
- [ ] App icon / splash / store metadata son haliyle finalize etmek
- [ ] Web ile birebir görsel fark kalan ekranlarda micro-polish
- [ ] Kullanıcı testlerinden çıkacak bugfix turu
- [ ] Release / production build doğrulaması

## Notlar

- Web lint tarafında yeni error yok; mevcut eski warning'ler duruyor.
- Kod tarafında büyük migration işi tamamlandı; bundan sonrası daha çok QA, polish ve release hazırlığı.
- Mobil backend auth uyumu büyük ölçüde bearer token üzerinden tamamlandı.
