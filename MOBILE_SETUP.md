# 📱 Mobil Cihazlarda Çalıştırma Rehberi

## 🚀 Hızlı Başlangıç

### 1. Gereksinimler
- **iPhone**: Expo Go uygulaması (App Store'dan indirin)
- **Android**: Expo Go uygulaması (Google Play Store'dan indirin)
- **Bilgisayar**: Node.js ve Expo CLI yüklü olmalı

### 2. Backend Server'ı Başlatın
```bash
# Backend projenizde (API server)
dotnet run
# veya
npm start
```

### 3. Frontend'i Başlatın
```bash
# Bu projede
npx expo start
```

### 4. QR Kodu Okutun
- Terminal'de görünen QR kodu telefonunuzla okutun
- Expo Go uygulaması otomatik olarak açılacak

## 🔧 Konfigürasyon

### IP Adresi Ayarları
- **Bilgisayar IP**: `192.168.1.108` (otomatik algılandı)
- **Backend Port**: `5118` (HTTP)
- **Frontend Port**: `8082` (Expo)

### Platform Bazlı Ayarlar
- **iOS Simulator**: `localhost:5118`
- **Android Emulator**: `10.0.2.2:5118`
- **Gerçek Cihazlar**: `192.168.1.108:5118`

## 📋 Sorun Giderme

### QR Kod Çalışmıyor
1. **Aynı WiFi ağında olduğunuzdan emin olun**
2. **Firewall'ı kontrol edin** (Windows Defender)
3. **Backend server'ın çalıştığından emin olun**

### API Bağlantı Hatası
1. **Backend server'ı kontrol edin**: `http://192.168.1.108:5118`
2. **IP adresini güncelleyin**: `src/shared/config/env.ts`
3. **Network ayarlarını kontrol edin**

### Expo Go Hatası
1. **Uygulamayı yeniden başlatın**
2. **Cache'i temizleyin**: Expo Go > Settings > Clear Cache
3. **QR kodu yeniden okutun**

## 🔄 Geliştirme Modu

### Hot Reload
- Kod değişiklikleriniz otomatik olarak cihazda görünür
- Backend değişiklikleri için uygulamayı yeniden başlatın

### Debug Modu
- **iOS**: Cmd+D (Simulator'da)
- **Android**: Cmd+M (Emulator'da)
- **Gerçek Cihaz**: Cihazı sallayın

## 📱 Test Senaryoları

### iPhone Test
1. ✅ QR kod okutma
2. ✅ Login/Register
3. ✅ API bağlantıları
4. ✅ Kamera erişimi
5. ✅ Fotoğraf yükleme

### Android Test
1. ✅ QR kod okutma
2. ✅ Login/Register
3. ✅ API bağlantıları
4. ✅ Kamera erişimi
5. ✅ Fotoğraf yükleme

## 🛠️ Gelişmiş Ayarlar

### Manuel IP Güncelleme
```typescript
// src/shared/config/env.ts
const HOST_REAL_DEVICE = 'YENİ_IP_ADRESİ';
```

### Port Değiştirme
```bash
# Farklı port ile başlatma
npx expo start --port 8083
```

### Tunnel Modu (NAT/Firewall sorunları için)
```bash
# Tunnel modu ile başlatma
npx expo start --tunnel
```

## 📞 Destek

Sorun yaşarsanız:
1. **Terminal loglarını kontrol edin**
2. **Expo Go loglarını kontrol edin**
3. **Network bağlantısını test edin**
4. **Backend server durumunu kontrol edin**

---
**Not**: Bu rehber `192.168.1.108` IP adresi için hazırlanmıştır. Farklı bir IP kullanıyorsanız `src/shared/config/env.ts` dosyasını güncelleyin.
