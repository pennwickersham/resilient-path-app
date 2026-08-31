/**
 * progress.js — Workbook module progress
 *
 * Tracks two things, stored under STORAGE_KEYS.PROGRESS:
 *   completed:   { [moduleId]: 'YYYY-MM-DD' }  — when the user marked it done
 *   lastVisited: moduleId                       — resume point for Home
 *
 * "Complete" is the user's own call (a Mark Complete button), not an
 * automatic heuristic — chronic pain readers revisit modules constantly
 * and auto-completion would be wrong as often as right.
 */

import storage, { STORAGE_KEYS } from './storage';
import { workbookData } from '../data/workbookForms';

const EMPTY = { completed: {}, lastVisited: null };

export async function getProgress() {
  const p = await storage.get(STORAGE_KEYS.PROGRESS);
  if (!p || typeof p !== 'object') return { ...EMPTY };
  return { completed: p.completed || {}, lastVisited: p.lastVisited ?? null };
}

export async function toggleModuleComplete(moduleId) {
  const p = await getProgress();
  const key = String(moduleId);
  if (p.completed[key]) delete p.completed[key];
  else p.completed[key] = new Date().toISOString().split('T')[0];
  await storage.set(STORAGE_KEYS.PROGRESS, p);
  return p;
}

export async function setLastVisited(moduleId) {
  const p = await getProgress();
  p.lastVisited = moduleId;
  await storage.set(STORAGE_KEYS.PROGRESS, p);
}

/** Summary for the Home progress card: counts + where to resume. */
export function summarizeProgress(p) {
  const total = workbookData.length;
  const done = Object.keys(p.completed || {}).length;
  // Resume: last visited if not complete, else first incomplete module.
  let resume = p.lastVisited;
  if (!resume || p.completed[String(resume)]) {
    const next = workbookData.find(m => !p.completed[String(m.moduleId)]);
    resume = next ? next.moduleId : null;
  }
  const resumeTitle = resume
    ? (workbookData.find(m => m.moduleId === resume)?.title || '').replace(/^Module \d+: /, '')
    : null;
  return { total, done, pct: Math.round((done / total) * 100), resume, resumeTitle };
}
