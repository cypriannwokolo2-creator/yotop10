'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  User, 
  Shield, 
  Key, 
  QrCode, 
  Monitor, 
  FileText, 
  Download, 
  ChevronRight, 
  Smartphone,
  Save,
  CheckCircle2,
  AlertCircle,
  Link as LinkIcon,
  Trash2,
  FolderOpen
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/PublicAuthContext';
import TransferIdentityModal from '@/components/auth/TransferIdentityModal';
import DeviceManager from '@/components/auth/DeviceManager';
import RecoveryModal from '@/components/auth/RecoveryModal';

export default function SettingsPage() {
  const { user, status, generateRecoveryKey } = useAuth();
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<'profile' | 'identity' | 'devices'>('profile');
  
  const [showTransfer, setShowTransfer] = useState(false);
  const [showDevices, setShowDevices] = useState(false);
  const [showRecovery, setShowRecovery] = useState(false);
  
  const [recoveryPath, setRecoveryPath] = useState<string>('');
  const [downloading, setDownloading] = useState(false);
  const [savedPath, setSavedPath] = useState(false);

  useEffect(() => {
    const path = localStorage.getItem('yotop10_recovery_path');
    if (path) setRecoveryPath(path);
  }, []);

  const handleDownloadRecovery = async () => {
    setDownloading(true);
    try {
      const key = await generateRecoveryKey();
      const blob = new Blob([`YoTop10 Recovery Key\n\nUsername: ${user?.username}\nKey: ${key}\n\nKeep this file safe. If you lose your device, this is the ONLY way to recover your account.`], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `yotop10-recovery-${user?.username}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed:', err);
    } finally {
      setDownloading(false);
    }
  };

  const savePath = () => {
    localStorage.setItem('yotop10_recovery_path', recoveryPath);
    setSavedPath(true);
    setTimeout(() => setSavedPath(false), 2000);
  };

  const sections = [
    { id: 'profile', label: 'Scholar Profile', icon: User },
    { id: 'identity', label: 'Identity & Security', icon: Shield },
    { id: 'devices', label: 'Connected Browsers', icon: Monitor },
  ];

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <AlertCircle size={48} className="text-muted-foreground/30 mb-4" />
        <h2 className="text-xl font-bold mb-2">Authentication Required</h2>
        <p className="text-muted-foreground mb-6">You need an active identity to access settings.</p>
        <button 
          onClick={() => router.push('/')}
          className="px-6 py-2.5 rounded-full bg-primary text-white font-semibold"
        >
          Return Home
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        
        {/* Sidebar Navigation */}
        <aside className="w-full md:w-64 space-y-1">
          <h1 className="text-2xl font-black uppercase tracking-tighter mb-6 px-2">Settings</h1>
          {sections.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id as any)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all",
                activeSection === s.id 
                  ? "bg-primary text-white shadow-lg shadow-primary/20" 
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <s.icon size={18} strokeWidth={activeSection === s.id ? 2.5 : 2} />
              {s.label}
            </button>
          ))}
        </aside>

        {/* Content Area */}
        <main className="flex-1 space-y-8">
          
          {activeSection === 'profile' && (
            <div className="space-y-6">
              <section className="bg-card border border-border rounded-3xl p-6 md:p-8">
                <div className="flex items-center gap-5 mb-8">
                  <div className="w-20 h-20 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <User size={40} className="text-primary" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">{user.username}</h2>
                    <p className="text-muted-foreground flex items-center gap-1.5">
                      <CheckCircle2 size={14} className="text-primary" />
                      {status === 'scholar' ? 'Scholar Identity' : 'Guest Identity'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-muted/50 border border-border/50">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Scholar Score</p>
                    <p className="text-xl font-bold">{(user.trust_score || 1.0).toFixed(2)} <span className="text-xs text-muted-foreground font-medium">/ 2.00</span></p>
                  </div>
                  <div className="p-4 rounded-2xl bg-muted/50 border border-border/50">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Identity Created</p>
                    <p className="text-xl font-bold">{new Date(user.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              </section>

              <button 
                onClick={() => router.push(`/a/${user.username}`)}
                className="w-full flex items-center justify-between p-6 bg-card border border-border rounded-3xl hover:bg-muted/30 transition-colors group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center">
                    <Monitor size={20} className="text-muted-foreground" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold">Public Profile</p>
                    <p className="text-xs text-muted-foreground">View your public stats and posts</p>
                  </div>
                </div>
                <ChevronRight size={20} className="text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          )}

          {activeSection === 'identity' && (
            <div className="space-y-6">
              {/* Identity Transfer */}
              <section className="bg-card border border-border rounded-3xl p-6 md:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <QrCode size={24} className="text-primary" />
                  <h3 className="text-xl font-bold">Cross-Browser Connection</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                  Connect your identity to another browser or phone. Use the QR code to securely link devices without passwords or emails.
                </p>
                <button 
                  onClick={() => setShowTransfer(true)}
                  className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-primary text-white font-bold hover:bg-primary-dark transition-all shadow-lg shadow-primary/20"
                >
                  <Smartphone size={20} />
                  Connect New Browser
                </button>
              </section>

              {/* Recovery Management */}
              <section className="bg-card border border-border rounded-3xl p-6 md:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <Key size={24} className="text-primary" />
                  <h3 className="text-xl font-bold">Backup & Recovery</h3>
                </div>
                
                <div className="space-y-6">
                  <div className="p-5 rounded-2xl bg-amber-500/5 border border-amber-500/20">
                    <p className="text-sm text-amber-700 font-medium leading-relaxed">
                      Download your recovery file and store it on your phone's storage. If you clear your browser data or lose this device, this file is the ONLY way to get your account back.
                    </p>
                  </div>

                  <button 
                    onClick={handleDownloadRecovery}
                    disabled={downloading}
                    className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl border-2 border-primary text-primary font-bold hover:bg-primary/5 transition-all"
                  >
                    {downloading ? <Loader2 size={20} className="animate-spin" /> : <Download size={20} />}
                    Download Recovery File (.txt)
                  </button>

                  <div className="pt-4 border-t border-border">
                    <label className="block text-xs font-black uppercase tracking-widest text-muted-foreground mb-3 ml-1">
                      Manual File Path Storage
                    </label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <FolderOpen size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input 
                          type="text" 
                          value={recoveryPath}
                          onChange={(e) => setRecoveryPath(e.target.value)}
                          placeholder="/storage/emulated/0/Documents/yotop10-key.txt"
                          className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-muted border-none text-sm focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                      <button 
                        onClick={savePath}
                        className="px-4 rounded-2xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                      >
                        {savedPath ? <CheckCircle2 size={20} /> : <Save size={20} />}
                      </button>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-2 px-1">
                      Store the path to your recovery file here for your own reference on this device.
                    </p>
                  </div>
                </div>
              </section>
            </div>
          )}

          {activeSection === 'devices' && (
            <section className="bg-card border border-border rounded-3xl p-6 md:p-8">
              <div className="flex items-center gap-3 mb-6">
                <Monitor size={24} className="text-primary" />
                <h3 className="text-xl font-bold">Active Devices</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-8">
                These are the browsers currently logged into your scholar identity. You can revoke any session remotely.
              </p>
              
              <button 
                onClick={() => setShowDevices(true)}
                className="w-full py-4 rounded-2xl bg-muted font-bold text-sm hover:bg-muted/80 transition-all flex items-center justify-center gap-3"
              >
                <Monitor size={18} />
                Manage Active Sessions
              </button>
            </section>
          )}

        </main>
      </div>

      {/* Modals */}
      {showTransfer && <TransferIdentityModal onClose={() => setShowTransfer(false)} />}
      {showDevices && <DeviceManager onClose={() => setShowDevices(false)} />}
      {showRecovery && <RecoveryModal onClose={() => setShowRecovery(false)} />}
    </div>
  );
}

function Loader2({ className, size }: { className?: string, size?: number }) {
  return (
    <svg 
      className={cn("animate-spin", className)} 
      xmlns="http://www.w3.org/2000/svg" 
      width={size || 24} 
      height={size || 24} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}
