import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { Server, Wifi, Loader2, ChevronRight, Shield, Users, Eye, EyeOff, Check, FolderOpen, RefreshCw } from 'lucide-react';
import { ROLES } from '@/lib/constants';
import { format } from 'date-fns';
import NasFolderBrowser from '@/components/nas/NasFolderBrowser';
import NasSyncSettings from '@/components/nas/NasSyncSettings';

export default function Settings() {
  const { user } = useCurrentUser();
  const [activeSection, setActiveSection] = useState('');
  const isSuperAdmin = user?.role === 'SUPERADMIN' || user?.role === 'admin';

  const sections = [
    { key: 'nas', icon: Server, label: 'NAS / Synology', subtitle: 'WebDAV Verbindung', adminOnly: true },
    { key: 'roles', icon: Shield, label: 'Rollen & Rechte', subtitle: 'Team-Mitglieder verwalten', adminOnly: true },
    { key: 'profile', icon: Users, label: 'Mein Profil', subtitle: 'Name, E-Mail, Rolle', adminOnly: false },
  ];

  return (
    <div className="px-4 pt-14 pb-4">
      <div className="mb-6">
        <h1 className="text-xl font-semibold">Einstellungen</h1>
        <p className="text-xs text-muted-foreground mt-0.5">{user?.full_name} · {ROLES[user?.role]?.label || user?.role}</p>
      </div>

      <div className="space-y-2 mb-6">
        {sections
          .filter(s => !s.adminOnly || isSuperAdmin)
          .map(({ key, icon: Icon, label, subtitle }) => (
          <button
            key={key}
            onClick={() => setActiveSection(p => p === key ? '' : key)}
            className="w-full flex items-center gap-3 p-4 bg-card border border-border rounded-2xl hover:bg-secondary/30 transition-all text-left"
          >
            <div className="p-2 bg-primary/10 rounded-xl flex-shrink-0">
              <Icon size={18} className="text-primary" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium">{label}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{subtitle}</div>
            </div>
            <ChevronRight size={16} className={`text-muted-foreground transition-transform ${activeSection === key ? 'rotate-90' : ''}`} />
          </button>
        ))}
      </div>

      {activeSection === 'nas' && <NasConfig />}
      {activeSection === 'roles' && <RolesSection currentUser={user} />}
      {activeSection === 'profile' && <ProfileSection user={user} />}

      {/* Version */}
      <div className="text-center text-xs text-muted-foreground/50 mt-8">
        BackOffice OS · MVP v1.0
      </div>
    </div>
  );
}

function NasConfig() {
  const [config, setConfig] = useState({ nasUrl: '', nasUsername: '', nasPassword: '', basePath: '/Backoffice' });
  const [saved, setSaved] = useState(null);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [showPw, setShowPw] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('verbindung'); // verbindung | browser | sync

  const loadConfig = async () => {
    const configs = await base44.entities.NasConfig.list();
    if (configs[0]) {
      setSaved(configs[0]);
      setConfig({
        nasUrl: configs[0].nasUrl || '',
        nasUsername: configs[0].nasUsername || '',
        nasPassword: configs[0].nasPassword || '',
        basePath: configs[0].basePath || '/Backoffice',
      });
    }
  };

  useEffect(() => { loadConfig(); }, []);

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    const res = await base44.functions.invoke('nasConnect', config);
    setTestResult(res.data);
    setTesting(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const data = { ...config, connectionStatus: 'connected' };
    if (saved) {
      await base44.entities.NasConfig.update(saved.id, data);
    } else {
      await base44.entities.NasConfig.create(data);
    }
    const updated = await base44.entities.NasConfig.list();
    setSaved(updated[0]);
    setSaving(false);
  };

  const tabs = [
    { key: 'verbindung', label: 'Verbindung' },
    { key: 'browser', label: 'Ordner', disabled: !saved },
    { key: 'sync', label: 'Auto-Sync', disabled: !saved },
  ];

  return (
    <div className="bg-card border border-border rounded-2xl p-4 mb-4 space-y-4">
      <h3 className="text-sm font-semibold flex items-center gap-2">
        <Server size={16} className="text-primary" />
        Synology NAS / WebDAV
        {saved?.connectionStatus === 'connected' && (
          <span className="ml-auto flex items-center gap-1 text-[10px] text-green-400 font-normal">
            <Wifi size={10} /> Verbunden
          </span>
        )}
      </h3>

      {/* Tabs */}
      <div className="flex gap-1 bg-secondary/30 rounded-xl p-1">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => !t.disabled && setActiveTab(t.key)}
            disabled={t.disabled}
            className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === t.key
                ? 'bg-card text-foreground shadow-sm'
                : t.disabled
                  ? 'text-muted-foreground/40 cursor-not-allowed'
                  : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab: Verbindung */}
      {activeTab === 'verbindung' && (
        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground font-medium">NAS URL (WebDAV)</label>
            <input
              value={config.nasUrl}
              onChange={e => setConfig(p => ({ ...p, nasUrl: e.target.value }))}
              className="w-full mt-1 bg-input border border-border text-foreground text-sm rounded-xl px-3 py-2.5 font-mono"
              placeholder="https://meinenas.synology.me:5006/dav"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground font-medium">Benutzername</label>
              <input
                value={config.nasUsername}
                onChange={e => setConfig(p => ({ ...p, nasUsername: e.target.value }))}
                className="w-full mt-1 bg-input border border-border text-foreground text-sm rounded-xl px-3 py-2.5"
                placeholder="admin"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground font-medium">Passwort</label>
              <div className="relative mt-1">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={config.nasPassword}
                  onChange={e => setConfig(p => ({ ...p, nasPassword: e.target.value }))}
                  className="w-full bg-input border border-border text-foreground text-sm rounded-xl px-3 py-2.5 pr-9"
                />
                <button onClick={() => setShowPw(p => !p)} className="absolute right-2 top-1/2 -translate-y-1/2">
                  {showPw ? <EyeOff size={14} className="text-muted-foreground" /> : <Eye size={14} className="text-muted-foreground" />}
                </button>
              </div>
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground font-medium">Basispfad</label>
            <input
              value={config.basePath}
              onChange={e => setConfig(p => ({ ...p, basePath: e.target.value }))}
              className="w-full mt-1 bg-input border border-border text-foreground text-sm rounded-xl px-3 py-2.5 font-mono"
              placeholder="/Backoffice"
            />
          </div>

          {testResult && (
            <div className={`p-3 rounded-xl text-xs border ${testResult.success ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
              {testResult.success ? '✓ ' : '✗ '}{testResult.message}
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleTest}
              disabled={testing || !config.nasUrl}
              className="flex-1 py-2.5 border border-border rounded-xl text-sm font-medium text-foreground hover:bg-secondary/50 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {testing ? <Loader2 size={14} className="animate-spin" /> : <Wifi size={14} />}
              Testen
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !config.nasUrl}
              className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              Speichern
            </button>
          </div>
        </div>
      )}

      {/* Tab: Ordner-Browser */}
      {activeTab === 'browser' && saved && (
        <NasFolderBrowser nasConfig={saved} />
      )}

      {/* Tab: Auto-Sync */}
      {activeTab === 'sync' && saved && (
        <NasSyncSettings savedConfig={saved} onConfigUpdated={loadConfig} />
      )}
    </div>
  );
}

function RolesSection({ currentUser }) {
  const [users, setUsers] = useState([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('BUERO');
  const [inviting, setInviting] = useState(false);
  const [inviteStatus, setInviteStatus] = useState('');

  useEffect(() => {
    base44.entities.User.list().then(setUsers);
  }, []);

  const handleInvite = async () => {
    if (!inviteEmail) return;
    setInviting(true);
    await base44.users.inviteUser(inviteEmail, inviteRole === 'SUPERADMIN' ? 'admin' : 'user');
    setInviteStatus(`Einladung gesendet an ${inviteEmail}`);
    setInviteEmail('');
    setInviting(false);
    base44.entities.User.list().then(setUsers);
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-4 mb-4 space-y-4">
      <h3 className="text-sm font-semibold">Team-Mitglieder</h3>

      <div className="space-y-2">
        {users.map(u => (
          <div key={u.id} className="flex items-center justify-between p-3 bg-secondary/30 rounded-xl">
            <div>
              <div className="text-sm font-medium">{u.full_name || u.email}</div>
              <div className="text-xs text-muted-foreground">{u.email}</div>
            </div>
            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-lg font-medium">
              {ROLES[u.role]?.label || u.role}
            </span>
          </div>
        ))}
      </div>

      <div className="pt-3 border-t border-border space-y-3">
        <h4 className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Neues Mitglied einladen</h4>
        <input
          value={inviteEmail}
          onChange={e => setInviteEmail(e.target.value)}
          className="w-full bg-input border border-border text-foreground text-sm rounded-xl px-3 py-2.5"
          placeholder="email@beispiel.de"
          type="email"
        />
        <select
          value={inviteRole}
          onChange={e => setInviteRole(e.target.value)}
          className="w-full bg-input border border-border text-foreground text-sm rounded-xl px-3 py-2.5"
        >
          {Object.entries(ROLES).filter(([k]) => k !== 'user').map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
        {inviteStatus && <div className="text-xs text-green-400">{inviteStatus}</div>}
        <button
          onClick={handleInvite}
          disabled={inviting || !inviteEmail}
          className="w-full py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium disabled:opacity-50"
        >
          {inviting ? 'Wird eingeladen...' : 'Einladung senden'}
        </button>
      </div>
    </div>
  );
}

function ProfileSection({ user }) {
  if (!user) return null;
  return (
    <div className="bg-card border border-border rounded-2xl p-4 mb-4 space-y-3">
      <h3 className="text-sm font-semibold">Mein Profil</h3>
      <div className="p-3 bg-secondary/30 rounded-xl space-y-2">
        <div className="flex justify-between">
          <span className="text-xs text-muted-foreground">Name</span>
          <span className="text-xs font-medium">{user.full_name}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-xs text-muted-foreground">E-Mail</span>
          <span className="text-xs font-medium">{user.email}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-xs text-muted-foreground">Rolle</span>
          <span className="text-xs font-medium">{ROLES[user.role]?.label || user.role}</span>
        </div>
      </div>
      <button
        onClick={() => base44.auth.logout()}
        className="w-full py-2.5 border border-destructive/30 text-destructive rounded-xl text-sm font-medium hover:bg-destructive/10 transition-colors"
      >
        Abmelden
      </button>
    </div>
  );
}