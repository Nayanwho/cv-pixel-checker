---
name: check-cv-lines
description: Audit, fit, or rewrite every CV/resume bullet using deterministic rendered-width measurements. Use for attached PDF or DOCX resumes, pasted CV sections, multi-bullet checks, exact line fitting, overflow detection, or candidate comparison when guessing by character count is unacceptable.
---

# Check CV Lines

Measure the complete CV in batches through the CV Pixel Checker MCP server. Treat the returned pixels as exact for the selected layout profile and bundled EB Garamond font.

## Audit a document

1. Extract every bullet or line the user intends to fit. Preserve source order, wording, numbers, punctuation, and bold runs.
2. Assign a stable unique ID such as `experience-01`. Record its section heading.
3. Select a profile from [profiles.md](references/profiles.md). If the template exposes a different text-column width, send that exact `maxWidthPx`. If the layout is unknown, use `PROJECT_DETAILS` and disclose the assumption.
4. Call `audit_cv_document` once with all lines. Do not call `check_cv_line` repeatedly for a document. Chunk only when the document exceeds the tool limit, and preserve IDs across chunks.
5. Accept the audit only when:
   - `fontReady` is `true`;
   - `coverageComplete` is `true`;
   - `submittedLineCount` equals `measuredLineCount`;
   - every source ID appears once in `results`.
6. Return a source-order table with ID, section, measured width/limit, utilisation, fit status, and revision need.

Never estimate widths, infer a missing result, or claim full-document coverage from a partial call.

## Rewrite lines

Preserve factual claims, metrics, chronology, and the user's intended meaning. Draft revisions for all lines needing work, then call `audit_cv_document` once with the complete revised set. Repeat by batch until the requested lines fit.

Use `check_cv_candidates` only when comparing several alternative phrasings of one bullet. Re-measure the chosen wording in the final document audit.

Do not silently remove metrics or alter facts to gain space. Flag any wording tradeoff that requires user judgment.

## Interpret results

- `optimal`: one line and within the requested target band.
- `underfilled`: fits but falls below the target band.
- `multi-line`, `overflow`, or `hard-overflow`: revise or change the layout constraint.
- `invalid-input`: fix the extraction; do not count it as checked.
- font failure or incomplete coverage: stop and report that exact validation is unavailable.

The measurement is exact for the supplied font, styling, and pixel limit. It cannot guarantee matching pagination in a different Word/PDF template unless that template's actual text-column width and typography are supplied.
