import { useChat } from '@ai-sdk/react';
import { useState, useEffect, useRef } from 'react';
import sendArrow from '/images/sendArrow.svg';
import ChatIcon from './ChatIcon/ChatIcon';
export default function Chat() {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false); // Loading state
  const [isChatOpen, setIsChatOpen] = useState(false); // To control the chat popup visibility
  const { messages, sendMessage, status } = useChat();

  // Reference for the message container to manage scroll behavior
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  // Scroll to the bottom of the chat when messages change
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Handle sending the message and triggering loading state
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!input) return;
    setIsLoading(true);
    sendMessage({ text: input });
    setInput('');
  };


  // Reset the loading state once AI response is received
  useEffect(() => {
    if (status === 'submitted') {
      setIsLoading(true);
    } else {
      setIsLoading(false);
    }
  }, [status]);

  // Toggle chat visibility
  const toggleChat = () => {
    setIsChatOpen(!isChatOpen);
  };

  // Close chat window
  const closeChat = () => {
    setIsChatOpen(false);
  };

  return (
    <div>
      {/* Floating Chat Icon */}
      <button
        onClick={toggleChat}
        style={{
          position: 'fixed',
          top: '20px',
          right: '10px',
          // width: '60px',
          // height: '60px',
          borderRadius: '50%',
          // backgroundColor: '#007bff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          // boxShadow: '0 6px 12px rgba(0, 0, 0, 0.1)',
          cursor: 'pointer',
          zIndex: 1000,
          border: 'none',
        }}
        aria-label="Toggle chat"
      >
        
        <ChatIcon />
      </button>

      {/* Chat Popup */}
      {isChatOpen && (
        <div
          style={{
            height: '500px',
            minHeight: '400px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start',
            width: '400px',
            borderRadius: '12px',
            backgroundColor: '#f7f7f7',
            overflow: 'hidden',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            position: 'fixed',
            bottom: '80px',
            right: '20px',
            zIndex: 1001,
          }}
        >
          {/* Chat Header with Close Button */}
          <div
            style={{
              padding: '7px 12px',
              backgroundColor: '#2c2e2f',
              color: 'white',
              fontSize: '16px',
              fontWeight: 'bold',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderTopLeftRadius: '12px',
              borderTopRightRadius: '12px',
            }}
          >
            <span>Chat with EU AI</span>
            <button
              onClick={closeChat}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'white',
                fontSize: '30px',
                cursor: 'pointer',
              }}
            >
              &times;
            </button>
          </div>

          <div
            ref={chatContainerRef}
            style={{
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              overflowY: 'auto',
              flex: '1',
              paddingRight: '10px',
              marginBottom: '20px',
            }}
          >
            {messages.map((message) => (
              <div
                key={message.id}
                style={{
                  display: 'flex',
                  justifyContent: message.role === 'user' ? 'flex-start' : 'flex-end',
                  gap: '10px',
                }}
              >
                <div
                  style={{
                    backgroundColor: message.role === 'user' ? '#e0e0e0' : '#2e2e2e',
                    color: message.role === 'user' ? 'black' : 'white',
                    padding: '12px 16px',
                    borderRadius: '20px',
                    maxWidth: '70%',
                    wordWrap: 'break-word',
                    fontSize: '14px',
                    boxShadow: message.role === 'user' ? '0 2px 5px rgba(0, 0, 0, 0.1)' : 'none',
                    fontFamily: 'Arial, sans-serif',
                    lineHeight: '1.4',
                  }}
                >
                  {messages.length !== 0 && messages[messages.length - 1].id === message.id && message.role === 'assistant' && status !== 'ready' && status !== 'error' &&
                    <ProcessingMessage />
                  }

                  {message.parts.map((part, i) => {
                    switch (part.type) {
                      case 'text':
                        return (
                          <div
                            key={`${message.id}-${i}`}
                            dangerouslySetInnerHTML={{ __html: part.text }}
                            style={{ maxWidth: '100%', overflowX: 'auto' }}
                          />
                        );

                      default:
                        return null
                    }
                  })}

                </div>
              </div>
            ))}

            {/* Show blue blinking dot loader while AI is generating response */}
            {isLoading && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  padding: '10px',
                  fontSize: '14px',
                  color: '#007bff',
                  fontStyle: 'italic',
                }}
              >
                <div className="dot-loader"></div>
              </div>
            )}

            {/* Reference to the end of the message container */}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Field with Send Button (Up Arrow) */}
          <form
            onSubmit={handleSendMessage}
            style={{
              padding: '12px',
              borderTop: '1px solid #ddd',
              backgroundColor: '#fff',
              position: 'sticky',
              bottom: '0',
              width: '100%',
              zIndex: 1,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
              <input
                style={{
                  width: '83%',
                  height: '40px',
                  padding: '0 16px',
                  borderRadius: '20px',
                  border: '1px solid #ccc',
                  outline: 'none',
                  fontSize: '14px',
                  fontFamily: 'Arial, sans-serif',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                  transition: 'all 0.3s ease',
                  boxSizing: 'border-box',
                }}
                onFocus={(e) => {
                  e.target.style.border = '1px solid #00aaff';
                  e.target.style.boxShadow = '0 0 8px rgba(0, 170, 255, 0.8)';
                }}
                onBlur={(e) => {
                  e.target.style.border = '1px solid #ccc';
                  e.target.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
                }}
                placeholder="Type here..."
                value={input}
                onChange={(e) => setInput(e.currentTarget.value)}
              />
              <button
                type="submit"
                style={{
                  border: 'none',
                  background: 'transparent',
                  marginLeft: '10px',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >

                <img style={{ width: '25px', height: '25px' }} src={sendArrow} alt="Send Arrow" />
                {/* Up Arrow Button */}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}



const ProcessingMessage = () => {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div>
        <p
          style={{
            fontSize: '20px',
            color: '#3498db',
            animation: 'blink 1.5s step-end infinite',
            margin: '0',
            padding: '0',
          }}
        >
          Processing
          <span
            style={{
              fontSize: '25px',
              animation: 'dot 1.5s steps(5, end) infinite',
            }}
          >
            ...
          </span>
        </p>
      </div>

      <style>
        {`
          @keyframes blink {
            50% {
              opacity: 0;
            }
          }

          @keyframes dot {
            0% { content: ''; }
            20% { content: '.'; }
            40% { content: '..'; }
            60% { content: '...'; }
            80% { content: ''; }
            100% { content: '.'; }
          }
        `}
      </style>
    </div>
  );
};


