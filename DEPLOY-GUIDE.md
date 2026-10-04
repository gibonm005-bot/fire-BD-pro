# FIRE BANGLADESH - Deploy Guide (step by step)

Ei zip e ache:
```
index.html      -> Download landing page (root)
config.js       -> APK / Telegram / Support link boshanor jaiga
assets/         -> logo
app/            -> asol tournament app (PWA: index.html, manifest.json, sw.js, icons)
firebase.json   -> Firebase Hosting config
.firebaserc     -> project: fire-bd-8dc47
```
Deploy hobe **HTTPS** hosting e (PWA install ar notification er jonno lagbe).

---
## Option A: Firebase Hosting (recommended - apnar Firebase project ei ache)

1. **Node.js install:** https://nodejs.org theke LTS version.
2. **Zip extract** korun, folder ta (`fire-bd-deploy`) er bhitore Terminal/CMD kholun.
3. **Firebase CLI install:**
   `npm install -g firebase-tools`
4. **Login:**
   `firebase login`  (browser e Google account e login korun)
5. **Deploy:** (config already set kora ache, init lagbe na)
   `firebase deploy --only hosting`
6. Terminal e ekta link dekhabe: `https://fire-bd-8dc47.web.app` - ei tai apnar site.
   - Landing page: `https://fire-bd-8dc47.web.app`
   - App: `https://fire-bd-8dc47.web.app/app/`

> Deploy e "project not found" asle: Firebase Console e Hosting ekbar "Get started" chapun, ba `firebase use fire-bd-8dc47` chalan.

---
## Option B: Netlify (sobcheye sohoj, CLI lage na)
1. https://app.netlify.com/drop e jan.
2. Extract kora `fire-bd-deploy` folder ta drag & drop korun.
3. Link pabe (jemon `https://xxxx.netlify.app`). Site name Settings theke bodlano jay.

## Option C: Vercel / GitHub Pages / Cloudflare Pages
Folder ta upload korun, "Framework: Other / No build", "Output directory: ." dilei hobe.

---
## Deploy er por MUST-DO (Firebase Console: https://console.firebase.google.com -> fire-bd-8dc47)

1. **Authentication -> Sign-in method:** *Google* ar *Email/Password* Enable korun.
2. **Authentication -> Settings -> Authorized domains:** apnar notun domain add korun
   (jemon `fire-bd-8dc47.web.app`, `fire-bd-8dc47.firebaseapp.com` - ei duto default thake; Netlify/Custom domain hole seta add korun). Na dile Google login kaj korbe na.
3. **Realtime Database:** Create Database korun (region select kore), tarpor **Rules** ekhane set korun.
   Test er jonno temporary:
   ```
   { "rules": { ".read": true, ".write": "auth != null" } }
   ```
   Live e jawar age strict rules likhun (admin/user alada).
4. Database khali thakbe - admin panel theke game, match, payment number, notice add korun.

---
## APK / Telegram link boshano
`config.js` file khule link din, tarpor abar deploy korun:
```js
APK_URL: "https://your-link/FIRE-BD.apk",
TELEGRAM_URL: "https://t.me/yourchannel",
SUPPORT_URL: "https://t.me/yoursupport"
```
Link khali thakle oi button landing page e dekhabe na.

**APK banabe kivabe?** Deploy kora HTTPS link ta https://www.pwabuilder.com e din -> "Package for stores" -> Android -> APK download. Oita config.js e boshan.

---
## Update korle
File bodle abar `firebase deploy --only hosting`. App e purono version dekhale browser cache clear korun ba `app/sw.js` er prothom line e `fire-bd-v1` ke `fire-bd-v2` korun (cache version bump).

## Test checklist
- [ ] Landing page khule, "Install App" chaple app khole
- [ ] Chrome e install banner ashe (Android, HTTPS)
- [ ] Register/Login kaj kore, Google login kaj kore
- [ ] Register er por notification popup ashe
- [ ] Developer page ar Website button (Chrome e khole)


---
## v2 update notes
- Manifest ar service worker ekhon root e (`manifest.json`, `sw.js`), tai landing page e "Install App" chaple shorasori install dialog ashe (Chrome/HTTPS).
- `config.js` e `APK_URL` boshale "Install App" button "Download App" hoye jay ar click korle APK download shuru hoy.
- Google sign-in: installed app / APK te redirect diye kaj kore. Firebase Console > Authentication > Settings > Authorized domains e apnar domain (web.app, firebaseapp.com, custom domain) thakte hobe, ar Sign-in method e Google + Email/Password Enable thakte hobe.
- Deploy er por browser e ekbar hard refresh korun (sw cache: fire-bd-v2).

---
## v6 update: Gmail account picker (One Tap)
"Sign up / Login with Google" chaple phone e login thaka sob Gmail account er list ashe, ekta select korlei account hoye jay.
Setup (1 bar):
1. Firebase Console > Authentication > Sign-in method > Google > *Web SDK configuration* theke **Web client ID** copy korun.
2. `config.js` e `GOOGLE_CLIENT_ID: "xxxx.apps.googleusercontent.com"` boshan.
3. Google Cloud Console > APIs & Services > Credentials > oi Web client > **Authorized JavaScript origins** e apnar domain din (https://fire-bd-8dc47.web.app etc).
4. Abar `firebase deploy --only hosting`. (sw cache: fire-bd-v9)
Client ID khali thakle ager moto Google popup/redirect chalu thakbe (fallback).

## v8: origin_mismatch fix
Gmail picker ekhon shudhu `config.js` er `GOOGLE_PICKER_ORIGINS` e thaka origin e chole. Google Cloud te origin add korar por
ekhane same origin din (jemon `["https://fire-bd-8dc47.web.app"]`). Na dile normal Google login (block hoy na) chole.

## v9: Install option lukano
App install kora thakle (home screen theke khulle ba browser e khulleo) menu er "Install App", install banner ar landing page er Install button dekhabe na; landing e "Open App" dekhabe.
manifest.json er `related_applications` e URL ta apnar domain er sathe milan (default: https://fire-bd-8dc47.web.app/manifest.json).

## v20: Support bubble + User Support chat
- User app (ar landing page) e floating support bubble: 1) Telegram Support (admin Settings er support_link / config.js SUPPORT_URL), 2) App Support Chat.
- Admin panel (admin.html) e notun sidebar item **User Support**: user er Name + User ID soho chat ashe, notun message e badge, popup notice ar beep hoy. Reply dile user er bubble e red dot ashe.
- Database: `support_chats/{uid}` (name, pid, email, lastMsg, unread) ar `support_msgs/{uid}` (messages). Realtime Database Rules e ei duto path e login kora user er write allow thakte hobe (ager rules ".write": "auth != null" hole kaj korbe).
- Deploy er por admin.html abar upload korun, sw cache: fire-bd-v13.

## v21: Speed boost
- Home data (banner, category, match, notice, settings) last bar er data phone e save thake -> app khulle sathe sathe dekhay, background e live update.
- App ar DB load ekhon image/font er wait kore na (age window.onload er por shuru hoto). Font/icon CSS non-blocking.
- Image fail hole auto 3 bar retry. Image ar Firebase SDK persistent cache e (`fire-img-v1`, `fire-cdn-v1`) thake, deploy dileo muche na, bar bar download hoy na.
- Splash ~2s theke ~0.6s. Default avatar inline (external site lage na). logo.png 327KB -> 95KB.
- Page cache-first, background e update: deploy er por prothom bar purono version dekhate pare, 2nd bar khulle notun. Tai deploy e `sw.js` er `fire-bd-v14` bump korun.
- Admin theke banner/category image dile boro (3MB+) image na diye <300KB, WebP/JPG banner (1000px width) din - eta sobcheye beshi speed barhay.


---
## v25: Push Notification (app + admin)
**Ki ki bodlano:**
- `app/index.html`: player Allow Notifications chaple (ba login korle, permission age thekei dewa thakle) device token auto `fcm_tokens/{token}` ar `users/{uid}/fcmToken` e save hoy.
- `sw.js`: push receive kore notification dekhay, tap korle app khole (ar admin je screen dise shetay jay). sw cache: `fire-bd-v16`.
- `admin-local/admin.html`: notun **Push Notification** category (Send Push, Push History, Push Server). Ei file **deploy hoy na** (firebase.json e ignore kora). Eta phone/PC te rekhe khulo.
- Admin Noticeboard e "push-o pathao" checkbox.

**Deploy:** `firebase deploy --only hosting` (ager moto). Tarpor player ra app khule hard refresh kore Allow Notifications dibe.

**Firebase Console e ekbar check koro:**
1. Project Settings > Cloud Messaging > **Firebase Cloud Messaging API (V1)** = Enabled.
2. Realtime Database Rules e `fcm_tokens` ar `push_history` e login kora user (`auth != null`) write allow thakte hobe. Ager rules `".write": "auth != null"` hole kaj korbe.
3. App HTTPS e thakte hobe (web.app e ache).

**Admin e use:** admin.html khule PIN > Push Notification > Push Server > passphrase diye Unlock > Send Push.
**Audience:** All players (registered device), Match players (oi match e join kora), One player (Player ID), One device (token).

**Shimabodhota:** Web push e topic subscribe client theke hoy na, tai "All" mane registered device list. iPhone e shudhu Home Screen e install kora PWA te (iOS 16.4+) pabe. Player Allow na korle ba browser e block thakle pabe na.
