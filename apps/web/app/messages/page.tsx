// apps/web/app/messages/page.tsx
"use client"
import React from "react"
import { useQuery } from "convex/react"
import { api } from "../../generated-convex"
import { Hero } from "../../components/ui/hero"
import { Card } from "../../components/ui/card"

interface TelegramMessage {
  _id: string
  messageId: number
  chatId: number
  userId?: number
  username?: string
  firstName?: string
  lastName?: string
  text: string
  messageType: string
  timestamp: number
  createdAt: number
  messageThreadId?: number
  replyToMessageId?: number
}

export default function MessagesPage(): React.ReactElement {
  const messages = useQuery(api.messages.getAllMessages, { limit: 100 })

  // Messages are now loaded automatically via useQuery hook
  // No need for manual fetching

  if (messages === undefined) {
    return (
      <div className="p-6 mx-auto max-w-6xl">
        <Hero 
          title="Telegram Messages" 
          subtitle="Loading messages..."
        />
        <Card className="py-12 text-center">
          <p className="text-gray-600 dark:text-gray-400">Loading messages...</p>
        </Card>
      </div>
    )
  }



  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString()
  }

  const getUserDisplay = (message: TelegramMessage) => {
    if (message.username) return `@${message.username}`
    if (message.firstName || message.lastName) {
      return `${message.firstName || ""} ${message.lastName || ""}`.trim()
    }
    return `User ${message.userId || "Unknown"}`
  }

  // Group messages by threads
  const groupMessagesByThread = (messages: TelegramMessage[] | undefined) => {
    if (!messages) return { threads: {}, standaloneMessages: [] }
    const threads: { [key: string]: TelegramMessage[] } = {}
    const standaloneMessages: TelegramMessage[] = []

    messages.forEach(message => {
      if (message.messageThreadId) {
        const threadKey = `${message.chatId}-${message.messageThreadId}`
        if (!threads[threadKey]) {
          threads[threadKey] = []
        }
        threads[threadKey].push(message)
      } else {
        standaloneMessages.push(message)
      }
    })

    // Sort messages within each thread by timestamp
    Object.keys(threads).forEach(threadKey => {
      const threadMessages = threads[threadKey]
      if (threadMessages) {
        threadMessages.sort((a, b) => a.timestamp - b.timestamp)
      }
    })

    return { threads, standaloneMessages }
  }

  const { threads, standaloneMessages } = groupMessagesByThread(messages || [])

  return (
      <div className="p-6 mx-auto max-w-6xl">
        <Hero 
          title="Telegram Messages" 
          subtitle={`Total messages: ${messages.length} | Threads: ${Object.keys(threads).length} | Standalone: ${standaloneMessages.length}`}
        />

        <div className="flex flex-col gap-6">
          {messages.length === 0 ? (
              <Card className="py-12 text-center">
                <p className="mb-2 text-gray-600 dark:text-gray-400">No messages found.</p>
                <p className="text-gray-500 dark:text-gray-500">Send a message to your Telegram bot to see it here!</p>
              </Card>
          ) : (
              <>
                {/* Render Threads */}
                {Object.entries(threads).map(([threadKey, threadMessages]) => {
                   const firstMessage = threadMessages[0]
                   if (!firstMessage) return null
                   
                   return (
                     <Card key={threadKey} className="bg-gray-50 border-2 dark:bg-gray-800">
                       <div className="flex justify-between items-center pb-3 mb-4 border-b border-gray-200 dark:border-gray-600">
                         <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">Thread {firstMessage.messageThreadId} in Chat {firstMessage.chatId}</h3>
                         <span className="px-3 py-1 text-sm font-medium text-white bg-gray-600 rounded-full">{threadMessages.length} messages</span>
                       </div>
                      <div className="flex flex-col gap-3">
                        {threadMessages.map((message: TelegramMessage) => (
                            <Card key={message._id} className="ml-4 bg-white border-l-4 border-cyan-500 dark:bg-gray-900">
                              <div className="flex flex-wrap gap-2 justify-between items-center mb-3">
                                <span className="px-3 py-1 text-sm font-medium text-cyan-800 bg-cyan-100 rounded-full dark:bg-cyan-900 dark:text-cyan-200">{getUserDisplay(message)}</span>
                                <span className="font-mono text-sm text-gray-500 dark:text-gray-400">{formatDate(message.timestamp)}</span>
                                {message.replyToMessageId && (
                                    <span className="px-2 py-1 text-xs italic text-yellow-800 bg-yellow-100 rounded-full dark:bg-yellow-900 dark:text-yellow-200">↳ Reply to {message.replyToMessageId}</span>
                                )}
                              </div>
                              <div className="mb-3">
                                <p className="leading-relaxed text-gray-900 dark:text-gray-100">{message.text}</p>
                              </div>
                              <div className="flex justify-between items-center pt-3 text-sm border-t border-gray-100 dark:border-gray-700">
                                <span className="px-2 py-1 text-xs text-green-800 capitalize bg-green-100 rounded-full dark:bg-green-900 dark:text-green-200">{message.messageType}</span>
                                <span className="font-mono text-xs text-gray-400 dark:text-gray-500">ID: {message.messageId}</span>
                              </div>
                            </Card>
                        ))}
                      </div>
                    </Card>
                   )
                 })}

                {/* Render Standalone Messages */}
                {standaloneMessages.length > 0 && (
                    <div className="mt-8">
                      <h3 className="pb-2 mb-4 text-xl font-semibold text-gray-700 border-b-2 border-gray-200 dark:text-gray-300 dark:border-gray-600">Standalone Messages</h3>
                      {standaloneMessages.map((message: TelegramMessage) => (
                          <Card key={message._id}>
                            <div className="flex flex-wrap gap-2 justify-between items-center mb-3">
                              <span className="px-3 py-1 text-sm font-medium text-cyan-800 bg-cyan-100 rounded-full dark:bg-cyan-900 dark:text-cyan-200">{getUserDisplay(message)}</span>
                              <span className="px-3 py-1 text-sm text-gray-700 bg-gray-100 rounded-full dark:bg-gray-700 dark:text-gray-300">Chat: {message.chatId}</span>
                              <span className="font-mono text-sm text-gray-500 dark:text-gray-400">{formatDate(message.timestamp)}</span>
                              {message.replyToMessageId && (
                                  <span className="px-2 py-1 text-xs italic text-yellow-800 bg-yellow-100 rounded-full dark:bg-yellow-900 dark:text-yellow-200">↳ Reply to {message.replyToMessageId}</span>
                              )}
                            </div>
                            <div className="mb-3">
                              <p className="leading-relaxed text-gray-900 dark:text-gray-100">{message.text}</p>
                            </div>
                            <div className="flex justify-between items-center pt-3 text-sm border-t border-gray-100 dark:border-gray-700">
                              <span className="px-2 py-1 text-xs text-green-800 capitalize bg-green-100 rounded-full dark:bg-green-900 dark:text-green-200">{message.messageType}</span>
                              <span className="font-mono text-xs text-gray-400 dark:text-gray-500">ID: {message.messageId}</span>
                            </div>
                          </Card>
                      ))}
                    </div>
                )}
              </>
          )}
        </div>
      </div>
  )
}
