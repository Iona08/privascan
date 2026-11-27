# PRIVAScan

> **100% client-side PII detection, classification, masking, and pseudonymization. Your data never leaves your browser.**

[![Deploy to GitHub Pages](https://github.com/<your-username>/privascan/actions/workflows/deploy.yml/badge.svg)](https://github.com/<your-username>/privascan/actions/workflows/deploy.yml)

**Live demo:** `https://<your-username>.github.io/privascan/`

---

## Table of Contents

- [Features](#features)
- [Detected PII Categories](#detected-pii-categories)
- [Redaction Modes](#redaction-modes)
- [Architecture](#architecture)
- [Privacy & Security Guarantees](#privacy--security-guarantees)
- [Getting Started](#getting-started)
- [Running Tests](#running-tests)
- [Production Build](#production-build)
- [GitHub Pages Deployment](#github-pages-deployment)
- [Keyboard Shortcuts](#keyboard-shortcuts)
- [Project Structure](#project-structure)
- [Design Decisions](#design-decisions)

---

## Features

| Feature | Detail |
|---|---|
| **Zero data egress** | All processing runs in the browser; no network requests, no backend |
| **6 PII categories** | Email, phone, IP, PAN, Aadhaar, credit card |
| **Checksum validation** | Luhn (credit cards), Verhoeff (Aadhaar) |
| **3 redaction modes** | Full mask, partial mask, pseudonymization |
| **CSV support** | Per-cell detection so matches never cross cell boundaries |
| **Live diff viewer** | Side-by-side original vs. sanitized with highlighted spans |
| **Audit log** | Tamper-evident in-session event log |
| **Statistics dashboard** | Counts by category, validation tier, characters sanitized |
| **Custom labels** | Per-category or global replacement tokens |
| **Keyboard shortcuts** | Alt+S, Alt+C, Alt+D, Alt+? |
| **Content Security Policy** | Strict CSP injected at build time; `connect-src 'none'` |
| **Accessible UI** | ARIA roles, live regions, keyboard navigation |

---

## Detected PII Categories

### Email Addresses
RFC-compliant email detection with boundary punctuation stripping and surrounding-quote handling.

### Phone Numbers
Indian (+91 prefix, 0-prefix, bare 10-digit mobile) and international E.164 formats. False-positive guards reject order IDs, dates, and long numeric strings.

### IP Addresses
- **IPv4** – validates all four octets are 0–255; rejects version-like strings (e.g., `3.11.0`)
- **IPv6** – validates full, compressed (`::1`), and IPv4-embedded (`::ffff:192.168.1.1`) forms; rejects timestamps

### PAN Numbers
Indian Permanent Account Number format (`[A-Z]{5}[0-9]{4}[A-Z]`) with holder-type code validation (P, C, H, F, A, B, G, J, L, T).

### Aadhaar Numbers
12-digit Aadhaar in `XXXX XXXX XXXX` or bare format, verified with the **Verhoeff checksum** algorithm. Format-only matches can be toggled separately.

### Credit Cards
13–19 digit card numbers (spaced, hyphenated, or bare) verified by **Luhn algorithm** with issuer-prefix classification: Visa, Mastercard, Amex, Discover, RuPay.

---

## Redaction Modes

| Mode | Behaviour | Example |
|---|---|---|
| **Full mask** | Replaces entire PII span with a configurable label | `[REDACTED]` or `[EMAIL]` |
| **Partial mask** | Masks most digits/characters, preserves structure | `j***@gmail.com`, `XXXX-XXXX-XXXX-1234` |
| **Pseudonymization** | Assigns consistent placeholder tokens per entity | `USER_01`, `CARD_02` – same value → same token within session |

---

## Architecture

```
src/
├── types/pii.ts              # Shared TypeScript types
├── utils/
│   ├── detection/
│   │   ├── detectionEngine.ts    # Overlap resolution, category dispatch
│   │   ├── emailDetector.ts
│   │   ├── phoneDetector.ts
│   │   ├── ipDetector.ts
│   │   ├── panDetector.ts
│   │   ├── aadhaarDetector.ts
│   │   ├── creditCardDetector.ts
│   │   ├── luhnValidator.ts
│   │   └── verhoeff.ts
│   ├── redaction/
│   │   ├── redactionEngine.ts    # Applies mode to sorted detections
│   │   ├── fullMask.ts
│   │   ├── partialMask.ts
│   │   └── pseudonymizer.ts      # In-closure session, never logged
│   └── export/
│       ├── csvParser.ts          # RFC 4180 parser + per-cell sanitization
│       ├── csvExporter.ts
│       └── textExporter.ts
├── hooks/
│   ├── usePIIDetection.ts        # Debounced detection (350 ms)
│   ├── useRedaction.ts
│   └── useAuditLog.ts
└── components/                   # React UI components
```

**Data flow:**
```
User input → detectPII() → resolveOverlaps() → applyRedaction() → sanitizedText
                                                       ↓
                                              segments[] → DiffViewer
```

---

## Privacy & Security Guarantees

1. **No network requests** – CSP `connect-src 'none'` enforced at build time
2. **No server-side processing** – pure client-side SPA, deployed as static files
3. **No localStorage / sessionStorage / cookies** – state is ephemeral
4. **No third-party scripts** – no analytics, no CDN fonts, no trackers
5. **Pseudonym maps in closure scope only** – never serialized, never logged, cleared on reset
6. **File processing via FileReader API** – files are never uploaded
7. **Strict Content Security Policy** injected by Vite plugin at build time:
   ```
   default-src 'self';
   style-src 'self' 'unsafe-inline';
   script-src 'self';
   img-src 'self' data: blob:;
   connect-src 'none';
   object-src 'none';
   base-uri 'self';
   form-action 'none';
   ```
8. **Export only contains sanitized output** – original text never written to Blob

---

## Getting Started

### Prerequisites
- Node.js 18+ (22 recommended)
- npm 9+

### Install & Run

```bash
git clone https://github.com/<your-username>/privascan.git
cd privascan
npm install
npm run dev
```

The dev server starts at `http://localhost:5173`.

---

## Running Tests

```bash
# Run all tests once
npm run test:run

# Watch mode
npm test

# Type check only
npm run typecheck
```

**Test coverage:**

| Test file | Tests | What is covered |
|---|---|---|
| `detectionEngine.test.ts` | 13 | Luhn, Verhoeff, all 6 detectors, overlap resolution, offsets, Unicode, 1 MB perf |
| `redactionEngine.test.ts` | 3 | Full mask labels, partial masking per category, pseudonymization consistency |
| `export.test.ts` | 5 | CSV round-trip, per-cell sanitization, filename safety, Blob contents |
| **Total** | **21** | |

---

## Production Build

```bash
npm run build        # outputs to dist/
npm run preview      # serves dist/ locally on :4173
```

The build:
- Sets `base: '/privascan/'` for GitHub Pages sub-path routing
- Injects the strict CSP `<meta>` tag via a Vite plugin
- Outputs `dist/index.html` + hashed JS/CSS assets

---

## GitHub Pages Deployment

The `.github/workflows/deploy.yml` workflow triggers on every push to `main`:

1. Installs dependencies (`npm ci`)
2. Type-checks (`tsc --noEmit`)
3. Runs all tests (`vitest run`)
4. Builds for production (`vite build`)
5. Uploads `dist/` and deploys to GitHub Pages

**Setup steps for a new repo:**

1. Push this repo to GitHub
2. Go to **Settings → Pages → Source** → select **GitHub Actions**
3. Push to `main` to trigger the first deployment
4. App will be live at `https://<your-username>.github.io/privascan/`

---

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Alt + S` | Load sample data |
| `Alt + C` | Clear / reset editor |
| `Alt + D` | Download sanitized output |
| `Alt + ?` | Show keyboard shortcut help |
| `Escape` | Close dialogs |

---

## Project Structure

```
privascan/
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Actions CI/CD
├── public/
│   └── favicon.svg
├── src/
│   ├── components/             # React UI components (13)
│   ├── hooks/                  # Custom React hooks (3)
│   ├── types/
│   │   └── pii.ts              # All TypeScript types
│   ├── utils/
│   │   ├── detection/          # Detector modules + engine
│   │   ├── redaction/          # Mask + pseudonymizer + engine
│   │   └── export/             # CSV parser + exporters
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── .gitignore
├── package.json
├── package-lock.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

## Design Decisions

**Why client-side only?**
Privacy tools that send data to servers are self-defeating. Running entirely in the browser means zero trust requirements on infrastructure.

**Why Verhoeff for Aadhaar?**
Aadhaar uses the Verhoeff checksum algorithm. Without it, any 12-digit number could match. The checksum cuts false positives significantly.

**Why Luhn for credit cards?**
Same rationale — industry-standard validation eliminates order IDs, timestamps, and other 16-digit strings from matching.

**Overlap resolution priority:**
When two detectors match the same span, the winner is chosen by: longest span → highest validation tier → category priority (credit_card > aadhaar > pan > ip > email > phone) → earliest start offset. This prevents an Aadhaar number from also being reported as a phone, for example.

**Pseudonym isolation:**
Each category has its own counter namespace. `USER_01` and `CARD_01` are independent sequences. Maps live in closure scope and are cleared on session reset — they are never accessible from outside the `createPseudonymSession()` closure.

---

*PRIVAScan — built for privacy engineers, compliance teams, and developers who handle sensitive data.*
