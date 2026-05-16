'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, User, ShoppingBag } from 'lucide-react';

import type { HeroBlock, LandingPage, SiteSettings } from '@/features/cms/types';
import styles from './volta.module.css';

type VoltaHomeProps = {
  page: LandingPage;
  settings: SiteSettings;
};

// ─── Palette ──────────────────────────────────────────────────────────────

const V = {
  paper:    '#FAFAF9',
  paperWarm:'#F4F2EE',
  ink:      '#0A0A0A',
  inkSoft:  '#1A1A1A',
  mute:     '#6B6B6B',
  hair:     'rgba(10,10,10,0.08)',
  signal:   '#2A5BD7',
  amber:    '#E8843B',
  hairDark: 'rgba(255,255,255,0.10)',
} as const;

// ─── Atoms ────────────────────────────────────────────────────────────────

type VBtnProps = {
  children: React.ReactNode;
  primary?: boolean;
  dark?: boolean;
  light?: boolean;
  ghost?: boolean;
  small?: boolean;
  type?: 'button' | 'submit';
  onClick?: () => void;
  style?: React.CSSProperties;
};

function VBtn({ children, primary, dark, light, ghost, small, type = 'button', onClick, style: extra }: VBtnProps) {
  const base: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    height: small ? 36 : 44,
    padding: small ? '0 18px' : '0 24px',
    borderRadius: 999,
    fontSize: small ? 13 : 14,
    fontFamily: 'inherit', fontWeight: 500,
    letterSpacing: '-0.005em',
    cursor: 'pointer', border: 'none',
    transition: 'transform .2s ease, background .2s ease',
    ...extra,
  };
  let colorStyle: React.CSSProperties;
  if (primary)     colorStyle = { background: V.signal, color: '#fff' };
  else if (dark)   colorStyle = { background: V.ink, color: V.paper };
  else if (light)  colorStyle = { background: '#fff', color: V.ink };
  else if (ghost)  colorStyle = { background: 'transparent', color: V.signal, border: `1px solid ${V.signal}` };
  else             colorStyle = { background: 'transparent', color: V.ink, border: `1px solid ${V.ink}` };

  return (
    <button
      type={type}
      style={{ ...base, ...colorStyle }}
      onClick={onClick}
      onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-1px)')}
      onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}
    >
      {children}
    </button>
  );
}

function useReveal(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) { setShown(true); io.disconnect(); } }),
      { threshold, rootMargin: '0px 0px -40px 0px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return { ref, shown };
}

function VReveal({ children, delay = 0, y = 24, style: extra }: {
  children: React.ReactNode; delay?: number; y?: number; style?: React.CSSProperties;
}) {
  const { ref, shown } = useReveal();
  return (
    <div ref={ref} style={{
      ...extra,
      opacity: shown ? 1 : 0,
      transform: shown ? 'translateY(0)' : `translateY(${y}px)`,
      transition: `opacity .85s cubic-bezier(.2,.7,.2,1) ${delay}ms, transform .85s cubic-bezier(.2,.7,.2,1) ${delay}ms`,
      willChange: 'opacity, transform',
    }}>
      {children}
    </div>
  );
}

function VCounter({ to, decimals = 0, suffix = '', duration = 1400 }: {
  to: number; decimals?: number; suffix?: string; duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [val, setVal] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) {
          const start = performance.now();
          const tick = (t: number) => {
            const p = Math.min(1, (t - start) / duration);
            setVal(to * (1 - Math.pow(1 - p, 3)));
            if (p < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
          io.disconnect();
        }
      }),
      { threshold: 0.5 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [to, duration]);
  return <span ref={ref}>{val.toFixed(decimals)}{suffix}</span>;
}

// ─── Announce bar ─────────────────────────────────────────────────────────

function VAnnounce() {
  const items = [
    'Free 2-day shipping on orders over $80',
    'Trade in your old device · up to $400 credit',
    '0% APR financing for 24 months on Pulse 12',
    'Care+ · extended coverage, instant repair',
  ];
  return (
    <div style={{
      background: V.ink, color: V.paper, height: 36,
      display: 'flex', alignItems: 'center', overflow: 'hidden',
      fontSize: 12, letterSpacing: '0.02em',
    }}>
      <div className={styles.marquee} style={{ display: 'flex', gap: 56, whiteSpace: 'nowrap', paddingLeft: 56 }}>
        {[...items, ...items, ...items].map((t, i) => (
          <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 12 }}>
            <span style={{ color: V.amber }}>◆</span>{t}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Sticky nav ───────────────────────────────────────────────────────────

function VNav({ siteName, navLinks }: { siteName: string; navLinks: string[] }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);
  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 50,
      backdropFilter: scrolled ? 'blur(24px) saturate(180%)' : 'none',
      WebkitBackdropFilter: scrolled ? 'blur(24px) saturate(180%)' : 'none',
      background: scrolled ? 'rgba(250,250,249,0.78)' : 'transparent',
      borderBottom: scrolled ? `1px solid ${V.hair}` : '1px solid transparent',
      transition: 'background .3s ease, border-color .3s ease',
    }}>
      <div style={{
        height: 60,
        display: 'grid', gridTemplateColumns: '1fr auto 1fr',
        alignItems: 'center', padding: '0 40px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 26, height: 26, background: V.ink, color: V.paper,
            borderRadius: 7, fontWeight: 700, fontSize: 14,
          }}>{siteName.charAt(0).toUpperCase()}</span>
          <span style={{ fontWeight: 600, letterSpacing: '-0.01em', fontSize: 17 }}>
            {siteName.toUpperCase()}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {navLinks.map(l => <button key={l} className={styles.navLink}>{l}</button>)}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 8 }}>
          <button className={styles.iconBtn} aria-label="search"><Search size={18} strokeWidth={1.8} /></button>
          <button className={styles.iconBtn} aria-label="account"><User size={18} strokeWidth={1.8} /></button>
          <button className={styles.iconBtn} aria-label="bag" style={{ position: 'relative' }}>
            <ShoppingBag size={18} strokeWidth={1.8} />
            <span style={{
              position: 'absolute', top: 4, right: 4,
              width: 14, height: 14, borderRadius: 999,
              background: V.signal, color: '#fff', fontSize: 9, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>2</span>
          </button>
        </div>
      </div>
    </nav>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────

const HERO_SPECS = [
  { v: 6.7, s: '"display', decimals: 1 },
  { v: 48,  s: 'MP camera', decimals: 0 },
  { v: 28,  s: 'hr battery', decimals: 0 },
  { v: 1.5, s: 'kg', decimals: 1 },
];

function VHero({ title, tagline, ctaLabel }: { title: string; tagline: string; ctaLabel: string }) {
  return (
    <section style={{ position: 'relative', padding: '40px 40px 80px', background: V.paper, overflow: 'hidden' }}>
      <div className={`${styles.blob} ${styles.blobA}`} />
      <div className={`${styles.blob} ${styles.blobB}`} />

      <div style={{ position: 'relative', textAlign: 'center', paddingTop: 56 }}>
        <VReveal>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '6px 14px', borderRadius: 999, background: 'rgba(42,91,215,0.08)',
            color: V.signal, fontSize: 12, fontWeight: 600, marginBottom: 24,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: 999, background: V.signal }} />
            New · Available Now
          </div>
        </VReveal>
        <VReveal delay={80}>
          <h1 style={{
            fontSize: 'clamp(48px, 8vw, 88px)', lineHeight: 0.98,
            letterSpacing: '-0.035em', fontWeight: 600, margin: 0, color: V.ink,
          }}>
            {title}
          </h1>
        </VReveal>
        <VReveal delay={140}>
          <p style={{ fontSize: 22, color: V.mute, marginTop: 14, marginBottom: 26, letterSpacing: '-0.01em' }}>
            {tagline}
          </p>
        </VReveal>
        <VReveal delay={200}>
          <div style={{ display: 'inline-flex', gap: 10 }}>
            <VBtn primary>{ctaLabel}</VBtn>
            <VBtn>Learn more →</VBtn>
          </div>
        </VReveal>
      </div>

      <VReveal delay={260} y={48}>
        <div style={{ position: 'relative', margin: '40px auto 0', width: 'min(1080px, 92%)', height: 520 }}>
          <div className={styles.floatProduct} style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{
              width: '92%', height: '100%',
              background: 'linear-gradient(135deg, #1A1F2A 0%, #0D1117 50%, #1A1F2A 100%)',
              borderRadius: 32,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'rgba(255,255,255,0.12)', fontSize: 11,
              letterSpacing: '0.18em', textTransform: 'uppercase',
              fontFamily: 'var(--font-mono, monospace)',
            }}>
              hero · product image
            </div>
          </div>

          {/* Specs pill */}
          <div style={{
            position: 'absolute', bottom: -28, left: '50%', transform: 'translateX(-50%)',
            display: 'flex', background: '#fff', borderRadius: 999, padding: '14px 8px',
            boxShadow: '0 12px 40px rgba(10,10,10,0.08), 0 0 0 1px rgba(10,10,10,0.04)',
            whiteSpace: 'nowrap',
          }}>
            {HERO_SPECS.map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
                {i > 0 && <span style={{ width: 1, alignSelf: 'stretch', background: V.hair, margin: '4px 8px' }} />}
                <div style={{ padding: '4px 24px', textAlign: 'center', minWidth: 96 }}>
                  <div style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.02em' }}>
                    <VCounter to={s.v} decimals={s.decimals} />
                  </div>
                  <div style={{ fontSize: 11, color: V.mute, marginTop: 2 }}>{s.s}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </VReveal>
    </section>
  );
}

// ─── Section header ───────────────────────────────────────────────────────

function VSeriesHeader({ eyebrow, title, blurb, action }: {
  eyebrow: string; title: string; blurb?: string; action?: React.ReactNode;
}) {
  return (
    <VReveal>
      <div style={{ textAlign: 'center', padding: '64px 40px 32px' }}>
        <div style={{
          fontSize: 12, fontWeight: 600, letterSpacing: '0.16em',
          textTransform: 'uppercase', color: V.signal,
        }}>{eyebrow}</div>
        <h2 style={{
          fontSize: 'clamp(36px, 5vw, 56px)', fontWeight: 600,
          letterSpacing: '-0.03em', margin: '14px 0 12px', lineHeight: 1.05,
        }}>{title}</h2>
        {blurb && (
          <p style={{
            fontSize: 17, color: V.mute, margin: '0 0 22px',
            maxWidth: 560, marginLeft: 'auto', marginRight: 'auto',
          }}>{blurb}</p>
        )}
        {action}
      </div>
    </VReveal>
  );
}

// ─── Product tile ─────────────────────────────────────────────────────────

type VProductTileProps = {
  tag: string;
  name: React.ReactNode;
  blurb?: string;
  price?: string | number;
  bg?: string;
  tint?: string;
  dark?: boolean;
  large?: boolean;
  badge?: string;
  narrowImg?: boolean;
};

function VProductTile({ tag, name, blurb, price, bg = '#fff', tint = '#1A1A1A', dark, large, badge, narrowImg }: VProductTileProps) {
  return (
    <div className={styles.tile} style={{
      background: bg, color: dark ? V.paper : V.ink,
      borderRadius: 28, padding: 36,
      minHeight: large ? 560 : 460,
      display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
      position: 'relative', overflow: 'hidden', cursor: 'pointer',
    }}>
      {badge && (
        <span style={{
          position: 'absolute', top: 24, right: 24,
          padding: '6px 10px', borderRadius: 999,
          background: dark ? 'rgba(255,255,255,0.12)' : 'rgba(42,91,215,0.10)',
          color: dark ? V.paper : V.signal,
          fontSize: 11, fontWeight: 600,
        }}>{badge}</span>
      )}
      <div>
        <div style={{
          fontSize: 11, fontWeight: 600, letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: dark ? 'rgba(250,250,249,0.55)' : V.mute,
        }}>{tag}</div>
        <h3 style={{
          fontSize: large ? 40 : 28, fontWeight: 600,
          letterSpacing: '-0.025em', lineHeight: 1.05, margin: '10px 0 8px',
        }}>{name}</h3>
        {blurb && (
          <p style={{
            fontSize: 14, margin: 0, maxWidth: large ? 360 : 280,
            color: dark ? 'rgba(250,250,249,0.7)' : V.mute,
          }}>{blurb}</p>
        )}
        {price !== undefined && (
          <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 14, fontWeight: 500 }}>From ${price}</span>
            <VBtn small light={!!dark} dark={!dark}>Buy</VBtn>
          </div>
        )}
      </div>
      <div style={{
        alignSelf: 'center',
        width: narrowImg ? '70%' : '90%',
        height: large ? 300 : 220,
        background: tint, borderRadius: 18, marginTop: 16,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'rgba(255,255,255,0.18)', fontSize: 10,
        letterSpacing: '0.18em', textTransform: 'uppercase',
        fontFamily: 'var(--font-mono, monospace)',
      }}>
        {tag.toLowerCase()}
      </div>
    </div>
  );
}

// ─── Sections ─────────────────────────────────────────────────────────────

function VPulseRail() {
  return (
    <section style={{ padding: '0 40px 32px' }}>
      <VSeriesHeader
        eyebrow="Pulse Series"
        title="One family. Three feels."
        blurb="From the everyday Pulse 12 to the medium-format Pro and the Ultra's larger sensor — the same color science across all three."
        action={<VBtn>See all phones</VBtn>}
      />
      <VReveal y={36}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          <VProductTile tag="Pulse 12"    name="The everyday flagship."    blurb="Six colors. Two days of battery. Now with the Pulse camera system." price="699" tint="#C03A2B" bg="#FBE7E2" />
          <VProductTile tag="Pulse 12 Pro" name="A studio in your pocket." blurb="6.7-inch display. 48MP main. Built-in 4K ProRes."                   price="899" tint="#1E5E3C" bg="#E1EFE4" badge="New" />
          <VProductTile tag="Pulse 12 Ultra" name="Medium format. Pocket size." blurb="1-inch sensor. Periscope zoom. Titanium frame."                 price="1199" tint="#2A2A2A" bg="#EFEEEC" />
        </div>
      </VReveal>
    </section>
  );
}

function VEchoSpotlight() {
  const ghostBtn: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    height: 44, padding: '0 24px', borderRadius: 999, fontSize: 14,
    fontFamily: 'inherit', fontWeight: 500, cursor: 'pointer',
    background: 'transparent', color: V.paper,
    border: '1px solid rgba(255,255,255,0.3)',
    transition: 'transform .2s ease',
  };
  return (
    <section style={{ padding: '32px 40px' }}>
      <VReveal y={40}>
        <div style={{
          position: 'relative', overflow: 'hidden',
          background: 'radial-gradient(110% 140% at 30% 50%, #2A4A8F 0%, #0E1730 60%, #050A18 100%)',
          color: V.paper, borderRadius: 32, padding: '80px 60px', minHeight: 520,
          display: 'grid', gridTemplateColumns: '1fr 1fr', alignItems: 'center', gap: 40,
        }}>
          <div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '6px 14px', borderRadius: 999,
              background: 'rgba(255,255,255,0.10)', fontSize: 12, fontWeight: 600,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: 999, background: V.amber }} />
              Echo Studio · Generation 04
            </div>
            <h2 style={{
              fontSize: 'clamp(48px, 6vw, 76px)', fontWeight: 600,
              letterSpacing: '-0.035em', lineHeight: 0.98, margin: '20px 0 14px',
            }}>
              Listen at the<br />speed of{' '}
              <em style={{ color: V.amber, fontStyle: 'italic', fontWeight: 500 }}>air</em>.
            </h2>
            <p style={{ fontSize: 17, color: 'rgba(250,250,249,0.7)', maxWidth: 440, margin: '0 0 28px' }}>
              Lossless audio over Volta's wireless protocol. 36-hour battery with the case.
              The H3 chip processes sound in 11 microseconds.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <VBtn light>Buy · from $329</VBtn>
              <button
                style={ghostBtn}
                onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-1px)')}
                onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}
              >Watch the film →</button>
            </div>
          </div>
          <div className={styles.floatSlow} style={{
            height: 360, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{
              width: '85%', height: '100%', borderRadius: 24,
              background: 'linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))',
              border: '1px solid rgba(255,255,255,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'rgba(255,255,255,0.18)', fontSize: 10,
              letterSpacing: '0.18em', textTransform: 'uppercase',
              fontFamily: 'var(--font-mono, monospace)',
            }}>echo studio · earbuds</div>
          </div>
        </div>
      </VReveal>
    </section>
  );
}

function VAudioGrid() {
  const items: VProductTileProps[] = [
    { tag: 'Echo Air',    name: 'Open-ear.',  price: 179, tint: '#E8E8E8', bg: '#F4F2EE',  narrowImg: true },
    { tag: 'Echo Studio', name: 'Reference.', price: 329, tint: '#1A1A1A', bg: '#222222',  dark: true, badge: 'New', narrowImg: true },
    { tag: 'Echo Buds',   name: 'Everyday.',  price: 149, tint: '#2A5BD7', bg: '#E6EDFB',  narrowImg: true },
    { tag: 'Echo Mini',   name: 'On the run.',price: 99,  tint: '#E8843B', bg: '#FBEFE2',  narrowImg: true },
  ];
  return (
    <section style={{ padding: '0 40px 32px' }}>
      <VSeriesHeader
        eyebrow="Echo Audio"
        title="Sound, by shape."
        blurb="Four form factors. One H3 chip. Pick the silhouette that fits your day."
      />
      <VReveal y={32}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {items.map(item => <VProductTile key={item.tag as string} {...item} />)}
        </div>
      </VReveal>
    </section>
  );
}

function VOrbitDuo() {
  return (
    <section style={{ padding: '0 40px 32px' }}>
      <VSeriesHeader
        eyebrow="Orbit Wearables"
        title="Time, body, signal."
        blurb="Two watches. The S you'll wear every day; the Ultra you'll wear off-grid."
      />
      <VReveal y={36}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <VProductTile tag="Orbit S"     name={<>Built for the<br />everyday loop.</>}  blurb="Always-on display. 7-day battery. Pulse rhythm, sleep stages, atrial monitor." price={399} tint="#D9A6B0" bg="#FBEFF1" large />
          <VProductTile tag="Orbit Ultra" name={<>Off-grid<br />on purpose.</>}           blurb="100m dive rated. Titanium case. GPS that works without towers."                price={799} tint="#1F2429" bg="#0F1115" dark large badge="New finish" />
        </div>
      </VReveal>
    </section>
  );
}

function VLumenSpotlight() {
  const ghostBtn: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    height: 44, padding: '0 24px', borderRadius: 999, fontSize: 14,
    fontFamily: 'inherit', fontWeight: 500, cursor: 'pointer',
    background: 'transparent', color: V.paper,
    border: '1px solid rgba(255,255,255,0.3)',
    transition: 'transform .2s ease',
  };
  return (
    <section style={{ padding: '32px 40px' }}>
      <VReveal y={40}>
        <div style={{
          position: 'relative', overflow: 'hidden',
          background: '#0A0A0A', color: V.paper, borderRadius: 32,
          minHeight: 620, display: 'flex', flexDirection: 'column',
          justifyContent: 'space-between', padding: 60,
        }}>
          <div className={styles.gridFade} />
          <div style={{ position: 'relative', textAlign: 'center' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '6px 14px', borderRadius: 999,
              background: 'rgba(255,255,255,0.10)', fontSize: 12, fontWeight: 600,
              marginBottom: 22,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: 999, background: V.signal }} />
              Lumen Book Pro · V3 silicon
            </div>
            <h2 style={{
              fontSize: 'clamp(48px, 7vw, 96px)', fontWeight: 600,
              letterSpacing: '-0.04em', lineHeight: 0.96, margin: '0 0 18px',
              background: 'linear-gradient(180deg, #fff 0%, #888 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              The work, faster.<br />The fan, never on.
            </h2>
            <p style={{ fontSize: 18, color: 'rgba(250,250,249,0.7)', maxWidth: 580, margin: '0 auto 26px' }}>
              Volta V3 silicon. 24 hours of real-world battery. Silent under load.
              Two pounds, two screens worth of resolution.
            </p>
            <div style={{ display: 'inline-flex', gap: 10 }}>
              <VBtn light>Configure · from $1599</VBtn>
              <button
                style={ghostBtn}
                onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-1px)')}
                onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}
              >Compare models</button>
            </div>
          </div>
          <div className={styles.floatProduct} style={{
            position: 'relative', height: 280,
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
          }}>
            <div style={{
              width: '60%', height: '100%', borderRadius: 20,
              background: 'linear-gradient(180deg, #1A1A1A 0%, #2A2A2A 100%)',
              border: '1px solid rgba(255,255,255,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'rgba(255,255,255,0.12)', fontSize: 10,
              letterSpacing: '0.18em', textTransform: 'uppercase',
              fontFamily: 'var(--font-mono, monospace)',
            }}>lumen book pro · hero</div>
          </div>
        </div>
      </VReveal>
    </section>
  );
}

function VComputingGrid() {
  const items: VProductTileProps[] = [
    { tag: 'Slate Pad',      name: 'Notebook reborn.',        price: 599,  tint: '#3B82F6', bg: '#E6EDFB' },
    { tag: 'Slate Pad Pro',  name: 'Pro, in 11″ and 13″.',    price: 899,  tint: '#1E1E1E', bg: '#E8E8E6' },
    { tag: 'Lumen Book Air', name: 'Two pounds, all day.',     price: 1099, tint: '#E8843B', bg: '#FBEFE2' },
  ];
  return (
    <section style={{ padding: '0 40px 32px' }}>
      <VSeriesHeader eyebrow="Compute & Slate" title="Pick a screen, any screen." />
      <VReveal y={32}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {items.map(item => <VProductTile key={item.tag as string} {...item} />)}
          <div className={styles.tile} style={{
            background: V.paperWarm, borderRadius: 28, padding: 36,
            minHeight: 460, display: 'flex', flexDirection: 'column',
            justifyContent: 'space-between', cursor: 'pointer', color: V.ink,
          }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: V.mute }}>
                Everything
              </div>
              <h3 style={{ fontSize: 36, fontWeight: 600, letterSpacing: '-0.025em', margin: '12px 0 8px' }}>
                All products.
              </h3>
              <p style={{ fontSize: 14, color: V.mute, margin: 0 }}>
                Compare specs, prices and availability across the whole line.
              </p>
            </div>
            <span style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 56, height: 56, borderRadius: 999,
              background: V.signal, color: '#fff', fontSize: 20,
            }}>→</span>
          </div>
        </div>
      </VReveal>
    </section>
  );
}

function VServices() {
  const tiles = [
    { t: 'Premium+', d: 'One subscription. Music, cloud, fitness, news.',             c: V.amber,    tc: '#1A1108' },
    { t: 'Trade-in', d: 'Send us your old device. Get instant credit for a new one.',  c: V.ink,      tc: V.paper  },
    { t: 'Care+',    d: 'Same-day screen repair. Unlimited accident coverage.',        c: V.signal,   tc: '#fff'   },
    { t: 'Studio',   d: 'Free 1-on-1 sessions with a Specialist. In store or online.', c: V.paperWarm, tc: V.ink  },
  ];
  return (
    <section style={{ padding: '32px 40px' }}>
      <VSeriesHeader eyebrow="Services" title="The part that comes after buying." />
      <VReveal y={32}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {tiles.map(t => (
            <div key={t.t} className={styles.tile} style={{
              background: t.c, color: t.tc, borderRadius: 24,
              padding: 28, minHeight: 220,
              display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
              cursor: 'pointer',
            }}>
              <div style={{ fontSize: 28, fontWeight: 600, letterSpacing: '-0.025em' }}>{t.t}</div>
              <div>
                <p style={{ fontSize: 13.5, margin: '0 0 16px', opacity: 0.85 }}>{t.d}</p>
                <span style={{ fontSize: 13, fontWeight: 500, opacity: 0.9 }}>Learn more →</span>
              </div>
            </div>
          ))}
        </div>
      </VReveal>
    </section>
  );
}

function VNewsletter() {
  return (
    <section style={{ padding: '64px 40px 24px' }}>
      <VReveal y={32}>
        <div style={{
          background: V.paperWarm, borderRadius: 32, padding: '64px 56px',
          display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 40, alignItems: 'center',
        }}>
          <div>
            <h3 style={{
              fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: 600,
              letterSpacing: '-0.03em', lineHeight: 1.02, margin: 0,
            }}>
              The dispatch.<br />
              <span style={{ color: V.mute }}>Once a week. Useful.</span>
            </h3>
            <p style={{ fontSize: 16, color: V.mute, maxWidth: 460, marginTop: 16 }}>
              New launches, early-access drops, and the occasional engineering note. Unsubscribe in one tap.
            </p>
          </div>
          <form
            style={{
              background: '#fff', borderRadius: 999, padding: 8, display: 'flex',
              boxShadow: '0 1px 0 rgba(10,10,10,0.04), 0 12px 32px rgba(10,10,10,0.06)',
            }}
            onSubmit={e => e.preventDefault()}
          >
            <input
              type="email"
              placeholder="you@your-domain.com"
              style={{
                flex: 1, border: 'none', outline: 'none',
                padding: '0 22px', fontSize: 15, fontFamily: 'inherit',
                background: 'transparent', color: V.ink,
              }}
            />
            <VBtn primary type="submit">Subscribe</VBtn>
          </form>
        </div>
      </VReveal>
    </section>
  );
}

function VFooter({ siteName }: { siteName: string }) {
  const cols = [
    { h: 'Shop',    l: ['Phones', 'Audio', 'Wearables', 'Computing', 'Accessories', 'Refurbished'] },
    { h: 'Learn',   l: ['Compare phones', 'Compare laptops', 'Camera system', 'Silicon', 'Sustainability'] },
    { h: 'Account', l: ['Sign in', 'Order status', 'Membership', 'Trade-in value', 'Saved bag'] },
    { h: 'Support', l: ['Contact', 'Care+', 'Studio sessions', 'Repair', 'FAQ', 'Accessibility'] },
    { h: 'Company', l: ['About', 'Careers', 'Press', 'Investors', 'Newsroom', 'Ethics'] },
  ];
  return (
    <footer style={{ background: V.ink, color: V.paper, padding: '72px 40px 28px' }}>
      <div style={{
        display: 'grid', gridTemplateColumns: '1.6fr repeat(5, 1fr)', gap: 32,
        paddingBottom: 56, borderBottom: `1px solid ${V.hairDark}`,
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 28, height: 28, background: V.paper, color: V.ink,
              borderRadius: 8, fontWeight: 700,
            }}>{siteName.charAt(0).toUpperCase()}</span>
            <span style={{ fontWeight: 600, fontSize: 18 }}>{siteName.toUpperCase()}</span>
          </div>
          <p style={{ marginTop: 18, maxWidth: 280, fontSize: 13.5, lineHeight: 1.65, color: 'rgba(250,250,249,0.6)' }}>
            Consumer electronics, distilled. Designed with precision, built for everyday life.
          </p>
          <div style={{ marginTop: 22, display: 'flex', gap: 10 }}>
            {['IG', 'YT', 'X', 'TT'].map(s => (
              <span key={s} style={{
                width: 36, height: 36, borderRadius: 999,
                border: `1px solid ${V.hairDark}`,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 600, color: 'rgba(250,250,249,0.8)', cursor: 'pointer',
              }}>{s}</span>
            ))}
          </div>
        </div>
        {cols.map(c => (
          <div key={c.h}>
            <div style={{
              fontSize: 11, fontWeight: 600, letterSpacing: '0.16em',
              textTransform: 'uppercase', color: 'rgba(250,250,249,0.5)',
            }}>{c.h}</div>
            <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {c.l.map(l => (
                <span key={l} style={{ fontSize: 13.5, color: 'rgba(250,250,249,0.85)', cursor: 'pointer' }}>{l}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div style={{
        paddingTop: 22, display: 'flex', justifyContent: 'space-between',
        fontSize: 12, color: 'rgba(250,250,249,0.55)',
      }}>
        <span>© {new Date().getFullYear()} {siteName} · All rights reserved</span>
        <span style={{ display: 'flex', gap: 24 }}>
          <span>Privacy</span><span>Terms</span><span>Cookies</span>
        </span>
      </div>
    </footer>
  );
}

// ─── Root export ──────────────────────────────────────────────────────────

export function VoltaHome({ page, settings }: VoltaHomeProps) {
  const siteName = settings.general.siteName || 'Volta';

  const rawNavLinks = settings.navigation.headerLinks.filter(l => l.enabled).map(l => l.label);
  const navLinks = rawNavLinks.length
    ? rawNavLinks.slice(0, 6)
    : ['Phones', 'Audio', 'Wearables', 'Computing', 'Home', 'Support'];

  const heroBlock = page.homeBlocks?.find((b): b is HeroBlock => b.type === 'hero' && b.enabled);
  const heroTitle  = heroBlock?.titlePrimary  || 'Pulse 12 Pro.';
  const heroTagline = heroBlock?.titleAccent  || 'Brighter. Quieter. Built to last the day, and then some.';
  const heroCtaLabel = heroBlock?.primaryCtaLabel || 'Shop now';

  return (
    <div className={styles.root}>
      <VAnnounce />
      <VNav siteName={siteName} navLinks={navLinks} />
      <VHero title={heroTitle} tagline={heroTagline} ctaLabel={heroCtaLabel} />
      <VPulseRail />
      <VEchoSpotlight />
      <VAudioGrid />
      <VOrbitDuo />
      <VLumenSpotlight />
      <VComputingGrid />
      <VServices />
      <VNewsletter />
      <VFooter siteName={siteName} />
    </div>
  );
}
