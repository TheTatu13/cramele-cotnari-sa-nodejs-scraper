# Contributing

Thank you for your interest in contributing!

## Development Setup

```bash
npm install
npx playwright install chromium
npm test
```

## Reporting Issues

Open a [GitHub Issue](https://github.com/TheTatu13/cramele-cotnari-sa-nodejs-scraper/issues) with:
- Clear description of the problem
- Steps to reproduce
- Expected vs actual behavior

## Job Sources

This scraper extracts jobs from:
- [BestJobs — Cramele Cotnari](https://www.bestjobs.eu/company-profile/cramele-cotnari)
- [eJobs — Cotnari](https://www.ejobs.ro/company/cotnari/304021)
- ANOFM (by CIF 40321026)

If a source changes its DOM structure or starts blocking bots, the Playwright extraction in `scraper/index.js` may need updating.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.