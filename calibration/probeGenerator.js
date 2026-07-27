import { measureCvLine } from '../src/engine/measurementEngine.js';

export const FIELD_PROFILES = {
  'LARGE-A': { name: 'Large Width Field (Historical ~599px)', historicalLimitPx: 599.0 },
  'SMALL-A': { name: 'Smaller Width Field (Historical ~559px)', historicalLimitPx: 559.0 },
  'ACADEMIC-WIDE': { name: 'Academic Wide Field (Historical ~677.7px)', historicalLimitPx: 677.67 }
};

/**
 * Generate structured probes across Phase 1 to 7 plus adaptive binary search probes
 */
export function generateProbeCatalog(profileId = 'LARGE-A') {
  const targetPx = FIELD_PROFILES[profileId]?.historicalLimitPx || 599.0;
  const probes = [];

  // Phase 1: Historical Boundary Probes
  const p1Texts = [
    { text: 'Engineered automated data pipelines using Python & SQL to boost throughput', tag: 'approx-570' },
    { text: 'Optimised customer onboarding workflows and standard operating procedures across teams', tag: 'approx-580' },
    { text: 'Led a cross-functional team to deliver the digital transformation project 2 weeks ahead of timeline', tag: 'approx-590' },
    { text: 'Coordinated administration & execution for the National Policy Summit, managing 50+ key stakeholders.', tag: 'approx-595' },
    { text: 'Spearheaded digital marketing campaigns, expanding qualified leads by 45% & reducing CAC by 18% overall', tag: 'approx-599' },
    { text: 'Architected cloud migration for enterprise databases, freeing $120K annual spend & boosting uptime to 99.9% target', tag: 'approx-605' },
    { text: 'Formulated comprehensive strategic operational roadmaps to drive cross-departmental alignment & long-term growth', tag: 'approx-610' }
  ];

  p1Texts.forEach((item, idx) => {
    const meas = measureCvLine({ text: item.text, maxWidthPx: targetPx });
    probes.push({
      id: `${profileId}-P1-${String(idx + 1).padStart(3, '0')}`,
      phase: 1,
      phaseName: 'Phase 1: Historical Boundary Probes',
      profile: profileId,
      text: item.text,
      segments: [{ text: item.text, bold: false }],
      formattingInstruction: 'Entire line regular (no bold)',
      engineWidthPx: meas.widthPx,
      historicalTargetPx: targetPx,
      tag: item.tag
    });
  });

  // Phase 2: Repeated Character Probes
  const charTests = [
    { char: 'W', count: 42, label: 'Wide-W' },
    { char: 'M', count: 44, label: 'Wide-M' },
    { char: '8', count: 68, label: 'Wide-Digit-8' },
    { char: 'a', count: 85, label: 'Medium-a' },
    { char: 'e', count: 88, label: 'Medium-e' },
    { char: 'i', count: 175, label: 'Narrow-i' },
    { char: 'l', count: 180, label: 'Narrow-l' },
    { char: '1', count: 130, label: 'Narrow-Digit-1' }
  ];

  charTests.forEach((item, idx) => {
    const str = item.char.repeat(item.count);
    const meas = measureCvLine({ text: str, maxWidthPx: targetPx });
    probes.push({
      id: `${profileId}-P2-${String(idx + 1).padStart(3, '0')}`,
      phase: 2,
      phaseName: 'Phase 2: Repeated Character Probes',
      profile: profileId,
      text: str,
      segments: [{ text: str, bold: false }],
      formattingInstruction: 'Entire line regular (no bold)',
      engineWidthPx: meas.widthPx,
      historicalTargetPx: targetPx,
      tag: item.label
    });
  });

  // Phase 3: Alternating Character & Alphanumeric Cycles
  const alternating = [
    { text: 'WMWMWMWMWMWMWMWMWMWMWMWMWMWMWMWMWMWMWM', label: 'WM-Alternating' },
    { text: 'WiWiWiWiWiWiWiWiWiWiWiWiWiWiWiWiWiWiWiWiWiWiWiWiWiWiWiWiWi', label: 'Wi-Alternating' },
    { text: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789', label: 'Alphabet-Digits' }
  ];

  alternating.forEach((item, idx) => {
    const meas = measureCvLine({ text: item.text, maxWidthPx: targetPx });
    probes.push({
      id: `${profileId}-P3-${String(idx + 1).padStart(3, '0')}`,
      phase: 3,
      phaseName: 'Phase 3: Alphanumeric & Alternating Probes',
      profile: profileId,
      text: item.text,
      segments: [{ text: item.text, bold: false }],
      formattingInstruction: 'Entire line regular (no bold)',
      engineWidthPx: meas.widthPx,
      historicalTargetPx: targetPx,
      tag: item.label
    });
  });

  // Phase 4: Symbols & Numeric Scope Patterns
  const symbolTexts = [
    { text: '₹₹₹₹₹₹₹₹₹₹₹₹₹₹₹₹₹₹₹₹₹₹₹₹₹₹₹₹₹₹₹₹₹₹₹₹₹₹₹₹₹₹₹₹₹₹', label: 'Rupee-Symbol-Repeat' },
    { text: '%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%', label: 'Percent-Symbol-Repeat' },
    { text: '++++++++++++++++++++++++++++++++++++++++++++++', label: 'Plus-Symbol-Repeat' },
    { text: '&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&', label: 'Ampersand-Repeat' },
    { text: 'Led team to secure ₹4.8L+ & ₹12L+ across 15% ROI growth w/ 250+ partners', label: 'Numeric-Scope-Pattern' }
  ];

  symbolTexts.forEach((item, idx) => {
    const meas = measureCvLine({ text: item.text, maxWidthPx: targetPx });
    probes.push({
      id: `${profileId}-P4-${String(idx + 1).padStart(3, '0')}`,
      phase: 4,
      phaseName: 'Phase 4: Symbols & Punctuation Probes',
      profile: profileId,
      text: item.text,
      segments: [{ text: item.text, bold: false }],
      formattingInstruction: 'Entire line regular (no bold)',
      engineWidthPx: meas.widthPx,
      historicalTargetPx: targetPx,
      tag: item.label
    });
  });

  // Phase 5: Bold Proportions & Mixed Formatting
  const mixedProbes = [
    {
      text: 'Led a cross-functional team to improve delivery efficiency by 27%',
      segments: [
        { text: 'Led a cross-functional team', bold: true },
        { text: ' to improve delivery efficiency by ', bold: false },
        { text: '27%', bold: true }
      ],
      boldPct: '25%',
      label: 'Mixed-25-Bold'
    },
    {
      text: 'Engineered automated data pipelines using Python & SQL, accelerating reporting TAT by 35% & boosting overall efficiency by 28%',
      segments: [
        { text: 'Engineered automated ', bold: false },
        { text: 'data pipelines', bold: true },
        { text: ' using ', bold: false },
        { text: 'Python & SQL', bold: true },
        { text: ', accelerating ', bold: false },
        { text: 'reporting TAT by 35%', bold: true },
        { text: ' & boosting overall ', bold: false },
        { text: 'efficiency by 28%', bold: true }
      ],
      boldPct: '50%',
      label: 'Mixed-50-Bold'
    },
    {
      text: 'SPEARHEADED DIGITAL TRANSFORMATION AND CLOUD MIGRATION FOR ENTERPRISE DATABASES ACROSS MULTIPLE WORKSTREAMS',
      segments: [
        { text: 'SPEARHEADED DIGITAL TRANSFORMATION AND CLOUD MIGRATION FOR ENTERPRISE DATABASES ACROSS MULTIPLE WORKSTREAMS', bold: true }
      ],
      boldPct: '100%',
      label: '100-Bold-All'
    }
  ];

  mixedProbes.forEach((item, idx) => {
    const meas = measureCvLine({ text: item.text, segments: item.segments, maxWidthPx: targetPx });
    probes.push({
      id: `${profileId}-P5-${String(idx + 1).padStart(3, '0')}`,
      phase: 5,
      phaseName: 'Phase 5: Bold & Mixed-Formatting Probes',
      profile: profileId,
      text: item.text,
      segments: item.segments,
      formattingInstruction: `Apply bold to: ${item.segments.filter(s=>s.bold).map(s=>'"'+s.text+'"').join(', ')}`,
      engineWidthPx: meas.widthPx,
      historicalTargetPx: targetPx,
      tag: item.label
    });
  });

  // Phase 6: Differential Pair Probes
  const diffPairs = [
    { text1: 'Operational Efficiency And Inventory Planning', text2: 'Operational Efficiency & Inventory Planning', label: 'And-vs-Ampersand' },
    { text1: 'Improved Delivery Time By 27 Percent', text2: 'Improved Delivery Time By 27%', label: 'Percent-Word-vs-Symbol' },
    { text1: 'Secured Rs 4.8L Sponsorship', text2: 'Secured ₹4.8L Sponsorship', label: 'Rs-vs-Rupee' }
  ];

  diffPairs.forEach((item, idx) => {
    const meas1 = measureCvLine({ text: item.text1, maxWidthPx: targetPx });
    const meas2 = measureCvLine({ text: item.text2, maxWidthPx: targetPx });
    probes.push({
      id: `${profileId}-P6-${String(idx * 2 + 1).padStart(3, '0')}`,
      phase: 6,
      phaseName: 'Phase 6: Differential Pair Probes',
      profile: profileId,
      text: item.text1,
      segments: [{ text: item.text1, bold: false }],
      formattingInstruction: 'Entire line regular (no bold)',
      engineWidthPx: meas1.widthPx,
      historicalTargetPx: targetPx,
      tag: `${item.label}-VariantA`
    });
    probes.push({
      id: `${profileId}-P6-${String(idx * 2 + 2).padStart(3, '0')}`,
      phase: 6,
      phaseName: 'Phase 6: Differential Pair Probes',
      profile: profileId,
      text: item.text2,
      segments: [{ text: item.text2, bold: false }],
      formattingInstruction: 'Entire line regular (no bold)',
      engineWidthPx: meas2.widthPx,
      historicalTargetPx: targetPx,
      tag: `${item.label}-VariantB`
    });
  });

  // Phase 7: Progressive Word Token Probes
  const tokens = ['Q1A', 'Q2BB', 'Q3CCC', 'Q4DDDD', 'Q5EEEEE', 'Q6FFFFFF', 'Q7GGGGGGG', 'Q8HHHHHHHH', 'Q9IIIIIIIII', 'Q10JJJJJJJJJJ'];
  let runningText = '';
  tokens.forEach((tok, idx) => {
    runningText = runningText ? `${runningText} ${tok}` : tok;
    const meas = measureCvLine({ text: runningText, maxWidthPx: targetPx });
    probes.push({
      id: `${profileId}-P7-${String(idx + 1).padStart(3, '0')}`,
      phase: 7,
      phaseName: 'Phase 7: Progressive Word Token Probes',
      profile: profileId,
      text: runningText,
      segments: [{ text: runningText, bold: false }],
      formattingInstruction: 'Entire line regular (no bold)',
      engineWidthPx: meas.widthPx,
      historicalTargetPx: targetPx,
      tag: `Token-Count-${idx + 1}`
    });
  });

  return probes;
}

/**
 * Calculate adaptive midpoint probe between largest fit and smallest wrap
 */
export function generateAdaptiveMidpointProbe(profileId, largestFitPx, smallestWrapPx, stepIndex = 1) {
  const midWidthPx = (largestFitPx + smallestWrapPx) / 2;
  const targetChars = Math.round(midWidthPx / 5.5);
  const base = 'Coordinated administration & execution for the National Policy Summit, managing key stakeholders ';
  let text = base;
  while (measureCvLine({ text }).widthPx < midWidthPx && text.length < 200) {
    text += 'and driving impact ';
  }

  const meas = measureCvLine({ text });
  return {
    id: `${profileId}-P8-MID-${String(stepIndex).padStart(2, '0')}`,
    phase: 8,
    phaseName: 'Phase 8: Adaptive Binary Search Midpoint Probe',
    profile: profileId,
    text,
    segments: [{ text, bold: false }],
    formattingInstruction: 'Entire line regular (no bold)',
    engineWidthPx: meas.widthPx,
    historicalTargetPx: FIELD_PROFILES[profileId]?.historicalLimitPx || 599.0,
    tag: `BinarySearch-Mid-${meas.widthPx.toFixed(1)}px`
  };
}
