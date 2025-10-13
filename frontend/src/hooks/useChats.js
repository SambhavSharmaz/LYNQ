import { useEffect, useState, useCallback } from 'react'
import { db, serverTimestamp, auth } from '../lib/firebase'
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  doc,
  setDoc,
  getDoc,
  updateDoc,
} from 'firebase/firestore'
import { socket } from '../lib/socket'

export function useChats() {
  const [chats, setChats] = useState([])
  const [activeChat, setActiveChatState] = useState(null)
  const [messages, setMessages] = useState([])
  const [typing, setTyping] = useState({})

  const setActiveChat = (chat) => {
    if (activeChat?.id === chat?.id) return
    setActiveChatState(chat)
  }

  useEffect(() => {
    if (!auth.currentUser) return

    const q = query(
      collection(db, 'chats'),
      where('members', 'array-contains', auth.currentUser.uid)
    )

    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
        list.sort((a, b) => {
          const aTime = a.updatedAt?.seconds || 0
          const bTime = b.updatedAt?.seconds || 0
          return bTime - aTime
        })
        setChats(list)
        if (!activeChat && list.length) setActiveChat(list[0])
      },
      (error) => {
        console.error('Error fetching chats:', error)
      }
    )

    return () => unsub()
  }, [auth.currentUser?.uid])

  useEffect(() => {
    if (!activeChat) {
      setMessages([])
      return
    }

    const q = query(
      collection(db, 'chats', activeChat.id, 'messages'),
      orderBy('createdAt', 'asc')
    )
    const unsub = onSnapshot(
      q,
      (snap) => {
        const newMessages = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
        setMessages(newMessages)
      },
      (error) => {
        console.error('Error fetching messages:', error)
        setMessages([])
      }
    )

    socket.emit('join', { chatId: activeChat.id, userId: auth.currentUser?.uid })
    const onTyping = (p) => setTyping((t) => ({ ...t, [p.userId]: p.typing }))
    const onMessage = (m) => {}

    socket.on('typing', onTyping)
    socket.on('message', onMessage)

    return () => {
      socket.off('typing', onTyping)
      socket.off('message', onMessage)
    }
  }, [activeChat?.id])

  const ensure1to1Chat = useCallback(async (otherUserId) => {
    if (!auth.currentUser) throw new Error('User not authenticated')
    const id = [auth.currentUser.uid, otherUserId].sort().join('_')
    const refDoc = doc(db, 'chats', id)
    const snap = await getDoc(refDoc)
    if (!snap.exists()) {
      const chatData = {
        isGroup: false,
        members: [auth.currentUser.uid, otherUserId],
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
      }
      await setDoc(refDoc, chatData)
    }
    const finalSnap = await getDoc(refDoc)
    return { id, ...finalSnap.data() }
  }, [])

  const startDirectChat = useCallback(
    async (otherUserId) => {
      // Check if users are friends first
      const currentUserDoc = await getDoc(doc(db, 'users', auth.currentUser.uid))
      const currentUserData = currentUserDoc.data()
      const friends = currentUserData?.friends || []
      
      if (!friends.includes(otherUserId)) {
        throw new Error('You can only chat with friends. Send a friend request first.')
      }
      
      const chat = await ensure1to1Chat(otherUserId)
      setActiveChat({ id: chat.id, ...chat })
    },
    [ensure1to1Chat]
  )

  const createGroup = useCallback(async (name, memberIds = []) => {
    // Check if all members are friends with the current user
    const currentUserDoc = await getDoc(doc(db, 'users', auth.currentUser.uid))
    const currentUserData = currentUserDoc.data()
    const friends = currentUserData?.friends || []
    
    const invalidMembers = memberIds.filter(id => !friends.includes(id))
    if (invalidMembers.length > 0) {
      throw new Error('You can only add friends to groups')
    }
    
    const members = Array.from(new Set([auth.currentUser.uid, ...memberIds.filter(Boolean)]))
    const chatRef = await addDoc(collection(db, 'chats'), {
      isGroup: true,
      name: name || 'New Group',
      members,
      createdBy: auth.currentUser.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    const newGroupChat = { id: chatRef.id, isGroup: true, name, members }
    setActiveChat(newGroupChat)
    return chatRef.id
  }, [])

  const uploadFileToCloudinary = async (file) => {
    if (!file) return null
    const formData = new FormData()
    formData.append('file', file)
    formData.append('upload_preset', import.meta.env.VITE_CLOUD_UPLOAD_PRESET)

    try {
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUD_NAME}/upload`,
        { method: 'POST', body: formData }
      )
      const data = await res.json()
      return { url: data.secure_url, type: file.type }
    } catch (err) {
      console.error('Cloudinary upload error:', err)
      return null
    }
  }

  const sendMessage = useCallback(
  async (chatId, text, file) => {
    let mediaUrl = null
    let mediaType = null
    if (file) {
      const uploaded = await uploadFileToCloudinary(file)
      if (!uploaded) return
      mediaUrl = uploaded.url
      mediaType = uploaded.type
    }

    const msg = {
      senderId: auth.currentUser.uid,
      text: text || '',
      ...(mediaUrl ? { mediaUrl } : {}),  // only include if not null
      ...(mediaType ? { mediaType } : {}), // only include if not null
      createdAt: serverTimestamp(),
    }

    await addDoc(collection(db, 'chats', chatId, 'messages'), msg)
    await updateDoc(doc(db, 'chats', chatId), {
      lastMessage: msg.text || mediaType || 'media',
      updatedAt: serverTimestamp(),
    })
    socket.emit('message', { chatId, ...msg })
  },
  []
)

  const indicateTyping = useCallback((chatId, typing) => {
    socket.emit('typing', { chatId, userId: auth.currentUser?.uid, typing })
  }, [])

  return {
    chats,
    activeChat,
    setActiveChat,
    messages,
    sendMessage,
    typing,
    ensure1to1Chat,
    startDirectChat,
    createGroup,
    indicateTyping,
  }
}
