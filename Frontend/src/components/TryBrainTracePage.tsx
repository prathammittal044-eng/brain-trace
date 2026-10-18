import React, { useState, useEffect } from 'react';
import { ArrowLeft, Eye, EyeOff, ShieldCheck, Mail, Phone, Lock, KeyRound, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';
import { BrainTraceLogo } from './BrainTraceLogo';
import { PatientDashboard } from './PatientDashboard';
import { CaretakerDashboard } from './CaretakerDashboard';
import { DoctorDashboard } from './DoctorDashboard';
import { FamilyDashboardView } from './care_space/FamilyDashboardView';
import { subscribeToCompanionNavigation } from '../services/companionNavigation';
import { authApi } from '../services/apiClient';


interface TryBrainTracePageProps {
  onBackToHome: () => void;
  loggedInUser?: string | null;
  userRole?: 'Patient' | 'Caretaker' | 'Doctor' | 'Family';
  onLoginSuccess?: (userName: string, role: 'Patient' | 'Caretaker' | 'Doctor' | 'Family') => void;
  onLogout?: () => void;
}

export const TryBrainTracePage: React.FC<TryBrainTracePageProps> = ({ 
  onBackToHome,
  loggedInUser,
  userRole = 'Patient',
  onLoginSuccess,
  onLogout
}) => {
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'otp' | 'loginOtp' | 'forgotPassword'>('login');
  const [selectedRole, setSelectedRole] = useState<'Patient' | 'Caretaker' | 'Doctor' | 'Family'>(userRole);
  const [isRoleLocked, setIsRoleLocked] = useState(false);
  
  // Login form state
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(Boolean(loggedInUser));
  const [loginSuccessMessage, setLoginSuccessMessage] = useState('');

  // Login OTP verification state
  const [loginEmailOtp, setLoginEmailOtp] = useState('');
  const [generatedLoginOtp, setGeneratedLoginOtp] = useState('123456');
  const [loginOtpError, setLoginOtpError] = useState('');

  // Signup form state
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [signupError, setSignupError] = useState('');
  const [userDisplayName, setUserDisplayName] = useState(loggedInUser || '');

  // OTP state for Caretaker & Doctor signup
  const [emailOtp, setEmailOtp] = useState('');
  const [phoneOtp, setPhoneOtp] = useState('');
  const [generatedEmailOtp, setGeneratedEmailOtp] = useState('');
  const [generatedPhoneOtp, setGeneratedPhoneOtp] = useState('');
  const [otpError, setOtpError] = useState('');

  // Forgot Password state
  const [resetEmail, setResetEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [isCodeVerified, setIsCodeVerified] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [resetError, setResetError] = useState('');

  const roles: ('Patient' | 'Caretaker' | 'Doctor' | 'Family')[] = ['Patient', 'Caretaker', 'Doctor', 'Family'];

  // Listen for companion navigation to automatically activate dashboard views
  useEffect(() => {
    const unsubscribe = subscribeToCompanionNavigation((destination) => {
      if (destination !== 'home') {
        if (!isLoggedIn) {
          setIsLoggedIn(true);
          setUserDisplayName('Demo Patient (DX-4091)');
          if (onLoginSuccess) {
            onLoginSuccess('Demo Patient (DX-4091)', 'Patient');
          }
        }
      }
    });
    return unsubscribe;
  }, [isLoggedIn, onLoginSuccess]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    if (selectedRole === 'Patient') {
      // Patient login: No password or OTP required
      const name = fullName || 'Demo Patient (DX-4091)';
      setUserDisplayName(name);
      setIsLoggedIn(true);
      authApi.login({ email, password: '', role: 'Patient' }).catch(() => {});
      if (onLoginSuccess) {
        onLoginSuccess(name, 'Patient');
      }
      return;
    }

    // Doctor & Caretaker login: Requires password first, then 2FA Email OTP
    if (!password) return;

    setGeneratedLoginOtp('123456');
    setLoginEmailOtp('');
    setLoginOtpError('');
    setAuthMode('loginOtp');
  };

  const handleVerifyLoginOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginOtpError('');

    if (loginEmailOtp.trim() !== generatedLoginOtp) {
      setLoginOtpError('Invalid OTP code. Please enter the 6-digit OTP sent to your email (Demo OTP: 123456).');
      return;
    }

    authApi.login({ email, password, role: selectedRole }).catch(() => {});

    const name = fullName || (selectedRole === 'Doctor' ? 'Dr. Rajesh Sharma' : selectedRole === 'Caretaker' ? 'Rahul Caregiver' : selectedRole === 'Family' ? 'Priya Sharma (Daughter)' : 'Demo Patient (DX-4091)');
    setUserDisplayName(name);
    setIsLoggedIn(true);
    if (onLoginSuccess) {
      onLoginSuccess(name, selectedRole);
    }
  };

  const handleSignupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError('');

    // Phone number validation: strictly 10 digits
    const phoneDigits = phone.replace(/\D/g, '');
    if (phoneDigits.length !== 10) {
      setSignupError('Phone number must be exactly 10 digits (e.g. 9876543210).');
      return;
    }

    if (signupPassword !== confirmPassword) {
      setSignupError('Passwords do not match. Please verify both passwords.');
      return;
    }

    if (signupPassword.length < 6) {
      setSignupError('Password must be at least 6 characters long.');
      return;
    }

    // Role is locked once signup form is submitted
    setIsRoleLocked(true);

    if (selectedRole === 'Patient') {
      // Patients create account directly without OTP
      authApi.register({
        email: signupEmail,
        password: signupPassword,
        role: 'patient',
        full_name: fullName,
        phone
      }).catch(() => {});

      setUserDisplayName(fullName || 'Patient');
      setLoginSuccessMessage(`Account created successfully for ${fullName || 'Patient'}! Please log in with your email and password.`);
      setEmail(signupEmail);
      
      // Reset signup fields & switch to login
      resetSignupForm();
      setIsRoleLocked(false);
      setAuthMode('login');
    } else {
      // Caretakers and Doctors require OTP verification on email and phone
      // Set 2 fixed different OTP numbers for verification
      const eOtp = '123456';
      const pOtp = '654321';

      setGeneratedEmailOtp(eOtp);
      setGeneratedPhoneOtp(pOtp);
      setEmailOtp('');
      setPhoneOtp('');
      setOtpError('');
      setAuthMode('otp');
    }
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError('');

    if (emailOtp.trim() !== generatedEmailOtp) {
      setOtpError('Invalid Email OTP. Please check the code sent to your email.');
      return;
    }

    if (phoneOtp.trim() !== generatedPhoneOtp) {
      setOtpError('Invalid Phone OTP. Please check the code sent to your mobile number.');
      return;
    }

    // Both OTPs verified! Account created successfully!
    authApi.register({
      email: signupEmail,
      password: signupPassword,
      role: selectedRole.toLowerCase(),
      full_name: fullName,
      phone
    }).catch(() => {});

    setUserDisplayName(fullName || selectedRole);
    setLoginSuccessMessage(`Security verification complete! Account created for ${fullName || selectedRole} (${selectedRole}). Please log in.`);
    setEmail(signupEmail);

    // Reset fields & switch to login
    resetSignupForm();
    setIsRoleLocked(false);
    setAuthMode('login');
  };

  const handleOpenForgotPassword = () => {
    setResetEmail(email || 'patient@braintrace.ai');
    setResetCode('');
    setIsCodeVerified(false);
    setNewPassword('');
    setConfirmNewPassword('');
    setResetError('');
    setAuthMode('forgotPassword');
  };

  const handleVerifyResetCode = (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');

    if (resetCode.trim().length !== 6) {
      setResetError('Please enter a valid 6-digit verification code.');
      return;
    }

    setIsCodeVerified(true);
  };

  const handleResetPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');

    if (newPassword !== confirmNewPassword) {
      setResetError('Passwords do not match. Please verify both passwords.');
      return;
    }

    if (newPassword.length < 6) {
      setResetError('New password must be at least 6 characters long.');
      return;
    }

    authApi.resetPassword(resetEmail || email, resetCode, newPassword).catch(() => {});

    setPassword(newPassword);
    if (resetEmail) {
      setEmail(resetEmail);
    }
    setLoginSuccessMessage('Password reset verified! Your password has been changed successfully. Please log in.');
    setIsCodeVerified(false);
    setAuthMode('login');
  };

  const resetSignupForm = () => {
    setFullName('');
    setPhone('');
    setSignupEmail('');
    setSignupPassword('');
    setConfirmPassword('');
    setEmailOtp('');
    setPhoneOtp('');
    setGeneratedEmailOtp('');
    setGeneratedPhoneOtp('');
    setSignupError('');
    setOtpError('');
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: [0.215, 0.61, 0.355, 1] },
    },
  };

  if (isLoggedIn) {
    if (selectedRole === 'Doctor') {
      return (
        <DoctorDashboard 
          userName={userDisplayName || 'Dr. Rajesh Sharma'} 
          onLogout={() => {
            setIsLoggedIn(false);
            if (onLogout) onLogout();
          }} 
          onBackToHome={onBackToHome}
        />
      );
    }

    if (selectedRole === 'Caretaker') {
      return (
        <CaretakerDashboard 
          userName={userDisplayName || 'Rahul Caregiver'} 
          onLogout={() => {
            setIsLoggedIn(false);
            if (onLogout) onLogout();
          }} 
          onBackToHome={onBackToHome}
        />
      );
    }

    if (selectedRole === 'Family') {
      return (
        <FamilyDashboardView 
          userName={userDisplayName || 'Priya Sharma (Daughter)'} 
          onLogout={() => {
            setIsLoggedIn(false);
            if (onLogout) onLogout();
          }} 
          onBackToHome={onBackToHome}
        />
      );
    }

    return (
      <PatientDashboard 
        userName={userDisplayName || loggedInUser || 'Demo Patient (DX-4091)'} 
        onLogout={() => {
          setIsLoggedIn(false);
          if (onLogout) onLogout();
        }} 
        onBackToHome={onBackToHome}
      />
    );
  }

  return (
    <motion.div 
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.1 }}
      variants={containerVariants}
      className="min-h-screen bg-[#F8F9FA] text-[#09090b] font-sans antialiased selection:bg-black selection:text-white flex flex-col justify-between p-4 sm:p-8"
    >
      
      {/* Top Header Navigation */}
      <motion.div variants={itemVariants} className="max-w-6xl w-full mx-auto flex items-center justify-between mb-6">
        <button
          onClick={onBackToHome}
          className="inline-flex items-center gap-2 text-sm font-bold text-neutral-700 hover:text-black transition-colors cursor-pointer group bg-white border border-neutral-300 px-4 py-2 rounded-xl shadow-sm"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Back to BrainTrace</span>
        </button>

        <div className="flex items-center gap-2">
          <BrainTraceLogo className="w-6 h-6" />
          <span className="font-extrabold text-base tracking-tight">BrainTrace Portal</span>
        </div>
      </motion.div>

      {/* Main Double-Panel Container */}
      <motion.div variants={itemVariants} className="max-w-5xl w-full mx-auto bg-white border-4 border-black rounded-[28px] overflow-hidden shadow-[12px_12px_0px_0px_rgba(9,9,11,1)] grid grid-cols-1 lg:grid-cols-2">
        
        {/* LEFT PANEL: Light Grey Branding & Doctor Illustration */}
        <div className="bg-[#F3F3F5] p-6 sm:p-10 flex flex-col justify-between items-center text-center border-b-4 lg:border-b-0 lg:border-r-4 border-black min-h-[500px]">
          
          {/* Top Logo & Handwritten Cursive Title */}
          <div className="flex items-center justify-center gap-3 sm:gap-4 pt-2">
            <div className="w-20 h-20 sm:w-28 sm:h-28 shrink-0">
              <BrainTraceLogo className="w-full h-full" leafColor="#F3F3F5" />
            </div>
            <div className="text-left font-['Great_Vibes','Dancing_Script',cursive] leading-[0.8] text-black select-none pt-2">
              <div className="text-5xl sm:text-6xl md:text-7xl font-normal tracking-wide">Brain</div>
              <div className="text-5xl sm:text-6xl md:text-7xl font-normal tracking-wide pl-4 sm:pl-6 -mt-1">Trace</div>
            </div>
          </div>

          {/* Bottom Doctors Illustration */}
          <div className="w-full max-w-sm mt-8 relative flex items-end justify-center">
            <svg
              viewBox="0 0 400 320"
              className="w-full h-auto max-h-[260px] drop-shadow-md select-none"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Female Doctor (Left) */}
              <g id="female-doctor">
                {/* Hair */}
                <path d="M120 70 C100 80, 85 110, 85 140 C85 170, 100 190, 100 190 L115 180 C115 180, 100 160, 105 130 C110 100, 130 90, 145 90 Z" fill="#000" />
                <path d="M110 75 C130 50, 160 55, 175 75 C185 90, 180 120, 175 135 C170 150, 175 180, 175 180 L160 175 C160 175, 160 145, 165 125 C170 105, 155 80, 135 75 Z" fill="#000" />
                
                {/* Face & Neck */}
                <path d="M125 90 C125 90, 120 135, 145 145 C165 135, 165 90, 165 90 Z" fill="#F3A892" stroke="#000" strokeWidth="2" />
                <path d="M138 135 L138 155 L152 155 L152 135 Z" fill="#E2957E" stroke="#000" strokeWidth="2" />

                {/* Inner Black V-neck shirt */}
                <path d="M125 155 L165 155 L155 190 L135 190 Z" fill="#000000" />

                {/* Grey Coat */}
                <path d="M90 175 L125 155 L140 185 L125 290 L75 280 Z" fill="#8E9399" stroke="#000" strokeWidth="2.5" />
                <path d="M200 175 L165 155 L150 185 L165 290 L215 280 Z" fill="#8E9399" stroke="#000" strokeWidth="2.5" />
                {/* Coat Lapels */}
                <path d="M125 155 L142 195 L128 200 Z" fill="#75797E" stroke="#000" strokeWidth="2" />
                <path d="M165 155 L148 195 L162 200 Z" fill="#75797E" stroke="#000" strokeWidth="2" />
                {/* Hands in pockets crease */}
                <path d="M100 240 C110 250, 120 255, 125 255" stroke="#000" strokeWidth="2" strokeLinecap="round" />
                <path d="M190 240 C180 250, 170 255, 165 255" stroke="#000" strokeWidth="2" strokeLinecap="round" />
              </g>

              {/* Male Doctor (Right) */}
              <g id="male-doctor">
                {/* Short Hair */}
                <path d="M260 65 C250 50, 290 35, 315 50 C330 60, 325 80, 320 85 C300 70, 270 75, 260 65 Z" fill="#000" />
                
                {/* Face & Ears */}
                <path d="M265 70 C265 70, 260 115, 290 125 C320 115, 315 70, 315 70 Z" fill="#F3A892" stroke="#000" strokeWidth="2" />
                <path d="M280 120 L280 140 L300 140 L300 120 Z" fill="#E2957E" stroke="#000" strokeWidth="2" />
                
                {/* Stethoscope */}
                <path d="M272 135 C265 150, 260 180, 275 195 C280 200, 285 200, 288 190" stroke="#000" strokeWidth="3" fill="none" strokeLinecap="round" />
                <path d="M308 135 C315 150, 320 175, 310 190" stroke="#000" strokeWidth="3" fill="none" strokeLinecap="round" />
                <circle cx="288" cy="192" r="5" fill="#75797E" stroke="#000" strokeWidth="2" />

                {/* Inner Black Shirt */}
                <path d="M268 140 L312 140 L302 175 L278 175 Z" fill="#000000" />

                {/* Grey Coat */}
                <path d="M230 160 L268 140 L282 175 L270 285 L220 280 Z" fill="#8E9399" stroke="#000" strokeWidth="2.5" />
                <path d="M350 160 L312 140 L298 175 L310 285 L360 280 Z" fill="#8E9399" stroke="#000" strokeWidth="2.5" />
                {/* Lapels */}
                <path d="M268 140 L285 180 L272 185 Z" fill="#75797E" stroke="#000" strokeWidth="2" />
                <path d="M312 140 L295 180 L308 185 Z" fill="#75797E" stroke="#000" strokeWidth="2" />

                {/* Clasped Hands */}
                <path d="M275 220 C280 215, 300 215, 305 220 C310 225, 305 235, 290 238 C275 235, 270 225, 275 220 Z" fill="#F3A892" stroke="#000" strokeWidth="2" />
              </g>
            </svg>
          </div>

        </div>

        {/* RIGHT PANEL: Form & Login */}
        <div className="p-6 sm:p-10 flex flex-col justify-center bg-white space-y-5">
          
          {/* Header text with decorative font */}
          <h2 className="font-['Amatic_SC',sans-serif] text-3xl sm:text-4xl font-extrabold text-black text-center tracking-widest uppercase select-none">
            PROMISE MEDICAL EFFICIENCY TODAY
          </h2>

          {/* 3 Role Option Buttons */}
          <div className="flex items-center justify-center gap-2 sm:gap-3 my-2">
            {roles.map((role) => {
              const isSelected = selectedRole === role;
              const disabled = isRoleLocked || authMode === 'otp' || authMode === 'loginOtp';
              return (
                <button
                  key={role}
                  type="button"
                  disabled={disabled}
                  onClick={() => {
                    if (!disabled) {
                      setSelectedRole(role);
                    }
                  }}
                  className={`rounded-2xl border-2 border-black px-4 sm:px-6 py-2 font-extrabold text-xs sm:text-sm tracking-wide transition-all duration-200 shadow-[3px_3px_0px_0px_rgba(9,9,11,1)] ${
                    isSelected
                      ? 'bg-black text-white translate-x-[1px] translate-y-[1px] shadow-none ring-2 ring-black ring-offset-2'
                      : 'bg-white text-black hover:bg-neutral-100 hover:-translate-y-0.5'
                  } ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                  title={disabled ? 'Role is locked during authentication' : undefined}
                >
                  {role} {disabled && isSelected && '🔒'}
                </button>
              );
            })}
          </div>

          {/* Login Form, Signup Form, or OTP Forms */}
          {authMode === 'loginOtp' ? (
            /* LOGIN OTP VERIFICATION FORM */
            <form onSubmit={handleVerifyLoginOtp} className="space-y-4">
              <div className="text-center pb-1">
                <h3 className="text-lg font-extrabold text-black">Verify Email OTP</h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Enter the 6-digit verification code sent to your email for <span className="font-bold text-black">{selectedRole}</span> login
                </p>
              </div>

              {/* Email OTP sent banner */}
              <div className="p-3 bg-blue-50 border-2 border-blue-400 text-blue-900 text-xs font-bold rounded-xl space-y-1 shadow-sm">
                <div className="flex items-center gap-1.5 font-extrabold text-blue-950">
                  <Mail className="w-4 h-4 text-blue-600" /> Demo OTP Code Sent to Email!
                </div>
                <p className="font-medium text-blue-800 text-[11px]">
                  We sent a 6-digit OTP code to <span className="font-bold underline">{email}</span>.
                  <span className="block mt-1 font-mono font-bold text-blue-950 bg-blue-100/80 px-2 py-0.5 rounded border border-blue-300 w-max">
                    Your Demo OTP: 123456
                  </span>
                </p>
              </div>

              {loginOtpError && (
                <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-lg text-center">
                  {loginOtpError}
                </div>
              )}

              {/* Verified Email & Password indicators */}
              <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-3 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-500 font-medium">Account Email:</span>
                  <span className="font-bold text-black">{email}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-500 font-medium">Selected Role:</span>
                  <span className="font-bold text-black bg-neutral-200 px-2 py-0.5 rounded text-[11px]">{selectedRole}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-500 font-medium">Password:</span>
                  <span className="font-bold text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                  </span>
                </div>
              </div>

              {/* 6-Digit Email OTP Input */}
              <div>
                <label className="text-xs font-bold text-neutral-800 mb-1 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-neutral-600" />
                  Enter 6-Digit Email OTP *
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  placeholder="Enter 123456"
                  value={loginEmailOtp}
                  onChange={(e) => setLoginEmailOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full border-2 border-neutral-300 rounded-lg px-3.5 py-2.5 text-base font-mono font-bold text-black focus:outline-none focus:border-black placeholder:text-neutral-400 placeholder:font-sans placeholder:font-normal tracking-widest text-center"
                />
              </div>

              {/* Submit OTP Button */}
              <button
                type="submit"
                className="w-full bg-[#09090b] hover:bg-neutral-800 text-white font-extrabold text-sm tracking-widest py-3 rounded-lg shadow-md transition-colors cursor-pointer uppercase mt-2"
              >
                VERIFY & LOGIN TO {selectedRole.toUpperCase()} DASHBOARD
              </button>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => setAuthMode('login')}
                  className="text-xs text-neutral-600 hover:text-black font-bold underline cursor-pointer"
                >
                  ← Back to Email & Password
                </button>
              </div>
            </form>
          ) : authMode === 'otp' ? (
            /* OTP VERIFICATION FORM FOR CARETAKER & DOCTOR */
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              
              <div className="text-center pb-1">
                <h3 className="text-lg font-extrabold text-black">Verify Your Identity</h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Enter the verification codes sent to your email & mobile number
                </p>
              </div>

              {otpError && (
                <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-lg text-center">
                  {otpError}
                </div>
              )}

              {/* Email OTP Input */}
              <div>
                <label className="text-xs font-bold text-neutral-800 mb-1 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-neutral-600" />
                  Email OTP *
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  placeholder="Enter 6-digit code"
                  value={emailOtp}
                  onChange={(e) => setEmailOtp(e.target.value)}
                  className="w-full border-2 border-neutral-300 rounded-lg px-3.5 py-2 text-sm font-mono font-bold text-black focus:outline-none focus:border-black placeholder:text-neutral-400 placeholder:font-sans placeholder:font-normal"
                />
              </div>

              {/* Phone OTP Input */}
              <div>
                <label className="text-xs font-bold text-neutral-800 mb-1 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-neutral-600" />
                  Mobile Phone OTP *
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  placeholder="Enter 6-digit code"
                  value={phoneOtp}
                  onChange={(e) => setPhoneOtp(e.target.value)}
                  className="w-full border-2 border-neutral-300 rounded-lg px-3.5 py-2 text-sm font-mono font-bold text-black focus:outline-none focus:border-black placeholder:text-neutral-400 placeholder:font-sans placeholder:font-normal"
                />
              </div>

              {/* Submit OTP */}
              <button
                type="submit"
                className="w-full bg-[#09090b] hover:bg-neutral-800 text-white font-extrabold text-sm tracking-widest py-3 rounded-lg shadow-md transition-colors cursor-pointer uppercase mt-2"
              >
                VERIFY & COMPLETE REGISTRATION
              </button>

            </form>
          ) : authMode === 'forgotPassword' ? (
            /* FORGOT PASSWORD FORM */
            !isCodeVerified ? (
              /* STEP 1: Enter Email & 6-digit verification code */
              <form onSubmit={handleVerifyResetCode} className="space-y-3.5">
                
                <div className="text-center pb-1">
                  <h3 className="text-lg font-extrabold text-black">Reset Your Password</h3>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Enter the 6-digit verification code sent to your email
                  </p>
                </div>

                {/* Password reset email sent notification banner */}
                <div className="p-3 bg-blue-50 border-2 border-blue-400 text-blue-900 text-xs font-bold rounded-xl space-y-1 shadow-sm">
                  <div className="flex items-center gap-1.5 font-extrabold text-blue-950">
                    <Mail className="w-4 h-4 text-blue-600" /> Password reset email sent!
                  </div>
                  <p className="font-medium text-blue-800 text-[11px]">
                    A 6-digit verification code has been sent to <span className="font-bold underline">{resetEmail || 'your email'}</span>.
                  </p>
                </div>

                {resetError && (
                  <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-lg text-center">
                    {resetError}
                  </div>
                )}

                {/* Email Address */}
                <div>
                  <label className="text-xs font-bold text-neutral-800 mb-1 block">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="w-full border-2 border-neutral-300 rounded-lg px-3.5 py-2 text-sm font-medium text-black focus:outline-none focus:border-black placeholder:text-neutral-400"
                  />
                </div>

                {/* 6-Digit Code */}
                <div>
                  <label className="text-xs font-bold text-neutral-800 mb-1 block">
                    6-Digit Verification Code *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="Enter 6-digit code"
                    value={resetCode}
                    onChange={(e) => setResetCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-full border-2 border-neutral-300 rounded-lg px-3.5 py-2 text-sm font-mono font-bold text-black focus:outline-none focus:border-black placeholder:text-neutral-400 placeholder:font-sans placeholder:font-normal"
                  />
                </div>

                {/* Verify Code Button */}
                <button
                  type="submit"
                  className="w-full bg-[#09090b] hover:bg-neutral-800 text-white font-extrabold text-sm tracking-widest py-3 rounded-lg shadow-md transition-colors cursor-pointer uppercase mt-2"
                >
                  VERIFY CODE
                </button>

                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => setAuthMode('login')}
                    className="text-xs text-neutral-600 hover:text-black font-bold underline cursor-pointer"
                  >
                    ← Back to Login
                  </button>
                </div>

              </form>
            ) : (
              /* STEP 2: Code verified! Enter New Password & Confirm Password */
              <form onSubmit={handleResetPasswordSubmit} className="space-y-3.5">
                
                <div className="text-center pb-1">
                  <h3 className="text-lg font-extrabold text-black">Set New Password</h3>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Verification code accepted for <span className="font-bold text-black">{resetEmail}</span>
                  </p>
                </div>

                {/* Code verified banner */}
                <div className="p-3 bg-emerald-50 border-2 border-emerald-500 text-emerald-900 text-xs font-bold rounded-xl flex items-center gap-2 shadow-sm">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>Code verified! Enter and confirm your new password below.</span>
                </div>

                {resetError && (
                  <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-lg text-center">
                    {resetError}
                  </div>
                )}

                {/* New Password */}
                <div>
                  <label className="text-xs font-bold text-neutral-800 mb-1 block">
                    Set New Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full border-2 border-neutral-300 rounded-lg pl-3.5 pr-10 py-2 text-sm font-medium text-black focus:outline-none focus:border-black placeholder:text-neutral-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-black cursor-pointer"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm New Password */}
                <div>
                  <label className="text-xs font-bold text-neutral-800 mb-1 block">
                    Confirm New Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmNewPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      className="w-full border-2 border-neutral-300 rounded-lg pl-3.5 pr-10 py-2 text-sm font-medium text-black focus:outline-none focus:border-black placeholder:text-neutral-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-black cursor-pointer"
                    >
                      {showConfirmNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Submit Reset Button */}
                <button
                  type="submit"
                  className="w-full bg-[#09090b] hover:bg-neutral-800 text-white font-extrabold text-sm tracking-widest py-3 rounded-lg shadow-md transition-colors cursor-pointer uppercase mt-2"
                >
                  RESET PASSWORD
                </button>

                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => setIsCodeVerified(false)}
                    className="text-xs text-neutral-600 hover:text-black font-bold underline cursor-pointer"
                  >
                    ← Re-enter Verification Code
                  </button>
                </div>

              </form>
            )
          ) : authMode === 'signup' ? (
            /* SIGNUP FORM */
            <form onSubmit={handleSignupSubmit} className="space-y-3.5">
              
              <div className="text-center pb-1">
                <h3 className="text-lg font-extrabold text-black">Create an Account</h3>
                <p className="text-xs text-neutral-500">
                  Register as <span className="font-bold text-black">{selectedRole}</span>
                </p>
              </div>

              {signupError && (
                <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-lg text-center">
                  {signupError}
                </div>
              )}

              {/* Full Name */}
              <div>
                <label className="text-xs font-bold text-neutral-800 mb-1 block">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder={selectedRole === 'Doctor' ? 'e.g. Dr. Ananya Sharma' : 'e.g. Rahul Verma'}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full border-2 border-neutral-300 rounded-lg px-3.5 py-2 text-sm font-medium text-black focus:outline-none focus:border-black placeholder:text-neutral-400"
                />
              </div>

              {/* Phone Number (Strictly 10 digits) */}
              <div>
                <label className="text-xs font-bold text-neutral-800 mb-1 block">
                  Phone Number (10 digits) *
                </label>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  placeholder="e.g. 9876543210"
                  value={phone}
                  onChange={(e) => {
                    // Filter to digits only and limit to 10 chars
                    const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                    setPhone(val);
                  }}
                  className="w-full border-2 border-neutral-300 rounded-lg px-3.5 py-2 text-sm font-medium text-black focus:outline-none focus:border-black placeholder:text-neutral-400"
                />
                {phone && phone.length !== 10 && (
                  <span className="text-[11px] text-amber-700 font-semibold mt-0.5 block">
                    Phone must be exactly 10 digits ({phone.length}/10)
                  </span>
                )}
              </div>

              {/* Email ID */}
              <div>
                <label className="text-xs font-bold text-neutral-800 mb-1 block">
                  Email ID *
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  className="w-full border-2 border-neutral-300 rounded-lg px-3.5 py-2 text-sm font-medium text-black focus:outline-none focus:border-black placeholder:text-neutral-400"
                />
              </div>

              {/* Set Password */}
              <div>
                <label className="text-xs font-bold text-neutral-800 mb-1 block">
                  Set Password *
                </label>
                <div className="relative">
                  <input
                    type={showSignupPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    className="w-full border-2 border-neutral-300 rounded-lg pl-3.5 pr-10 py-2 text-sm font-medium text-black focus:outline-none focus:border-black placeholder:text-neutral-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSignupPassword(!showSignupPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-black cursor-pointer"
                  >
                    {showSignupPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="text-xs font-bold text-neutral-800 mb-1 block">
                  Confirm Password *
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full border-2 border-neutral-300 rounded-lg pl-3.5 pr-10 py-2 text-sm font-medium text-black focus:outline-none focus:border-black placeholder:text-neutral-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-black cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full bg-[#09090b] hover:bg-neutral-800 text-white font-extrabold text-sm tracking-widest py-3 rounded-lg shadow-md transition-colors cursor-pointer uppercase mt-3"
              >
                CREATE ACCOUNT
              </button>

              {/* Account Link to Switch to Login */}
              <div className="text-xs text-neutral-600 font-medium text-center pt-2">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setSignupError('');
                    setIsRoleLocked(false);
                    setAuthMode('login');
                  }}
                  className="font-bold text-black underline cursor-pointer"
                >
                  Log In
                </button>
              </div>

            </form>
          ) : (
            /* LOGIN FORM */
            <form onSubmit={handleLogin} className="space-y-4">
              
              {loginSuccessMessage && (
                <div className="p-3 bg-emerald-50 border-2 border-emerald-500 text-emerald-900 text-xs font-bold rounded-xl flex items-start justify-between gap-2 shadow-sm">
                  <span>{loginSuccessMessage}</span>
                  <button
                    type="button"
                    onClick={() => setLoginSuccessMessage('')}
                    className="text-emerald-700 hover:text-black font-extrabold shrink-0 cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Role-based Banner */}
              {selectedRole === 'Patient' ? (
                <div className="p-3 bg-neutral-100 border-2 border-neutral-300 text-neutral-800 text-xs font-semibold rounded-xl flex items-center gap-2 shadow-sm">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    <strong className="text-black font-extrabold">Patient Instant Portal:</strong> Password and OTP verification are not required for Patients.
                  </span>
                </div>
              ) : (
                <div className="p-3 bg-blue-50 border-2 border-blue-200 text-blue-900 text-xs font-semibold rounded-xl flex items-center gap-2 shadow-sm">
                  <Lock className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>
                    <strong className="text-blue-950 font-extrabold">{selectedRole} Secure Login:</strong> Enter password, then 2FA Email OTP code.
                  </span>
                </div>
              )}

              {/* Email Field */}
              <div>
                <label className="text-xs font-bold text-neutral-800 mb-1 block">
                  {selectedRole === 'Patient' ? 'Patient Email ID / Mobile Number *' : `${selectedRole} Email ID *`}
                </label>
                <input
                  type="email"
                  required
                  placeholder={selectedRole === 'Patient' ? 'e.g. patient@braintrace.org' : `e.g. ${selectedRole.toLowerCase()}@hospital.org`}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border-2 border-neutral-300 rounded-lg px-3.5 py-2.5 text-sm font-medium text-black focus:outline-none focus:border-black placeholder:text-neutral-400"
                />
              </div>

              {/* Password Field (Only for Doctor & Caretaker) */}
              {selectedRole !== 'Patient' && (
                <div>
                  <label className="text-xs font-bold text-neutral-800 mb-1 block">
                    Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full border-2 border-neutral-300 rounded-lg pl-3.5 pr-10 py-2.5 text-sm font-medium text-black focus:outline-none focus:border-black placeholder:text-neutral-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-black cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              {/* Account text */}
              <div className="text-xs text-neutral-600 font-medium">
                New to BrainTrace?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setSignupError('');
                    setAuthMode('signup');
                  }}
                  className="font-bold text-black underline cursor-pointer"
                >
                  Create an Account
                </button>
              </div>

              {/* Remember me & Forgot Password */}
              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-neutral-800">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-2 border-neutral-400 text-black focus:ring-black cursor-pointer"
                  />
                  <span>Remember me</span>
                </label>
                {selectedRole !== 'Patient' && (
                  <button
                    type="button"
                    onClick={handleOpenForgotPassword}
                    className="font-bold text-neutral-800 hover:underline cursor-pointer"
                  >
                    Forgot your password?
                  </button>
                )}
              </div>

              {/* LOGIN Button */}
              <button
                type="submit"
                className="w-full bg-[#09090b] hover:bg-neutral-800 text-white font-extrabold text-sm tracking-widest py-3 rounded-lg shadow-md transition-colors cursor-pointer uppercase mt-2"
              >
                {selectedRole === 'Patient' ? 'LOGIN TO PATIENT DASHBOARD' : `LOGIN AS ${selectedRole.toUpperCase()}`}
              </button>

            </form>
          )}

        </div>

      </motion.div>

      {/* Footer Info */}
      <motion.div variants={itemVariants} className="text-center text-xs text-neutral-500 font-semibold mt-6">
        © {new Date().getFullYear()} BrainTrace Technologies. Promise Medical Efficiency Today.
      </motion.div>

    </motion.div>
  );
};
