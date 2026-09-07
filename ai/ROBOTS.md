# Robots.txt Analysis — BestJobs & eJobs

## BestJobs

Sursa: https://www.bestjobs.eu/robots.txt

### Reguli

```
User-agent: *
Disallow:

User-agent: MJ12bot
User-agent: BLEXBot
User-agent: AhrefsBot
User-agent: SemrushBot
User-agent: Yandex
...
Disallow: /
```

### Interpretare

| Cale | Accesibil? | Ce conține |
|---|---|---|
| `/` | ✅ Allowed (`Disallow:` gol) | Tot site-ul, inclusiv paginile profilului de angajator |
| `/company-profile/<slug>` | ✅ Allowed | Profilul companiei cu lista job-urilor scrape-uite |

Robots.txt blochează doar crawler-ele explicite de SEO (MJ12, Ahrefs, Semrush, etc.). Agentul Chromium Headless cu un User-Agent obișnuit nu e pe listă.

## eJobs

Sursa: https://www.ejobs.ro/robots.txt

### Reguli

```
User-agent: *
Allow: */pagina2$ ... */pagina10$
Disallow: /oauth/
Disallow: */pagina
Disallow: */sort-publish
Disallow: */sort-geo
```

### Interpretare

| Cale | Accesibil? | Ce conține |
|---|---|---|
| `/company/<slug>/<id>` | ✅ Allowed | Pagina de angajator cu lista job-urilor |
| `/job/<id>` | ✅ Allowed | Paginile individuale de job |
| `/oauth/` | ❌ Disallowed | Autentificare (nu ne interesează) |

## Diferență față de template-ul EPAM

Template-ul EPAM scrape-uia `careers.epam.com`, unde `Disallow: /` bloca oficial tot site-ul (dar API-ul răspundea 200 în practică). Pentru BestJobs și eJobs, robots.txt **permite explicit** scrape-ul pentru agenți generali — risc minim, mai mic decât la template.

**Concluzie**: Risc minim pentru ambele surse. Ambele permit accesul pentru `User-agent: *`, iar scraper-ul e politicos (o singură pagină la un moment dat, fără crawl agresiv, fără autentificare).