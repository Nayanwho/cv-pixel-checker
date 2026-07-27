# Human-in-the-Loop Black-Box Skynet Calibration Protocol

This directory contains the automated empirical calibration system for Skynet's updated CV rendering engine.

## 📋 Human Operator Setup Checklist

Before starting a calibration session, ensure the following conditions remain constant throughout the testing session:

1. **Browser Zoom**: Set browser zoom to exactly **100%** (`Cmd + 0` or `Ctrl + 0`).
2. **Display Scaling**: Keep operating system display scale constant.
3. **Template & Account**: Use the same Skynet template, section, and account throughout testing.
4. **No Spurious Spaces**: Do not add extra trailing spaces or line breaks when pasting probes.
5. **Formatting Controls**: Apply bold formatting using Skynet's native toolbar / keyboard shortcuts as instructed for each probe.

---

## 🎯 Target Field Profiles

- **`LARGE-A`**: Large-width fields corresponding to historical 599.0px limit (e.g. Internship & Project Details / Achievements full-width rows).
- **`SMALL-A`**: Smaller-width fields corresponding to historical 559.0px limit (e.g. Position of Responsibility, Extra-Curricular, Academic rows with year/category columns).
- **`ACADEMIC-WIDE`**: Wide Academic section rows corresponding to historical 677.7px limit.

---

## 💻 CLI Calibration Commands

- **Run Interactive Calibration**: `npm run skynet-calibrate`
- **Run Drift Detection Smoke Test**: `npm run skynet-drift-check`
- **Run Privacy & Security Audit**: `npm run privacy-check`
