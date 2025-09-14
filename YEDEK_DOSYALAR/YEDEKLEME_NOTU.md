# 📁 YEDEKLEME NOTU

**Tarih:** 14 Eylül 2025  
**İşlem:** Türkçe İsimlendirme Düzenlemesi  
**Amaç:** Benzer isimli dosyaları düzenleme ve gereksiz duplikasyonları temizleme

## 🔄 YEDEKLENEN DOSYALAR

### 1. HarcamaEkleEkran.js → SİLİNDİ
- **Yedek:** `HarcamaEkleEkran_YEDEK.js`
- **Sebep:** HarcamaEkle.js ile aynı işlev, gereksiz duplikasyon
- **İçerik:** RNPickerSelect kullanarak harcama ekleme formu
- **Kategoriler:** Market, Diğer, Yemek, Borç, Elektrik, Su, Doğalgaz

### 2. KayitOlEkran.js → KayitOlForm.js
- **Yedek:** `KayitOlEkran_YEDEK.js`
- **Sebep:** Daha net isimlendirme
- **İçerik:** Kayıt olma formu (Ad Soyad, Email, Şifre, Şifre Tekrar)
- **Özellikler:** Doğrulama kodu gönderme, form validasyonu

### 3. Alacaklar.js → AlacaklarListesi.js
- **Yedek:** `Alacaklar_YEDEK.js`
- **Sebep:** Alacaklarim.js ile karışmaması için
- **İçerik:** Alacaklar listesi, toplam alacak gösterimi
- **Özellikler:** Ev arkadaşları ile borç/alacak detayları

## 📋 YAPILAN DEĞİŞİKLİKLER

### ✅ Tamamlanan İşlemler:
1. **HarcamaEkleEkran.js** → Silindi (gereksiz duplikasyon)
2. **KayitOlEkran.js** → **KayitOlForm.js** (daha net isim)
3. **Alacaklar.js** → **AlacaklarListesi.js** (karışıklığı önleme)

### 🔧 Güncellenen Referanslar:
- Navigation dosyalarındaki import yolları güncellendi
- Diğer dosyalardaki referanslar kontrol edildi

## 🚨 GERİ YÜKLEME TALİMATLARI

Eğer yanlışlıkla silinen dosya varsa:

### HarcamaEkleEkran.js'i geri yükle:
```bash
cp YEDEK_DOSYALAR/HarcamaEkleEkran_YEDEK.js src/screens/HarcamaEkleEkran.js
```

### KayitOlEkran.js'i geri yükle:
```bash
cp YEDEK_DOSYALAR/KayitOlEkran_YEDEK.js src/screens/KayitOlEkran.js
```

### Alacaklar.js'i geri yükle:
```bash
cp YEDEK_DOSYALAR/Alacaklar_YEDEK.js src/screens/Alacaklar.js
```

## 📝 NOTLAR

- Tüm yedek dosyalar `YEDEK_DOSYALAR/` klasöründe saklanmaktadır
- Orijinal dosya içerikleri korunmuştur
- Navigation referansları güncellenmiştir
- Linter hataları kontrol edilmiştir

## 🎯 SONUÇ

- **HarcamaEkle.js** → Market, Yemek, Diğer (basit harcamalar)
- **DuzenliGiderEkle.js** → Kira, Elektrik, Su (düzenli giderler)
- **KayitOlForm.js** → Kayıt olma formu
- **AlacaklarListesi.js** → Alacaklar listesi
- **Alacaklarim.js** → Kişisel alacaklar

Artık dosya isimleri daha net ve karışıklık yaratmıyor! 🚀
