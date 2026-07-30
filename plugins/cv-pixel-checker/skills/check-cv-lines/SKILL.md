---
name: check-cv-lines
description: Audit, fit, or rewrite every CV/resume bullet using deterministic rendered-width measurements. Use for attached PDF or DOCX resumes, pasted CV sections, multi-bullet checks, exact line fitting, overflow detection, or candidate comparison when guessing by character count is unacceptable.
---

# Check CV Lines

Measure CV text through the CV Pixel Checker MCP server. Treat
`authoritativeWidthPx` as the only valid width for the returned
`metricsProfile`, layout, and rendered style.

## Check one isolated line

1. Copy only the CV line the user asked to measure. Preserve every Unicode
   character, space, number, currency mark, slash, ampersand, and punctuation
   mark exactly.
2. Call `check_cv_line` exactly once. If the user did not explicitly provide a
   different typeface, size, or weight, omit `style`; the authoritative default
   is bundled EB Garamond, 9.75 pt, regular weight 400.
3. Send `presetId` or `maxWidthPx` only when the layout is known. The width
   limit changes fit and wrapping, but it does not change the text's
   `authoritativeWidthPx`.
4. Accept the measurement only when all of these are true:
   - `fontReady` is `true`;
   - `measurementContract.authoritative` is `true`;
   - `measurementContract.fallbackUsed` is `false`;
   - `inputText` exactly matches the submitted string;
   - `renderedText` preserves the intended visible text;
   - `renderedStyle` matches the requested style or the default above.
5. Report `authoritativeWidthPx`, `maxWidthPx`, `lineCount`, `status`,
   `neededTrimPx`, `orphanText`, and `renderedStyle` exactly as returned.

Never estimate a width, convert it to another font, describe it as Arial, or
replace a failed `check_cv_line` call with `check_cv_candidates`. If the call
fails or any validation gate fails, stop and report that exact measurement is
unavailable; do not invent a number.

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
   - every result passes the single-line font, fallback, and text-preservation
     gates above.
6. Return a source-order table with ID, section, measured width/limit, utilisation, fit status, and revision need.

Never estimate widths, infer a missing result, or claim full-document coverage from a partial call.

## Rewrite lines

Preserve factual claims, metrics, chronology, and the user's intended meaning. Draft revisions for all lines needing work, then call `audit_cv_document` once with the complete revised set. Repeat by batch until the requested lines fit.

Use `check_cv_candidates` only when the user supplied or requested two or more
alternative phrasings of one bullet. Never use it as an error-recovery path.
Re-measure the chosen wording in the final document audit.

Do not silently remove metrics or alter facts to gain space. Flag any wording tradeoff that requires user judgment.

## Interpret results

- `optimal`: one line and within the requested target band.
- `underfilled`: fits but falls below the target band.
- `multi-line`, `overflow`, or `hard-overflow`: revise or change the layout constraint.
- `invalid-input`: fix the extraction; do not count it as checked.
- font failure or incomplete coverage: stop and report that exact validation is unavailable.

The measurement is exact for the returned `metricsProfile`, supplied font,
styling, and pixel limit. It cannot guarantee matching pagination in a
different Word/PDF template unless that template's actual text-column width
and typography are supplied.
