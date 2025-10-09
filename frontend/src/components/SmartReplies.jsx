import React, { useEffect, useState } from 'react'
import { ai } from '../lib/ai'

export default function SmartReplies({ context, onPick }) {
  const [replies, setReplies] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let ignore = false
    const fetchReplies = async () => {
      try {
        setLoading(true)
        const suggestions = await ai.smartReplies(context || [])
        if (!ignore) setReplies(suggestions.slice(0, 3))
      } catch (e) {
        console.warn('smart replies failed', e)
      } finally {
        setLoading(false)
      }
    }
    fetchReplies()
    return () => { ignore = true }
  }, [JSON.stringify(context)])

  if (!replies.length) return null

  return (
    <div className="flex gap-2 overflow-x-auto">
      {replies.map((r, i) => (
        <button key={i} onClick={()=>onPick?.(r)} className="px-3 py-1 rounded-full bg-gray-200 text-sm hover:bg-gray-300 whitespace-nowrap">{r}</button>
      ))}
      {loading && <div className="text-xs text-gray-500">Loading...</div>}
    </div>
  )
}
