'use client';

import { useActionState, useEffect } from 'react';
import { loginAction } from './actions';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(loginAction, null);
  const router = useRouter();
  const { setTheme } = useTheme();

  useEffect(() => {
    // Force light mode on login screen
    setTheme('light');
    
    if (state?.success) {
      router.push('/');
    }
  }, [state, router, setTheme]);

  return (
    <div style={{ height: '100vh', width: '100vw', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-default)' }}>
      <div style={{ width: '100%', maxWidth: '400px', padding: 'var(--space-6)', border: '1px solid var(--primary)', backgroundColor: 'var(--bg-surface)' }}>
        <h1 style={{ color: 'var(--primary)', textTransform: 'uppercase', marginBottom: 'var(--space-4)', fontSize: '24px', letterSpacing: '1px' }}>TransitOps</h1>
        <div style={{ marginBottom: 'var(--space-6)', color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase' }}>Authorized Personnel Only</div>
        
        <form action={formAction} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {state?.error && (
            <div style={{ padding: 'var(--space-2)', border: '1px solid var(--error)', color: 'var(--error)', fontSize: '12px' }}>
              {state.error}
            </div>
          )}
          
          <div>
            <label style={{ display: 'block', marginBottom: 'var(--space-2)', fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Email</label>
            <input type="email" name="email" required className="input-field" placeholder="admin@transitops.local" />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: 'var(--space-2)', fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Password</label>
            <input type="password" name="password" required className="input-field" />
          </div>

          <button type="submit" className="btn-primary" disabled={isPending} style={{ marginTop: 'var(--space-4)' }}>
            {isPending ? 'Authenticating...' : 'Access System'}
          </button>
        </form>
      </div>
    </div>
  );
}
