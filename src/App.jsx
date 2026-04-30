import React, { useEffect, useState, useMemo, useRef } from "react";
import {
  Check, Copy, ExternalLink, Send, Github, Wallet, QrCode, X,
  Languages, Sun, Moon, ShieldCheck, AlertTriangle, MessageCircle,
  BellRing, Star, GitFork, TrendingUp, TrendingDown, Sparkles,
  Award, Code2, Rocket, HeartHandshake
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

/* ============================================================
   CONFIG & DATA
   ============================================================ */
const LANG_STORAGE_KEY = "wallets-page-lang";
const THEME_STORAGE_KEY = "wallets-page-theme";
const LAST_UPDATED = "2026-04-30";

const USER_DATA = {
  name: "älbuquerque bio",
  telegramUsername: "allllbuquerque",
  telegramChannel: "allllbukirka",
  githubUsername: "unnnacc",
  socials: [
    { platform: "Channel", handle: "@allllbukirka", url: "https://t.me/allllbukirka", icon: Send },
    { platform: "GitHub", handle: "@unnnacc", url: "https://github.com/unnnacc", icon: Github },
  ],
};

const STATUSES = ["Online 🟢", "Trading 📈", "Coding 💻", "Sleeping 😴", "Mooning 🚀", "Searching for Gems 💎"];

const WALLETS = [
  {
    network: "TON",
    address: "UQCR7VPE-XZm-97j08aCYbPDO1t6Rze07G3_3KlJ5vBJ4UoS",
    symbol: "TON",
    gradient: "from-sky-400 via-blue-500 to-indigo-600",
    ring: "shadow-[0_0_20px_rgba(56,139,253,0.4)]",
    coingeckoId: "the-open-network",
    explorer: "https://tonviewer.com/UQCR7VPE-XZm-97j08aCYbPDO1t6Rze07G3_3KlJ5vBJ4UoS",
  },
  {
    network: "Tron",
    address: "TLV9mViLNFsZBUEqaFK4SRBBMsSHh7fXGw",
    symbol: "USDT",
    gradient: "from-rose-400 via-red-500 to-rose-600",
    ring: "shadow-[0_0_20px_rgba(244,63,94,0.4)]",
    coingeckoId: "tether",
    explorer: "https://tronscan.org/#/address/TLV9mViLNFsZBUEqaFK4SRBBMsSHh7fXGw",
  },
  {
    network: "Ethereum",
    address: "0xFb8CE66e161EdEf3716B709b80D443d5C1fCbc5A",
    symbol: "ETH/USDT",
    gradient: "from-violet-400 via-indigo-500 to-purple-600",
    ring: "shadow-[0_0_20px_rgba(139,92,246,0.4)]",
    coingeckoId: "ethereum",
    explorer: "https://etherscan.io/address/0xFb8CE66e161EdEf3716B709b80D443d5C1fCbc5A",
  },
];

const TRANSLATIONS = {
  en: {
    title: "Crypto Hub & Dev Portfolio", bio: "dm — @allllbuquerque", aboutTitle: "About Me",
    aboutBody: "Full-stack Web3 developer. I build high-performance dApps and automate everything. Open to high-end collaborations.",
    walletsHeading: "Treasury", copy: "Copy", copied: "Copied!",
    verify: "Verify", scan: "Scan QR", close: "Close",
    confirmTitle: "Address Verification", confirmBody: "Please double check the address below:",
    iVerified: "I verified it", cancel: "Cancel", copyAddress: "Copy address",
    footer: "Powered by Telegram", langLabel: "EN",
    socials: { Channel: "Channel", GitHub: "GitHub" }, welcome: "Welcome, {name}! Let's build the future.",
  },
  ru: {
    title: "Крипто-Хаб и Портфолио", bio: "лс — @allllbuquerque", aboutTitle: "Обо мне",
    aboutBody: "Full-stack Web3 разработчик. Создаю высокопроизводительные dApps и автоматизирую всё. Открыт к серьезным предложениям.",
    walletsHeading: "Казначейство", copy: "Копировать", copied: "Готово!",
    verify: "Проверить", scan: "QR-код", close: "Закрыть",
    confirmTitle: "Верификация адреса", confirmBody: "Пожалуйста, сверьте адрес ниже:",
    iVerified: "Я проверил — копировать", cancel: "Отмена", copyAddress: "Скопировать адрес",
    footer: "Под защитой Telegram", langLabel: "RU",
    socials: { Channel: "Канал", GitHub: "GitHub" }, welcome: "Привет, {name}! Давай строить будущее вместе.",
  },
};

const formatPrice = (n) => n >= 1 ? `$${n.toLocaleString("en-US", { maximumFractionDigits: 2 })}` : `$${n.toFixed(4)}`;
const formatChange = (n) => `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;
const formatDate = (iso, lang) => {
  try {
    return new Date(iso).toLocaleDateString(lang === "ru" ? "ru-RU" : "en-US", { year: "numeric", month: "short", day: "numeric" });
  } catch (e) { return iso; }
};

function App() {
  const [tg, setTg] = useState(null);
  const [userName, setUserName] = useState("");
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [qrWallet, setQrWallet] = useState(null);
  const [confirmWallet, setConfirmWallet] = useState(null);
  const [rates, setRates] = useState(null);
  const [projects, setProjects] = useState(null);
  const [status, setStatus] = useState("Online 🟢");
  const [eggOpen, setEggOpen] = useState(false);
  const [lang, setLang] = useState(() => {
    if (typeof window === "undefined") return "en";
    return window.localStorage.getItem(LANG_STORAGE_KEY) || (navigator.language?.startsWith("ru") ? "ru" : "en");
  });
  const [theme, setTheme] = useState(() => {
    if (typeof window === "undefined") return "dark";
    return window.localStorage.getItem(THEME_STORAGE_KEY) || "dark";
  });

  const t = useMemo(() => TRANSLATIONS[lang], [lang]);
  const longPressTimer = useRef(null);

  useEffect(() => {
    if (window.Telegram?.WebApp) {
      const webapp = window.Telegram.WebApp;
      webapp.ready(); webapp.expand(); setTg(webapp);
      setUserName(webapp.initDataUnsafe?.user?.first_name || "User");
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setStatus(STATUSES[Math.floor(Math.random() * STATUSES.length)]);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const ids = WALLETS.map(w => w.coingeckoId).join(",");
    const load = async () => {
      try {
        const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`);
        const data = await res.json();
        setRates(WALLETS.map(w => ({
          symbol: w.symbol,
          price: data[w.coingeckoId]?.usd || null,
          change24h: data[w.coingeckoId]?.usd_24h_change || null,
        })));
      } catch (e) {}
    };
    load();
    const interval = setInterval(load, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetch(`https://api.github.com/users/${USER_DATA.githubUsername}/repos?sort=updated&per_page=10`)
      .then(r => r.json())
      .then(data => {
        setProjects(data.filter(r => !r.fork).sort((a, b) => b.stargazers_count - a.stargazers_count).slice(0, 4));
      }).catch(() => setProjects([]));
  }, []);

  const haptic = (type) => tg?.HapticFeedback?.impactOccurred(type);

  const performCopy = async (wallet, index) => {
    try {
      await navigator.clipboard.writeText(wallet.address);
      haptic("medium");
      if (tg) tg.HapticFeedback?.notificationOccurred("success");
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (e) {}
  };

  const openExternal = (url) => tg?.openLink ? tg.openLink(url) : window.open(url, "_blank");

  const startLongPress = () => {
    longPressTimer.current = setTimeout(() => {
      haptic("success");
      setEggOpen(true);
    }, 1200);
  };

  const cancelLongPress = () => {
    clearTimeout(longPressTimer.current);
    longPressTimer.current = null;
  };

  const tickerItems = useMemo(() => rates?.filter(r => r.price !== null) || [], [rates]);

  return (
    <div className={`relative min-h-screen w-full transition-colors duration-500 ${theme === 'dark' ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'}`}>
      
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[70%] h-[70%] rounded-full bg-blue-500/20 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[70%] h-[70%] rounded-full bg-indigo-500/20 blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute inset-0 flex flex-wrap content-around items-center justify-around opacity-5 dark:opacity-10" style={{ transform: 'rotate(-30deg) scale(1.2)', fontSize: '12px', fontWeight: 'bold' }}>
          {Array.from({ length: 60 }).map((_, i) => <span key={i} className="p-4">@{USER_DATA.telegramUsername.toUpperCase()}</span>)}
        </div>
      </div>

      <div className="fixed right-4 z-50 flex items-center gap-2" style={{ top: "max(env(safe-area-inset-top), 1rem)" }}>
        <button onClick={() => { haptic("light"); setTheme(t => t === 'dark' ? 'light' : 'dark') }} className="flex h-9 w-9 items-center justify-center rounded-full glass-card active:scale-90 transition-all">
          {theme === 'dark' ? <Sun className="h-4 w-4 text-amber-300" /> : <Moon className="h-4 w-4 text-slate-700" />}
        </button>
        <button onClick={() => { haptic("light"); setLang(l => l === 'en' ? 'ru' : 'en') }} className="flex h-9 items-center gap-1.5 rounded-full glass-card px-3 text-[11px] font-bold uppercase tracking-widest active:scale-90 transition-all">
          <Languages className="h-3.5 w-3.5" /> <span>{t.langLabel}</span>
        </button>
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-md flex-col px-5 pb-10" style={{ paddingTop: "max(env(safe-area-inset-top), 2rem)" }}>
        
        <header className="flex flex-col items-center pt-8 text-center">
          <div className="relative group">
            <div className="absolute inset-0 rounded-full bg-blue-500 blur-3xl opacity-40 animate-pulse" />
            <button 
              onMouseDown={startLongPress} onMouseUp={cancelLongPress} onMouseLeave={cancelLongPress}
              onTouchStart={startLongPress} onTouchEnd={cancelLongPress}
              className="relative h-24 w-24 rounded-full bg-gradient-to-br from-sky-400 via-blue-500 to-indigo-600 text-3xl font-black text-white shadow-2xl ring-4 ring-white/10 active:scale-90 transition-all float-element"
            >
              ä
            </button>
          </div>
          <h1 className="mt-6 text-3xl font-black tracking-tight text-gradient">{USER_DATA.name}</h1>
          <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-blue-500/10 px-3 py-1 text-[11px] font-bold text-blue-500 ring-1 ring-blue-500/20 cursor-pointer active:scale-95 transition-all">
            <span className="relative flex h-1.5 w-1.5"><span className="absolute h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" /><span className="relative h-1.5 w-1.5 rounded-full bg-blue-400" /></span>
            {status}
          </div>
          <p className="mt-4 text-sm leading-relaxed opacity-70 max-w-xs italic">
            "{t.welcome.replace('{name}', userName)}"
          </p>
        </header>

        <section className="mt-8 grid grid-cols-2 gap-3">
          <button onClick={() => openExternal(`https://t.me/${USER_DATA.telegramUsername}`)} className="flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/30 active:scale-95 transition-all hover:bg-blue-500">
            <MessageCircle className="h-4 w-4" /> {t.sendDm}
          </button>
          <button onClick={() => openExternal(`https://t.me/${USER_DATA.telegramChannel}`)} className="flex items-center justify-center gap-2 rounded-2xl glass-card px-4 py-3 text-sm font-bold active:scale-95 transition-all hover:bg-white/20">
            <BellRing className="h-4 w-4 text-blue-500" /> {t.subscribe}
          </button>
        </section>

        <section className="mt-4 grid grid-cols-2 gap-3">
          {USER_DATA.socials.map((social) => {
            const Icon = social.icon;
            return (
              <a key={social.platform} href={social.url} target="_blank" rel="noopener noreferrer" className="glass-card group flex items-center gap-3 rounded-2xl p-3 active:scale-95 transition-all hover:bg-white/10">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/20 text-blue-500 ring-1 ring-blue-500/30"><Icon className="h-4 w-4" /></div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-bold truncate">{t.socials[social.platform] || social.platform}</p>
                  <p className="text-[11px] opacity-60 truncate">{social.handle}</p>
                </div>
              </a>
            );
          })}
        </section>

        <section className="mt-8 glass-card rounded-2xl p-4 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity"><Sparkles className="h-12 w-12 text-blue-500" /></div>
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-3.5 w-3.5 text-blue-500" />
            <h2 className="text-xs font-bold uppercase tracking-widest opacity-60">{t.aboutTitle}</h2>
          </div>
          <p className="text-sm leading-relaxed opacity-90">{t.aboutBody}</p>
        </section>

        <section className="mt-6">
          <div className="mb-2 flex items-center justify-between px-1">
            <h2 className="text-xs font-bold uppercase tracking-widest opacity-60">{t.ratesTitle}</h2>
          </div>
          <div className="glass-card overflow-hidden rounded-3xl p-3">
            <div className="flex gap-6 overflow-x-auto no-scrollbar py-1">
              {tickerItems.map((rate, i) => (
                <div key={i} className="flex items-center gap-2 group cursor-pointer">
                  <span className="text-xs font-bold opacity-80">{rate.symbol}</span>
                  <span className="text-xs font-medium">{formatPrice(rate.price)}</span>
                  <span className={`text-[10px] font-bold px-1 rounded ${rate.change24h >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {formatChange(rate.change24h)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-8">
          <div className="mb-4 flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <Wallet className="h-4 w-4 text-blue-500" />
              <h2 className="text-sm font-bold">{t.walletsHeading}</h2>
            </div>
          </div>
          <div className="flex flex-col gap-4">
            {WALLETS.map((wallet, index) => (
              <div key={index} className={`relative group rounded-3xl p-5 transition-all active:scale-95 ${wallet.ring} glass-card shimmer-effect`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${wallet.gradient} animate-gradient flex items-center justify-center text-white font-black shadow-lg`}>
                      {wallet.symbol[0]}
                    </div>
                    <span className="font-bold">{wallet.network}</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setQrWallet(wallet)} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-white/10"><QrCode className="h-4 w-4" /></button>
                    <button onClick={() => openExternal(wallet.explorer)} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-white/10"><ExternalLink className="h-4 w-4" /></button>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-black/30 p-3 rounded-xl text-xs font-mono truncate flex-1 border border-white/5">
                    {wallet.address}
                  </div>
                  <button 
                    onClick={() => { haptic("light"); setConfirmWallet({ wallet, index }); }}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all glass-card ${copiedIndex === index ? 'bg-emerald-500/50 text-white border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 'bg-blue-600/20 text-blue-400 border-blue-500/30 shadow-[0_0_15px_rgba(56,139,253,0.2)] hover:bg-blue-600/30'}`}
                  >
                    {copiedIndex === index ? t.copied : t.copy}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8">
          <div className="mb-4 flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <Github className="h-4 w-4 text-blue-500" />
              <h2 className="text-sm font-bold">{t.projectsTitle}</h2>
            </div>
            <button onClick={() => openExternal(`https://github.com/${USER_DATA.githubUsername}`)} className="text-[10px] font-bold opacity-50 hover:opacity-100 transition-opacity uppercase tracking-widest">
              {t.projectsViewAll}
            </button>
          </div>
          <div className="flex flex-col gap-3">
            {projects?.map((repo) => (
              <button key={repo.id} onClick={() => openExternal(repo.html_url)} className="glass-card group flex items-center gap-3 p-3 rounded-2xl text-left active:scale-95 transition-all hover:bg-white/20">
                <div className="h-9 w-9 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-500"><Code2 className="h-4 w-4" /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold truncate">{repo.name}</p>
                  <p className="text-[10px] opacity-60 truncate">{repo.description || 'No description'}</p>
                </div>
                <ExternalLink className="h-3 w-3 opacity-30 group-hover:opacity-100 transition-opacity" />
              </button>
            ))}
          </div>
        </section>

        <footer className="mt-12 mb-6 text-center opacity-40">
          <p className="text-[10px] font-medium uppercase tracking-widest">{t.footer}</p>
          <p className="text-[9px] mt-1">{t.lastUpdated}: {formatDate(LAST_UPDATED, lang)}</p>
        </footer>
      </div>

      {/* QR Modal */}
      {qrWallet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setQrWallet(null)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />
          <div className="relative w-full max-w-xs bg-slate-900 rounded-3xl p-6 shadow-2xl ring-1 ring-white/20y" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <span className="font-bold">{qrWallet.network} QR</span>
              <button onClick={() => setQrWallet(null)} className="p-2 rounded-full bg-white/10"><X className="h-4 w-4" /></button>
            </div>
            <div className="flex justify-center mb-6 bg-white p-4 rounded-2xl">
              <QRCodeSVG value={qrWallet.address} size={200} />
            </div>
            <button onClick={() => {
              const idx = WALLETS.findIndex(w => w.address === qrWallet.address);
              setConfirmWallet({ wallet: qrWallet, index: idx });
            }} className="w-full py-3 rounded-xl bg-blue-600 text-white font-bold active:scale-95 transition-all shadow-lg shadow-blue-600/30">
              {t.copyAddress}
            </button>
          </div>
        </div>
      )}

      {/* Anti-Phishing Modal */}
      {confirmWallet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setConfirmWallet(null)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />
          <div className="relative w-full max-w-xs bg-slate-900 rounded-3xl p-6 shadow-2xl ring-1 ring-white/20" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4 text-amber-500">
              <AlertTriangle className="h-5 w-5" />
              <span className="font-bold">{t.confirmTitle}</span>
            </div>
            <p className="text-xs opacity-60 mb-4">{t.confirmBody}</p>
            
            {/* FULL ADDRESS DISPLAY with Neon Glow */}
            <div className="bg-black/40 p-4 rounded-2xl font-mono text-xs text-center mb-4 border border-white/5 ring-1 ring-blue-500/20 shadow-[0_0_15px_rgba(56,139,253,0.1)]">
              <span className="text-blue-400 neon-text break-all">
                {confirmWallet.wallet.address}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setConfirmWallet(null)} className="py-3 rounded-xl bg-white/10 text-white font-bold text-xs transition-all active:scale-95 border border-white/10">
                {t.cancel}
              </button>
              <button onClick={async () => {
                await performCopy(confirmWallet.wallet, confirmWallet.index);
                setConfirmWallet(null);
              }} className="py-3 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 active:scale-95 transition-all">
                {t.iVerified}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Easter Egg */}
      {eggOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setEggOpen(false)}>
          <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl text-center shadow-2xl ring-1 ring-white/20 animate-in zoom-in-95 duration-300">
            <div className="text-5xl mb-4">🥚</div>
            <p className="font-bold text-lg">{t.eggMessage}</p>
            <p className="text-xs opacity-60 mt-2">tg: @{USER_DATA.telegramUsername}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;