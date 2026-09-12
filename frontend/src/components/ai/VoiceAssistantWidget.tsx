'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAIAssistant } from '../../hooks/useAIAssistant';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import {
  Mic,
  MicOff,
  Square,
  Volume2,
  VolumeX,
  X,
  Trash2,
  Send,
  Sparkles,
  ShoppingBag,
  ArrowRight,
  Plus,
  CheckCircle2,
  Store,
  ChevronDown,
  Shirt,
  Truck,
  RotateCcw,
  AlertTriangle,
  HelpCircle,
  Clock,
  User
} from 'lucide-react';

export function VoiceAssistantWidget() {
  const router = useRouter();
  const { role, isAuthenticated } = useAuth();
  const { addItem, isCartOpen, setIsCartOpen } = useCart();
  const [typedInput, setTypedInput] = useState('');
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const {
    isOpen,
    setIsOpen,
    state,
    statusMessage,
    messages,
    isVoiceMuted,
    setIsVoiceMuted,
    isAiEnabled,
    aiMode,
    studentFirstName,
    startListening,
    stopListening,
    handleStudentInput,
    clearConversation,
    liveTranscript,
    micSupported,
    micPermission,
    requestMicPermission,
  } = useAIAssistant();

  const handleMicClick = async () => {
    if (micPermission !== 'granted') {
      const granted = await requestMicPermission();
      if (granted) {
        startListening();
      }
    } else {
      startListening();
    }
  };

  // Scroll to bottom of chat automatically when new message arrives
  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, state]);

  // STRICT REQUIREMENT: Only visible to authenticated students and when AI is enabled by Admin
  if (!isAuthenticated || role !== 'STUDENT' || !isAiEnabled) {
    return null;
  }

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedInput.trim()) return;
    handleStudentInput(typedInput.trim());
    setTypedInput('');
  };

  const getStateBadge = () => {
    switch (state) {
      case 'LISTENING':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            Listening...
          </span>
        );
      case 'UNDERSTANDING':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-bounce" />
            Understanding...
          </span>
        );
      case 'WORKING':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/10 text-blue-600 border border-blue-500/20">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-spin" />
            Working...
          </span>
        );
      case 'SPEAKING':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-500/10 text-purple-600 border border-purple-500/20">
            <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
            Speaking...
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
            <span className="w-2 h-2 rounded-full bg-slate-400" />
            Ready
          </span>
        );
    }
  };

  return (
    <>
      {/* 1. FLOATING ASSISTANT TRIGGER BUTTON (Always visible for logged-in Student) */}
      {!isOpen && (
        <div className="fixed bottom-24 md:bottom-8 right-4 sm:right-6 z-40 flex items-center">
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="group flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-[#172033] to-[#243350] text-white shadow-xl hover:shadow-2xl border border-slate-700/60 transition-all duration-200 hover:scale-[1.03] active:scale-[0.98] cursor-pointer"
            aria-label="Open Campus Basket Voice Assistant"
            id="ai-assistant-trigger-button"
          >
            <div className="relative flex items-center justify-center w-7 h-7 rounded-full bg-[#4F9D2F] text-white shadow-inner group-hover:rotate-12 transition-transform">
              <Mic className="w-4 h-4" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full ring-2 ring-[#172033] animate-pulse" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-xs font-black tracking-wide text-slate-100 flex items-center gap-1">
                Ask Campus Basket
                <Sparkles className="w-3 h-3 text-[#79c35b]" />
              </span>
              <span className="text-[10px] text-slate-300 font-medium">Campus AI Voice Assistant</span>
            </div>
          </button>
        </div>
      )}

      {/* 2. COMPACT ASSISTANT PANEL (Does not obstruct screen unnecessarily) */}
      {isOpen && (
        <div className="fixed bottom-20 md:bottom-6 right-3 sm:right-6 z-50 w-[calc(100vw-24px)] sm:w-[420px] max-h-[640px] h-[86vh] bg-white rounded-3xl shadow-2xl border border-slate-200/90 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="px-4 py-3.5 bg-gradient-to-r from-[#172033] via-[#1d2a44] to-[#253759] text-white flex items-center justify-between shadow-sm shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#4F9D2F] flex items-center justify-center text-white shadow-md">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-black tracking-wide flex items-center gap-1.5 text-white">
                  Campus Basket AI
                  <span className="text-[9px] px-1.5 py-0.2 bg-[#4F9D2F]/30 text-[#8ade64] rounded font-bold uppercase tracking-wider">
                    {aiMode}
                  </span>
                </h3>
                <p className="text-[10px] text-slate-300">
                  {studentFirstName ? `Assisting ${studentFirstName}` : 'Student Voice Assistant'}
                </p>
              </div>
            </div>

            {/* Quick Utility Actions */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setIsVoiceMuted(!isVoiceMuted)}
                className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title={isVoiceMuted ? 'Unmute Voice' : 'Mute Voice'}
              >
                {isVoiceMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>

              <button
                type="button"
                onClick={clearConversation}
                className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="Clear Conversation"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => {
                  stopListening();
                  setIsOpen(false);
                }}
                className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="Close Assistant"
                id="ai-assistant-close-button"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Status Sub-bar with Indian Female Voice Badge */}
          <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-semibold text-slate-500">Assistant</span>
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
                Indian Female Voice
              </span>
            </div>
            {getStateBadge()}
          </div>

          {/* Microphone Permission Prompts & Resolution Banners */}
          {micPermission === 'denied' && (
            <div className="px-3.5 py-2.5 bg-amber-50 border-b border-amber-200 text-amber-900 flex flex-col gap-1.5 shrink-0 animate-in fade-in">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Microphone Blocked</span>
                </div>
                <button
                  type="button"
                  onClick={requestMicPermission}
                  className="px-2.5 py-1 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-bold shadow-xs transition-colors cursor-pointer shrink-0"
                >
                  Grant Permission
                </button>
              </div>
              <p className="text-[10px] text-amber-700 leading-normal">
                Click the <strong>lock / camera icon</strong> in your browser address bar (top-left), set Microphone to <strong>Allow</strong>, then tap Grant Permission.
              </p>
            </div>
          )}

          {micPermission === 'prompt' && (
            <div className="px-3.5 py-2 bg-emerald-50 border-b border-emerald-200 text-emerald-900 flex items-center justify-between gap-2 shrink-0 animate-in fade-in">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-800">
                <Mic className="w-3.5 h-3.5 text-[#4F9D2F] shrink-0" />
                <span>Microphone access required for voice</span>
              </div>
              <button
                type="button"
                onClick={requestMicPermission}
                className="px-2.5 py-1 rounded-xl bg-[#4F9D2F] hover:bg-[#438727] text-white text-[10px] font-bold shadow-xs transition-colors cursor-pointer shrink-0"
              >
                Allow Mic
              </button>
            </div>
          )}

          {/* Conversation Transcript Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#fbfcfb]">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'student' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                    msg.sender === 'student'
                      ? 'bg-[#172033] text-white rounded-tr-xs shadow-sm font-medium'
                      : 'bg-white text-slate-800 rounded-tl-xs shadow-xs border border-slate-200/80 font-normal'
                  }`}
                >
                  {msg.text}

                  {/* Inline Suggested Products Card if present */}
                  {msg.suggestedProducts && msg.suggestedProducts.length > 0 && (
                    <div className="mt-2.5 pt-2.5 border-t border-slate-100 space-y-2">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Available Options
                      </div>
                      <div className="grid grid-cols-1 gap-1.5">
                        {msg.suggestedProducts.slice(0, 3).map((prod) => (
                          <div
                            key={prod.id}
                            className="flex items-center justify-between p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-150 transition-colors text-left"
                          >
                            <div className="truncate pr-2">
                              <div className="text-[11px] font-bold text-slate-900 truncate">
                                {prod.name}
                              </div>
                              <div className="text-[10px] font-semibold text-[#4F9D2F]">
                                ₹{prod.price} <span className="text-slate-400 font-normal">/ {prod.unit}</span>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                handleStudentInput(`Add ${prod.name}`);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-[#4F9D2F] hover:bg-[#438727] text-white text-[10px] font-bold flex items-center gap-1 shrink-0 transition-colors shadow-xs"
                            >
                              <Plus className="w-3 h-3" />
                              Select
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Contextual Action Buttons */}
                  {msg.actionType === 'CANCEL_PROMPT' && (
                    <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleStudentInput('Yes, cancel it')}
                        className="px-3 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold shadow-xs transition-colors"
                      >
                        Yes, Cancel Order
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStudentInput('No, keep order')}
                        className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold transition-colors"
                      >
                        Keep Order
                      </button>
                    </div>
                  )}

                  {msg.actionType === 'LAUNDRY_BOOK' && (
                    <div className="mt-2.5 pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => router.push('/laundry/checkout')}
                        className="w-full px-3 py-1.5 rounded-xl bg-[#4F9D2F] hover:bg-[#438727] text-white text-[11px] font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                      >
                        <Shirt className="w-3.5 h-3.5" />
                        Proceed to Laundry Checkout ➔
                      </button>
                    </div>
                  )}

                  {msg.actionType === 'TRACK_ORDER' && (
                    <div className="mt-2.5 pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => router.push(`/orders/${msg.actionData?.id || ''}/track?id=${msg.actionData?.id || ''}`)}
                        className="w-full px-3 py-1.5 rounded-xl bg-[#172033] hover:bg-[#243350] text-white text-[11px] font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                      >
                        <Truck className="w-3.5 h-3.5 text-[#4F9D2F]" />
                        Open Live Order Tracking ➔
                      </button>
                    </div>
                  )}

                  {msg.actionType === 'LAUNDRY_TRACK' && (
                    <div className="mt-2.5 pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => router.push('/laundry')}
                        className="w-full px-3 py-1.5 rounded-xl bg-[#172033] hover:bg-[#243350] text-white text-[11px] font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                      >
                        <Clock className="w-3.5 h-3.5 text-blue-400" />
                        View Laundry Orders &amp; OTPs ➔
                      </button>
                    </div>
                  )}

                  {msg.actionType === 'ORDER_HISTORY' && (
                    <div className="mt-2.5 pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => router.push('/orders')}
                        className="w-full px-3 py-1.5 rounded-xl bg-[#172033] hover:bg-[#243350] text-white text-[11px] font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                      >
                        <ShoppingBag className="w-3.5 h-3.5 text-emerald-400" />
                        Open My Orders History ➔
                      </button>
                    </div>
                  )}

                  {msg.actionType === 'REFUND_VIEW' && (
                    <div className="mt-2.5 pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => router.push('/dashboard?tab=refunds')}
                        className="w-full px-3 py-1.5 rounded-xl bg-[#172033] hover:bg-[#243350] text-white text-[11px] font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                        View Refund Account Details ➔
                      </button>
                    </div>
                  )}

                  {msg.actionType === 'COMPLAINT_OPEN' && (
                    <div className="mt-2.5 pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => router.push('/dashboard?tab=support')}
                        className="w-full px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                      >
                        <AlertTriangle className="w-3.5 h-3.5 text-white" />
                        Open Support Ticket Form ➔
                      </button>
                    </div>
                  )}

                  {msg.actionType === 'PROFILE_VIEW' && (
                    <div className="mt-2.5 pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => router.push('/dashboard?tab=profile')}
                        className="w-full px-3 py-1.5 rounded-xl bg-[#172033] hover:bg-[#243350] text-white text-[11px] font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                      >
                        <User className="w-3.5 h-3.5 text-sky-400" />
                        Open Student Profile ➔
                      </button>
                    </div>
                  )}
                </div>
                <span className="text-[9px] text-slate-400 mt-1 px-1">
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}

            {/* Listening Indicator with Real-Time Live Transcript */}
            {state === 'LISTENING' && (
              <div className="flex flex-col gap-1.5 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 shadow-xs max-w-[90%] self-start animate-in fade-in duration-150">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                  <span className="text-xs font-bold text-emerald-800">
                    Listening to your voice... Speak now
                  </span>
                </div>
                {liveTranscript ? (
                  <div className="px-2.5 py-1.5 rounded-xl bg-white border border-emerald-100 text-xs text-slate-800 font-medium italic shadow-2xs">
                    &ldquo;{liveTranscript}&rdquo;
                  </div>
                ) : (
                  <p className="text-[10px] text-emerald-600">
                    Say: &ldquo;I want momo&rdquo;, &ldquo;Book laundry&rdquo;, &ldquo;Track my order&rdquo;...
                  </p>
                )}
              </div>
            )}

            {/* Speaking Audio Animation */}
            {state === 'SPEAKING' && (
              <div className="flex items-center gap-1.5 p-3 rounded-2xl bg-purple-50/80 border border-purple-200 shadow-2xs max-w-[180px]">
                <div className="w-1.5 h-3 bg-purple-600 rounded-full animate-pulse" />
                <div className="w-1.5 h-5 bg-purple-600 rounded-full animate-pulse delay-75" />
                <div className="w-1.5 h-2 bg-purple-600 rounded-full animate-pulse delay-150" />
                <div className="w-1.5 h-4 bg-purple-600 rounded-full animate-pulse delay-100" />
                <span className="text-[11px] font-bold text-purple-700 ml-1">
                  Speaking...
                </span>
              </div>
            )}

            <div ref={chatBottomRef} />
          </div>

          {/* Quick Action Suggestion Chips for ALL Student Facilities */}
          <div className="px-3 py-1.5 bg-slate-50/90 border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
            <button
              type="button"
              onClick={() => handleStudentInput('I want momo')}
              className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-700 text-[10px] font-semibold border border-slate-200 shrink-0 transition-colors cursor-pointer"
            >
              🥟 Momos
            </button>
            <button
              type="button"
              onClick={() => handleStudentInput('I want to book laundry')}
              className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-700 text-[10px] font-semibold border border-slate-200 shrink-0 transition-colors cursor-pointer"
            >
              👔 Laundry
            </button>
            <button
              type="button"
              onClick={() => handleStudentInput('Track my order')}
              className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-700 text-[10px] font-semibold border border-slate-200 shrink-0 transition-colors cursor-pointer"
            >
              🚚 Track Order
            </button>
            <button
              type="button"
              onClick={() => handleStudentInput('Show my previous orders')}
              className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-700 text-[10px] font-semibold border border-slate-200 shrink-0 transition-colors cursor-pointer"
            >
              📦 Orders
            </button>
            <button
              type="button"
              onClick={() => handleStudentInput('Show my refund details')}
              className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-700 text-[10px] font-semibold border border-slate-200 shrink-0 transition-colors cursor-pointer"
            >
              ↩ Refunds
            </button>
            <button
              type="button"
              onClick={() => handleStudentInput('I want to make a complaint')}
              className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-700 text-[10px] font-semibold border border-slate-200 shrink-0 transition-colors cursor-pointer"
            >
              ⚠️ Complaint
            </button>
            <button
              type="button"
              onClick={() => handleStudentInput('Open my profile')}
              className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-700 text-[10px] font-semibold border border-slate-200 shrink-0 transition-colors cursor-pointer"
            >
              👤 Profile
            </button>
          </div>

          {/* Status / Notice Banner */}
          {statusMessage &&
            statusMessage !== 'Ready' &&
            statusMessage !== 'Listening...' &&
            statusMessage !== 'Speaking...' &&
            statusMessage !== 'Understanding...' && (
              <div className="px-3.5 py-1.5 bg-amber-50/90 border-t border-amber-200/70 text-[11px] font-medium text-amber-800 flex items-center justify-between shrink-0">
                <span className="truncate">{statusMessage}</span>
              </div>
            )}

          {/* Bottom Interactive Controls (Mic + Text Input Fallback) */}
          <div className="p-3 bg-white border-t border-slate-200 shrink-0">
            <form onSubmit={handleSend} className="flex items-center gap-2">
              {/* Mic & Stop Buttons */}
              {state === 'LISTENING' ? (
                <button
                  type="button"
                  onClick={stopListening}
                  className="relative w-10 h-10 rounded-2xl bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shrink-0 transition-transform active:scale-95 shadow-md ring-4 ring-red-400/30 animate-pulse cursor-pointer"
                  title="Stop listening"
                >
                  <Square className="w-4 h-4 fill-white" />
                </button>
              ) : state === 'SPEAKING' ? (
                <button
                  type="button"
                  onClick={stopListening}
                  className="w-10 h-10 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center shrink-0 transition-transform active:scale-95 shadow-md cursor-pointer"
                  title="Stop speaking"
                >
                  <VolumeX className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleMicClick}
                  className="w-10 h-10 rounded-2xl bg-[#4F9D2F] hover:bg-[#438727] text-white flex items-center justify-center shrink-0 transition-transform active:scale-95 shadow-md cursor-pointer group"
                  title="Speak into Microphone"
                  id="ai-assistant-mic-button"
                >
                  <Mic className="w-5 h-5 group-hover:scale-110 transition-transform" />
                </button>
              )}

              {/* Text Input */}
              <input
                type="text"
                value={typedInput}
                onChange={(e) => setTypedInput(e.target.value)}
                placeholder="Speak or type a command..."
                className="flex-1 h-10 px-3.5 rounded-2xl bg-slate-100 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#4F9D2F]/40 focus:bg-white transition-all"
                id="ai-assistant-text-input"
              />

              {/* Send Button */}
              <button
                type="submit"
                disabled={!typedInput.trim()}
                className="w-10 h-10 rounded-2xl bg-[#172033] hover:bg-[#243350] disabled:opacity-40 disabled:hover:bg-[#172033] text-white flex items-center justify-center shrink-0 transition-colors cursor-pointer"
                title="Send Message"
                id="ai-assistant-send-button"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
