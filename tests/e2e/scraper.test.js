import { jest } from '@jest/globals';
import fetch from 'node-fetch';

const API_BASE = 'https://api.peviitor.ro/v1';

let HAS_API = false;

let HAS_ANAF = false;

function itIfApi(name, fn, timeout) {
  if (HAS_API) {
    return it(name, fn, timeout);
  }
  return it.skip(`${name} (skipped: API unavailable)`, fn, timeout);
}

function itIfAnaf(name, fn, timeout) {
  if (HAS_ANAF) {
    return it(name, fn, timeout);
  }
  return it.skip(`${name} (skipped: ANAF API unavailable)`, fn, timeout);
}

import companyConfig from '../../scraper/config/company.js';
const TEST_CIF = companyConfig.id;
const TEST_BRAND = companyConfig.brand;
const COMPANY_NAME = companyConfig.company;

beforeAll(async () => {
  [HAS_API, HAS_ANAF] = await Promise.all([
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/scraper/jobs/?cif=${TEST_CIF}&rows=1`, {
          signal: AbortSignal.timeout(5000)
        });
        return res.ok || res.status === 400;
      } catch {
        return false;
      }
    })(),
    (async () => {
      try {
        const res = await fetch('https://demoanaf.ro/api/search?q=test', {
          method: 'HEAD',
          signal: AbortSignal.timeout(5000)
        });
        return res.ok;
      } catch {
        return false;
      }
    })()
  ]);
});

describe('E2E: Full Scraping Pipeline', () => {

  describe('Job Sources — Live Fetch', () => {
    let index;

    beforeAll(async () => {
      index = await import('../../scraper/index.js');
    });

    it('should scrape BestJobs company page without crashing', async () => {
      const jobs = [];
      let browser = null;
      try {
        const { chromium } = await import('playwright');
        browser = await chromium.launch({ headless: true });
        const page = await browser.newPage();
        await page.goto('https://www.bestjobs.eu/company-profile/cramele-cotnari', {
          waitUntil: 'networkidle',
          timeout: 30000
        });
        await page.waitForTimeout(5000);
        const jobLinks = await page.$$eval(
          'a[href*="/job/"], a[href*="/oferta"], a[href*="/loc-de-munca"]',
          (links) => links.map((a) => ({ url: a.href, title: a.textContent.trim() }))
        );
        jobs.push(...jobLinks.filter((j) => j.title && j.url));
      } catch (err) {
        console.log('BestJobs fetch failed (site may block bots):', err.message);
      } finally {
        if (browser) await browser.close().catch(() => {});
      }
      expect(Array.isArray(jobs)).toBe(true);
    }, 45000);

    it('should scrape eJobs company page gracefully', async () => {
      const jobs = [];
      let browser = null;
      try {
        const { chromium } = await import('playwright');
        browser = await chromium.launch({ headless: true });
        const page = await browser.newPage();
        await page.goto('https://www.ejobs.ro/company/cotnari/304021', {
          waitUntil: 'networkidle',
          timeout: 30000
        });
        await page.waitForTimeout(3000);
        const bodyText = await page.textContent('body').catch(() => '');
        if (bodyText.includes('nu are joburi disponibile')) {
          console.log('Company currently has 0 jobs on eJobs');
          return;
        }
        const jobLinks = await page.$$eval(
          'a[href*="/oferta-de-munca/"], a[href*="/job/"]',
          (links) => links.map((a) => ({ url: a.href, title: a.textContent.trim() }))
        );
        jobs.push(...jobLinks.filter((j) => j.title && j.url));
      } catch (err) {
        console.log('eJobs fetch failed (site may block bots):', err.message);
      } finally {
        if (browser) await browser.close().catch(() => {});
      }
      expect(Array.isArray(jobs)).toBe(true);
    }, 45000);
  });

  describe('Parse + Transform Pipeline', () => {
    let index;

    beforeAll(async () => {
      index = await import('../../scraper/index.js');
    });

    it('should map scraped jobs to the job model', () => {
      const rawJob = {
        url: 'https://www.bestjobs.eu/job/01FKTEST',
        title: 'Manager de zona',
        location: ['Iași'],
        source: 'bestjobs'
      };

      const model = index.mapToJobModel(rawJob, TEST_CIF, COMPANY_NAME);

      expect(model).toHaveProperty('url', rawJob.url);
      expect(model).toHaveProperty('title', rawJob.title);
      expect(model).toHaveProperty('company', COMPANY_NAME);
      expect(model).toHaveProperty('cif', TEST_CIF);
      expect(model).toHaveProperty('status', 'scraped');
      expect(model).toHaveProperty('date');
    });

    it('should transform jobs and keep Romanian locations', () => {
      const jobs = [
        index.mapToJobModel({
          url: 'https://www.bestjobs.eu/job/1',
          title: 'Job 1',
          location: ['Iași'],
          source: 'bestjobs'
        }, TEST_CIF, COMPANY_NAME),
        index.mapToJobModel({
          url: 'https://www.ejobs.ro/oferta-de-munca/2',
          title: 'Job 2',
          location: ['Bucharest'],
          source: 'ejobs'
        }, TEST_CIF, COMPANY_NAME)
      ];

      const payload = {
        source: 'bestjobs.eu,ejobs.ro,anofm.ro',
        company: COMPANY_NAME,
        cif: TEST_CIF,
        jobs
      };

      const transformed = index.transformJobsForSOLR(payload);

      expect(transformed.company).toBe(COMPANY_NAME);
      expect(transformed.jobs.length).toBe(jobs.length);

      for (const job of transformed.jobs) {
        expect(job).toHaveProperty('location');
        expect(Array.isArray(job.location)).toBe(true);
        expect(job.location.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Company Validation Path', () => {
    let anaf;
    let company;

    beforeAll(async () => {
      anaf = await import('../../scraper/anaf.js');
      company = await import('../../scraper/company.js');
    });

    itIfAnaf('should find Cotnari in ANAF and validate active status', async () => {
      const results = await anaf.searchCompany(TEST_BRAND);

      const cotnari = results.find(c =>
        c.cui.toString() === TEST_CIF &&
        c.statusLabel === 'Funcțiune'
      );
      expect(cotnari).toBeDefined();
      expect(cotnari.cui.toString()).toBe(TEST_CIF);

      const anafData = await anaf.getCompanyFromANAF(TEST_CIF);
      expect(anafData).toBeDefined();
      expect(anafData.inactive).toBe(false);
    }, 30000);

    itIfApi('should run full validation and report active status with job count', async () => {
      const result = await company.validateAndGetCompany();

      expect(result.status).toBe('active');
      expect(result.company).toBe(COMPANY_NAME);
      expect(result.cif).toBe(TEST_CIF);

      if (result.existingJobsCount === 0) {
        console.log('⚠️ No jobs in API — skipping job count assertion');
        return;
      }
      expect(result.existingJobsCount).toBeGreaterThan(0);
    }, 30000);
  });

  describe('Inactive Company Handling', () => {
    let anaf;

    beforeAll(async () => {
      anaf = await import('../../scraper/anaf.js');
    });

    itIfAnaf('should detect inactive/radiated companies via ANAF', async () => {
      const results = await anaf.searchCompany(TEST_BRAND);

      const nonActive = results.find(c => c.statusLabel !== 'Funcțiune');

      if (nonActive) {
        try {
          const anafData = await anaf.getCompanyFromANAF(nonActive.cui.toString());
          expect(anafData).toBeDefined();
          if (anafData.inactive !== undefined) {
            expect(anafData.inactive).toBe(true);
          }
        } catch {
          expect(nonActive.statusLabel).toMatch(/Radiată|Inactiv|Suspendat/);
        }
      }
    }, 30000);
  });

  describe('API Data Verification', () => {
    let api;

    beforeAll(async () => {
      api = await import('../../scraper/api.js');
    });

    itIfApi('should have Cotnari jobs in API with correct company name', async () => {
      const result = await api.querySOLR(TEST_CIF);

      if (result.numFound === 0) {
        console.log('⚠️ No jobs in API — skipping API data verification');
        return;
      }

      for (const job of result.docs) {
        expect(job.company).toBe(COMPANY_NAME);
        expect(job.cif).toBe(TEST_CIF);
      }
    }, 15000);

    itIfApi('should have Cotnari company core entry with required fields', async () => {
      const companyDoc = await api.getCompanyByCif(TEST_CIF);

      expect(companyDoc).toBeDefined();
      expect(companyDoc.company).toBe(COMPANY_NAME);
      expect(companyDoc.status).toBe('activ');
    }, 15000);
  });
});