# SafeSchool

Faqe statike në shqip për Gjimnazin Kostandin Kristoforidhi, Elbasan. Ndërtuar me React, TypeScript dhe Vite.

## Zhvillimi

```sh
npm ci
npm run dev
npm run build
```

`npm run build` kontrollon TypeScript dhe krijon skedarët statikë në `dist/`. `npm run preview` shërben versionin e ndërtuar për verifikim lokal.

## Rrjedha e raportimit

Formulari e mban draftin në kujtesën e faqes. Nxënësi mund të rishikojë tekstin, ta kopjojë, ta shkarkojë ose të hapë një email të adresuar te shërbimi psikosocial. Ai vendos nëse dhe si do ta dërgojë raportin. Nëse zgjedh emailin, marrësi e sheh adresën e llogarisë dërguese. Për dorëzim pa emër, formulari ofron tekst të shkarkueshëm dhe mundësinë për të lënë bosh të dhënat identifikuese.

Gmail SMTP kërkon autentikim nga një shërbim i besuar. Versioni statik e lë dërgimin te aplikacioni i emailit të nxënësit. Konfigurimi i dërgimit automatik nga `safeschoolkostandini@gmail.com` kërkon një shërbim dërgues me kredenciale të mbajtura jashtë kodit të shfletuesit.

## Përmbajtja dhe kontakti

Adresa e marrësit, udhëzimi për zyrën dhe orarin, kategoritë dhe materialet informuese redaktohen te `src/content.ts`. Faqja përdor logon e shkollës nga `public/shkolla.jpg`.
