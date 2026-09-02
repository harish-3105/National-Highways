'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Smartphone,
  ShieldCheck,
  QrCode,
  ArrowRight,
  Loader2,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Copy,
  Check,
  Lock,
} from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/highways';

  const [step, setStep] = useState<'PHONE' | 'SETUP_QR' | 'VERIFY_OTP'>('PHONE');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [fullName, setFullName] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [manualSecret, setManualSecret] = useState('');
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Handle Step 1: Phone Identification
  const handleIdentify = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = phoneNumber.trim().replace(/[\s-]/g, '');
    if (!clean || clean.length < 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/auth/identify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: clean }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to identify mobile number.');
      }

      setFullName(data.fullName);
      if (data.needsSetup) {
        setQrCodeUrl(data.qrCodeUrl);
        setManualSecret(data.manualSecret);
        setStep('SETUP_QR');
      } else {
        setStep('VERIFY_OTP');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error communicating with server.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Step 2: Verify TOTP Code
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = otpCode.trim().replace(/[\s-]/g, '');
    if (cleanCode.length !== 6 || !/^\d{6}$/.test(cleanCode)) {
      setErrorMsg('Please enter a valid 6-digit numeric code.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/auth/verify-totp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: phoneNumber.trim().replace(/[\s-]/g, ''),
          code: cleanCode,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Verification failed.');
      }

      // Redirect to intended route
      router.push(redirectUrl);
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid authenticator code.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopySecret = () => {
    navigator.clipboard.writeText(manualSecret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center px-4 sm:px-6 py-12">
      {/* Department Branding Header */}
      <div className="text-center mb-8 max-w-md">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xs bg-blue-600 text-white font-black text-lg mb-3 shadow-lg shadow-blue-600/30">
          NH
        </div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight">
          Tamil Nadu National Highways
        </h1>
        <p className="text-xs text-slate-400 font-medium mt-1">
          Integrated Departmental Management & Governance Portal
        </p>
      </div>

      {/* Login Card */}
      <div className="w-full max-w-md bg-slate-800 border border-slate-700 rounded-xs shadow-2xl p-6 sm:p-8 relative">
        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-5 p-3.5 bg-red-950/80 border border-red-800 rounded-xs text-xs text-red-200 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* STEP 1: Enter Mobile Number */}
        {step === 'PHONE' && (
          <form onSubmit={handleIdentify} className="space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <Smartphone className="w-4 h-4 text-blue-400" />
                <label className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Mobile Phone Number
                </label>
              </div>
              <p className="text-[11px] text-slate-400 mb-3">
                Enter your registered 10-digit mobile number to log in via Authenticator app.
              </p>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs font-mono font-bold text-slate-400">
                  +91
                </span>
                <input
                  type="tel"
                  required
                  autoFocus
                  placeholder="9840123456"
                  maxLength={10}
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                  className="w-full pl-12 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-xs text-sm font-mono font-bold text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || phoneNumber.length < 10}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs rounded-xs transition-colors cursor-pointer shadow-md shadow-blue-600/20"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying Mobile...</span>
                </>
              ) : (
                <>
                  <span>Continue to Authenticator</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* STEP 2A: First Time QR Code Setup */}
        {step === 'SETUP_QR' && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="text-center">
              <div className="inline-flex p-2 bg-blue-950/60 border border-blue-800 rounded-xs text-blue-300 mb-2">
                <QrCode className="w-5 h-5" />
              </div>
              <h2 className="text-sm font-bold text-slate-100">Setup Authenticator App</h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Welcome, <strong className="text-blue-400">{fullName}</strong>! Scan this QR code in Google Authenticator or Microsoft Authenticator.
              </p>
            </div>

            {/* QR Code Display */}
            {qrCodeUrl && (
              <div className="p-3 bg-white rounded-xs flex flex-col items-center justify-center max-w-[200px] mx-auto border-2 border-blue-500 shadow-lg">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qrCodeUrl} alt="2FA QR Code" className="w-44 h-44" />
              </div>
            )}

            {/* Manual Secret Code */}
            <div className="p-2.5 bg-slate-900 border border-slate-700 rounded-xs flex items-center justify-between gap-2">
              <div className="overflow-hidden">
                <div className="text-[9px] font-bold text-slate-400 uppercase">Manual Entry Key</div>
                <div className="text-xs font-mono font-bold text-amber-300 truncate">{manualSecret}</div>
              </div>
              <button
                type="button"
                onClick={handleCopySecret}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xs transition-colors cursor-pointer shrink-0"
                title="Copy Secret Key"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* 6-Digit Code Input */}
            <div>
              <label className="text-xs font-bold text-slate-200 block mb-1.5 uppercase tracking-wider">
                Enter 6-Digit Code from App
              </label>
              <input
                type="text"
                required
                autoFocus
                maxLength={6}
                placeholder="123456"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                className="w-full text-center tracking-[0.4em] py-2.5 bg-slate-900 border border-slate-700 rounded-xs text-base font-mono font-extrabold text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setStep('PHONE');
                  setOtpCode('');
                }}
                className="w-1/3 py-2 px-3 bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold text-xs rounded-xs transition-colors cursor-pointer"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={isLoading || otpCode.length !== 6}
                className="w-2/3 flex items-center justify-center gap-2 py-2 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xs transition-colors cursor-pointer shadow-md"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Complete Setup</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* STEP 2B: Regular Daily Login (6-Digit Code) */}
        {step === 'VERIFY_OTP' && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="text-center">
              <div className="inline-flex p-2 bg-blue-950/60 border border-blue-800 rounded-xs text-blue-300 mb-2">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h2 className="text-sm font-bold text-slate-100">Enter Authenticator Code</h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Officer: <strong className="text-blue-400">{fullName}</strong> (+91 {phoneNumber})
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  6-Digit Passcode
                </label>
                <span className="text-[10px] text-slate-400">Google / Microsoft Auth</span>
              </div>
              <input
                type="text"
                required
                autoFocus
                maxLength={6}
                placeholder="• • • • • •"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                className="w-full text-center tracking-[0.5em] py-3 bg-slate-900 border border-slate-700 rounded-xs text-lg font-mono font-extrabold text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setStep('PHONE');
                  setOtpCode('');
                }}
                className="w-1/3 py-2.5 px-3 bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold text-xs rounded-xs transition-colors cursor-pointer"
              >
                Change Phone
              </button>
              <button
                type="submit"
                disabled={isLoading || otpCode.length !== 6}
                className="w-2/3 flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs rounded-xs transition-colors cursor-pointer shadow-md shadow-blue-600/20"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Logging In...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Verify & Log In</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Footer Security Note */}
        <div className="mt-6 pt-4 border-t border-slate-700/60 text-center">
          <p className="text-[10px] text-slate-400">
            Protected by <strong>RFC 6238 TOTP</strong> & Departmental RBAC.
            <br />
            For device replacement or lost phone, contact your Chief Engineer.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-400 text-xs font-bold">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500 mr-2" />
          <span>Loading Secure Portal Login...</span>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
