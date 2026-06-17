import { useEffect, useState, useCallback } from 'react';
import { BEASTS } from '../store/useStore';
import { asset } from '../lib/asset';
import { sfx } from '../lib/sfx';
import {
  createTournament, joinTournament, getMyTournaments, getLeaderboard, inviteLink,
  type Tournament, type LeaderboardRow,
} from '../lib/tournaments';

const FONT = '"Press Start 2P", monospace';
const BEAST_LIST = Object.values(BEASTS);

const fmtMins = (m: number) => {
  const h = Math.floor(m / 60);
  const min = Math.round(m % 60);
  return h > 0 ? `${h}h ${min}m` : `${min}m`;
};

export function TournamentsScreen({ userId, onClose }: { userId: string; onClose: () => void }) {
  const [tab, setTab] = useState<'list' | 'create' | 'join'>('list');
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selected, setSelected] = useState<Tournament | null>(null);
  const [board, setBoard] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadList = useCallback(async () => {
    setLoading(true);
    try {
      const list = await getMyTournaments();
      setTournaments(list);
      if (list.length && !selected) setSelected(list[0]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setLoading(false);
    }
  }, [selected]);

  useEffect(() => { loadList(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!selected) { setBoard([]); return; }
    getLeaderboard(selected.id).then(setBoard).catch(() => setBoard([]));
  }, [selected]);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9998, display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(4,2,1,0.96)', backdropFilter: 'blur(4px)', fontFamily: FONT, padding: 20,
    }}>
      <div style={{
        width: '100%', maxWidth: 760, maxHeight: '92vh', display: 'flex', flexDirection: 'column',
        border: '2px solid #92400e', background: '#0a0504',
        boxShadow: '8px 8px 0 #000, 0 0 60px rgba(146,64,14,0.18)',
      }}>
        {/* Header */}
        <div style={{ padding: '16px 22px', borderBottom: '1px solid #1a0e08', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 7, color: '#6b5040', letterSpacing: '0.28em', marginBottom: 5 }}>⸺ EL GREMIO ⸺</div>
            <h2 style={{ fontSize: 14, color: '#fbbf24', letterSpacing: '0.12em', textShadow: '2px 2px 0 #000' }}>TORNEOS</h2>
          </div>
          <button onClick={() => { sfx.click(); onClose(); }} style={btnGhost}>✕</button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid #1a0e08', flexShrink: 0 }}>
          {([['list', 'MIS TORNEOS'], ['create', '+ CREAR'], ['join', '↦ UNIRME']] as const).map(([k, label]) => (
            <button key={k} onClick={() => { sfx.click(); setTab(k); setError(null); }} style={{
              flex: 1, padding: '12px 0', fontFamily: FONT, fontSize: 8, cursor: 'pointer',
              background: tab === k ? '#160a00' : 'transparent',
              color: tab === k ? '#fbbf24' : '#6b5040',
              border: 'none', borderBottom: `2px solid ${tab === k ? '#d97706' : 'transparent'}`,
              letterSpacing: '0.1em',
            }}>{label}</button>
          ))}
        </div>

        <div style={{ overflowY: 'auto', flex: 1, minHeight: 0 }}>
          {error && <div style={{ margin: 16, fontSize: 8, color: '#f87171', border: '1px solid #7f1d1d', background: '#160404', padding: '8px 10px' }}>⚠ {error}</div>}

          {tab === 'list' && (
            <ListTab loading={loading} tournaments={tournaments} selected={selected} setSelected={setSelected}
              board={board} userId={userId} onGoCreate={() => setTab('create')} />
          )}
          {tab === 'create' && (
            <CreateTab onCreated={async (t) => { sfx.success(); await loadList(); setSelected(t); setTab('list'); }} setError={setError} />
          )}
          {tab === 'join' && (
            <JoinTab onJoined={async (t) => { sfx.success(); await loadList(); setSelected(t); setTab('list'); }} setError={setError} />
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Tab: Lista + ranking ─────────────────────────────────────────────────────
function ListTab({ loading, tournaments, selected, setSelected, board, userId, onGoCreate }: {
  loading: boolean; tournaments: Tournament[]; selected: Tournament | null;
  setSelected: (t: Tournament) => void; board: LeaderboardRow[]; userId: string; onGoCreate: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const copyLink = () => {
    if (!selected) return;
    navigator.clipboard.writeText(inviteLink(selected.invite_code)).then(() => {
      sfx.click(); setCopied(true); setTimeout(() => setCopied(false), 1800);
    });
  };

  if (loading) return <Centered>INVOCANDO TORNEOS...</Centered>;
  if (!tournaments.length) return (
    <Centered>
      <div style={{ marginBottom: 16 }}>No perteneces a ningún torneo.</div>
      <button onClick={() => { sfx.click(); onGoCreate(); }} style={btnPrimary}>+ CREAR EL PRIMERO</button>
    </Centered>
  );

  const beast = selected ? (BEASTS[selected.beast_id as keyof typeof BEASTS] ?? BEASTS.aurelian) : null;

  return (
    <div style={{ display: 'flex', minHeight: 0 }}>
      {/* Lista */}
      <div style={{ flex: '0 0 220px', borderRight: '1px solid #1a0e08' }}>
        {tournaments.map(t => {
          const b = BEASTS[t.beast_id as keyof typeof BEASTS] ?? BEASTS.aurelian;
          const sel = selected?.id === t.id;
          return (
            <button key={t.id} onClick={() => { sfx.click(); setSelected(t); }} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px',
              border: 'none', borderBottom: '1px solid #120a06',
              borderLeft: `3px solid ${sel ? '#d97706' : 'transparent'}`,
              background: sel ? '#160a00' : 'transparent', cursor: 'pointer', textAlign: 'left',
            }}>
              <img src={asset(b.spriteImg)} alt="" style={{ width: 26, height: 26, imageRendering: 'pixelated', objectFit: 'contain', flexShrink: 0 }} />
              <span style={{ fontSize: 8, color: sel ? '#fbbf24' : '#8b7355', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</span>
            </button>
          );
        })}
      </div>

      {/* Detalle + ranking */}
      <div style={{ flex: 1, padding: '16px 18px', minWidth: 0 }}>
        {selected && beast && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <img src={asset(beast.spriteImg)} alt="" style={{ width: 40, height: 40, imageRendering: 'pixelated', objectFit: 'contain', filter: `drop-shadow(0 0 6px ${beast.color}aa)` }} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 11, color: '#fbbf24', marginBottom: 5, overflow: 'hidden', textOverflow: 'ellipsis' }}>{selected.name}</div>
                {selected.ends_at && <div style={{ fontSize: 7, color: '#6b5040' }}>cierra {new Date(selected.ends_at).toLocaleDateString()}</div>}
              </div>
            </div>

            {/* Invitar */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center' }}>
              <div style={{ flex: 1, fontSize: 8, color: '#8b7355', border: '2px solid #2a1810', background: '#0f0804', padding: '9px 11px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                CÓDIGO: <span style={{ color: '#fbbf24' }}>{selected.invite_code}</span>
              </div>
              <button onClick={copyLink} style={{ ...btnSmall, color: copied ? '#4ade80' : '#fbbf24', borderColor: copied ? '#14532d' : '#d97706' }}>
                {copied ? '✓ COPIADO' : '⎘ COPIAR LINK'}
              </button>
            </div>

            {/* Ranking */}
            <div style={{ fontSize: 8, color: '#8b7355', letterSpacing: '0.2em', marginBottom: 10 }}>RANKING</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {board.map((r, i) => {
                const b = BEASTS[r.avatar_beast as keyof typeof BEASTS] ?? BEASTS.maro;
                const me = r.user_id === userId;
                const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`;
                return (
                  <div key={r.user_id} style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px',
                    background: me ? '#160a00' : '#0f0804',
                    border: `2px solid ${me ? '#d97706' : '#1a0e08'}`,
                  }}>
                    <span style={{ fontSize: 9, width: 22, textAlign: 'center', color: '#fbbf24' }}>{medal}</span>
                    <img src={asset(b.spriteImg)} alt="" style={{ width: 22, height: 22, imageRendering: 'pixelated', objectFit: 'contain' }} />
                    <span style={{ flex: 1, fontSize: 8, color: me ? '#fbbf24' : '#c9b896', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.display_name}{me ? ' (vos)' : ''}</span>
                    <span style={{ fontSize: 8, color: '#6b5040' }}>{fmtMins(r.total_mins)}</span>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Tab: Crear ───────────────────────────────────────────────────────────────
function CreateTab({ onCreated, setError }: { onCreated: (t: Tournament) => void; setError: (s: string | null) => void }) {
  const [name, setName] = useState('');
  const [beastId, setBeastId] = useState('aurelian');
  const [ends, setEnds] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!name.trim()) return;
    setBusy(true); setError(null);
    try {
      const t = await createTournament(name, beastId, ends || null);
      onCreated(t);
    } catch (e) {
      sfx.error(); setError(e instanceof Error ? e.message : 'Error');
    } finally { setBusy(false); }
  };

  return (
    <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 18 }}>
      <Label text="NOMBRE DEL TORNEO" />
      <input value={name} onChange={e => setName(e.target.value)} placeholder="PARCIAL ANÁLISIS MATEMÁTICO 2" maxLength={40} style={inputStyle} />

      <Label text="BESTIA DEL TORNEO" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(50px, 1fr))', gap: 6 }}>
        {BEAST_LIST.map(b => {
          const sel = beastId === b.id;
          return (
            <button key={b.id} onClick={() => { sfx.click(); setBeastId(b.id); }} title={b.fullName} style={{
              aspectRatio: '1', background: sel ? '#1c0e00' : '#0f0804',
              border: `2px solid ${sel ? '#d97706' : '#2a1810'}`,
              boxShadow: sel ? '0 0 10px rgba(217,119,6,0.35)' : 'none', cursor: 'pointer', padding: 4,
            }}>
              <img src={asset(b.spriteImg)} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', imageRendering: 'pixelated', opacity: sel ? 1 : 0.65 }} />
            </button>
          );
        })}
      </div>

      <Label text="FECHA DEL PARCIAL (OPCIONAL)" />
      <input type="date" value={ends} onChange={e => setEnds(e.target.value)} style={inputStyle} />

      <button onClick={submit} disabled={busy || !name.trim()} onMouseEnter={() => !busy && sfx.hover()}
        style={{ ...btnPrimary, opacity: name.trim() ? 1 : 0.4, marginTop: 6 }}>
        {busy ? 'FORJANDO...' : '⚔  CREAR TORNEO'}
      </button>
    </div>
  );
}

// ─── Tab: Unirse ──────────────────────────────────────────────────────────────
function JoinTab({ onJoined, setError }: { onJoined: (t: Tournament) => void; setError: (s: string | null) => void }) {
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!code.trim()) return;
    setBusy(true); setError(null);
    try {
      const t = await joinTournament(code);
      onJoined(t);
    } catch (e) {
      sfx.error(); setError(e instanceof Error ? e.message : 'Código inválido');
    } finally { setBusy(false); }
  };

  return (
    <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Label text="CÓDIGO DE INVITACIÓN" />
      <p style={{ fontSize: 7, color: '#6b5040', lineHeight: 1.7 }}>Pegá el código que te pasó tu compañero (o entrá por el link directo).</p>
      <input value={code} onChange={e => setCode(e.target.value)} placeholder="a1b2c3d4" maxLength={16} style={inputStyle} />
      <button onClick={submit} disabled={busy || !code.trim()} onMouseEnter={() => !busy && sfx.hover()}
        style={{ ...btnPrimary, opacity: code.trim() ? 1 : 0.4 }}>
        {busy ? 'ENTRANDO...' : '↦  UNIRME'}
      </button>
    </div>
  );
}

// ─── Helpers UI ───────────────────────────────────────────────────────────────
const inputStyle: React.CSSProperties = {
  fontFamily: FONT, fontSize: 10, padding: '12px 13px', background: '#0f0804',
  color: '#ede0c8', border: '2px solid #2a1810', outline: 'none', boxShadow: 'inset 2px 2px 0 rgba(0,0,0,0.4)',
};
const btnPrimary: React.CSSProperties = {
  padding: '14px 18px', fontFamily: FONT, fontSize: 10, background: '#1c0e00', color: '#fbbf24',
  border: '2px solid #d97706', cursor: 'pointer', letterSpacing: '0.1em', textShadow: '2px 2px 0 #000',
  boxShadow: '0 0 14px rgba(217,119,6,0.28), 3px 3px 0 #000',
};
const btnSmall: React.CSSProperties = {
  padding: '9px 12px', fontFamily: FONT, fontSize: 8, background: '#1c0e00',
  border: '2px solid #d97706', cursor: 'pointer', letterSpacing: '0.06em', whiteSpace: 'nowrap',
};
const btnGhost: React.CSSProperties = {
  padding: '8px 12px', fontFamily: FONT, fontSize: 10, background: '#0f0804', color: '#8b7355',
  border: '2px solid #2a1810', cursor: 'pointer',
};

function Label({ text }: { text: string }) {
  return <span style={{ fontSize: 7, color: '#8b7355', letterSpacing: '0.2em' }}>{text}</span>;
}
function Centered({ children }: { children: React.ReactNode }) {
  return <div style={{ padding: 40, textAlign: 'center', fontSize: 9, color: '#6b5040', lineHeight: 1.8 }}>{children}</div>;
}
