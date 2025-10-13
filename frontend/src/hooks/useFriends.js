import { useEffect, useState, useCallback } from 'react'
import { db, auth, serverTimestamp } from '../lib/firebase'
import { 
  doc, 
  updateDoc, 
  arrayUnion, 
  arrayRemove, 
  onSnapshot,
  query,
  collection,
  where,
  getDocs
} from 'firebase/firestore'

export function useFriends() {
  const [friends, setFriends] = useState([])
  const [friendRequests, setFriendRequests] = useState({ incoming: [], outgoing: [] })
  const [loading, setLoading] = useState(true)

  // Listen to current user's friend data
  useEffect(() => {
    if (!auth.currentUser) {
      setLoading(false)
      return
    }

    const userDoc = doc(db, 'users', auth.currentUser.uid)
    const unsub = onSnapshot(userDoc, (doc) => {
      const data = doc.data()
      setFriends(data?.friends || [])
      setFriendRequests(data?.friendRequests || { incoming: [], outgoing: [] })
      setLoading(false)
    })

    return () => unsub()
  }, [auth.currentUser?.uid])

  // Find user by lynqId
  const findUserByLynqId = useCallback(async (lynqId) => {
    const q = query(collection(db, 'users'), where('lynqId', '==', lynqId.toUpperCase()))
    const snap = await getDocs(q)
    
    if (snap.empty) return null
    
    const userData = snap.docs[0].data()
    return {
      uid: userData.uid,
      lynqId: userData.lynqId,
      displayName: userData.displayName,
      email: userData.email,
      photoURL: userData.photoURL
    }
  }, [])

  // Find user by email
  const findUserByEmail = useCallback(async (email) => {
    const q = query(collection(db, 'users'), where('email', '==', email.toLowerCase()))
    const snap = await getDocs(q)
    
    if (snap.empty) return null
    
    const userData = snap.docs[0].data()
    return {
      uid: userData.uid,
      lynqId: userData.lynqId,
      displayName: userData.displayName,
      email: userData.email,
      photoURL: userData.photoURL
    }
  }, [])

  // Send friend request
  const sendFriendRequest = useCallback(async (targetUserId) => {
    if (!auth.currentUser || targetUserId === auth.currentUser.uid) return

    const currentUserDoc = doc(db, 'users', auth.currentUser.uid)
    const targetUserDoc = doc(db, 'users', targetUserId)

    // Add to current user's outgoing requests
    await updateDoc(currentUserDoc, {
      'friendRequests.outgoing': arrayUnion(targetUserId)
    })

    // Add to target user's incoming requests
    await updateDoc(targetUserDoc, {
      'friendRequests.incoming': arrayUnion(auth.currentUser.uid)
    })
  }, [])

  // Accept friend request
  const acceptFriendRequest = useCallback(async (requesterId) => {
    if (!auth.currentUser) return

    const currentUserDoc = doc(db, 'users', auth.currentUser.uid)
    const requesterDoc = doc(db, 'users', requesterId)

    // Remove from incoming requests and add to friends
    await updateDoc(currentUserDoc, {
      'friendRequests.incoming': arrayRemove(requesterId),
      friends: arrayUnion(requesterId)
    })

    // Remove from requester's outgoing requests and add to friends
    await updateDoc(requesterDoc, {
      'friendRequests.outgoing': arrayRemove(auth.currentUser.uid),
      friends: arrayUnion(auth.currentUser.uid)
    })
  }, [])

  // Reject friend request
  const rejectFriendRequest = useCallback(async (requesterId) => {
    if (!auth.currentUser) return

    const currentUserDoc = doc(db, 'users', auth.currentUser.uid)
    const requesterDoc = doc(db, 'users', requesterId)

    // Remove from incoming requests
    await updateDoc(currentUserDoc, {
      'friendRequests.incoming': arrayRemove(requesterId)
    })

    // Remove from requester's outgoing requests
    await updateDoc(requesterDoc, {
      'friendRequests.outgoing': arrayRemove(auth.currentUser.uid)
    })
  }, [])

  // Cancel outgoing friend request
  const cancelFriendRequest = useCallback(async (targetUserId) => {
    if (!auth.currentUser) return

    const currentUserDoc = doc(db, 'users', auth.currentUser.uid)
    const targetUserDoc = doc(db, 'users', targetUserId)

    // Remove from current user's outgoing requests
    await updateDoc(currentUserDoc, {
      'friendRequests.outgoing': arrayRemove(targetUserId)
    })

    // Remove from target user's incoming requests
    await updateDoc(targetUserDoc, {
      'friendRequests.incoming': arrayRemove(auth.currentUser.uid)
    })
  }, [])

  // Remove friend
  const removeFriend = useCallback(async (friendId) => {
    if (!auth.currentUser) return

    const currentUserDoc = doc(db, 'users', auth.currentUser.uid)
    const friendDoc = doc(db, 'users', friendId)

    // Remove from both users' friend lists
    await updateDoc(currentUserDoc, {
      friends: arrayRemove(friendId)
    })

    await updateDoc(friendDoc, {
      friends: arrayRemove(auth.currentUser.uid)
    })
  }, [])

  return {
    friends,
    friendRequests,
    loading,
    findUserByLynqId,
    findUserByEmail,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    cancelFriendRequest,
    removeFriend
  }
}