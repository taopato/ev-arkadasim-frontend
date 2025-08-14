# Ev Arkadaşım API Bağlantı Rehberi

## 🚀 Backend API Bağlantısı

Bu uygulama artık GitHub'daki Clean Architecture backend API'sine bağlanacak şekilde yapılandırılmıştır.

### 📍 API Bilgileri

- **Base URL**: `http://localhost:7118/api`
- **Swagger UI**: `https://localhost:7118/swagger/index.html`
- **Backend Repository**: [EvArkadasimCleanArchitecture](https://github.com/taopato/EvArkadasimCleanArchitecture/tree/DuzeltilmisHaller)

### 🔧 Yapılandırma Değişiklikleri

1. **HTTP Desteği**: API HTTP üzerinden çalışıyor (React Native uyumluluğu için)
2. **Mock Data Kapatıldı**: Gerçek API kullanılıyor
3. **React Native Uyumluluğu**: Node.js modülleri kaldırıldı
4. **Gelişmiş Hata Yönetimi**: Detaylı hata logları ve kullanıcı dostu mesajlar

### 🚀 Uygulama Durumu

Uygulama artık tamamen gerçek API'ye bağlı:

- **Mock Data**: Kapatıldı
- **Gerçek API**: Aktif
- **Tüm Endpoint'ler**: Çalışır durumda
- **Test Ekranları**: Kaldırıldı

### 📋 Kullanım Adımları

1. **Backend'i Başlatın**:
   ```bash
   # Backend projesini klonlayın
   git clone https://github.com/taopato/EvArkadasimCleanArchitecture.git
   cd EvArkadasimCleanArchitecture
   
   # DuzeltilmisHaller branch'ine geçin
   git checkout DuzeltilmisHaller
   
   # Projeyi çalıştırın
   dotnet run
   ```

2. **Swagger UI'ı Kontrol Edin**:
   - Tarayıcıda `https://localhost:7118/swagger/index.html` adresini açın
   - API endpoint'lerinin çalıştığını doğrulayın

3. **Uygulamayı Kullanın**:
   - Uygulamayı başlatın
   - Tüm özellikler gerçek API'ye bağlı
   - Harcama ekleme, ev yönetimi, ödemeler çalışır durumda

### 🔍 Endpoint'ler

API aşağıdaki endpoint'leri destekler:

#### Auth Endpoints
- `POST /Auth/Login` - Kullanıcı girişi
- `POST /Auth/SendVerificationCode` - Doğrulama kodu gönder
- `POST /Auth/VerifyCodeAndRegister` - Kodu doğrula ve kayıt ol
- `POST /Auth/VerifyCodeForReset` - Şifre sıfırlama için kodu doğrula
- `POST /Auth/ResetPassword` - Şifre sıfırla

#### Houses Endpoints
- `GET /Houses` - Tüm evleri getir
- `POST /Houses` - Ev oluştur
- `GET /Houses/{id}` - Ev detayını getir
- `POST /Houses/{id}/members` - Üye ekle
- `DELETE /Houses/{id}/members/{userId}` - Üye çıkar
- `POST /Houses/{houseId}/invitations` - Davet gönder
- `POST /Houses/AcceptInvitation` - Daveti kabul et

#### Expenses Endpoints
- `GET /Expenses` - Tüm harcamaları getir
- `POST /Expenses` - Harcama oluştur
- `GET /Expenses/GetExpenses/{houseId}` - Ev harcamalarını getir
- `GET /Expenses/GetExpense/{expenseId}` - Harcama detayını getir

#### Payments Endpoints
- `POST /Payments/CreatePayment` - Ödeme oluştur
- `GET /Payments/GetPayments/{houseId}` - Evdeki ödemeleri getir
- `GET /Payments/GetPendingPayments/{userId}` - Bekleyen ödemeleri getir
- `POST /Payments/ApprovePayment/{paymentId}` - Ödeme onayla
- `POST /Payments/RejectPayment/{paymentId}` - Ödeme reddet

### ⚠️ Sorun Giderme

#### Bağlantı Hatası
- Backend'in çalıştığından emin olun
- Port 7118'in açık olduğunu kontrol edin
- HTTP bağlantısı kullanıldığından emin olun

#### 401 Unauthorized
- Token'ın geçerli olduğunu kontrol edin
- Login işlemini tekrar yapın

#### 500 Server Error
- Backend loglarını kontrol edin
- API endpoint'lerinin doğru çalıştığını doğrulayın

### 📱 Kullanım Senaryoları

1. **Kullanıcı Girişi**:
   - Login ekranından giriş yapın
   - Gerçek kullanıcı bilgileri ile authentication

2. **Ev Yönetimi**:
   - Ev grupları oluşturun ve yönetin
   - Ev arkadaşları ekleyin

3. **Harcama Yönetimi**:
   - Harcama ekleyin ve paylaşın
   - Borç/alacak takibi yapın

### 🔄 Güncellemeler

- **Mock Data**: Tamamen kaldırıldı
- **Gerçek API**: Tam entegrasyon
- **Test Ekranları**: Kaldırıldı
- **Tüm Özellikler**: Çalışır durumda

### 📞 Destek

Sorun yaşarsanız:
1. Backend loglarını kontrol edin
2. API Test ekranındaki hata mesajlarını inceleyin
3. Swagger UI'da endpoint'leri test edin
4. Console loglarını kontrol edin

---

**Not**: Bu rehber sürekli güncellenmektedir. Yeni özellikler eklendikçe bu dosya da güncellenecektir.
