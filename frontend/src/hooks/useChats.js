import { useEffect, useState, useCallback } from 'react'
import { db, storage, serverTimestamp, auth } from '../lib/firebase'
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
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { socket } from '../lib/socket'

export function useChats() {
  const [chats, setChats] = useState([])
  const [activeChat, setActiveChatState] = useState(null)
  const [messages, setMessages] = useState([])
  const [typing, setTyping] = useState({})
  
  // Wrapper function for setActiveChat
  const setActiveChat = (chat) => {
    if (activeChat?.id === chat?.id) return
    setActiveChatState(chat)
  }

  useEffect(() => {
    if (!auth.currentUser) return
    
    // Temporarily use a simpler query without orderBy to avoid index requirement
    // TODO: Add composite index for members + updatedAt in Firebase Console
    const q = query(collection(db, 'chats'), where('members', 'array-contains', auth.currentUser.uid))
    
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }))

      // Sort manually by updatedAt since we can't use orderBy without the index
      list.sort((a, b) => {
        const aTime = a.updatedAt?.seconds || 0
        const bTime = b.updatedAt?.seconds || 0
        return bTime - aTime // descending
      })

      setChats(list)
      if (!activeChat && list.length) {
        setActiveChat(list[0])
      }
    }, (error) => {
      // Optionally handle error silently or surface via UI
    })
    
    return () => unsub()
  }, [auth.currentUser?.uid])

  useEffect(() => {
    if (!activeChat) {
      setMessages([])
      return
    }

    const q = query(collection(db, 'chats', activeChat.id, 'messages'), orderBy('createdAt', 'asc'))
    const unsub = onSnapshot(q, (snap) => {
      const newMessages = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      setMessages(newMessages)
    }, (error) => {
      setMessages([])
    })
    socket.emit('join', { chatId: activeChat.id, userId: auth.currentUser?.uid })
    const onTyping = (p) => { setTyping(t => ({ ...t, [p.userId]: p.typing })) }
    const onMessage = (m) => { /* Firestore will sync; optional immediate UI */ }
    socket.on('typing', onTyping)
    socket.on('message', onMessage)
    return () => {
      socket.off('typing', onTyping)
      socket.off('message', onMessage)
    }
  }, [activeChat?.id])

  const ensure1to1Chat = useCallback(async (otherUserId) => {
    if (!auth.currentUser) {
      throw new Error('User not authenticated')
    }

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
    const result = { id, ...finalSnap.data() }
    return result
  }, [])

  const startDirectChat = useCallback(async (otherUserId) => {
    try {
      const chat = await ensure1to1Chat(otherUserId)
      setActiveChat({ id: chat.id, ...chat })
    } catch (error) {
      throw error
    }
  }, [ensure1to1Chat])

  const createGroup = useCallback(async (name, memberIds=[]) => {
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

  const sendMessage = useCallback(async (chatId, text, file) => {
    let mediaUrl = null
    let mediaType = null
    if (file) {
      const r = ref(storage, `uploads/${chatId}/${Date.now()}_${file.name}`)
      const up = await uploadBytes(r, file)
      mediaUrl = await getDownloadURL(up.ref)
      mediaType = file.type
    }
    const msg = {
      senderId: auth.currentUser.uid,
      text: text || '',
      mediaUrl,
      mediaType,
      createdAt: serverTimestamp(),
    }
    await addDoc(collection(db, 'chats', chatId, 'messages'), msg)
    await updateDoc(doc(db, 'chats', chatId), { lastMessage: msg.text || (mediaType || 'media'), updatedAt: serverTimestamp() })
    socket.emit('message', { chatId, ...msg })
  }, [])

  const indicateTyping = useCallback((chatId, typing) => {
    socket.emit('typing', { chatId, userId: auth.currentUser?.uid, typing })
  }, [])

  return { chats, activeChat, setActiveChat, messages, sendMessage, typing, ensure1to1Chat, startDirectChat, createGroup, indicateTyping }
}
