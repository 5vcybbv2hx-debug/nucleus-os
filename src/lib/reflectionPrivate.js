import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

/**
 * Datenschutz: DailyReflection ist strikt privat — kein anderer Benutzer
 * hat Zugriff, auch nicht als Admin. Diese Funktion erzwingt den Filter
 * user === currentUser.id bei JEDEM Zugriff auf DailyReflection.
 */
export async function loadMyReflections(date) {
  const user = await base44.auth.me();
  if (!user) return [];
  const all = await base44.entities.DailyReflection.list();
  // Strikt: nur eigene Reflexionen — niemals fremde, auch nicht als Admin
  return all.filter(r => r.user === user.id && (!date || r.reflection_date === date));
}

export async function saveMyReflection(data) {
  const user = await base44.auth.me();
  if (!user) throw new Error('Nicht angemeldet');
  // private ist IMMER true und kann nicht geändert werden
  const payload = { ...data, user: user.id, private: true };
  if (payload.id) {
    // Bearbeiten — nur eigene
    const existing = await base44.entities.DailyReflection.get(payload.id);
    if (existing.user !== user.id) throw new Error('Kein Zugriff auf fremde Reflexion');
    const { id, ...rest } = payload;
    return base44.entities.DailyReflection.update(id, rest);
  }
  return base44.entities.DailyReflection.create(payload);
}