import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import axiosClient from '../api/axiosClient';
import { Eye, EyeOff, Lock, Mail, ArrowRight } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export const Login: React.FC = () => {
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsSubmitting(true);
    try {
      const response = await axiosClient.post('/auth/login', data);
      const { token, user } = response.data;
      login(token, user);
      showToast(`Welcome back, ${user.name}!`, 'success');
      navigate('/');
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Login failed. Please check your credentials.';
      showToast(errorMsg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'var(--background)',
      padding: '48px 16px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Ambient glow orbs */}
      <div style={{
        position: 'absolute', top: '-15%', left: '-10%',
        width: 600, height: 600, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(75,99,130,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '-15%', right: '-10%',
        width: 500, height: 500, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(166,136,104,0.06) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ width: '100%', maxWidth: 400, position: 'relative', zIndex: 1 }}>

        {/* Brand header */}
        <div style={{ textAlign: 'center', marginBottom: 36 }} className="reveal reveal-1">
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            backgroundColor: 'var(--color-interactive)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 18px',
            fontSize: 14, fontWeight: 800, color: '#fff',
            border: '1px solid rgba(255,255,255,0.12)',
            boxShadow: '0 8px 24px rgba(75,99,130,0.3)',
          }}>TO</div>
          <h1 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>
            TransitOps
          </h1>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>
            Sign in to manage your fleet operations
          </p>
        </div>

        {/* Login card */}
        <div
          className="card reveal reveal-2"
          style={{ padding: '28px 28px', position: 'relative', overflow: 'hidden' }}
        >
          <div className="accent-bar" />

          <form style={{ display: 'flex', flexDirection: 'column', gap: 20 }} onSubmit={handleSubmit(onSubmit)}>

            {/* Email */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label htmlFor="email" style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)' }}>
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={14} strokeWidth={1.75} style={{
                  position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                  color: 'var(--text-muted)', pointerEvents: 'none',
                }} />
                <input
                  id="email"
                  type="email"
                  {...register('email')}
                  className="input-base"
                  style={{
                    paddingLeft: 36,
                    borderColor: errors.email ? 'rgba(239,68,68,0.5)' : undefined,
                  }}
                  placeholder="manager@transitops.com"
                />
              </div>
              {errors.email && <p style={{ margin: 0, fontSize: 11, color: '#f87171' }}>{errors.email.message}</p>}
            </div>

            {/* Password */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label htmlFor="password" style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={14} strokeWidth={1.75} style={{
                  position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                  color: 'var(--text-muted)', pointerEvents: 'none',
                }} />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  {...register('password')}
                  className="input-base"
                  style={{
                    paddingLeft: 36, paddingRight: 40,
                    borderColor: errors.password ? 'rgba(239,68,68,0.5)' : undefined,
                  }}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--text-muted)', padding: 4, display: 'flex', alignItems: 'center',
                  }}
                >
                  {showPassword ? <EyeOff size={14} strokeWidth={1.75} /> : <Eye size={14} strokeWidth={1.75} />}
                </button>
              </div>
              {errors.password && <p style={{ margin: 0, fontSize: 11, color: '#f87171' }}>{errors.password.message}</p>}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: 8, width: '100%', padding: '12px 20px',
                borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)',
                backgroundColor: 'var(--color-interactive)',
                color: '#fff', fontSize: 13, fontWeight: 600,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                opacity: isSubmitting ? 0.7 : 1,
                boxShadow: '0 4px 14px rgba(75,99,130,0.3)',
                transition: 'all 160ms cubic-bezier(0.16,1,0.3,1)',
                letterSpacing: '-0.01em',
              }}
            >
              {isSubmitting ? (
                <div style={{ width: 18, height: 18, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', animation: 'spin 0.7s linear infinite' }} />
              ) : (
                <>
                  <span>Sign in</span>
                  <ArrowRight size={14} strokeWidth={2} />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Demo credentials */}
        <div
          className="reveal reveal-3"
          style={{
            marginTop: 16,
            padding: '14px 18px',
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            textAlign: 'center',
          }}
        >
          <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
            Demo Credentials (password: password)
          </p>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.8 }}>
            <div>Fleet Manager: <span style={{ color: 'var(--color-accent-h)', fontWeight: 600 }}>manager@transitops.com</span></div>
            <div>Driver: <span style={{ color: 'var(--color-accent-h)', fontWeight: 600 }}>driver@transitops.com</span></div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Login;
