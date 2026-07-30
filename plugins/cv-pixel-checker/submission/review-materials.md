# CV Pixel Checker — directory submission materials

## Listing

- **Display name:** CV Pixel Checker
- **Version:** 1.3.0
- **Developer:** Adarsh Nayan
- **Category:** Productivity
- **Short description:** Exact CV line-width audits
- **Website:** https://cv-pixel-checker.vercel.app/
- **Support:** https://cv-pixel-checker.vercel.app/support.html
- **LinkedIn:** https://www.linkedin.com/in/adarsh-nayan
- **Privacy:** https://cv-pixel-checker.vercel.app/privacy.html
- **Terms:** https://cv-pixel-checker.vercel.app/terms.html

### Long description

Measure one CV bullet or audit an entire resume in a deterministic batch using
the bundled EB Garamond 9.75 pt renderer. CV Pixel Checker preserves Unicode,
punctuation, bold runs, template-specific widths, and source order; reports
authoritative CSS-pixel measurements; detects overflow, wrapping, and orphan
spillover; and verifies complete document coverage before reporting results.

## Starter prompts

1. Audit every bullet in my attached CV.
2. Rewrite these CV points to fit their exact widths.
3. Check this resume and report every line that overflows.

## MCP

- **URL type:** Universal
- **Production URL:** https://cv-pixel-checker.vercel.app/mcp
- **Authentication:** None
- **Custom UI:** None
- **Data handling:** Read-only rendered-width computation; no application database.

## Tool annotations and justifications

All three tools compute measurements and do not change application, user, or
public state.

| Tool | readOnlyHint | openWorldHint | destructiveHint | Justification |
| --- | --- | --- | --- | --- |
| `check_cv_line` | `true` | `false` | `false` | Computes and returns one deterministic measurement; performs no write or external action. |
| `audit_cv_document` | `true` | `false` | `false` | Computes a source-order batch audit; performs no write or external action. |
| `check_cv_candidates` | `true` | `false` | `false` | Compares supplied wording candidates; performs no write or external action. |

## Positive test cases

### 1. Exact single-line measurement

- **Prompt:** Measure `Boosted ROIC by 33% & cut quality costs 19% from ₹3.2L to ₹2.6L/month by deploying Six Sigma & lean Kanban` at 559 px.
- **Expected behavior:** Call `check_cv_line` exactly once and preserve every Unicode character and punctuation mark.
- **Expected result shape:** Authoritative width, rendered style, capacity, line count, fit status, and trim/orphan details.

### 2. Styled line with bold runs

- **Prompt:** Measure my 599 px CV bullet while preserving the supplied bold phrases.
- **Expected behavior:** Call `check_cv_line` with exact `segments`; do not strip or infer bold text.
- **Expected result shape:** `authoritativeWidthPx`, `renderedStyle`, `lineCount`, `status`, and `measurementContract`.

### 3. Complete attached-CV audit

- **Prompt:** Audit every bullet in my attached CV and report all overflow.
- **Expected behavior:** Extract all intended bullets, assign stable IDs, and call `audit_cv_document` once.
- **Expected result shape:** `coverageComplete=true`, equal submitted/measured counts, summary totals, and source-order results.

### 4. Mixed template widths

- **Prompt:** Audit these experience, responsibility, and academic bullets against their respective section widths.
- **Expected behavior:** Use a matching preset or explicit width per line in one document audit.
- **Expected result shape:** Per-line preset/limit, width, utilization, line count, status, and revision need.

### 5. Candidate comparison

- **Prompt:** Compare these three rewrites of one CV bullet and select the closest valid 98–100% fit.
- **Expected behavior:** Call `check_cv_candidates` once with only the supplied alternatives.
- **Expected result shape:** All candidate measurements and the best valid candidate ID.

## Negative test cases

### 1. Missing text

- **Scenario:** The user asks for a width but provides no CV text.
- **Expected behavior:** Ask for the exact line; do not call a measurement tool and do not estimate.
- **Why:** Exact input is required for deterministic measurement.

### 2. Unsupported document claim

- **Scenario:** A document contains more lines than were extracted or returned.
- **Expected behavior:** Do not claim full coverage; report incomplete extraction or tool coverage.
- **Why:** Silent partial audits would mislead the user.

### 3. Font failure

- **Scenario:** The result reports `fontReady=false`, fallback use, or substituted typography.
- **Expected behavior:** Stop and say exact measurement is unavailable; do not retry through another tool or invent a width.
- **Why:** A fallback renderer would violate the authoritative measurement contract.

## Initial release notes

Initial public submission of CV Pixel Checker 1.3.0. This release provides
authoritative EB Garamond CV line measurement, whole-document deterministic
batch audits, exact bold-run preservation, orphan/overflow diagnostics,
candidate comparison, complete-coverage validation, refreshed branding,
publisher identity, and public privacy, terms, support, and LinkedIn contact
pages.

## Submission prerequisites that must be completed in the portal

1. Select the verified individual developer identity for Adarsh Nayan.
2. Scan the production MCP server and review all discovered tool metadata.
3. Use the generated domain challenge token with the
   `OPENAI_APPS_CHALLENGE` production environment variable.
4. Add a reviewer-accessible demo recording showing the three main tools.
5. Select only countries or regions where support and legal terms are ready.
6. Complete the required policy attestations after reviewing the final draft.
