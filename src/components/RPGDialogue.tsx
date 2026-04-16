import { useState, useEffect, useCallback, useRef } from 'react';

export interface DialogueOption {
  id: string;
  label: string;
}

interface RPGDialogueProps {
  speakerName?: string;
  text: string;
  options?: DialogueOption[];
  onSelect?: (option: DialogueOption) => void;
  /** Called on ESC or when text has no options and ENTER is pressed */
  onClose?: () => void;
  /** ms per character. Default 28 */
  typewriterSpeed?: number;
}

export function RPGDialogue({
  speakerName,
  text,
  options = [],
  onSelect,
  onClose,
  typewriterSpeed = 28,
}: RPGDialogueProps) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);
  const [cursor, setCursor] = useState(0);
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const listRef = useRef<HTMLDivElement>(null);

  // ── Typewriter ─────────────────────────────────────────────────────────────
  useEffect(() => {
    setDisplayed('');
    setDone(false);
    setCursor(0);
    let i = 0;
    const iv = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(iv);
        setDone(true);
      }
    }, typewriterSpeed);
    return () => clearInterval(iv);
  }, [text, typewriterSpeed]);

  // ── Auto-scroll selected option into view ──────────────────────────────────
  useEffect(() => {
    optionRefs.current[cursor]?.scrollIntoView({ block: 'nearest' });
  }, [cursor]);

  // ── Skip typewriter OR confirm selection ───────────────────────────────────
  const confirm = useCallback(() => {
    if (!done) {
      setDisplayed(text);
      setDone(true);
      return;
    }
    if (options.length > 0) {
      onSelect?.(options[cursor]);
    } else {
      onClose?.();
    }
  }, [done, text, options, cursor, onSelect, onClose]);

  // ── Keyboard navigation (capture phase so hub WASD doesn't fire) ───────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          e.stopPropagation();
          e.preventDefault();
          if (done) setCursor(prev => (prev > 0 ? prev - 1 : options.length - 1));
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          e.stopPropagation();
          e.preventDefault();
          if (done) setCursor(prev => (prev < options.length - 1 ? prev + 1 : 0));
          break;
        case 'Enter':
        case ' ':
          e.stopPropagation();
          e.preventDefault();
          confirm();
          break;
        case 'Escape':
          e.stopPropagation();
          onClose?.();
          break;
        default:
          break;
      }
    };
    // capture: true → fires before hub listeners
    window.addEventListener('keydown', onKey, { capture: true });
    return () => window.removeEventListener('keydown', onKey, { capture: true });
  }, [done, options.length, confirm, onClose]);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '840px',
        maxWidth: 'calc(100% - 40px)',
        zIndex: 200,
        fontFamily: '"Press Start 2P", monospace',
        pointerEvents: 'auto',
        // Subtle scanline on the overlay area
        backgroundImage:
          'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.08) 2px, rgba(0,0,0,0.08) 4px)',
      }}
    >
      {/* ── Speaker name tab ── */}
      {speakerName && (
        <div
          style={{
            display: 'inline-block',
            marginLeft: 20,
            marginBottom: -4,
            position: 'relative',
            zIndex: 1,
            padding: '5px 14px 8px',
            background: '#0f0804',
            border: '4px solid #3d2817',
            borderBottom: 'none',
            color: '#fbbf24',
            fontSize: '7px',
            letterSpacing: '0.05em',
          }}
        >
          {speakerName}
        </div>
      )}

      {/* ── Main box ── */}
      <div
        style={{
          margin: '0 0 10px',
          padding: '16px 20px 12px',
          background: 'rgba(15, 8, 4, 0.97)',
          border: '4px solid #3d2817',
          boxShadow: '0 -8px 60px rgba(0,0,0,0.9), inset 0 0 40px rgba(0,0,0,0.5)',
        }}
      >
        {/* Text area */}
        <p
          style={{
            color: '#e4e4e7',
            fontSize: '9px',
            lineHeight: 2,
            minHeight: '2em',
            marginBottom: done && options.length > 0 ? 14 : 0,
          }}
        >
          {displayed}
          {!done && (
            <span
              style={{ animation: 'twcursor 0.7s step-end infinite', opacity: 1 }}
            >
              █
            </span>
          )}
        </p>

        {/* Options list */}
        {done && options.length > 0 && (
          <>
            <div
              style={{ height: 1, background: '#2a1810', marginBottom: 12 }}
            />
            <div
              ref={listRef}
              style={{
                maxHeight: 200,
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                // Slim pixel scrollbar
                scrollbarWidth: 'thin',
                scrollbarColor: '#3d2817 #0f0804',
              }}
            >
              {options.map((opt, i) => (
                <button
                  key={opt.id}
                  ref={el => { optionRefs.current[i] = el; }}
                  onMouseEnter={() => setCursor(i)}
                  onClick={() => { setCursor(i); onSelect?.(opt); }}
                  style={{
                    textAlign: 'left',
                    padding: '7px 10px',
                    fontSize: '8px',
                    color: i === cursor ? '#fbbf24' : '#8b7355',
                    background: i === cursor
                      ? 'rgba(251,191,36,0.10)'
                      : 'transparent',
                    border: i === cursor
                      ? '1px solid rgba(251,191,36,0.25)'
                      : '1px solid transparent',
                    cursor: 'pointer',
                    fontFamily: '"Press Start 2P", monospace',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    transition: 'color 0.08s, background 0.08s',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  <span style={{ width: 10, flexShrink: 0, color: '#fbbf24' }}>
                    {i === cursor ? '▶' : ' '}
                  </span>
                  {opt.label}
                </button>
              ))}
            </div>
          </>
        )}

        {/* Hint footer */}
        <div
          style={{
            marginTop: 10,
            color: '#5c4a3d',
            fontSize: '6px',
            display: 'flex',
            gap: 20,
          }}
        >
          {!done && <span>ENTER · saltar texto</span>}
          {done && options.length > 0 && <span>↑↓ seleccionar · ENTER confirmar</span>}
          {done && options.length === 0 && <span>ENTER · continuar</span>}
          {onClose && <span>ESC · cancelar</span>}
        </div>
      </div>

      <style>{`
        @keyframes twcursor {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
