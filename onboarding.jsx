// onboarding.jsx — Account creation + Welcome screens

function OnboardingFlow({ dark, accent, onComplete, onSkip }) {
  const [mode, setMode] = useState2('signup'); // 'signup' | 'signin'
  const [step, setStep] = useState2(1);
  const [email, setEmail] = useState2('');
  const [password, setPassword] = useState2('');
  const [showPass, setShowPass] = useState2(false);
  const [emailFocused, setEmailFocused] = useState2(false);
  const [passFocused, setPassFocused] = useState2(false);
  const [loading, setLoading] = useState2(false);
  const [error, setError] = useState2('');

  const bg = dark
    ? 'linear-gradient(160deg, #0e1018 0%, #161824 100%)'
    : 'linear-gradient(160deg, #f7f2ea 0%, #ece4d4 100%)';

  const textPrimary = dark ? '#f5f1e8' : '#1a1a2e';
  const textMuted = dark ? 'rgba(255,255,255,0.42)' : 'rgba(20,20,30,0.42)';
  const inputBg = dark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.72)';
  const inputBorderNormal = dark ? 'rgba(255,255,255,0.1)' : 'rgba(20,30,60,0.1)';

  const inputStyle = (focused) => ({
    width: '100%', boxSizing: 'border-box',
    height: 54, padding: '0 16px', borderRadius: 14,
    border: `1.5px solid ${focused ? accent : (error ? '#e05c5c' : inputBorderNormal)}`,
    outline: 'none',
    background: inputBg,
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    fontFamily: SANS, fontSize: 16, color: textPrimary,
    transition: 'border-color 0.18s',
  });

  const canSubmit = email.trim().length > 3 && password.length >= 6;

  const handleSubmit = async () => {
    if (!canSubmit || loading) return;
    setLoading(true);
    setError('');
    try {
      if (mode === 'signup') {
        const { error: err } = await window.sb.auth.signUp({ email, password });
        if (err) { setError(err.message); setLoading(false); return; }
        setStep(2);
      } else {
        const { error: err } = await window.sb.auth.signInWithPassword({ email, password });
        if (err) { setError(err.message); setLoading(false); return; }
        onSkip(); // signed in → go straight to app
      }
    } catch (e) {
      setError('Something went wrong. Try again.');
    }
    setLoading(false);
  };

  const switchMode = () => {
    setMode(m => m === 'signup' ? 'signin' : 'signup');
    setError('');
  };

  const destinations = ['Tokyo', 'Lisbon', 'Kyoto', 'Brooklyn', 'Paris', 'Amsterdam', 'Toronto', 'Barcelona'];

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 100, background: bg, overflow: 'hidden' }}>

      {/* ── SCREEN 1: Account creation / Sign in ── */}
      {step === 1 && (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column', padding: '0 28px',
          animation: 'minko-fade-in 0.35s ease',
        }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <span style={{ fontFamily: SERIF, fontSize: 54, fontWeight: 500, fontStyle: 'italic', color: textPrimary, letterSpacing: -1.5, lineHeight: 1 }}>minko</span>
            <span style={{ fontFamily: SANS, fontSize: 13, color: textMuted, letterSpacing: 0.5 }}>
              {mode === 'signup' ? 'Your travel journal' : 'Welcome back'}
            </span>
          </div>

          <div style={{ paddingBottom: 52, display: 'flex', flexDirection: 'column', gap: 14 }}>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              <label style={{ fontFamily: SANS, fontSize: 11.5, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', color: textMuted }}>Email</label>
              <input
                type="email" value={email}
                onChange={e => { setEmail(e.target.value); setError(''); }}
                onFocus={() => setEmailFocused(true)} onBlur={() => setEmailFocused(false)}
                placeholder="you@example.com"
                style={inputStyle(emailFocused)}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              <label style={{ fontFamily: SANS, fontSize: 11.5, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', color: textMuted }}>Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPass ? 'text' : 'password'} value={password}
                  onChange={e => { setPassword(e.target.value); setError(''); }}
                  onFocus={() => setPassFocused(true)} onBlur={() => setPassFocused(false)}
                  placeholder={mode === 'signup' ? 'Min. 6 characters' : '••••••••'}
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                  style={{ ...inputStyle(passFocused), paddingRight: 48 }}
                />
                <button onClick={() => setShowPass(v => !v)} style={{
                  position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: textMuted,
                }}>
                  <MinkoIcon name="eye-off" size={18} strokeWidth={1.6}/>
                </button>
              </div>
            </div>

            {error && (
              <div style={{
                padding: '10px 14px', borderRadius: 10,
                background: 'rgba(220,60,60,0.1)', border: '1px solid rgba(220,60,60,0.25)',
                fontFamily: SANS, fontSize: 13, color: '#e05c5c',
              }}>{error}</div>
            )}

            <button
              disabled={!canSubmit || loading}
              onClick={handleSubmit}
              style={{
                height: 54, borderRadius: 16, border: 'none',
                cursor: canSubmit && !loading ? 'pointer' : 'default',
                background: canSubmit && !loading ? accent : (dark ? 'rgba(255,255,255,0.1)' : 'rgba(20,30,60,0.1)'),
                color: canSubmit && !loading ? 'white' : textMuted,
                fontFamily: SANS, fontSize: 16, fontWeight: 600, letterSpacing: 0.2,
                marginTop: 4,
                boxShadow: canSubmit && !loading ? `0 4px 18px ${accent}44` : 'none',
                transition: 'background 0.2s, box-shadow 0.2s',
              }}>
              {loading ? '…' : mode === 'signup' ? 'Create account' : 'Sign in'}
            </button>

            <div style={{ textAlign: 'center' }}>
              <button onClick={switchMode} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontFamily: SANS, fontSize: 14, color: textMuted, padding: '6px 0',
              }}>
                {mode === 'signup' ? 'Already have an account? ' : 'No account yet? '}
                <span style={{ color: accent, fontWeight: 600 }}>
                  {mode === 'signup' ? 'Sign in' : 'Create one'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── SCREEN 2: Welcome (post-signup) ── */}
      {step === 2 && (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
          animation: 'minko-fade-in 0.35s ease', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
            {destinations.map((d, i) => {
              const positions = [
                { top: '12%', left: '8%', rotate: '-6deg' },
                { top: '18%', right: '6%', rotate: '4deg' },
                { top: '30%', left: '18%', rotate: '-3deg' },
                { top: '38%', right: '10%', rotate: '7deg' },
                { top: '22%', left: '52%', rotate: '-5deg' },
                { top: '46%', left: '6%', rotate: '3deg' },
                { top: '10%', left: '38%', rotate: '-8deg' },
                { top: '34%', left: '60%', rotate: '5deg' },
              ];
              const pos = positions[i] || {};
              return (
                <div key={d} style={{
                  position: 'absolute', ...pos, transform: `rotate(${pos.rotate})`,
                  padding: '6px 13px', borderRadius: 999,
                  background: dark ? 'rgba(255,255,255,0.06)' : 'rgba(20,30,60,0.06)',
                  border: dark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(20,30,60,0.07)',
                  fontFamily: SANS, fontSize: 12.5, fontWeight: 500,
                  color: dark ? 'rgba(255,255,255,0.28)' : 'rgba(20,20,30,0.28)',
                  whiteSpace: 'nowrap', opacity: 0.8,
                }}>{d}</div>
              );
            })}
          </div>

          <div style={{ flex: 1 }}/>
          <div style={{ padding: '0 28px 56px', display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontFamily: SERIF, fontSize: 16, fontStyle: 'italic', color: accent, marginBottom: 24, display: 'block' }}>minko</span>
            <h1 style={{ fontFamily: SERIF, fontSize: 46, fontWeight: 500, lineHeight: 1.05, color: textPrimary, letterSpacing: -1.2, margin: '0 0 16px' }}>
              Your travel<br/>journal.
            </h1>
            <p style={{ fontFamily: SANS, fontSize: 15.5, lineHeight: 1.6, color: textMuted, margin: '0 0 38px' }}>
              Log the places you go. Rate them honestly. Build a map that's actually yours.
            </p>
            <button onClick={onComplete} style={{
              height: 54, borderRadius: 16, border: 'none', cursor: 'pointer',
              background: accent, color: 'white',
              fontFamily: SANS, fontSize: 16, fontWeight: 600, letterSpacing: 0.2,
              boxShadow: `0 4px 18px ${accent}44`, marginBottom: 16,
            }}>
              Log your first place →
            </button>
            <button onClick={onSkip} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: SANS, fontSize: 14, color: textMuted, padding: '8px 0', textAlign: 'center',
            }}>
              Skip for now
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

window.OnboardingFlow = OnboardingFlow;
