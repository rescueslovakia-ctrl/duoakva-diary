# DuoAkva Diary Mobile v1

This branch prepares a Capacitor 7 native shell without changing the production web application.

## Architecture

The Android/iOS shell loads `https://diary.duoakva.sk`. This is intentional for v1 because DuoAkva Diary uses Next.js server/API routes and cannot safely be converted to a static bundle without a larger architectural change. Supabase remains the shared backend, so web/Android/iOS use the same accounts and data.

App ID / Bundle ID: `sk.duoakva.diary`
App name: `DuoAkva Diary`

## Local prerequisites

- Node.js 20+ and npm
- Android: Android Studio + Android SDK/JDK
- iOS: macOS + current Xcode + Apple Developer account for device/TestFlight/App Store signing

## Generate native projects

Run on this branch only:

```bash
npm install
npx cap add android
npx cap add ios
npm run mobile:sync
npm run mobile:doctor
```

Then:

```bash
npm run mobile:android
npm run mobile:ios
```

Do not merge generated native projects to `main` until device testing is complete and explicitly approved.

## Test checklist

1. Cold launch and splash screen.
2. Login/logout and session persistence after app restart.
3. Registration/password reset links.
4. Aquarium CRUD and switching aquariums.
5. Measurements, graphs and custom ranges.
6. Plants, livestock, equipment and fertilizers.
7. Maintenance and tasks.
8. Photo diary: choose photo from gallery and camera where offered by the OS file picker.
9. Photo AI flow and quota display.
10. Premium activation and purchase links.
11. Account deletion.
12. External links/legal pages.
13. Android hardware/system Back gesture.
14. iPhone safe areas/notch, keyboard and rotation policy.
15. Offline/network-error behaviour.

## Store work still required

- Final app icon and native splash assets.
- Android signing keystore and Play Console application; release as AAB.
- Apple Developer signing, App Store Connect record and TestFlight build.
- Store screenshots/descriptions/privacy declarations/data-safety forms.
- Review in-app purchase requirements before exposing digital Premium purchase inside store builds. Apple/Google rules for digital subscriptions must be handled before public store submission.

## Production safety

`main` is not modified by this mobile work. The native shell currently points to the existing production URL and contains no database migrations. Any mobile-specific web UX changes should first be made and tested on a separate preview branch before production deployment.
