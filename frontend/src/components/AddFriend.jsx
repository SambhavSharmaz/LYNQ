import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useFriends } from '../hooks/useFriends'
import { useAuth } from '../hooks/useAuth'

export default function AddFriend({ onClose }) {
  const [searchType, setSearchType] = useState('lynqId') // 'lynqId' or 'email'
  const [searchValue, setSearchValue] = useState('')
  const [foundUser, setFoundUser] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const { findUserByLynqId, findUserByEmail, sendFriendRequest, friendRequests, friends } = useFriends()
  const { user } = useAuth()

  const handleSearch = async () => {
    if (!searchValue.trim()) return
    
    setLoading(true)
    setError('')
    setFoundUser(null)

    try {
      let result = null
      if (searchType === 'lynqId') {
        result = await findUserByLynqId(searchValue.trim())
      } else {
        result = await findUserByEmail(searchValue.trim())
      }

      if (!result) {
        setError(`No user found with this ${searchType === 'lynqId' ? 'Lynq ID' : 'email'}`)
        return
      }

      if (result.uid === user?.uid) {
        setError("You can't add yourself as a friend")
        return
      }

      if (friends.includes(result.uid)) {
        setError("You're already friends with this user")
        return
      }

      if (friendRequests.outgoing.includes(result.uid)) {
        setError("Friend request already sent")
        return
      }

      if (friendRequests.incoming.includes(result.uid)) {
        setError("This user has already sent you a friend request")
        return
      }

      setFoundUser(result)
    } catch (err) {
      setError('Failed to search for user')
    } finally {
      setLoading(false)
    }
  }

  const handleSendRequest = async () => {
    if (!foundUser) return

    setLoading(true)
    try {
      await sendFriendRequest(foundUser.uid)
      setSuccess('Friend request sent!')
      setFoundUser(null)
      setSearchValue('')
    } catch (err) {
      setError('Failed to send friend request')
    } finally {
      setLoading(false)
    }
  }

  const copyLynqId = async () => {
    if (!user?.lynqId) return
    try {
      await navigator.clipboard.writeText(user.lynqId)
      setSuccess('Your Lynq ID copied to clipboard!')
    } catch (err) {
      setError('Failed to copy Lynq ID')
    }
  }

  const shareViaWhatsApp = () => {
    const text = `Hey! Add me on Lynq using my ID: ${user?.lynqId}`
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`
    window.open(url, '_blank')
  }

  const shareViaEmail = () => {
    const subject = 'Connect with me on Lynq'
    const body = `Hey! I'm using Lynq for messaging. Add me using my Lynq ID: ${user?.lynqId}`
    const url = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    window.open(url)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="card p-6 w-full max-w-md space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-display text-brand-blue">Add Friend</h2>
          <button onClick={onClose} className="text-white/60 hover:text-white text-xl">×</button>
        </div>

        {/* Your Lynq ID Section */}
        <div className="space-y-3">
          <h3 className="font-medium text-white/90">Your Lynq ID</h3>
          <div className="flex items-center gap-2 p-3 bg-white/5 rounded-lg border border-white/10">
            <code className="flex-1 font-mono text-brand-blue text-lg tracking-wider">{user?.lynqId || 'Loading...'}</code>
            <button onClick={copyLynqId} className="btn btn-ghost px-3 py-1 text-sm">Copy</button>
          </div>
          
          <div className="flex gap-2">
            <button onClick={shareViaWhatsApp} className="btn btn-ghost flex-1 text-sm">
              📱 WhatsApp
            </button>
            <button onClick={shareViaEmail} className="btn btn-ghost flex-1 text-sm">
              📧 Email
            </button>
          </div>
        </div>

        <div className="border-t border-white/10"></div>

        {/* Add Friend Section */}
        <div className="space-y-4">
          <h3 className="font-medium text-white/90">Find Friends</h3>
          
          <div className="flex gap-2">
            <button
              onClick={() => setSearchType('lynqId')}
              className={`btn flex-1 text-sm ${searchType === 'lynqId' ? 'btn-primary' : 'btn-ghost'}`}
            >
              Lynq ID
            </button>
            <button
              onClick={() => setSearchType('email')}
              className={`btn flex-1 text-sm ${searchType === 'email' ? 'btn-primary' : 'btn-ghost'}`}
            >
              Email
            </button>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder={searchType === 'lynqId' ? 'Enter Lynq ID (e.g. ABC123XY)' : 'Enter email address'}
              className="input flex-1"
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button
              onClick={handleSearch}
              disabled={loading || !searchValue.trim()}
              className="btn btn-primary px-4"
            >
              {loading ? '...' : '🔍'}
            </button>
          </div>

          {error && (
            <div className="text-red-400 text-sm bg-red-500/10 p-2 rounded border border-red-500/20">
              {error}
            </div>
          )}

          {success && (
            <div className="text-brand-neon text-sm bg-brand-neon/10 p-2 rounded border border-brand-neon/20">
              {success}
            </div>
          )}

          {foundUser && (
            <div className="card p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-brand-blue text-white flex items-center justify-center font-semibold">
                  {foundUser.displayName?.[0]?.toUpperCase() || '?'}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-white">{foundUser.displayName}</div>
                  <div className="text-sm text-white/60">{foundUser.email}</div>
                  <div className="text-xs text-brand-blue font-mono">{foundUser.lynqId}</div>
                </div>
              </div>
              <button
                onClick={handleSendRequest}
                disabled={loading}
                className="btn btn-primary w-full"
              >
                {loading ? 'Sending...' : 'Send Friend Request'}
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}