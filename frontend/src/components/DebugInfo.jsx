import React from 'react'
import { useAuth } from '../hooks/useAuth'
import { useUsers } from '../hooks/useUsers'
import { useChats } from '../hooks/useChats'

const DebugInfo = () => {
  const { user } = useAuth()
  const { users, usersMap } = useUsers()
  const { chats, activeChat } = useChats()

  return (
    <div className="p-4 bg-gray-100 border rounded-lg mt-4 text-xs">
      <h3 className="font-bold mb-2">🔍 Debug Information</h3>
      
      <div className="mb-2">
        <strong>Current User:</strong>
        <pre className="bg-white p-2 rounded mt-1 overflow-auto">
          {JSON.stringify(user ? {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName
          } : null, null, 2)}
        </pre>
      </div>

      <div className="mb-2">
        <strong>All Users ({users.length}):</strong>
        <pre className="bg-white p-2 rounded mt-1 overflow-auto max-h-32">
          {JSON.stringify(users.map(u => ({
            uid: u.uid,
            email: u.email,
            displayName: u.displayName
          })), null, 2)}
        </pre>
      </div>

      <div className="mb-2">
        <strong>Chats ({chats.length}):</strong>
        {chats.map((c, idx) => (
          <div key={c.id} className={`p-2 mt-1 rounded border ${
            activeChat?.id === c.id ? 'bg-blue-50 border-blue-200' : 'bg-white'
          }`}>
            <div className="flex justify-between items-start">
              <div>
                <strong>#{idx + 1}</strong> {c.isGroup ? 'Group' : 'Direct'}
                {activeChat?.id === c.id && <span className="ml-2 text-blue-600 font-bold">[ACTIVE]</span>}
              </div>
              <div className="text-xs text-gray-500">
                ...{c.id.slice(-6)}
              </div>
            </div>
            <div className="text-sm mt-1">
              <strong>Name:</strong> {c.isGroup ? (c.name || 'Unnamed Group') : 'Direct Chat'}<br/>
              <strong>Members:</strong> {c.members?.length || 0} users<br/>
              {c.members && (
                <div className="text-xs text-gray-600 mt-1">
                  {c.members.map(m => (
                    <div key={m}>{m === user?.uid ? '👤 You' : `👥 ${usersMap[m]?.displayName || m.slice(-6)}`}</div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {chats.length === 0 && (
          <div className="p-2 mt-1 bg-yellow-50 rounded text-sm">
            No chats found. Try creating a new chat!
          </div>
        )}
      </div>

      <div className="mb-2">
        <strong>Active Chat:</strong>
        <pre className="bg-white p-2 rounded mt-1 overflow-auto">
          {JSON.stringify(activeChat ? {
            id: activeChat.id,
            isGroup: activeChat.isGroup,
            members: activeChat.members,
            name: activeChat.name
          } : null, null, 2)}
        </pre>
      </div>

      <div className="mt-2 p-2 bg-yellow-100 rounded">
        <strong>💡 Troubleshooting Tips:</strong>
        <ul className="mt-1 list-disc list-inside space-y-1">
          <li>Make sure you have at least 2 users signed up</li>
          <li>Check browser console for any JavaScript errors</li>
          <li>Verify Firebase project has Firestore enabled</li>
          <li>Ensure your Firebase configuration is correct</li>
        </ul>
      </div>
    </div>
  )
}

export default DebugInfo