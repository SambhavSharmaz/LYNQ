import React, { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useFriends } from '../hooks/useFriends'
import { useUsers } from '../hooks/useUsers'
import { useChatsContext } from '../context/ChatsContext'

export default function FriendRequests({ onClose }) {
  const [activeTab, setActiveTab] = useState('incoming') // 'incoming' or 'outgoing'
  const { friendRequests, acceptFriendRequest, rejectFriendRequest, cancelFriendRequest } = useFriends()
  const { usersMap } = useUsers()
  const { startDirectChat } = useChatsContext()
  const [processingRequests, setProcessingRequests] = useState(new Set())

  const incomingRequests = useMemo(() => {
    return friendRequests.incoming.map(uid => usersMap[uid]).filter(Boolean)
  }, [friendRequests.incoming, usersMap])

  const outgoingRequests = useMemo(() => {
    return friendRequests.outgoing.map(uid => usersMap[uid]).filter(Boolean)
  }, [friendRequests.outgoing, usersMap])

  const handleAccept = async (uid) => {
    setProcessingRequests(prev => new Set([...prev, uid]))
    try {
      await acceptFriendRequest(uid)
      
      // Auto-start chat with new friend
      try {
        await startDirectChat(uid)
      } catch (chatErr) {
        // If chat creation fails, it's not critical
        console.warn('Could not auto-start chat with new friend:', chatErr)
      }
      
      // Close modal after successful accept
      setTimeout(() => onClose(), 500)
    } catch (err) {
      console.error('Failed to accept friend request:', err)
      alert('Failed to accept friend request. Please try again.')
    } finally {
      setProcessingRequests(prev => {
        const next = new Set(prev)
        next.delete(uid)
        return next
      })
    }
  }

  const handleReject = async (uid) => {
    setProcessingRequests(prev => new Set([...prev, uid]))
    try {
      await rejectFriendRequest(uid)
    } catch (err) {
      console.error('Failed to reject friend request:', err)
      alert('Failed to reject friend request. Please try again.')
    } finally {
      setProcessingRequests(prev => {
        const next = new Set(prev)
        next.delete(uid)
        return next
      })
    }
  }

  const handleCancel = async (uid) => {
    setProcessingRequests(prev => new Set([...prev, uid]))
    try {
      await cancelFriendRequest(uid)
    } catch (err) {
      console.error('Failed to cancel friend request:', err)
      alert('Failed to cancel friend request. Please try again.')
    } finally {
      setProcessingRequests(prev => {
        const next = new Set(prev)
        next.delete(uid)
        return next
      })
    }
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
        className="card p-6 w-full max-w-md max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-display text-brand-blue">Friend Requests</h2>
          <button onClick={onClose} className="text-white/60 hover:text-white text-xl">×</button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('incoming')}
            className={`btn flex-1 text-sm ${activeTab === 'incoming' ? 'btn-primary' : 'btn-ghost'}`}
          >
            Incoming ({incomingRequests.length})
          </button>
          <button
            onClick={() => setActiveTab('outgoing')}
            className={`btn flex-1 text-sm ${activeTab === 'outgoing' ? 'btn-primary' : 'btn-ghost'}`}
          >
            Outgoing ({outgoingRequests.length})
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto space-y-3">
          {activeTab === 'incoming' && (
            <>
              {incomingRequests.length === 0 ? (
                <div className="text-center text-white/60 py-8">
                  <div className="text-3xl mb-2">📭</div>
                  <p>No incoming friend requests</p>
                </div>
              ) : (
                incomingRequests.map((user) => (
                  <div key={user.uid} className="card p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-brand-blue text-white flex items-center justify-center font-semibold">
                        {user.displayName?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-white">{user.displayName}</div>
                        <div className="text-sm text-white/60">{user.email}</div>
                        <div className="text-xs text-brand-blue font-mono">{user.lynqId}</div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAccept(user.uid)}
                        disabled={processingRequests.has(user.uid)}
                        className="btn btn-primary flex-1 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {processingRequests.has(user.uid) ? 'Accepting...' : 'Accept & Chat'}
                      </button>
                      <button
                        onClick={() => handleReject(user.uid)}
                        disabled={processingRequests.has(user.uid)}
                        className="btn btn-ghost border border-red-500/20 hover:border-red-500/40 text-red-400 flex-1 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {processingRequests.has(user.uid) ? 'Rejecting...' : 'Decline'}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </>
          )}

          {activeTab === 'outgoing' && (
            <>
              {outgoingRequests.length === 0 ? (
                <div className="text-center text-white/60 py-8">
                  <div className="text-3xl mb-2">📤</div>
                  <p>No outgoing friend requests</p>
                </div>
              ) : (
                outgoingRequests.map((user) => (
                  <div key={user.uid} className="card p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-brand-blue text-white flex items-center justify-center font-semibold">
                        {user.displayName?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-white">{user.displayName}</div>
                        <div className="text-sm text-white/60">{user.email}</div>
                        <div className="text-xs text-brand-blue font-mono">{user.lynqId}</div>
                        <div className="text-xs text-yellow-400">Pending...</div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleCancel(user.uid)}
                      disabled={processingRequests.has(user.uid)}
                      className="btn btn-ghost border border-white/10 hover:border-white/20 w-full text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {processingRequests.has(user.uid) ? 'Cancelling...' : 'Cancel Request'}
                    </button>
                  </div>
                ))
              )}
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}