'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../lib/api';
import { Hall } from '../../types';
import confetti from 'canvas-confetti';
import {
  ShieldCheck,
  Mail,
  Lock,
  User,
  Phone,
  Home,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  GraduationCap,
  Building2,
  RotateCcw,
  AlertCircle,
  BookOpen,
  Check,
  ArrowLeft
} from 'lucide-react';

const DEPARTMENTS = [
  'Computer Science & Engineering',
  'Electronics & Communication Engineering',
  'Electrical Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
  'Chemical Engineering',
  'Metallurgical & Materials Engineering',
  'Biotechnology',
  'Department of Management Studies',
  'Mathematics & Computing',
  'Physics',
  'Chemistry',
  'Humanities and Social Sciences'
];

const PROGRAMMES = ['B.Tech', 'Dual Degree', 'M.Tech', 'MCA', 'M.Sc', 'MBA', 'Ph.D'];

const YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year'];

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuth();

  // 7-step registration flow:
  // 1: College Email
  // 2: Verify College Email OTP
  // 3: Personal Email
  // 4: Verify Personal Email OTP
  // 5: Student Details (Academic + Residence)
  // 6: Password Creation
  // 7: Registration Complete
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5 | 6 | 7>(1);

  // Step 1 & 2: College Email State
  const [collegeEmail, setCollegeEmail] = useState('');
  const [collegeOtp, setCollegeOtp] = useState('');
  const [collegeVerified, setCollegeVerified] = useState(false);
  const [collegeResendTimer, setCollegeResendTimer] = useState(0);

  // Step 3 & 4: Personal Email State
  const [personalEmail, setPersonalEmail] = useState('');
  const [personalOtp, setPersonalOtp] = useState('');
  const [personalVerified, setPersonalVerified] = useState(false);
  const [personalResendTimer, setPersonalResendTimer] = useState(0);

  // Step 5: Student Profile State
  const [fullName, setFullName] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [department, setDepartment] = useState(DEPARTMENTS[0]);
  const [programme, setProgramme] = useState(PROGRAMMES[0]);
  const [year, setYear] = useState(YEARS[0]);
  const [hallId, setHallId] = useState('');
  const [hallNumber, setHallNumber] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [halls, setHalls] = useState<Hall[]>([]);

  // Step 6: Password State
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Load campus residence halls
  useEffect(() => {
    apiRequest('/api/campus/halls')
      .then((res) => {
        if (res.success && res.halls) {
          setHalls(res.halls);
          if (res.halls.length > 0) {
            setHallId(res.halls[0].id);
            setHallNumber(res.halls[0].hallNumber || '1');
          }
        }
      })
      .catch(() => {});
  }, []);

  // Countdown timer for College OTP resend
  useEffect(() => {
    if (collegeResendTimer <= 0) return;
    const timer = setInterval(() => {
      setCollegeResendTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [collegeResendTimer]);

  // Countdown timer for Personal OTP resend
  useEffect(() => {
    if (personalResendTimer <= 0) return;
    const timer = setInterval(() => {
      setPersonalResendTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [personalResendTimer]);



  // Password Strength Calculation
  const calculatePasswordStrength = (pass: string) => {
    let score = 0;
    if (pass.length >= 8) score += 25;
    if (/[A-Z]/.test(pass)) score += 25;
    if (/[0-9]/.test(pass)) score += 25;
    if (/[^A-Za-z0-9]/.test(pass)) score += 25;
    return score;
  };

  const passStrength = calculatePasswordStrength(password);
  const getStrengthLabel = (score: number) => {
    if (score <= 25) return { text: 'Weak', color: 'bg-red-500', textCol: 'text-red-600' };
    if (score <= 50) return { text: 'Fair', color: 'bg-amber-500', textCol: 'text-amber-600' };
    if (score <= 75) return { text: 'Good', color: 'bg-blue-500', textCol: 'text-blue-600' };
    return { text: 'Strong', color: 'bg-[#689f38]', textCol: 'text-[#2e7d32]' };
  };

  // ========================================================
  // Step 1: Send College Email OTP
  // ========================================================
  const handleSendCollegeOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const clean = collegeEmail.trim().toLowerCase();
    if (!clean.endsWith('@nitdgp.ac.in')) {
      setError('Only @nitdgp.ac.in email addresses are accepted.');
      return;
    }

    setLoading(true);
    try {
      const res = await apiRequest('/api/auth/college/send-otp', {
        method: 'POST',
        body: JSON.stringify({ collegeEmail: clean }),
      });

      if (res.success) {
        setSuccessMsg('OTP sent to your NIT Durgapur email.');
        setCollegeOtp('');
        setCollegeResendTimer(60);
        setStep(2);
      } else {
        setError(res.message || 'Failed to dispatch verification code.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to dispatch verification code.');
    } finally {
      setLoading(false);
    }
  };

  // ========================================================
  // Step 2: Verify College Email OTP
  // ========================================================
  const handleVerifyCollegeOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (collegeOtp.trim().length !== 6) {
      setError('Please enter a valid 6-digit verification code.');
      return;
    }

    setLoading(true);
    try {
      const res = await apiRequest('/api/auth/college/verify-otp', {
        method: 'POST',
        body: JSON.stringify({
          collegeEmail: collegeEmail.trim().toLowerCase(),
          otp: collegeOtp.trim()
        }),
      });

      if (res.success) {
        setCollegeVerified(true);
        setSuccessMsg('✓ College email verified');
        setTimeout(() => {
          setSuccessMsg(null);
          setStep(3);
        }, 1200);
      } else {
        setError(res.message || 'Incorrect verification code. Please try again.');
      }
    } catch (err: any) {
      setError(err.message || 'Incorrect verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ========================================================
  // Step 3: Send Personal Email OTP
  // ========================================================
  const handleSendPersonalOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const clean = personalEmail.trim().toLowerCase();
    if (!clean.includes('@') || clean.endsWith('@nitdgp.ac.in')) {
      setError('Please enter a valid personal email (e.g. Gmail). College email cannot be used here.');
      return;
    }

    if (clean === collegeEmail.trim().toLowerCase()) {
      setError('Personal email must be different from your college email.');
      return;
    }

    setLoading(true);
    try {
      const res = await apiRequest('/api/auth/personal/send-otp', {
        method: 'POST',
        body: JSON.stringify({
          collegeEmail: collegeEmail.trim().toLowerCase(),
          personalEmail: clean
        }),
      });

      if (res.success) {
        setSuccessMsg('OTP sent to your personal email.');
        setPersonalOtp('');
        setPersonalResendTimer(60);
        setStep(4);
      } else {
        setError(res.message || 'Failed to dispatch verification code.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to dispatch verification code.');
    } finally {
      setLoading(false);
    }
  };

  // ========================================================
  // Step 4: Verify Personal Email OTP
  // ========================================================
  const handleVerifyPersonalOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (personalOtp.trim().length !== 6) {
      setError('Please enter a valid 6-digit verification code.');
      return;
    }

    setLoading(true);
    try {
      const res = await apiRequest('/api/auth/personal/verify-otp', {
        method: 'POST',
        body: JSON.stringify({
          personalEmail: personalEmail.trim().toLowerCase(),
          otp: personalOtp.trim()
        }),
      });

      if (res.success) {
        setPersonalVerified(true);
        setSuccessMsg('✓ Personal email verified');
        setTimeout(() => {
          setSuccessMsg(null);
          setStep(5);
        }, 1200);
      } else {
        setError(res.message || 'Incorrect verification code. Please try again.');
      }
    } catch (err: any) {
      setError(err.message || 'Incorrect verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ========================================================
  // Step 5: Save Student Profile Details -> Proceed to Password
  // ========================================================
  const handleProceedToPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim() || !rollNumber.trim() || !registrationNumber.trim() || !mobileNumber.trim() || !roomNumber.trim()) {
      setError('Please fill in all required profile fields.');
      return;
    }

    if (!/^[6-9]\d{9}$/.test(mobileNumber.trim())) {
      setError('Please provide a valid 10-digit Indian mobile number.');
      return;
    }

    setStep(6);
  };

  // ========================================================
  // Step 6: Create Password & Complete Registration
  // ========================================================
  const handleFinalAccountCreation = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        collegeEmail: collegeEmail.trim().toLowerCase(),
        personalEmail: personalEmail.trim().toLowerCase(),
        fullName: fullName.trim(),
        rollNumber: rollNumber.trim().toUpperCase(),
        registrationNumber: registrationNumber.trim().toUpperCase(),
        mobileNumber: mobileNumber.trim(),
        department,
        programme,
        year,
        hallId,
        hallNumber,
        roomNumber: roomNumber.trim(),
        password
      };

      const res = await apiRequest('/api/auth/register/complete', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (res.success && res.token && res.user) {
        login(res.token, res.user);
        setStep(7);
        try {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
          });
        } catch (e) {}
      } else {
        setError(res.message || 'Failed to complete registration.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create student account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-8 sm:py-12">
      {/* Step Progress Tracker */}
      <div className="mb-8">
        <div className="flex items-center justify-between text-[11px] font-bold text-gray-500 mb-2">
          <span className={step >= 1 ? 'text-[#689f38]' : ''}>1. College Email</span>
          <span className={step >= 3 ? 'text-[#689f38]' : ''}>2. Personal Email</span>
          <span className={step >= 5 ? 'text-[#689f38]' : ''}>3. Details</span>
          <span className={step >= 6 ? 'text-[#689f38]' : ''}>4. Password</span>
          <span className={step === 7 ? 'text-[#689f38]' : ''}>5. Complete</span>
        </div>
        <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
          <div
            className="bg-[#689f38] h-full transition-all duration-500 rounded-full"
            style={{ width: `${((step - 1) / 6) * 100}%` }}
          />
        </div>
      </div>

      {/* Main Form Card */}
      <div className="bg-white p-7 sm:p-9 rounded-2xl border border-gray-200 shadow-md transition-all space-y-6">
        {/* Card Header */}
        <div className="text-center space-y-1.5">
          <div className="w-12 h-12 bg-[#f1f8e9] text-[#689f38] border border-[#c5e1a5] rounded-xl flex items-center justify-center mx-auto shadow-inner">
            <GraduationCap className="w-6 h-6" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
            Create Your Campus Basket Account
          </h1>
          <p className="text-xs text-gray-500">
            NIT Durgapur Verified Student Registration
          </p>
        </div>



        {/* Alerts */}
        {error && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 rounded-xl bg-[#f1f8e9] border border-[#c5e1a5] text-xs text-[#2e7d32] font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#689f38] shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* ======================================================== */}
        {/* STEP 1: Official NIT Durgapur College Email               */}
        {/* ======================================================== */}
        {step === 1 && (
          <form onSubmit={handleSendCollegeOtp} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">
                Official NIT Durgapur Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  placeholder="e.g. student@nitdgp.ac.in"
                  value={collegeEmail}
                  onChange={(e) => setCollegeEmail(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-lg pl-10 pr-4 py-2.5 text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#84c225] focus:ring-1 focus:ring-[#84c225] transition-colors"
                  required
                  autoFocus
                />
              </div>
              <p className="text-[11px] text-gray-500 mt-1.5 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-[#689f38]" />
                Strictly restricted to official <strong className="text-gray-700 font-mono">@nitdgp.ac.in</strong> addresses.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || !collegeEmail}
              className="w-full py-3 bg-[#689f38] hover:bg-[#5b8c30] text-white font-extrabold text-xs uppercase tracking-wider rounded-lg shadow-sm active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              {loading ? <span>Sending Code...</span> : (
                <>
                  <span>Send OTP</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* ======================================================== */}
        {/* STEP 2: Verify College Email OTP                          */}
        {/* ======================================================== */}
        {step === 2 && (
          <form onSubmit={handleVerifyCollegeOtp} className="space-y-4">
            <div className="p-3 bg-[#f8fafc] border border-gray-200 rounded-xl text-xs text-gray-600 text-center space-y-1">
              <div>OTP sent to your NIT Durgapur email:</div>
              <div className="font-mono font-bold text-gray-900 text-sm">{collegeEmail}</div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">
                Enter 6-Digit College Verification Code
              </label>
              <input
                type="text"
                maxLength={6}
                placeholder="• • • • • •"
                value={collegeOtp}
                onChange={(e) => setCollegeOtp(e.target.value.replace(/\D/g, ''))}
                className="w-full bg-white border border-gray-300 rounded-lg py-2.5 text-center text-xl font-mono tracking-widest text-gray-900 focus:outline-none focus:border-[#84c225] focus:ring-1 focus:ring-[#84c225]"
                required
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={loading || collegeOtp.length !== 6}
              className="w-full py-3 bg-[#689f38] hover:bg-[#5b8c30] text-white font-extrabold text-xs uppercase tracking-wider rounded-lg shadow-sm active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? <span>Verifying...</span> : <span>Verify OTP</span>}
            </button>

            <div className="flex items-center justify-between text-xs text-gray-500 pt-1">
              <button
                type="button"
                onClick={() => { setStep(1); setError(null); }}
                className="hover:text-gray-900 flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Change College Email
              </button>

              <button
                type="button"
                disabled={collegeResendTimer > 0 || loading}
                onClick={handleSendCollegeOtp}
                className="text-[#689f38] font-bold hover:underline disabled:opacity-40 cursor-pointer"
              >
                {collegeResendTimer > 0 ? `Resend OTP (${collegeResendTimer}s)` : 'Resend OTP'}
              </button>
            </div>
          </form>
        )}

        {/* ======================================================== */}
        {/* STEP 3: Personal Email (Gmail / Personal)                 */}
        {/* ======================================================== */}
        {step === 3 && (
          <form onSubmit={handleSendPersonalOtp} className="space-y-4">
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#2e7d32]" />
                <span className="font-mono text-gray-800">{collegeEmail}</span>
              </div>
              <span className="bg-[#2e7d32] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                ✓ College email verified
              </span>
            </div>

            <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 leading-relaxed">
              <strong>Important:</strong> Your personal email will be used for all future OTPs, account recovery and important security notifications.
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">
                Personal Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  placeholder="e.g. studentname@gmail.com"
                  value={personalEmail}
                  onChange={(e) => setPersonalEmail(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-lg pl-10 pr-4 py-2.5 text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#84c225] focus:ring-1 focus:ring-[#84c225] transition-colors"
                  required
                  autoFocus
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !personalEmail}
              className="w-full py-3 bg-[#689f38] hover:bg-[#5b8c30] text-white font-extrabold text-xs uppercase tracking-wider rounded-lg shadow-sm active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              {loading ? <span>Sending Code...</span> : (
                <>
                  <span>Send OTP</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* ======================================================== */}
        {/* STEP 4: Verify Personal Email OTP                         */}
        {/* ======================================================== */}
        {step === 4 && (
          <form onSubmit={handleVerifyPersonalOtp} className="space-y-4">
            <div className="p-3 bg-[#f8fafc] border border-gray-200 rounded-xl text-xs text-gray-600 text-center space-y-1">
              <div>OTP sent to your personal email:</div>
              <div className="font-mono font-bold text-gray-900 text-sm">{personalEmail}</div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">
                Enter 6-Digit Personal Verification Code
              </label>
              <input
                type="text"
                maxLength={6}
                placeholder="• • • • • •"
                value={personalOtp}
                onChange={(e) => setPersonalOtp(e.target.value.replace(/\D/g, ''))}
                className="w-full bg-white border border-gray-300 rounded-lg py-2.5 text-center text-xl font-mono tracking-widest text-gray-900 focus:outline-none focus:border-[#84c225] focus:ring-1 focus:ring-[#84c225]"
                required
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={loading || personalOtp.length !== 6}
              className="w-full py-3 bg-[#689f38] hover:bg-[#5b8c30] text-white font-extrabold text-xs uppercase tracking-wider rounded-lg shadow-sm active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? <span>Verifying...</span> : <span>Verify OTP</span>}
            </button>

            <div className="flex items-center justify-between text-xs text-gray-500 pt-1">
              <button
                type="button"
                onClick={() => { setStep(3); setError(null); }}
                className="hover:text-gray-900 flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Change Personal Email
              </button>

              <button
                type="button"
                disabled={personalResendTimer > 0 || loading}
                onClick={handleSendPersonalOtp}
                className="text-[#689f38] font-bold hover:underline disabled:opacity-40 cursor-pointer"
              >
                {personalResendTimer > 0 ? `Resend OTP (${personalResendTimer}s)` : 'Resend OTP'}
              </button>
            </div>
          </form>
        )}

        {/* ======================================================== */}
        {/* STEP 5: Student Profile (Academic + Residence Details)     */}
        {/* ======================================================== */}
        {step === 5 && (
          <form onSubmit={handleProceedToPassword} className="space-y-4">
            {/* Verified Badges Banner */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-[#f8fafc] p-3 rounded-xl border border-gray-200">
              <div className="flex items-center justify-between text-[11px] bg-white p-2 rounded-lg border border-gray-200">
                <span className="font-mono text-gray-700 truncate">{collegeEmail}</span>
                <span className="text-[#2e7d32] font-bold shrink-0 ml-1">✓ Verified</span>
              </div>
              <div className="flex items-center justify-between text-[11px] bg-white p-2 rounded-lg border border-gray-200">
                <span className="font-mono text-gray-700 truncate">{personalEmail}</span>
                <span className="text-[#2e7d32] font-bold shrink-0 ml-1">✓ Verified</span>
              </div>
            </div>

            {/* Basic Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="e.g. Student Name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-[#84c225]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Mobile Number</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                  <input
                    type="tel"
                    maxLength={10}
                    placeholder="10-digit mobile"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-white border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-[#84c225]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Roll Number</label>
                <input
                  type="text"
                  placeholder="e.g. 24U10001"
                  value={rollNumber}
                  onChange={(e) => setRollNumber(e.target.value.toUpperCase())}
                  className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-xs font-mono text-gray-900 focus:outline-none focus:border-[#84c225]"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Registration Number</label>
                <input
                  type="text"
                  placeholder="e.g. 202410001"
                  value={registrationNumber}
                  onChange={(e) => setRegistrationNumber(e.target.value.toUpperCase())}
                  className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-xs font-mono text-gray-900 focus:outline-none focus:border-[#84c225]"
                  required
                />
              </div>
            </div>

            {/* Academic Information */}
            <div className="pt-2 border-t border-gray-100">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-2">
                Academic Information
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="sm:col-span-3">
                  <label className="text-[11px] font-bold text-gray-700 block mb-1">Department</label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-lg px-2.5 py-2 text-xs text-gray-900 focus:outline-none focus:border-[#84c225]"
                  >
                    {DEPARTMENTS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-gray-700 block mb-1">Programme</label>
                  <select
                    value={programme}
                    onChange={(e) => setProgramme(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-lg px-2.5 py-2 text-xs text-gray-900 focus:outline-none focus:border-[#84c225]"
                  >
                    {PROGRAMMES.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[11px] font-bold text-gray-700 block mb-1">Year of Study</label>
                  <select
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-lg px-2.5 py-2 text-xs text-gray-900 focus:outline-none focus:border-[#84c225]"
                  >
                    {YEARS.map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Residence Information */}
            <div className="pt-2 border-t border-gray-100">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-2">
                Residence / Hostel Information
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-gray-700 block mb-1">Hostel / Hall Name</label>
                  <select
                    value={hallId}
                    onChange={(e) => {
                      setHallId(e.target.value);
                      const matched = halls.find((h) => h.id === e.target.value);
                      if (matched) setHallNumber(matched.hallNumber || '');
                    }}
                    className="w-full bg-white border border-gray-300 rounded-lg px-2.5 py-2 text-xs text-gray-900 focus:outline-none focus:border-[#84c225]"
                    required
                  >
                    {halls.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.name} (Hall {h.hallNumber})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-gray-700 block mb-1">Room Number</label>
                  <input
                    type="text"
                    placeholder="e.g. B-304"
                    value={roomNumber}
                    onChange={(e) => setRoomNumber(e.target.value.toUpperCase())}
                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-xs font-mono text-gray-900 focus:outline-none focus:border-[#84c225]"
                    required
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-[#689f38] hover:bg-[#5b8c30] text-white font-extrabold text-xs uppercase tracking-wider rounded-lg shadow-sm active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer mt-3"
            >
              <span>Continue to Password</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* ======================================================== */}
        {/* STEP 6: Password Creation & Confirmation                  */}
        {/* ======================================================== */}
        {step === 6 && (
          <form onSubmit={handleFinalAccountCreation} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Create Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-lg pl-10 pr-10 py-2.5 text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#84c225] focus:ring-1 focus:ring-[#84c225]"
                  required
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Strength Indicator Bar */}
              {password && (
                <div className="mt-2 space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-gray-500">Strength:</span>
                    <span className={`font-bold ${getStrengthLabel(passStrength).textCol}`}>
                      {getStrengthLabel(passStrength).text}
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${getStrengthLabel(passStrength).color}`}
                      style={{ width: `${passStrength}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-gray-400 flex flex-wrap gap-x-2">
                    <span className={password.length >= 8 ? 'text-[#2e7d32]' : ''}>• 8+ chars</span>
                    <span className={/[A-Z]/.test(password) ? 'text-[#2e7d32]' : ''}>• Uppercase</span>
                    <span className={/[0-9]/.test(password) ? 'text-[#2e7d32]' : ''}>• Number</span>
                    <span className={/[^A-Za-z0-9]/.test(password) ? 'text-[#2e7d32]' : ''}>• Symbol</span>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Confirm Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-lg pl-10 pr-10 py-2.5 text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#84c225] focus:ring-1 focus:ring-[#84c225]"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-700"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !password || password !== confirmPassword}
              className="w-full py-3 bg-[#689f38] hover:bg-[#5b8c30] text-white font-extrabold text-xs uppercase tracking-wider rounded-lg shadow-sm active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              {loading ? <span>Creating Account...</span> : <span>Complete Registration</span>}
            </button>

            <button
              type="button"
              onClick={() => setStep(5)}
              className="w-full text-center text-xs text-gray-500 hover:text-gray-800 pt-1 cursor-pointer"
            >
              ← Back to Details
            </button>
          </form>
        )}

        {/* ======================================================== */}
        {/* STEP 7: Registration Complete                             */}
        {/* ======================================================== */}
        {step === 7 && (
          <div className="text-center space-y-5 py-4 animate-fade-in">
            <div className="w-16 h-16 bg-emerald-100 text-[#2e7d32] rounded-full flex items-center justify-center mx-auto border-2 border-emerald-300 shadow-sm">
              <Check className="w-8 h-8 stroke-[3]" />
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-900">Registration Complete!</h2>
              <p className="text-xs text-gray-500 mt-1">
                Your Campus Basket student account has been created successfully.
              </p>
            </div>

            <div className="bg-[#f8fafc] p-4 rounded-xl border border-gray-200 text-left text-xs space-y-2">
              <div className="flex justify-between border-b border-gray-100 pb-1.5">
                <span className="text-gray-500">Student Name:</span>
                <span className="font-bold text-gray-900">{fullName}</span>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-1.5">
                <span className="text-gray-500">Official College Email:</span>
                <span className="font-mono text-gray-900">{collegeEmail}</span>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-1.5">
                <span className="text-gray-500">Recovery &amp; OTP Email:</span>
                <span className="font-mono text-gray-900">{personalEmail}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Roll Number &amp; Room:</span>
                <span className="font-mono text-gray-900">{rollNumber} &bull; Room {roomNumber}</span>
              </div>
            </div>

            <button
              onClick={() => router.push('/')}
              className="w-full py-3.5 bg-[#4F9D2F] hover:bg-[#36751F] text-white font-extrabold text-xs uppercase tracking-wider rounded-lg shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Go to Campus Marketplace</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Footer */}
        {step < 7 && (
          <div className="pt-3 border-t border-gray-100 text-center text-xs text-gray-500">
            Already have a registered student account?{' '}
            <Link href="/login" className="text-[#689f38] font-bold hover:underline">
              Sign In
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}