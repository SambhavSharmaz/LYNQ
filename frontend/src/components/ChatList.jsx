import React, { useMemo, useState } from 'react'
import { useChatsContext } from '../context/ChatsContext'
import { useUsers } from '../hooks/useUsers'
import { useAuth } from '../hooks/useAuth'
import { useFriends } from '../hooks/useFriends'
import AddFriend from './AddFriend'
import FriendRequests from './FriendRequests'
import { motion, AnimatePresence } from 'framer-motion'

export default function ChatList() {
  const { chats, activeChat, setActiveChat, startDirectChat, createGroup } = useChatsContext()
  const { user } = useAuth()
  const { users, usersMap } = useUsers()
  const { friends, friendRequests } = useFriends()
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddFriend, setShowAddFriend] = useState(false)
  const [showFriendRequests, setShowFriendRequests] = useState(false)
  const [showNewGroup, setShowNewGroup] = useState(false)
  const [groupName, setGroupName] = useState('')
  const [selected, setSelected] = useState({})

  // Get friend users only
  const friendUsers = useMemo(() => {
    return friends.map(uid => usersMap[uid]).filter(Boolean)
  }, [friends, usersMap])

  // Filter chats and friends based on search query
  const filteredChats = useMemo(() => {
    if (!searchQuery.trim()) return chats
    
    return chats.filter(chat => {
      if (chat.isGroup) {
        return chat.name?.toLowerCase().includes(searchQuery.toLowerCase())
      } else {
        const otherId = chat.members?.find(m => m !== user?.uid)
        const otherUser = usersMap[otherId]
        return otherUser?.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
               otherUser?.email?.toLowerCase().includes(searchQuery.toLowerCase())
      }
    })
  }, [chats, searchQuery, user?.uid, usersMap])

  const filteredFriends = useMemo(() => {
    if (!searchQuery.trim()) return friendUsers
    
    return friendUsers.filter(friend => 
      friend.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      friend.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      friend.lynqId?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [friendUsers, searchQuery])

  // Count total pending requests
  const totalPendingRequests = friendRequests.incoming.length

  const displayNameForChat = (c) => {
    if (c.isGroup) return c.name || 'Group'
    const otherId = (c.members || []).find(m => m !== user?.uid)
    return usersMap[otherId]?.displayName || 'Direct Chat'
  }

  const toggleSel = (uid) => setSelected((s) => ({ ...s, [uid]: !s[uid] }))
  const createGroupNow = async () => {
    const picks = Object.entries(selected).filter(([,v]) => v).map(([k]) => k)
    if (!picks.length) return
    await createGroup(groupName || 'New Group', picks)
    setShowNewGroup(false)
    setGroupName('')
    setSelected({})
  }

  const startChatWithFriend = async (friendId) => {
    try {
      await startDirectChat(friendId)
    } catch (error) {
      alert('Failed to start chat: ' + error.message)
    }
  }

  return (
  <div className="relative bg-brand-dark text-white min-h-screen font-sans">
    {/* Header */}
    <div className="p-4 sticky top-0 z-10 backdrop-blur-xl bg-brand-dark/80 border-b border-white/10 shadow-lg">
      {/* Search Bar */}
      <div className="mb-4">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search chats and friends..."
          className="input w-full text-sm"
        />
      </div>

      <div className="flex justify-between items-center mb-2">
        <div className="flex gap-2">
          <button
            onClick={() => setShowAddFriend(true)}
            className="btn btn-primary px-3 py-1.5 text-sm"
          >
            ➕ Add Friend
          </button>
          <button
            onClick={() => setShowFriendRequests(true)}
            className="btn btn-ghost border border-white/10 hover:border-white/20 px-3 py-1.5 text-sm relative"
          >
            🔔 Requests
            {totalPendingRequests > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-brand-neon text-xs rounded-full flex items-center justify-center text-black font-semibold">
                {totalPendingRequests}
              </span>
            )}
          </button>
          <button
            onClick={() => setShowNewGroup(v => !v)}
            className="btn btn-ghost border border-white/10 hover:border-white/20 px-3 py-1.5 text-sm"
          >
            👥 Group
          </button>
        </div>
        <div className="text-xs text-white/60">
          {filteredChats.length} chat{filteredChats.length !== 1 ? "s" : ""}
        </div>
      </div>
    </div>

    {/* Available Friends Section */}
    {friendUsers.length > 0 && (
      <div className="p-4 border-b border-white/10">
        <div className="text-sm font-medium text-brand-blue mb-3">
          {searchQuery ? `Friends (${filteredFriends.length})` : 'Start New Chat'}
        </div>
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {(searchQuery ? filteredFriends : friendUsers.slice(0, 5)).map(friend => {
            // Check if there's already an existing chat with this friend
            const existingChat = chats.find(chat => 
              !chat.isGroup && chat.members?.includes(friend.uid)
            )
            
            return (
              <button
                key={friend.uid}
                onClick={() => {
                  if (existingChat) {
                    setActiveChat(existingChat)
                  } else {
                    startChatWithFriend(friend.uid)
                  }
                }}
                className="w-full text-left p-3 card hover:bg-white/10 transition-all duration-200 group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-brand-blue text-white flex items-center justify-center font-semibold">
                    {friend.displayName?.[0]?.toUpperCase() || "?"}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium group-hover:text-brand-blue">
                      {friend.displayName || "User"}
                    </div>
                    <div className="text-xs text-white/60">{friend.email}</div>
                    <div className="text-xs text-brand-blue font-mono">{friend.lynqId}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Online/Offline Status */}
                    <div
                      className={`w-3 h-3 rounded-full shadow-lg ${
                        friend.isOnline 
                          ? 'bg-brand-neon animate-pulse shadow-brand-neon/50' 
                          : 'bg-red-500 shadow-red-500/50'
                      }`}
                      title={friend.isOnline ? 'Online' : 'Offline'}
                    />
                    {existingChat && (
                      <div className="text-xs text-brand-blue bg-brand-blue/10 px-2 py-1 rounded">
                        Chat exists
                      </div>
                    )}
                  </div>
                </div>
              </button>
            )
          })}
          {!searchQuery && friendUsers.length > 5 && (
            <div className="text-xs text-white/60 text-center py-2">
              Search to see all {friendUsers.length} friends
            </div>
          )}
        </div>
      </div>
    )}

    {/* New Group Section */}
    {showNewGroup && (
      <div className="p-4 border-b border-white/10">
        <div className="text-sm font-medium text-brand-blue mb-3">
          Create Group
        </div>
        <input
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          placeholder="Group name"
          className="input mb-3"
        />
        <div className="space-y-2 max-h-40 overflow-y-auto mb-3">
          {friendUsers.map(friend => (
            <label key={friend.uid} className="flex items-center gap-3 p-2 hover:bg-white/5 rounded cursor-pointer">
              <input
                type="checkbox"
                checked={selected[friend.uid] || false}
                onChange={() => toggleSel(friend.uid)}
                className="w-4 h-4 rounded"
              />
              <div className="w-8 h-8 rounded-full bg-brand-blue text-white flex items-center justify-center text-sm font-semibold">
                {friend.displayName?.[0]?.toUpperCase() || "?"}
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium">{friend.displayName}</div>
                <div className="text-xs text-white/60">{friend.email}</div>
              </div>
            </label>
          ))}
        </div>
        <div className="flex gap-2">
          <button onClick={createGroupNow} className="btn btn-primary flex-1 text-sm">
            Create Group
          </button>
          <button onClick={() => setShowNewGroup(false)} className="btn btn-ghost flex-1 text-sm">
            Cancel
          </button>
        </div>
      </div>
    )}

    {/* Chats List */}
    <div className="divide-y divide-white/10">
      {filteredChats.map(c => {
        const isActive = activeChat?.id === c.id
        const otherUser = !c.isGroup
          ? usersMap[(c.members || []).find(m => m !== user?.uid)]
          : null

        return (
          <button
            key={c.id}
            onClick={() => setActiveChat(c)}
            className={`w-full text-left px-5 py-4 transition-all duration-200 flex items-center gap-4 ${
              isActive
                ? "bg-brand-blue/10 border-l-4 border-brand-blue"
                : "hover:bg-white/5 border-l-4 border-transparent"
            }`}
          >
            {/* Avatar */}
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-white shadow-md ${
                c.isGroup ? "bg-purple-500" : "bg-brand-blue"
              }`}
            >
              {c.isGroup
                ? c.name?.[0]?.toUpperCase() || "G"
                : (otherUser?.displayName || otherUser?.email)?.[0]?.toUpperCase() ||
                  "?"}
            </div>

            {/* Chat Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3
                  className={`font-semibold truncate ${
                    isActive ? "text-brand-blue" : "text-white"
                  }`}
                >
                  {displayNameForChat(c)}
                </h3>
                {!c.isGroup && (
                  <div
                    className={`w-3 h-3 rounded-full shadow-lg ${
                      otherUser?.isOnline 
                        ? 'bg-brand-neon animate-pulse shadow-brand-neon/50' 
                        : 'bg-red-500 shadow-red-500/50'
                    }`}
                    title={otherUser?.isOnline ? 'Online' : 'Offline'}
                  />
                )}
              </div>
              <p
                className={`text-xs truncate ${
                  isActive ? "text-brand-blue" : "text-white/60"
                }`}
              >
                {c.lastMessage || "No messages yet"}
              </p>
              {c.isGroup && (
                <p className="text-xs text-white/50">
                  {c.members?.length || 0} members
                </p>
              )}
            </div>
          </button>
        )
      })}
    </div>

    {!filteredChats.length && !searchQuery && (
      <div className="p-8 text-center text-white/60">
        <div className="text-4xl mb-4">💬</div>
        <p className="mb-2">No chats yet</p>
        {friendUsers.length === 0 ? (
          <p className="text-sm mb-4">Add friends to start chatting!</p>
        ) : (
          <p className="text-sm mb-4">Click on a friend above to start chatting!</p>
        )}
        <button
          onClick={() => setShowAddFriend(true)}
          className="btn btn-primary text-sm"
        >
          ➕ Add Your First Friend
        </button>
      </div>
    )}

    {!filteredChats.length && searchQuery && (
      <div className="p-8 text-center text-white/60">
        <div className="text-4xl mb-4">🔍</div>
        <p>No results for "{searchQuery}"</p>
      </div>
    )}

    {/* Modals */}
    <AnimatePresence>
      {showAddFriend && (
        <AddFriend onClose={() => setShowAddFriend(false)} />
      )}
      {showFriendRequests && (
        <FriendRequests onClose={() => setShowFriendRequests(false)} />
      )}
    </AnimatePresence>
  </div>
)
}
