import { useState, useRef, useEffect } from 'react'
import './ChatView.css'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

function ChatView() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const cleanup = window.closeclaw.llm.onToken((token: string) => {
      setMessages((prev) => {
        const updated = [...prev]
        const last = updated[updated.length - 1]
        if (last && last.role === 'assistant') {
          updated[updated.length - 1] = {
            ...last,
            content: last.content + token,
          }
        }
        return updated
      })
    })

    return cleanup
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isGenerating) return

    const userMessage = input.trim()
    setInput('')
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }])
    setMessages((prev) => [...prev, { role: 'assistant', content: '' }])
    setIsGenerating(true)

    try {
      await window.closeclaw.llm.prompt(userMessage)
    } catch (err) {
      console.error('Prompt error:', err)
      setMessages((prev) => {
        const updated = [...prev]
        const last = updated[updated.length - 1]
        if (last && last.role === 'assistant' && last.content === '') {
          updated[updated.length - 1] = {
            ...last,
            content: 'Sorry, something went wrong. Please try again.',
          }
        }
        return updated
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleNewChat = async () => {
    await window.closeclaw.llm.resetChat()
    setMessages([])
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <div className="chat-view">
      <div className="chat-header">
        <h1>Closeclaw AI</h1>
        <button onClick={handleNewChat} className="new-chat-btn">
          New Chat
        </button>
      </div>
      <div className="messages">
        {messages.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">C</div>
            <h2>Welcome to Closeclaw</h2>
            <p>Your private AI assistant, running locally on your Mac.</p>
            <p>Powered by a model optimized for Apple Silicon with Metal acceleration.</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`message ${msg.role}`}>
            <div className="message-label">
              {msg.role === 'user' ? 'You' : 'Closeclaw'}
            </div>
            <div className="message-content">
              {msg.content || (isGenerating ? 'Thinking...' : '')}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSubmit} className="input-area">
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask Closeclaw anything..."
          disabled={isGenerating}
          rows={1}
        />
        <button type="submit" disabled={isGenerating || !input.trim()}>
          {isGenerating ? 'Generating...' : 'Send'}
        </button>
      </form>
    </div>
  )
}

export default ChatView
