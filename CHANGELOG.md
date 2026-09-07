# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-09-07

### Added
- Repo derivat din template-ul [epam-systems-international-srl-nodejs-scraper](https://github.com/sebiboga/epam-systems-international-srl-nodejs-scraper) pentru **CRAMELE COTNARI S.A.** (CIF: 40321026)
- Scraping Playwright (headless Chromium) pe [BestJobs](https://www.bestjobs.eu/company-profile/cramele-cotnari) și [eJobs](https://www.ejobs.ro/company/cotnari/304021)
- Scraping ANOFM prin `employer_tax_code`
- Degradare grațioasă: o sursă indisponibilă sau blocată nu oprește scrape-ul
- Pipeline CI cu `npx playwright install --with-deps chromium`

### Changed
- `scraper/config/company.json`: identitate CRAMELE COTNARI S.A. (brand Cotnari, sediu Iași)
- `scraper/index.js`: `fetchJobsPage`/`parseApiJobs` (EPAM JSON API) → `scrapeBestJobs`/`scrapeEJobs` (Playwright DOM)
- Teste adaptate la noul CIF și la noile surse (unit, integration, e2e, consistency)
- `tests/validate-epam-jobs.js` → `tests/validate-cramele-cotnari-jobs.js`

### Removed
- Istoricul CHANGELOG din template (aparține template-ului EPAM)

## License

Copyright (c) 2026 TheTatu13
Licensed under MIT License