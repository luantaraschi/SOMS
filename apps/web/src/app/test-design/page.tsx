import { Crown, Headphones, Music, Trophy, Zap } from 'lucide-react';
import {
  SmAvatar,
  SmBadge,
  SmButton,
  SmCard,
  SmInput,
  SmLabel,
} from '@/components/primitives';

/**
 * /test-design — sandbox visual de TODOS os tokens do design system.
 * Não tem lógica; só renderização. Use pra validar:
 *   - Fontes carregaram via next/font (Unbounded/Inter/JetBrains Mono)
 *   - Tokens CSS resolveram (cores, sombras, raios)
 *   - Classes .sm-* foram aplicadas via styles.css importado do package
 *   - Tailwind v4 utilities (bg-primary, text-ink) funcionam via @theme inline
 */

type Swatch = {
  token: string;
  hex: string;
  textColor: string;
};

const PALETTE: Swatch[] = [
  { token: '--bg', hex: '#FFFCF2', textColor: 'var(--ink)' },
  { token: '--surface', hex: '#FFFFFF', textColor: 'var(--ink)' },
  { token: '--ink', hex: '#0A0A0A', textColor: '#FFF' },
  { token: '--ink-soft', hex: '#3D3D3D', textColor: '#FFF' },
  { token: '--primary', hex: '#FFE600', textColor: 'var(--ink)' },
  { token: '--secondary', hex: '#FF3D7F', textColor: '#FFF' },
  { token: '--success', hex: '#B8FF1A', textColor: 'var(--ink)' },
  { token: '--warm', hex: '#FF9F1C', textColor: 'var(--ink)' },
  { token: '--info', hex: '#00E5FF', textColor: 'var(--ink)' },
  { token: '--special', hex: '#A78BFA', textColor: '#FFF' },
  { token: '--danger', hex: '#FF4D4D', textColor: '#FFF' },
];

const RADII = [
  { token: '--radius-sm', label: 'sm', cssVar: 'var(--radius-sm)' },
  { token: '--radius-md', label: 'md', cssVar: 'var(--radius-md)' },
  { token: '--radius-lg', label: 'lg', cssVar: 'var(--radius-lg)' },
  { token: '--radius-xl', label: 'xl', cssVar: 'var(--radius-xl)' },
];

const SHADOWS = [
  { token: '--shadow-sm', label: 'sm — 3px', cssVar: 'var(--shadow-sm)' },
  { token: '--shadow-md', label: 'md — 6px', cssVar: 'var(--shadow-md)' },
  { token: '--shadow-lg', label: 'lg — 8px', cssVar: 'var(--shadow-lg)' },
  { token: '--shadow-xl', label: 'xl — 12px', cssVar: 'var(--shadow-xl)' },
];

export default function TestDesignPage(): React.ReactElement {
  return (
    <main className="paper min-h-screen p-8">
      <div className="max-w-5xl mx-auto space-y-16">
        <header>
          <h1 className="t-h1">design system — sandbox</h1>
          <p className="t-caption mt-2">
            cada bloco abaixo valida um pedaço de tokens.css ou styles.css. se algo
            tá errado aqui, tá errado em todo o app.
          </p>
        </header>

        {/* ─── PALETA ─── */}
        <Section title="01 · paleta">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {PALETTE.map((s) => (
              <div
                key={s.token}
                className="border-3 rounded-lg overflow-hidden"
                style={{
                  borderColor: 'var(--ink)',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <div
                  className="h-20 flex items-center justify-center"
                  style={{ background: `var(${s.token})`, color: s.textColor }}
                >
                  <span className="t-mono text-sm">{s.hex}</span>
                </div>
                <div className="bg-surface p-2 border-t-3" style={{ borderColor: 'var(--ink)' }}>
                  <code className="t-mono text-xs">{s.token}</code>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* ─── TIPOGRAFIA ─── */}
        <Section title="02 · tipografia">
          <div className="space-y-6">
            <Row label="t-mega · Unbounded 900 uppercase">
              <span className="t-mega">SOMS</span>
            </Row>
            <Row label="t-display · Unbounded 800 uppercase">
              <span className="t-display">VOCÊ ACERTOU</span>
            </Row>
            <Row label="t-h1 · Unbounded 800">
              <span className="t-h1">criar sala</span>
            </Row>
            <Row label="t-h2 · Unbounded 700">
              <span className="t-h2">configurações da partida</span>
            </Row>
            <Row label="t-h3 · Unbounded 700">
              <span className="t-h3">memi · host</span>
            </Row>
            <Row label="t-lg · Inter 500">
              <span className="t-lg">ouça, chute, passe vergonha.</span>
            </Row>
            <Row label="t-body · Inter 400">
              <span className="t-body">
                a maioria das pessoas erra os feats. drake só tem 3 hits em 10 rounds.
              </span>
            </Row>
            <Row label="t-label · Inter 700 uppercase tracking 0.12em">
              <span className="t-label">código da sala</span>
            </Row>
            <Row label="t-caption · Inter 400 ink-soft">
              <span className="t-caption">aguardando mais 2 jogadores...</span>
            </Row>
            <Row label="t-mono · JetBrains Mono 700 tabular">
              <span className="t-mono text-2xl">ABKM · 00:27</span>
            </Row>
            <Row label="t-slogan · Inter italic 500 ink-soft">
              <span className="t-slogan">todo mundo acha que sabe.</span>
            </Row>
          </div>
        </Section>

        {/* ─── RADII ─── */}
        <Section title="03 · border-radius">
          <div className="flex flex-wrap gap-6">
            {RADII.map((r) => (
              <div key={r.token} className="text-center">
                <div
                  className="w-24 h-24 bg-primary border-3"
                  style={{
                    borderColor: 'var(--ink)',
                    borderRadius: r.cssVar,
                    boxShadow: 'var(--shadow-md)',
                  }}
                />
                <code className="t-mono text-xs block mt-2">{r.label}</code>
              </div>
            ))}
          </div>
        </Section>

        {/* ─── SOMBRAS ─── */}
        <Section title="04 · sombras (hard, zero blur)">
          <div className="flex flex-wrap gap-10">
            {SHADOWS.map((s) => (
              <div key={s.token} className="text-center">
                <div
                  className="w-24 h-24 bg-surface border-3"
                  style={{
                    borderColor: 'var(--ink)',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: s.cssVar,
                  }}
                />
                <code className="t-mono text-xs block mt-3">{s.label}</code>
              </div>
            ))}
          </div>
        </Section>

        {/* ─── BOTÕES ─── */}
        <Section title="05 · botões">
          <div className="flex flex-wrap items-center gap-4">
            <SmButton variant="primary">CRIAR SALA</SmButton>
            <SmButton variant="secondary">CONVIDAR</SmButton>
            <SmButton variant="success">+50 PTS</SmButton>
            <SmButton variant="danger">EXPULSAR</SmButton>
            <SmButton variant="default">VOLTAR</SmButton>
            <SmButton variant="ghost">CANCELAR</SmButton>
          </div>
          <div className="flex flex-wrap items-center gap-4 mt-6">
            <SmButton variant="primary" size="lg">
              INICIAR PARTIDA
            </SmButton>
            <SmButton variant="primary" block>
              ENTRAR
            </SmButton>
          </div>
        </Section>

        {/* ─── INPUTS ─── */}
        <Section title="06 · inputs">
          <div className="max-w-md space-y-6">
            <div>
              <SmLabel>seu apelido</SmLabel>
              <SmInput placeholder="memi" defaultValue="" />
            </div>
            <div>
              <SmLabel>código da sala</SmLabel>
              <SmInput mono placeholder="ABCD12" maxLength={6} />
            </div>
          </div>
        </Section>

        {/* ─── CARDS ─── */}
        <Section title="07 · cards">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <SmCard tilt="l">
              <div className="flex items-center gap-3">
                <SmAvatar initial="m" bgColor="var(--success)" />
                <div>
                  <div className="t-h3">memi</div>
                  <SmBadge variant="host">
                    <Crown size={14} strokeWidth={3} className="mr-1" /> HOST
                  </SmBadge>
                </div>
              </div>
              <p className="t-caption mt-4">acertou em 1.4s · +130 pts</p>
            </SmCard>
            <SmCard tilt="r" style={{ background: 'var(--primary)' }}>
              <div className="t-label">round 3 de 10</div>
              <div className="t-mega mt-2 t-mono">ABKM</div>
              <p className="t-caption mt-2 on-light">
                código pra entrar nessa partida.
              </p>
            </SmCard>
            <SmCard tilt="l" hero>
              <div className="text-center">
                <div className="t-h2">PÓDIO</div>
                <Trophy size={40} strokeWidth={3} className="mx-auto mt-4" />
                <p className="t-h3 mt-3">memi · 480 pts</p>
              </div>
            </SmCard>
          </div>
        </Section>

        {/* ─── HERO (room code) ─── */}
        <Section title="08 · hero — room code">
          <SmCard
            hero
            tilt="r"
            style={{ background: 'var(--special)', maxWidth: '600px' }}
          >
            <div className="on-light text-center">
              <SmLabel>código da sala</SmLabel>
              <div className="t-mega t-mono mt-2" style={{ color: '#FFF' }}>
                ABKM
              </div>
              <p className="t-body mt-4" style={{ color: '#FFF' }}>
                copia e cola pros seus amigos.
              </p>
            </div>
          </SmCard>
        </Section>

        {/* ─── BADGES + ÍCONES ─── */}
        <Section title="09 · badges + ícones lucide">
          <div className="flex flex-wrap items-center gap-4">
            <SmBadge variant="host">
              <Crown size={14} strokeWidth={3} className="mr-1" />
              HOST
            </SmBadge>
            <SmBadge variant="special">
              <Zap size={14} strokeWidth={3} className="mr-1" />
              ACERTO EM 1.2s
            </SmBadge>
            <SmBadge variant="info">
              <Headphones size={14} strokeWidth={3} className="mr-1" />
              OUVINDO
            </SmBadge>
            <SmBadge variant="warm">QUASE</SmBadge>
          </div>
          <div className="flex flex-wrap items-center gap-6 mt-6">
            <Music size={32} strokeWidth={3} />
            <Crown size={32} strokeWidth={3} />
            <Zap size={32} strokeWidth={3} />
            <Headphones size={32} strokeWidth={3} />
            <Trophy size={32} strokeWidth={3} />
          </div>
        </Section>
      </div>
    </main>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <section>
      <h2 className="t-label mb-6">{title}</h2>
      {children}
    </section>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <div className="border-b-3 pb-4" style={{ borderColor: 'var(--ink-soft)', borderStyle: 'dashed', borderBottomWidth: 1 }}>
      <div className="t-caption mb-2">{label}</div>
      <div>{children}</div>
    </div>
  );
}
