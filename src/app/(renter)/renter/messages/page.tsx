'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { MessageSquare, Send, User } from 'lucide-react'

export default function RenterMessagesPage() {
  const [conversations, setConversations] = useState<any[]>([])
  const [selectedConversation, setSelectedConversation] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState('')

  useEffect(() => {
    fetchUserId()
  }, [])

  useEffect(() => {
    if (userId) {
      fetchConversations()
    }
  }, [userId])

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages()
      const interval = setInterval(fetchMessages, 3000) // Poll every 3 seconds
      return () => clearInterval(interval)
    }
  }, [selectedConversation])

  async function fetchUserId() {
    try {
      const response = await fetch('/api/auth/me')
      const data = await response.json()
      setUserId(data.user?.id)
    } catch (error) {
      console.error('Error:', error)
    }
  }

  async function fetchConversations() {
    try {
      const response = await fetch(`/api/messages?method=conversations&user_id=${userId}`, {
        method: 'PUT',
      })
      const data = await response.json()
      setConversations(data.conversations || [])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  async function fetchMessages() {
    if (!selectedConversation) return

    try {
      const response = await fetch(
        `/api/messages?user_id=${userId}&asset_id=${selectedConversation.asset?.id || ''}`
      )
      const data = await response.json()

      // Filter messages between current user and selected partner
      const filtered = data.messages?.filter(
        (m: any) =>
          (m.from_user_id === userId && m.to_user_id === selectedConversation.partner_id) ||
          (m.from_user_id === selectedConversation.partner_id && m.to_user_id === userId)
      )

      setMessages(filtered || [])

      // Mark as read
      filtered?.forEach((m: any) => {
        if (m.to_user_id === userId && !m.is_read) {
          fetch('/api/messages', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: m.id }),
          })
        }
      })
    } catch (error) {
      console.error('Error:', error)
    }
  }

  async function sendMessage() {
    if (!newMessage.trim() || !selectedConversation) return

    try {
      await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from_user_id: userId,
          to_user_id: selectedConversation.partner_id,
          asset_id: selectedConversation.asset?.id,
          message: newMessage,
          message_type: 'general',
        }),
      })

      setNewMessage('')
      fetchMessages()
    } catch (error) {
      console.error('Error:', error)
    }
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-6">Messages</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
        {/* Conversations List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Conversations</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {conversations.length > 0 ? (
              <div className="divide-y">
                {conversations.map((conv) => (
                  <button
                    key={conv.partner_id}
                    onClick={() => setSelectedConversation(conv)}
                    className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                      selectedConversation?.partner_id === conv.partner_id ? 'bg-gray-50' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                        <User className="h-5 w-5 text-gray-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-semibold text-sm truncate">
                            {conv.partner?.full_name || 'Owner'}
                          </p>
                          {conv.unread_count > 0 && (
                            <Badge className="bg-black text-white">{conv.unread_count}</Badge>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mb-1">
                          {conv.asset?.name || 'RV Inquiry'}
                        </p>
                        <p className="text-xs text-gray-400 truncate">{conv.last_message}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <MessageSquare className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No conversations yet</p>
                <p className="text-xs text-gray-400 mt-1">
                  Message an owner from an RV listing
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Message Thread */}
        <Card className="lg:col-span-2 flex flex-col">
          {selectedConversation ? (
            <>
              <CardHeader className="border-b">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                    <User className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">
                      {selectedConversation.partner?.full_name || 'Owner'}
                    </CardTitle>
                    <p className="text-sm text-gray-500">
                      {selectedConversation.asset?.name || 'General'}
                    </p>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="flex-1 overflow-y-auto p-4">
                <div className="space-y-4">
                  {messages.map((msg) => {
                    const isMe = msg.from_user_id === userId
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-lg px-4 py-2 ${
                            isMe
                              ? 'bg-black text-white'
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          <p className="text-sm">{msg.message}</p>
                          <p
                            className={`text-xs mt-1 ${
                              isMe ? 'text-gray-300' : 'text-gray-500'
                            }`}
                          >
                            {new Date(msg.created_at).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>

              <Separator />

              <div className="p-4">
                <div className="flex gap-2">
                  <Textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="resize-none"
                    rows={2}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        sendMessage()
                      }
                    }}
                  />
                  <Button onClick={sendMessage} className="bg-black hover:bg-gray-800">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <CardContent className="flex items-center justify-center h-full">
              <div className="text-center text-gray-500">
                <MessageSquare className="h-16 w-16 mx-auto mb-3 text-gray-300" />
                <p>Select a conversation to start messaging</p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  )
}
