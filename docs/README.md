# job_seeker_ro_spider

**job_seeker_ro_spider** — scraper pentru job-urile CRAMELE COTNARI S.A. din România.

Extrage anunțurile de pe [BestJobs](https://www.bestjobs.eu/company-profile/cramele-cotnari), [eJobs](https://www.ejobs.ro/company/cotnari/304021) și [ANOFM](https://mediere.anofm.ro) și le publică în [peviitor.ro](https://peviitor.ro) prin API-ul Peviitor.

> **🌱 Repo derivat.** Acest repo este derivat din template-ul [epam-systems-international-srl-nodejs-scraper](https://github.com/sebiboga/epam-systems-international-srl-nodejs-scraper).

## Identificare

Toate request-urile HTTP folosesc User-Agent-ul:

```
job_seeker_ro_spider
```

## Ce face

1. **Validează compania** — interoghează API-ul public ANAF ([demoanaf.ro](https://demoanaf.ro)) după CIF-ul (40321026) și verifică:
   - Denumirea oficială: CRAMELE COTNARI S.A.
   - Status: activ/inactiv/radiat
   - Adresa completă din registrul comerțului
2. **Cross-validează cu Peviitor** — verifică existența companiei în API-ul Peviitor
3. **Scrape-uiește job-urile** — extrage lista completă de job-uri din BestJobs și eJobs (prin Playwright, DOM) și de pe ANOFM (după CIF)
4. **Transformă datele** — normalizează locațiile (doar orașe românești), tag-urile (lowercase), workmode-ul (remote/on-site/hybrid)
5. **Stochează în Peviitor** — upsert prin API-ul Peviitor (job-uri și date companie)
6. **Generează jobs.md** — fișier markdown cu informații companie + toate job-urile curente

## API-uri folosite

| API | URL | Autentificare |
|---|---|---|
| BestJobs | `https://www.bestjobs.eu/company-profile/cramele-cotnari` | Public |
| eJobs | `https://www.ejobs.ro/company/cotnari/304021` | Public |
| ANOFM | `https://api.anofm.ro/api/entity/vw_public_job_posting` | Public |
| ANAF (demoanaf) | `https://demoanaf.ro/api/...` | Public |
| Peviitor | `https://api.peviitor.ro/v1/company/` | Public |

## Robots.txt

BestJobs și eJobs [permit explicit](robots.txt) scrape-ul pentru agenți generali (`User-agent: *` → `Disallow:` gol / doar `/oauth/`). Scraper-ul este politicos: o singură pagină la un moment dat, fără crawl agresiv, fără autentificare.

Pentru analiza completă, vezi [ai/ROBOTS.md](../ai/ROBOTS.md).

## Testare

```bash
# Toate testele
npm test

# Doar unitare
npm run test:unit

# Doar integrare (necesită ANAF live, Peviitor API conditional)
npm run test:integration

# Doar E2E (BestJobs/eJobs reale + ANAF + Peviitor)
npm run test:e2e
```

Testele Peviitor API folosesc `itIfApi` — se auto-skip dacă API-ul Peviitor nu e disponibil.