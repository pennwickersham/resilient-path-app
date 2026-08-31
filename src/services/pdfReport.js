/**
 * pdfReport.js — Visit Prep Packet as a real PDF
 *
 * A formatted one-to-two page document a clinician will actually read in
 * a 15-minute visit, replacing the raw-text share for appointments:
 *   1. The patient's own questions (first — they get squeezed out otherwise)
 *   2. 30-day symptom picture with a drawn trend chart
 *   3. Possible food triggers / what's been helping (from the diary analysis)
 *   4. Current medications (with start dates when recorded)
 *   5. Care team, key history
 *
 * Output handling:
 *   - Native: written to Documents via Filesystem (base64), then the system
 *     share sheet opens with the file so it can go straight to email/portal.
 *   - Web: standard browser download.
 *
 * Requires: npm install jspdf && npx cap sync
 */

import { jsPDF } from 'jspdf';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { validEntries, toNum, analyzeFoodTriggers, analyzePractices } from './symptomAnalysis';

/* Palette — matches the app's teal primary and slate secondaries. */
const TEAL = [13, 148, 136];
const SLATE_DARK = [15, 23, 42];
const SLATE = [71, 85, 105];
const SLATE_LIGHT = [148, 163, 184];
const GRID = [226, 232, 240];
const RED = [220, 38, 38];
const AMBER = [217, 119, 6];
const GREEN = [5, 150, 105];

const PAGE_W = 210, PAGE_H = 297; // A4 mm
const MARGIN = 18;
const CONTENT_W = PAGE_W - 2 * MARGIN;

export async function generateVisitPacket({ medications, doctors, history, symptoms }) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  let y = 0;

  const ensureSpace = (needed) => {
    if (y + needed > PAGE_H - 16) {
      doc.addPage();
      y = MARGIN;
    }
  };

  const sectionHeader = (label) => {
    ensureSpace(14);
    y += 4;
    doc.setFillColor(...TEAL);
    doc.rect(MARGIN, y, 1.6, 5.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...SLATE_DARK);
    doc.text(label, MARGIN + 4, y + 4.4);
    y += 9;
  };

  const bodyText = (text, { size = 9.5, color = SLATE, indent = 0, gap = 1.6 } = {}) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(size);
    doc.setTextColor(...color);
    const lines = doc.splitTextToSize(text, CONTENT_W - indent);
    for (const line of lines) {
      ensureSpace(5);
      doc.text(line, MARGIN + indent, y);
      y += 4.2;
    }
    y += gap;
  };

  /* ── Header band ── */
  doc.setFillColor(...TEAL);
  doc.rect(0, 0, PAGE_W, 26, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text('Appointment Visit Summary', MARGIN, 12);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const dateStr = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  doc.text(`Prepared ${dateStr} with the Resilient Path app`, MARGIN, 19);
  y = 34;

  /* ── 1. Questions ── */
  if (history?.visitQuestions?.trim()) {
    sectionHeader('My Questions for This Visit');
    history.visitQuestions.trim().split('\n').filter(Boolean).forEach((q, i) => {
      bodyText(`${i + 1}. ${q.trim()}`, { color: SLATE_DARK, gap: 0.8 });
    });
    y += 2;
  }

  /* ── 2. 30-day picture + chart ── */
  const sorted = validEntries(symptoms || []);
  const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 30);
  const cutoffStr = cutoff.toISOString().split('T')[0];
  const last30 = sorted.filter(e => e.date >= cutoffStr);

  if (last30.length > 0) {
    sectionHeader(`Last 30 Days (${last30.length} check-ins)`);

    const avgOf = (key) => {
      const xs = last30.map(e => toNum(e[key])).filter(v => v !== null);
      return xs.length ? xs.reduce((a, v) => a + v, 0) / xs.length : null;
    };
    const stats = [
      ['Average pain', avgOf('pain'), RED],
      ['Average fatigue', avgOf('fatigue'), AMBER],
      ['Average sleep quality', avgOf('sleep'), GREEN],
    ].filter(([, v]) => v !== null);

    // Stat chips row
    ensureSpace(16);
    let cx = MARGIN;
    stats.forEach(([label, v, color]) => {
      const w = 56;
      doc.setDrawColor(...GRID);
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(cx, y, w, 12, 2, 2, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(...color);
      doc.text(`${v.toFixed(1)}/10`, cx + 3, y + 5.4);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(...SLATE);
      doc.text(label, cx + 3, y + 9.8);
      cx += w + 3;
    });
    y += 16;

    // Trend chart (drawn, not rasterized — crisp at any zoom)
    const chartPts = last30.map(e => ({
      ts: Date.parse(e.date),
      pain: toNum(e.pain), fatigue: toNum(e.fatigue), sleep: toNum(e.sleep),
    })).sort((a, b) => a.ts - b.ts);

    if (chartPts.length >= 2) {
      const CH = 42, CW = CONTENT_W;
      ensureSpace(CH + 14);
      const t0 = chartPts[0].ts, t1 = chartPts[chartPts.length - 1].ts;
      const px = (ts) => MARGIN + ((ts - t0) / Math.max(1, t1 - t0)) * CW;
      const py = (v) => y + CH - (v / 10) * CH;

      // Gridlines 0/5/10
      doc.setDrawColor(...GRID);
      doc.setLineWidth(0.2);
      [0, 5, 10].forEach(v => {
        doc.line(MARGIN, py(v), MARGIN + CW, py(v));
        doc.setFontSize(6.5);
        doc.setTextColor(...SLATE_LIGHT);
        doc.text(String(v), MARGIN + CW + 1.5, py(v) + 1);
      });

      const series = [
        ['pain', RED], ['fatigue', AMBER], ['sleep', GREEN],
      ];
      doc.setLineWidth(0.5);
      series.forEach(([key, color]) => {
        const pts = chartPts.filter(p => p[key] !== null);
        if (pts.length < 2) return;
        doc.setDrawColor(...color);
        for (let i = 1; i < pts.length; i++) {
          doc.line(px(pts[i - 1].ts), py(pts[i - 1][key]), px(pts[i].ts), py(pts[i][key]));
        }
      });

      // Medication start-date markers on the timeline — the overlay that
      // turns a symptom diary into treatment-decision evidence.
      const medStarts = (medications || [])
        .filter(m => m.name && m.startDate && /^\d{4}-\d{2}-\d{2}$/.test(m.startDate))
        .map(m => ({ name: m.name, ts: Date.parse(m.startDate) }))
        .filter(m => m.ts >= t0 && m.ts <= t1);
      doc.setLineWidth(0.35);
      medStarts.forEach(m => {
        doc.setDrawColor(...TEAL);
        doc.setLineDashPattern([1.2, 1.2], 0);
        doc.line(px(m.ts), y, px(m.ts), y + CH);
        doc.setLineDashPattern([], 0);
        doc.setFontSize(6);
        doc.setTextColor(...TEAL);
        doc.text(`${m.name} started`, px(m.ts) + 1, y + 3, { maxWidth: 30 });
      });

      // Legend + date range
      y += CH + 4;
      doc.setFontSize(7);
      let lx = MARGIN;
      [['Pain', RED], ['Fatigue', AMBER], ['Sleep', GREEN]].forEach(([label, color]) => {
        doc.setFillColor(...color);
        doc.circle(lx + 1.2, y - 1, 1.2, 'F');
        doc.setTextColor(...SLATE);
        doc.text(label, lx + 3.5, y);
        lx += doc.getTextWidth(label) + 10;
      });
      const fd = (ts) => new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      doc.setTextColor(...SLATE_LIGHT);
      doc.text(`${fd(t0)} \u2013 ${fd(t1)}`, MARGIN + CW, y, { align: 'right' });
      y += 5;
    }

    // Worst day callout
    const worst = last30.reduce((w, e) => (toNum(e.pain) ?? -1) > (toNum(w.pain) ?? -1) ? e : w, last30[0]);
    if (toNum(worst.pain) !== null) {
      bodyText(
        `Worst pain day: ${worst.date} (${toNum(worst.pain)}/10${worst.triggers ? `; possible triggers: ${worst.triggers}` : ''})`,
        { size: 8.5 }
      );
    }
  }

  /* ── 3. Patterns from tracking ── */
  const fa = analyzeFoodTriggers(symptoms || []);
  const suspects = fa.ready ? fa.results.filter(r => r.delta >= 1).slice(0, 4) : [];
  if (suspects.length) {
    sectionHeader('Possible Food Triggers (from my food diary)');
    suspects.forEach(r => {
      bodyText(
        `\u2022 ${r.food}: symptom burden avg ${r.expAvg.toFixed(1)} the ${r.window} vs ${r.nonAvg.toFixed(1)} otherwise (${r.timesEaten} days)`,
        { gap: 0.6 }
      );
    });
    bodyText('Patterns from self-tracking, not a diagnosis.', { size: 7.5, color: SLATE_LIGHT });
  }

  const pa = analyzePractices(symptoms || []);
  const helpers = pa.ready ? pa.results.filter(r => r.benefit >= 1).slice(0, 4) : [];
  if (helpers.length) {
    sectionHeader('What Seems to Help');
    helpers.forEach(r => {
      bodyText(
        `\u2022 ${r.practice}: symptom burden avg ${r.benefit.toFixed(1)} points lower on practice days (${r.timesDone} days)`,
        { gap: 0.6 }
      );
    });
  }

  /* ── 4. Medications ── */
  const meds = (medications || []).filter(m => m.name || m.dose);
  if (meds.length) {
    sectionHeader('Current Medications');
    // Simple table: header row + zebra rows, drawn manually to avoid a
    // plugin dependency.
    const cols = [
      { label: 'Medication', w: 44, get: m => m.name || '' },
      { label: 'Dose', w: 24, get: m => m.dose || '' },
      { label: 'Frequency', w: 30, get: m => m.frequency || '' },
      { label: 'Started', w: 24, get: m => m.startDate || '' },
      { label: 'Purpose', w: CONTENT_W - 44 - 24 - 30 - 24, get: m => m.purpose || '' },
    ];
    ensureSpace(8);
    let tx = MARGIN;
    doc.setFillColor(...TEAL);
    doc.rect(MARGIN, y, CONTENT_W, 6, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    cols.forEach(c => { doc.text(c.label, tx + 1.5, y + 4.2); tx += c.w; });
    y += 6;
    doc.setFont('helvetica', 'normal');
    meds.forEach((m, i) => {
      const cellLines = cols.map(c => doc.splitTextToSize(c.get(m), c.w - 3));
      const rowH = Math.max(...cellLines.map(l => l.length)) * 3.6 + 2.6;
      ensureSpace(rowH);
      if (i % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(MARGIN, y, CONTENT_W, rowH, 'F');
      }
      let cx2 = MARGIN;
      doc.setFontSize(8);
      doc.setTextColor(...SLATE_DARK);
      cols.forEach((c, ci) => {
        doc.text(cellLines[ci], cx2 + 1.5, y + 3.6);
        cx2 += c.w;
      });
      y += rowH;
      if (m.sideEffects) {
        ensureSpace(5);
        doc.setFontSize(7.5);
        doc.setTextColor(...AMBER);
        doc.text(`Side effects noted: ${m.sideEffects}`, MARGIN + 1.5, y + 3, { maxWidth: CONTENT_W - 3 });
        y += 5;
      }
    });
    y += 2;
  }

  /* ── 5. Care team ── */
  const docs = (doctors || []).filter(d => d.name || d.specialty);
  if (docs.length) {
    sectionHeader('My Care Team');
    docs.forEach(d => {
      const parts = [d.name, d.specialty, d.phone].filter(Boolean).join('  \u00b7  ');
      bodyText(parts, { color: SLATE_DARK, gap: 0.4 });
      if (d.notes) bodyText(d.notes, { size: 8, indent: 3, gap: 1 });
    });
  }

  /* ── 6. Key history ── */
  if (history?.conditions || history?.allergies) {
    sectionHeader('Key History');
    if (history.conditions) bodyText(`Conditions: ${history.conditions}`);
    if (history.allergies) bodyText(`Allergies: ${history.allergies}`);
  }

  /* ── Footer on every page ── */
  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...SLATE_LIGHT);
    doc.text(
      'Self-tracked data prepared by the patient with the Resilient Path app. Not a medical record.',
      MARGIN, PAGE_H - 8
    );
    doc.text(`Page ${p} of ${pages}`, PAGE_W - MARGIN, PAGE_H - 8, { align: 'right' });
  }

  return doc;
}

/** Generate, save, and (on native) open the share sheet. Returns filename. */
export async function saveAndShareVisitPacket(data) {
  const doc = await generateVisitPacket(data);
  const filename = `Resilient_Path_Visit_Packet_${new Date().toISOString().split('T')[0]}.pdf`;

  if (Capacitor.isNativePlatform()) {
    const base64 = doc.output('datauristring').split(',')[1];
    const written = await Filesystem.writeFile({
      path: filename,
      data: base64,
      directory: Directory.Documents,
      recursive: true,
    });
    try {
      await Share.share({
        title: 'Visit Packet',
        url: written.uri,
        dialogTitle: 'Share Visit Packet',
      });
    } catch { /* user dismissed the sheet — the file is still saved */ }
  } else {
    doc.save(filename);
  }
  return filename;
}
