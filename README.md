# SafeSchool

Faqe në shqip për Gjimnazin Kostandin Kristoforidhi, Elbasan. Ndërtuar me React, TypeScript dhe Vite.

## Zhvillimi

```sh
npm ci
npm run dev
npm run build
```

`npm run dev` hap faqen për zhvillim. `npm run build` kontrollon TypeScript dhe ndërton faqen dhe pikën fundore të raportimit në `dist/server/index.js`. `npm run preview` shërben të dyja në `http://127.0.0.1:4173/`.

## Rrjedha e raportimit

Emri, mbiemri, klasa dhe mësuesi/ja kujdestar/e janë të detyrueshëm. SafeSchool e mban draftin në kujtesën e faqes derisa Google Apps Script të konfirmojë dërgimin. Apps Script mban përkohësisht vetëm identifikues dhe gjendje teknike për të parandaluar email-et e dyfishta pas riprovimit. Raporti dërgohet në adresën e shërbimit psikosocial.

## Aktivizimi i dërgimit me Google Apps Script

1. Hyr në [Google Apps Script](https://script.google.com/) me llogarinë `safeschoolkostandini@gmail.com`. Krijo një projekt dhe kopjo [Code.gs](apps-script/Code.gs) në redaktues.
2. Krijo një çelës të rastësishëm prej 32 bajtesh. Në Windows mund ta kopjosh në kujtesën e përkohshme me `node -e "process.stdout.write(require('node:crypto').randomBytes(32).toString('hex'))" | Set-Clipboard`. Te **Project Settings → Script Properties** ruaje si `APPS_SCRIPT_RELAY_KEY`.
3. Ekzekuto `authorizeSafeSchool` nga redaktuesi dhe mirato lejen për dërgim email-i. Pastaj zgjidh **Deploy → New deployment → Web app**, **Execute as → Me** dhe **Who has access → Anyone**. Kopjo adresën `/exec`. Script-i kontrollon çelësin para çdo dërgimi dhe e ka marrësin të përcaktuar në kod.
4. Në konfigurimin e publikimit të SafeSchool vendos adresën si `APPS_SCRIPT_URL` dhe të njëjtin çelës si sekret `APPS_SCRIPT_RELAY_KEY`. Publiko versionin e ruajtur me konfigurimin e përditësuar. Variablat mund të vendosen edhe në mjedisin e procesit për `npm run preview`. Mbaji jashtë kodit, historikut të Git-it dhe bisedave.
5. Kontrollo dërgimin me një raport tërësisht fiktiv dhe verifiko email-in te `sherbimipsikosocialkonstandink@gmail.com` përpara përdorimit me nxënës.

## Përmbajtja dhe kontakti

Adresa e marrësit, udhëzimi për zyrën dhe orarin, kategoritë dhe materialet informuese redaktohen te `src/content.ts`. Faqja përdor logon e shkollës nga `public/shkolla.jpg`.
