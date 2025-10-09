import React, { useMemo, useState } from 'react'
import { useChats } from '../hooks/useChats'
import { useUsers } from '../hooks/useUsers'
import { useAuth } from '../hooks/useAuth'

export default function ChatList() {
  const { chats, activeChat, setActiveChat, startDirectChat, createGroup } = useChats()
  const { user } = useAuth()
  const { users, usersMap } = useUsers()
  const [showNewChat, setShowNewChat] = useState(false)
  const [showNewGroup, setShowNewGroup] = useState(false)
  const [groupName, setGroupName] = useState('')
  const [selected, setSelected] = useState({})

  const otherUsers = useMemo(() => {
    console.log('🔥 ChatList - All users:', users)
    console.log('🔥 ChatList - Current user:', user)
    const filtered = users.filter(u => u.uid !== user?.uid)
    console.log('🔥 ChatList - Other users:', filtered)
    return filtered
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
    <div className="relative">
      <div className="p-3 border-b sticky top-0 bg-white z-10">
        <div className="flex justify-between items-center mb-2">
          <div className="flex gap-2">
            <button onClick={()=>setShowNewChat(v=>!v)} className="px-2 py-1 text-sm border rounded">New chat</button>
            <button onClick={()=>setShowNewGroup(v=>!v)} className="px-2 py-1 text-sm border rounded">New group</button>
          </div>
          <div className="text-xs text-gray-500">
            {chats.length} chat{chats.length !== 1 ? 's' : ''}
          </div>
        </div>
        {activeChat && (
          <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
            Active: {activeChat.isGroup ? 'Group' : 'Direct'} • {activeChat.id.slice(-6)}
          </div>
        )}
      </div>

      {showNewChat && (
        <div className="p-3 border-b bg-gray-50">
          <div className="text-sm font-medium text-gray-700 mb-3">Start a new chat</div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {otherUsers.map(u => (
              <button 
                key={u.uid} 
                onClick={async () => {
                  console.log('🔥 Clicked on user:', {
                    uid: u.uid,
                    displayName: u.displayName,
                    email: u.email,
                    currentUser: user?.uid
                  })
                  
                  try {
                    console.log('🔥 Starting direct chat...')
                    await startDirectChat(u.uid)
                    console.log('🔥 Direct chat started successfully')
                    setShowNewChat(false)
                  } catch (error) {
                    console.error('🔥 Error starting direct chat:', error)
                    alert('Failed to start chat: ' + error.message)
                  }
                }} 
                className="w-full text-left p-3 hover:bg-white rounded-lg border bg-white transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-medium text-sm">
                    {(u.displayName || u.email)?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 group-hover:text-blue-600">
                      {u.displayName || 'User'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {u.email}
                    </div>
                  </div>
                  {u.isOnline && (
                    <div className="w-2 h-2 bg-green-500 rounded-full" title="Online"></div>
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

      {showNewGroup && (
        <div className="p-3 border-b space-y-2">
          <div className="text-xs text-gray-500">Create group</div>
          <input value={groupName} onChange={e=>setGroupName(e.target.value)} placeholder="Group name" className="w-full border rounded px-2 py-1" />
          <div className="text-xs text-gray-500">Members</div>
          <div className="max-h-48 overflow-y-auto space-y-1">
            {otherUsers.map(u => (
              <label key={u.uid} className="flex items-center gap-2 px-2 py-1 hover:bg-gray-50 rounded">
                <input type="checkbox" checked={!!selected[u.uid]} onChange={()=>toggleSel(u.uid)} />
                <span>{u.displayName || u.email}</span>
              </label>
            ))}
            {!otherUsers.length && <div className="text-xs text-gray-500">No other users yet.</div>}
          </div>
          <div className="flex gap-2">
            <button onClick={createGroupNow} className="px-2 py-1 text-sm bg-blue-600 text-white rounded">Create</button>
            <button onClick={()=>{ setShowNewGroup(false); setSelected({}); setGroupName('') }} className="px-2 py-1 text-sm border rounded">Cancel</button>
          </div>
        </div>
      )}

      {chats.map(c => {
        const isActive = activeChat?.id === c.id
        const otherUser = !c.isGroup ? usersMap[(c.members || []).find(m => m !== user?.uid)] : null
        
        return (
          <button 
            key={c.id} 
            onClick={() => {
              console.log('🔥 Switching to chat:', {
                chatId: c.id,
                chatData: c,
                currentActiveChat: activeChat?.id
              })
              setActiveChat(c)
              console.log('🔥 setActiveChat called')
            }} 
            className={`w-full text-left px-4 py-3 border-b transition-colors ${
              isActive 
                ? 'bg-blue-50 border-blue-200 border-l-4 border-l-blue-600' 
                : 'hover:bg-gray-50 border-l-4 border-l-transparent'
            }`}
          >
            <div className="flex items-center gap-3">
              {/* Avatar/Icon */}
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium ${
                c.isGroup ? 'bg-purple-500' : 'bg-blue-500'
              }`}>
                {c.isGroup 
                  ? c.name?.[0]?.toUpperCase() || 'G'
                  : (otherUser?.displayName || otherUser?.email)?.[0]?.toUpperCase() || '?'
                }
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col flex-1 min-w-0">
                    <h3 className={`font-medium truncate ${
                      isActive ? 'text-blue-900' : 'text-gray-900'
                    }`}>
                      {displayNameForChat(c)}
                    </h3>
                    <div className={`text-xs ${
                      isActive ? 'text-blue-500' : 'text-gray-400'
                    }`}>
                      {c.isGroup ? 'Group' : 'Direct'} • {c.id.slice(-6)}
                    </div>
                  </div>
                  {!c.isGroup && otherUser?.isOnline && (
                    <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0" title="Online"></div>
                  )}
                </div>
                
                <p className={`text-xs truncate ${
                  isActive ? 'text-blue-600' : 'text-gray-500'
                }`}>
                  {c.lastMessage || 'No messages yet'}
                </p>
                
                {c.isGroup && (
                  <p className={`text-xs ${
                    isActive ? 'text-blue-500' : 'text-gray-400'
                  }`}>
                    {c.members?.length || 0} members
                  </p>
                )}
              </div>
            </div>
          </button>
        )
      })}
      {!chats.length && <div className="p-4 text-sm text-gray-500">No chats yet.</div>}
    </div>
  )
}
