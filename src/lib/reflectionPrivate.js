import { base44 } from '@/api/base44Client';

/**
 * Datenschutz: DailyReflection läuft ausschließlich über die Backend-Function
 * `secureDailyReflection`, die serverseitig user === currentUser.id erzwingt.
 * Kein anderer Benutzer (auch kein Admin) erhält Zugriff auf fremde Reflexionen.
 * AuditLog speichert NUR Datum + Mood, niemals Reflexionstexte.
 */
export async function loadMyReflections(date) {
  const res = await base44.functions.invoke('secureDailyReflection', { action: 'list' });
  const all = res.data?.reflections || [];
  return all.filter(r => !date || r.reflection_date === date);
}

export async function getMyReflection(id) {
  const res = await base44.functions.invoke('secureDailyReflection', { action: 'get', id });
  return res.data?.reflection || null;
}

export async function saveMyReflection(data) {
  const payload = {
    action: data.id ? 'update' : 'create',
    id: data.id,
    reflection_date: data.reflection_date,
    mood: data.mood,
    what_went_well: data.what_went_well,
    what_was_difficult: data.what_was_difficult,
    what_was_learned: data.what_was_learned,
    change_for_tomorrow: data.change_for_tomorrow,
  };
  const res = await base44.functions.invoke('secureDailyReflection', payload);
  return res.data?.reflection;
}