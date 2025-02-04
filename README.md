# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
    npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.

# Ev Arkadaşım Uygulaması

## Harcama Ekleme Özelliği

### Endpoint'ler

1. `/House/Friends/${houseId}`
   - Ev üyelerinin listesini getirir
   - Dönen veri: `{ fullName, email }`

2. `/Users`
   - Tüm kullanıcıların listesini getirir
   - Dönen veri: `{ id, fullName, email }`

3. `/Expenses/AddExpense`
   - Yeni harcama ekler
   - Gönderilen veri:
     ```javascript
     {
       tur: string,       // Harcama türü
       tutar: number,     // Harcama tutarı
       houseId: number,   // Ev ID'si
       odeyenUserId: number, // Ödemeyi yapan kişinin ID'si
       kaydedenUserId: number // Kaydeden kişinin ID'si
     }
     ```

### Özellikler

1. Harcama Türü Seçimi
   - Market
   - Fatura
   - Kira
   - Manav
   - Diğer

2. Harcama Tutarı
   - Sayısal değer girişi
   - Sıfırdan büyük olmalı

3. Ödemeyi Yapan Kişi
   - Ev üyeleri listesinden seçim
   - Email eşleştirmesi ile doğru ID bulunur

4. Kaydeden Kişi
   - Otomatik olarak giriş yapan kullanıcı

### Veri Akışı

1. Sayfa açıldığında:
   - Ev üyeleri listesi alınır
   - Kullanıcı ID'leri alınır
   - İki liste email'e göre eşleştirilir

2. Harcama eklenirken:
   - Tüm alanların doluluğu kontrol edilir
   - Sayısal değerler doğrulanır
   - API'ye gönderilir
   - Başarılı/başarısız durumu kullanıcıya bildirilir
