import React, { useState, useRef, useEffect } from 'react';
import { Drawer, Input, Button, Tag, Alert, Spin } from 'antd';
import { FiSend, FiCpu, FiUser, FiInfo, FiTrash2 } from 'react-icons/fi';
import aiApi from '../../api/ai.api';
import { useAuth } from '../../contexts/AuthContext';

export const AIChatDrawer = ({ open, onClose }) => {
  const { role } = useAuth();
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content:
        'Hello! I am HCM Lite AI Assistant. Ask me about company leave rules, attendance policies, salary slabs, or your records.',
      isAIGenerated: true,
      toolsUsed: [],
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (open) scrollToBottom();
  }, [messages, open]);

  const getSuggestedQuestions = () => {
    if (role === 'EMPLOYEE') {
      return [
        'What is my remaining leave balance?',
        'Explain the company leave policy',
        'What are the office timings and grace period?',
        'How is income tax calculated on salary?',
      ];
    }
    return [
      'How many employees are currently active?',
      'Summarize attendance for today',
      'Who are the top late-comers this month?',
      'What leave requests are awaiting approval?',
      'Summarize the latest payroll run',
    ];
  };

  const handleSend = async (textToSend) => {
    const text = (textToSend || inputText).trim();
    if (!text || loading) return;

    setErrorMsg('');
    const userMessage = { role: 'user', content: text };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInputText('');
    setLoading(true);

    try {
      // Send conversation history to backend Groq AI
      const res = await aiApi.sendAIChat(nextMessages.map((m) => ({ role: m.role, content: m.content })));

      const aiReply = res?.data?.answer || 'No response returned from AI.';
      const toolsUsed = res?.data?.toolsUsed || [];

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: aiReply,
          isAIGenerated: true,
          toolsUsed,
        },
      ]);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to communicate with AI Assistant.');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setMessages([
      {
        role: 'assistant',
        content: 'Conversation cleared. How can I help you today?',
        isAIGenerated: true,
      },
    ]);
  };

  return (
    <Drawer
      title={
        <div className="flex items-center justify-between w-full pr-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-700">
              <FiCpu className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 leading-tight">HCM Lite Assistant</h3>
              <p className="text-[10px] text-slate-500 font-medium">Groq Powered • Role Scoped</p>
            </div>
          </div>
          <Button
            type="text"
            size="small"
            icon={<FiTrash2 className="w-3.5 h-3.5 text-slate-400" />}
            onClick={handleClear}
            title="Clear Chat"
          />
        </div>
      }
      open={open}
      onClose={onClose}
      width={440}
      bodyStyle={{ padding: '16px', display: 'flex', flexDirection: 'column' }}
    >
      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div className="flex items-center gap-1.5 mb-1 px-1">
              {m.role === 'user' ? (
                <span className="text-[10px] font-semibold text-slate-500 uppercase">You</span>
              ) : (
                <>
                  <FiCpu className="w-3 h-3 text-indigo-600" />
                  <span className="text-[10px] font-bold text-indigo-700 uppercase">AI Assistant</span>
                  {m.isAIGenerated && (
                    <Tag color="geekblue" className="text-[9px] px-1 py-0 rounded m-0 border-0">
                      AI-generated
                    </Tag>
                  )}
                </>
              )}
            </div>

            <div
              className={`p-3.5 rounded-2xl text-xs leading-relaxed max-w-[90%] whitespace-pre-wrap ${
                m.role === 'user'
                  ? 'bg-indigo-600 text-white rounded-br-xs shadow-sm font-normal'
                  : 'bg-slate-100 text-slate-800 rounded-bl-xs border border-slate-200'
              }`}
            >
              {m.content}

              {m.toolsUsed && m.toolsUsed.length > 0 && (
                <div className="mt-2 pt-2 border-t border-slate-200/60 flex flex-wrap gap-1">
                  <span className="text-[9px] text-slate-500 font-semibold block w-full">Data Sources:</span>
                  {m.toolsUsed.map((tool, tIdx) => (
                    <Tag key={tIdx} color="default" className="text-[9px] py-0 px-1 font-mono">
                      {tool}
                    </Tag>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 w-fit">
            <Spin size="small" />
            <span className="text-xs text-slate-500 italic">HCM Lite AI is thinking...</span>
          </div>
        )}

        {errorMsg && <Alert type="error" showIcon message={errorMsg} className="text-xs" />}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Questions */}
      <div className="py-2 border-t border-slate-100 mt-2">
        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
          <FiInfo className="w-3 h-3" /> Suggested queries:
        </p>
        <div className="flex flex-wrap gap-1.5">
          {getSuggestedQuestions().map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(q)}
              disabled={loading}
              className="text-[11px] px-2.5 py-1 rounded-full bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 transition-colors text-left border border-slate-200"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Input Area */}
      <div className="pt-2">
        <div className="flex items-center gap-2">
          <Input.TextArea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Type your question..."
            autoSize={{ minRows: 1, maxRows: 3 }}
            disabled={loading}
            className="rounded-xl text-xs py-2"
          />
          <Button
            type="primary"
            onClick={() => handleSend()}
            disabled={!inputText.trim() || loading}
            className="bg-indigo-600 hover:bg-indigo-700 h-10 w-10 flex items-center justify-center shrink-0 rounded-xl"
            icon={<FiSend className="w-4 h-4" />}
          />
        </div>
        <p className="text-[10px] text-slate-400 text-center mt-1">
          Press Enter to send. Shift+Enter for new line.
        </p>
      </div>
    </Drawer>
  );
};

export default AIChatDrawer;
