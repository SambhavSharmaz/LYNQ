import React, { useMemo, useState } from 'react'
import { useChatsContext } from '../context/ChatsContext'
import { useUsers } from '../hooks/useUsers'
import { useAuth } from '../hooks/useAuth'

export default function ChatList() {
  const { chats, activeChat, setActiveChat, startDirectChat, createGroup } = useChatsContext()
  const { user } = useAuth()
  const { users, usersMap } = useUsers()
  const [showNewChat, setShowNewChat] = useState(false)
  const [showNewGroup, setShowNewGroup] = useState(false)
  const [groupName, setGroupName] = useState('')
  const [selected, setSelected] = useState({})

  const otherUsers = useMemo(() => {
    return users.filter(u => u.uid !== user?.uid)
  }, [users, user?.uid])

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

  return (
  <div className="relative bg-[#0D1117] text-white min-h-screen font-[Poppins]">
    {/* Header */}
    <div className="p-4 sticky top-0 z-10 backdrop-blur-xl bg-[#0D1117]/80 border-b border-[#1D9BF0]/20 shadow-lg">
      <div className="flex justify-between items-center mb-2">
        <div className="flex gap-3">
          <button
            onClick={() => setShowNewChat(v => !v)}
            className="px-3 py-1.5 text-sm rounded-lg border border-[#1D9BF0]/40 hover:bg-[#1D9BF0]/10 transition-all duration-200"
          >
            ➕ New Chat
          </button>
          <button
            onClick={() => setShowNewGroup(v => !v)}
            className="px-3 py-1.5 text-sm rounded-lg border border-[#1D9BF0]/40 hover:bg-[#1D9BF0]/10 transition-all duration-200"
          >
            👥 New Group
          </button>
        </div>
        <div className="text-xs text-gray-400">
          {chats.length} chat{chats.length !== 1 ? "s" : ""}
        </div>
      </div>

    </div>

    {/* New Chat Section */}
    {showNewChat && (
      <div className="p-4 border-b border-[#1D9BF0]/20 bg-[#0D1117]/70 backdrop-blur-xl">
        <div className="text-sm font-medium text-[#1D9BF0] mb-3">
          Start a New Chat
        </div>
        <div className="space-y-2 max-h-56 overflow-y-auto scrollbar-thin scrollbar-thumb-[#1D9BF0]/30">
          {otherUsers.map(u => (
            <button
              key={u.uid}
              onClick={async () => {
                try {
                  await startDirectChat(u.uid)
                  setShowNewChat(false)
                } catch (error) {
                  alert("Failed to start chat: " + error.message)
                }
              }}
              className="w-full text-left p-3 bg-[#111827] hover:bg-[#1D9BF0]/10 border border-[#1D9BF0]/20 rounded-xl transition-all duration-200 group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#1D9BF0] text-white flex items-center justify-center font-semibold">
                  {(u.displayName || u.email)?.[0]?.toUpperCase() || "?"}
                </div>
                <div className="flex-1">
                  <div className="font-medium group-hover:text-[#1D9BF0]">
                    {u.displayName || "User"}
                  </div>
                  <div className="text-xs text-gray-400">{u.email}</div>
                </div>
                {u.isOnline && (
                  <div
                    className="w-2.5 h-2.5 bg-[#10B981] rounded-full"
                    title="Online"
                  ></div>
                )}
              </div>
            </button>
          ))}
          {!otherUsers.length && (
            <div className="text-center text-gray-500 py-6">
              <div className="text-2xl mb-2">👥</div>
              <p className="text-sm">No other users found.</p>
              <p className="text-xs">Invite friends to start chatting!</p>
            </div>
          )}
        </div>
      </div>
    )}

    {/* Chats List */}
    <div className="divide-y divide-[#1D9BF0]/10">
      {chats.map(c => {
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
                ? "bg-[#1D9BF0]/10 border-l-4 border-[#1D9BF0]"
                : "hover:bg-[#1D9BF0]/5 border-l-4 border-transparent"
            }`}
          >
            {/* Avatar */}
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-white shadow-md ${
                c.isGroup ? "bg-purple-500" : "bg-[#1D9BF0]"
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
                    isActive ? "text-[#1D9BF0]" : "text-gray-200"
                  }`}
                >
                  {displayNameForChat(c)}
                </h3>
                {!c.isGroup && otherUser?.isOnline && (
                  <div
                    className="w-2.5 h-2.5 bg-[#10B981] rounded-full"
                    title="Online"
                  ></div>
                )}
              </div>
              <p
                className={`text-xs truncate ${
                  isActive ? "text-[#1D9BF0]" : "text-gray-400"
                }`}
              >
                {c.lastMessage || "No messages yet"}
              </p>
              {c.isGroup && (
                <p className="text-xs text-gray-500">
                  {c.members?.length || 0} members
                </p>
              )}
            </div>
          </button>
        )
      })}
    </div>

    {!chats.length && (
      <div className="p-4 text-sm text-gray-500 text-center">
        No chats yet. Start one!
      </div>
    )}
  </div>
)
}
