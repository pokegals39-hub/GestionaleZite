# IronHub – Gestionale Palestra

## Pubblicazione su GitHub Pages

**Automatica (consigliata):** carica il progetto su GitHub, poi vai su
*Settings → Pages → Source* e scegli **GitHub Actions**. A ogni push su `main`
il workflow `.github/workflows/deploy-pages.yml` compila e pubblica il sito.

**Manuale:**
```bash
npm install
npm run build:github -w apps/gestionale-palestra
```
Poi pubblica il contenuto di `apps/gestionale-palestra/dist`.

I dati sono salvati nel browser: usa *Impostazioni → Esporta backup* regolarmente.


---

[![Restore to zite](https://img.shields.io/badge/Restore%20to-ZITE-orange?style=for-the-badge&logo=rocket)](https://build.fillout.com)