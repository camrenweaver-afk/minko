// onboarding.jsx — Account creation + Welcome screens

function OnboardingFlow({ dark, accent, onComplete, onSkip }) {
  // view: 'landing' | 'emailSignup' | 'emailSignin'
  const [view, setView] = useState2('landing');
  const [step, setStep] = useState2(1);
  const [email, setEmail] = useState2('');
  const [password, setPassword] = useState2('');
  const [showPass, setShowPass] = useState2(false);
  const [emailFocused, setEmailFocused] = useState2(false);
  const [passFocused, setPassFocused] = useState2(false);
  const [loading, setLoading] = useState2(false);
  const [googleLoading, setGoogleLoading] = useState2(false);
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
      if (view === 'emailSignup') {
        const { error: err } = await window.sb.auth.signUp({ email, password });
        if (err) { setError(err.message); setLoading(false); return; }
        setStep(2);
      } else {
        const { error: err } = await window.sb.auth.signInWithPassword({ email, password });
        if (err) { setError(err.message); setLoading(false); return; }
        onSkip();
      }
    } catch (e) {
      setError('Something went wrong. Try again.');
    }
    setLoading(false);
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    setError('');
    const { error: err } = await window.sb.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.href.split('?')[0].split('#')[0] },
    });
    if (err) { setError(err.message); setGoogleLoading(false); }
  };

  const goBack = () => { setView('landing'); setError(''); setEmail(''); setPassword(''); };

  const GoogleIcon = () => (
    <svg width="18" height="18" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <path fill="#EA4335" d="M24 9.5c3.14 0 5.95 1.08 8.17 2.86l6.08-6.08C34.52 3.05 29.56 1 24 1 14.82 1 7.07 6.48 3.64 14.22l7.08 5.5C12.43 13.72 17.76 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.5 24.5c0-1.64-.15-3.22-.42-4.75H24v9h12.67c-.55 2.96-2.2 5.47-4.67 7.16l7.19 5.58C43.37 37.27 46.5 31.36 46.5 24.5z"/>
      <path fill="#FBBC05" d="M10.72 28.28A14.6 14.6 0 0 1 9.5 24c0-1.49.26-2.93.72-4.28l-7.08-5.5A23.93 23.93 0 0 0 0 24c0 3.87.93 7.53 2.57 10.75l8.15-6.47z"/>
      <path fill="#34A853" d="M24 47c5.56 0 10.23-1.84 13.64-4.99l-7.19-5.58C28.7 37.88 26.46 38.5 24 38.5c-6.24 0-11.57-4.22-13.28-9.94l-8.15 6.47C6.07 42.28 14.45 47 24 47z"/>
    </svg>
  );

  const destinations = ['Tokyo', 'Lisbon', 'Kyoto', 'Brooklyn', 'Paris', 'Amsterdam', 'Toronto', 'Barcelona'];

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 100, background: bg, overflow: 'hidden' }}>

      {/* ── LANDING: Logo + Google + Email Sign Up + Sign in link ── */}
      {step === 1 && view === 'landing' && (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column', padding: '0 28px',
          animation: 'minko-fade-in 0.35s ease',
        }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <img src="logo.png" alt="Minko" style={{ width: '95%', height: 'auto' }}/>
          </div>

          <div style={{ paddingBottom: 52, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Google */}
            <button onClick={handleGoogle} disabled={googleLoading} style={{
              height: 54, borderRadius: 16, border: '1.5px solid rgba(20,30,60,0.12)',
              background: 'white', cursor: googleLoading ? 'default' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              fontFamily: SANS, fontSize: 15, fontWeight: 600, color: '#1a1a2e',
              boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
              opacity: googleLoading ? 0.6 : 1, transition: 'opacity 0.15s',
            }}>
              <GoogleIcon/>
              {googleLoading ? '…' : 'Continue with Google'}
            </button>

            {/* Email Sign Up */}
            <button onClick={() => setView('emailSignup')} style={{
              height: 54, borderRadius: 16, border: 'none', cursor: 'pointer',
              background: accent, color: 'white',
              fontFamily: SANS, fontSize: 15, fontWeight: 600,
              boxShadow: `0 4px 18px ${accent}44`,
            }}>
              Sign up with Email
            </button>

            {/* Sign in link */}
            <div style={{ textAlign: 'center' }}>
              <button onClick={() => setView('emailSignin')} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontFamily: SANS, fontSize: 14, color: textMuted, padding: '6px 0',
              }}>
                Already have an account?{' '}
                <span style={{ color: accent, fontWeight: 600 }}>Sign in</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── EMAIL FORM (signup or signin) ── */}
      {step === 1 && (view === 'emailSignup' || view === 'emailSignin') && (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column', padding: '0 28px',
          animation: 'minko-fade-in 0.25s ease',
        }}>
          {/* Back button */}
          <div style={{ paddingTop: 56, paddingBottom: 8 }}>
            <button onClick={goBack} style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0',
              fontFamily: SANS, fontSize: 14, color: textMuted,
              display: 'flex', alignItems: 'center', gap: 4,
            }}>
              ← Back
            </button>
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 6 }}>
            <span style={{ fontFamily: SERIF, fontSize: 32, fontWeight: 500, color: textPrimary, letterSpacing: -0.8 }}>
              {view === 'emailSignup' ? 'Create account' : 'Welcome back'}
            </span>
            <span style={{ fontFamily: SANS, fontSize: 14, color: textMuted, marginBottom: 8 }}>
              {view === 'emailSignup' ? 'Your travel journal awaits.' : 'Sign in to continue.'}
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
                  placeholder={view === 'emailSignup' ? 'Min. 6 characters' : '••••••••'}
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
              {loading ? '…' : view === 'emailSignup' ? 'Create account' : 'Sign in'}
            </button>
          </div>
        </div>
      )}

      {/* ── WELCOME (post-signup) ── */}
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
