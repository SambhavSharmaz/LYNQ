import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../hooks/useAuth'

export default function PhoneAuth({ onSuccess, onBack }) {
  const [phoneNumber, setPhoneNumber] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState('phone') // 'phone' or 'otp'
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [confirmationResult, setConfirmationResult] = useState(null)

  const { phoneSignIn, verifyOTP } = useAuth()

  const formatPhoneNumber = (phone) => {
    // Remove all non-digits
    const cleaned = phone.replace(/\D/g, '')
    
    // Add country code if not present
    if (cleaned.length === 10) {
      return `+1${cleaned}` // Default to US
    }
    if (cleaned.length > 10 && !cleaned.startsWith('1')) {
      return `+${cleaned}`
    }
    if (cleaned.length > 10 && cleaned.startsWith('1')) {
      return `+${cleaned}`
    }
    
    return cleaned.startsWith('+') ? phone : `+${cleaned}`
  }

  const handleSendOTP = async () => {
    if (!phoneNumber.trim()) {
      setError('Please enter your phone number')
      return
    }

    setLoading(true)
    setError('')

    try {
      const formattedPhone = formatPhoneNumber(phoneNumber)
      const confirmation = await phoneSignIn(formattedPhone)
      setConfirmationResult(confirmation)
      setStep('otp')
    } catch (err) {
      console.error('Phone sign in error:', err)
      setError(err.message || 'Failed to send OTP. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOTP = async () => {
    if (!otp.trim()) {
      setError('Please enter the OTP')
      return
    }

    setLoading(true)
    setError('')

    try {
      await verifyOTP(confirmationResult, otp)
      onSuccess?.()
    } catch (err) {
      console.error('OTP verification error:', err)
      setError('Invalid OTP. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleResendOTP = async () => {
    setLoading(true)
    setError('')
    
    try {
      const formattedPhone = formatPhoneNumber(phoneNumber)
      const confirmation = await phoneSignIn(formattedPhone)
      setConfirmationResult(confirmation)
      setError('')
    } catch (err) {
      setError('Failed to resend OTP. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (step === 'otp') {
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="space-y-6"
      >
        <div className="text-center">
          <h2 className="text-2xl font-display text-brand-blue mb-2">Verify OTP</h2>
          <p className="text-white/60 text-sm">
            Enter the 6-digit code sent to {phoneNumber}
          </p>
        </div>

        <div className="space-y-4">
          <input
            type="text"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="Enter 6-digit OTP"
            className="input text-center text-xl tracking-widest"
            maxLength={6}
            autoComplete="one-time-code"
          />

          {error && (
            <div className="text-red-400 text-sm text-center bg-red-500/10 p-2 rounded border border-red-500/20">
              {error}
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={handleVerifyOTP}
              disabled={loading || otp.length !== 6}
              className="btn btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>

            <div className="flex justify-between items-center text-sm">
              <button
                onClick={() => setStep('phone')}
                className="text-white/60 hover:text-white"
              >
                ← Change Number
              </button>
              <button
                onClick={handleResendOTP}
                disabled={loading}
                className="text-brand-blue hover:text-blue-400 disabled:opacity-50"
              >
                Resend OTP
              </button>
            </div>
          </div>
        </div>

        {/* Recaptcha container */}
        <div id="recaptcha-container"></div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-6"
    >
      <div className="text-center">
        <h2 className="text-2xl font-display text-brand-blue mb-2">Phone Login</h2>
        <p className="text-white/60 text-sm">
          Enter your phone number to receive a verification code
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm text-white/80">Phone Number</label>
          <input
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="+1 (555) 123-4567"
            className="input"
            autoComplete="tel"
          />
          <p className="text-xs text-white/50">
            Include country code (e.g., +1 for US)
          </p>
        </div>

        {error && (
          <div className="text-red-400 text-sm bg-red-500/10 p-2 rounded border border-red-500/20">
            {error}
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={handleSendOTP}
            disabled={loading || !phoneNumber.trim()}
            className="btn btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Sending...' : 'Send OTP'}
          </button>

          {onBack && (
            <button
              onClick={onBack}
              className="btn btn-ghost w-full border border-white/10 hover:border-white/20"
            >
              ← Back to other options
            </button>
          )}
        </div>
      </div>

      {/* Recaptcha container */}
      <div id="recaptcha-container"></div>
    </motion.div>
  )
}