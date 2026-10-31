/**
 * pdfReport.js — Visit Prep Packet as a real PDF
 *
 * A formatted one-to-two page document a clinician will actually read in
 * a 15-minute visit, replacing the raw-text share for appointments:
 *   1. The patient's own questions (first — they get squeezed out otherwise)
 *   2. 30-day symptom picture with a drawn trend chart
 *   3. Possible food triggers / what's been helping (from the diary analysis)
 *   4. Current medications (with start dates when recorded)
 *   5. Care team, key history and notes
 *   6. Labs / tests / imaging the user attached (list, plus the photos
 *      embedded at the end; attached PDFs are listed — jsPDF can't merge them)
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
import { localDateStr, daysAgoStr, dateKeyTs } from '../utils/dates';
import { listDocuments, getDocumentDataUrl, isImage, isPdf } from './healthDocuments';

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

/** Decode an image data URL and re-encode it as a modest JPEG (keeps the PDF small). */
function loadImageForPdf(dataUrl, maxPx = 1600) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxPx / Math.max(img.naturalWidth, img.naturalHeight));
      const w = Math.max(1, Math.round(img.naturalWidth * scale));
      const h = Math.max(1, Math.round(img.naturalHeight * scale));
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);
      resolve({ data: canvas.toDataURL('image/jpeg', 0.82), w, h });
    };
    img.onerror = () => resolve(null); // e.g. a format this WebView can't decode
    img.src = dataUrl;
  });
}

const fmtDate = (key) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key || '')) return key || '';
  return new Date(dateKeyTs(key)).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};

export async function generateVisitPacket({ medications, doctors, history, symptoms, flares, documents }) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  let y = 0;

  /** Simple table: teal header row + zebra rows (no plugin dependency). */
  const table = (cols, rows) => {
    const drawHeader = () => {
      let tx = MARGIN;
      doc.setFillColor(...TEAL);
      doc.rect(MARGIN, y, CONTENT_W, 6, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(255, 255, 255);
      cols.forEach(c => { doc.text(c.label, tx + 1.5, y + 4.2); tx += c.w; });
      y += 6;
      doc.setFont('helvetica', 'normal');
    };
    ensureSpace(14);
    drawHeader();
    rows.forEach((r, i) => {
      doc.setFontSize(8);
      const cellLines = cols.map(c => doc.splitTextToSize(String(c.get(r) ?? ''), c.w - 3));
      const rowH = Math.max(...cellLines.map(l => l.length)) * 3.6 + 2.6;
      if (y + rowH > PAGE_H - 16) { doc.addPage(); y = MARGIN; drawHeader(); }
      if (i % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(MARGIN, y, CONTENT_W, rowH, 'F');
      }
      let cx = MARGIN;
      doc.setFontSize(8);
      doc.setTextColor(...SLATE_DARK);
      cols.forEach((c, ci) => { doc.text(cellLines[ci], cx + 1.5, y + 3.6); cx += c.w; });
      y += rowH;
    });
    y += 3;
  };

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
  const cutoffStr = daysAgoStr(30);
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
      ts: dateKeyTs(e.date),
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
        .map(m => ({ name: m.name, ts: dateKeyTs(m.startDate) }))
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

  /* ── Recent check-ins (the raw entries behind the averages) ── */
  const recent = [...sorted].sort((a, b) => (b.date || '').localeCompare(a.date || '')).slice(0, 14);
  if (recent.length) {
    sectionHeader(`Recent Check-ins (last ${recent.length})`);
    const score = (v) => (toNum(v) === null ? '' : String(toNum(v)));
    const noteFor = (e) => [
      e.triggers && `Triggers: ${e.triggers}`,
      e.notes,
      e.practices?.length && `Helped: ${e.practices.join(', ')}`,
    ].filter(Boolean).join(' \u2014 ');
    table([
      { label: 'Date', w: 26, get: e => fmtDate(e.date) },
      { label: 'Pain', w: 12, get: e => score(e.pain) },
      { label: 'Fatigue', w: 15, get: e => score(e.fatigue) },
      { label: 'Sleep', w: 13, get: e => score(e.sleep) },
      { label: 'Mood', w: 26, get: e => e.mood || '' },
      { label: 'Notes', w: CONTENT_W - 26 - 12 - 15 - 13 - 26, get: noteFor },
    ], recent);
  }

  const recentFlares = (flares || []).filter(f => f?.date && f.date >= cutoffStr);
  if (recentFlares.length) {
    bodyText(
      `Flare days logged in the last 30 days: ${recentFlares.length} (${recentFlares.map(f => fmtDate(f.date)).join(', ')})`,
      { size: 8.5 }
    );
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
  if (history?.conditions || history?.allergies || history?.surgeries || history?.familyHistory) {
    sectionHeader('Key History');
    if (history.conditions) bodyText(`Conditions: ${history.conditions}`);
    if (history.allergies) bodyText(`Allergies: ${history.allergies}`);
    if (history.surgeries) bodyText(`Surgeries / procedures: ${history.surgeries}`);
    if (history.familyHistory) bodyText(`Family history: ${history.familyHistory}`);
  }
  if (history?.otherNotes?.trim()) {
    sectionHeader('Notes');
    bodyText(history.otherNotes.trim());
  }

  /* ── 7. Labs, tests & imaging ── */
  const docsList = (documents || []).slice().sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  if (docsList.length) {
    sectionHeader('Labs, Tests & Imaging');
    table([
      { label: 'Date', w: 28, get: d => fmtDate(d.date) },
      { label: 'Type', w: 22, get: d => d.type || '' },
      { label: 'Title', w: CONTENT_W - 28 - 22 - 34, get: d => d.title || '' },
      { label: 'File', w: 34, get: d => (isPdf(d) ? 'PDF (in app)' : isImage(d) ? 'Image (attached below)' : '') },
    ], docsList);
    if (docsList.some(isPdf)) {
      bodyText('PDF reports are kept in the app and can be shared separately from Health Tools > Labs & Imaging.', { size: 7.5, color: SLATE_LIGHT });
    }

    // Embed attached photos, each scaled to fit the page width.
    for (const d of docsList.filter(isImage)) {
      const dataUrl = await getDocumentDataUrl(d);
      const img = dataUrl ? await loadImageForPdf(dataUrl) : null;
      const caption = `${d.type || ''}: ${d.title || ''}${d.date ? ` (${fmtDate(d.date)})` : ''}`;
      if (!img) {
        bodyText(`${caption} \u2014 image could not be included.`, { size: 8 });
        continue;
      }
      const maxH = PAGE_H - 2 * MARGIN - 24;
      let w = CONTENT_W;
      let h = (img.h / img.w) * w;
      if (h > maxH) { h = maxH; w = (img.w / img.h) * h; }
      ensureSpace(h + 12);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(...SLATE_DARK);
      doc.text(doc.splitTextToSize(caption, CONTENT_W)[0], MARGIN, y + 3);
      y += 6;
      doc.addImage(img.data, 'JPEG', MARGIN, y, w, h);
      y += h + 6;
    }
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
  const documents = data.documents || await listDocuments().catch(() => []);
  const doc = await generateVisitPacket({ ...data, documents });
  const filename = `Resilient_Path_Visit_Packet_${localDateStr()}.pdf`;

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
