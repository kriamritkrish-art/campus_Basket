'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { Product, Order } from '../types';
import { FALLBACK_STORE_PRODUCTS, FALLBACK_PROVIDERS, ProviderInfo } from '../lib/fallbackCatalog';
import { apiRequest } from '../lib/api';

export type AssistantState = 'IDLE' | 'LISTENING' | 'UNDERSTANDING' | 'WORKING' | 'SPEAKING';

export interface ChatMessage {
  id: string;
  sender: 'student' | 'ai';
  text: string;
  timestamp: Date;
  suggestedProducts?: Product[];
  actionType?:
    | 'SEARCH'
    | 'FILTER'
    | 'CART_ADD'
    | 'CART_UPDATE'
    | 'CART_OPEN'
    | 'NAVIGATE_CHECKOUT'
    | 'ORDER_CONFIRM'
    | 'ORDER_PLACED'
    | 'CLARIFY'
    | 'LAUNDRY_BOOK'
    | 'LAUNDRY_TRACK'
    | 'TRACK_ORDER'
    | 'ORDER_HISTORY'
    | 'ORDER_DETAIL'
    | 'CANCEL_PROMPT'
    | 'CANCEL_SUCCESS'
    | 'REFUND_VIEW'
    | 'COMPLAINT_OPEN'
    | 'PROFILE_VIEW';
  actionData?: any;
}

// Helper to extract numbers (words or digits)
function parseNumberFromText(text: string): number | null {
  const digitMatch = text.match(/\b\d+\b/);
  if (digitMatch) return parseInt(digitMatch[0], 10);

  const wordMap: Record<string, number> = {
    one: 1, a: 1, an: 1, single: 1,
    two: 2, double: 2, couple: 2,
    three: 3,
    four: 4,
    five: 5,
    six: 6,
    seven: 7,
    eight: 8,
    nine: 9,
    ten: 10,
    twelve: 12,
  };

  const words = text.toLowerCase().split(/\s+/);
  for (const w of words) {
    if (wordMap[w] !== undefined) return wordMap[w];
  }
  return null;
}

// Extract ordinal index (e.g. "the second one", "first one", "third")
function parseOrdinalIndex(text: string): number | null {
  const t = text.toLowerCase();
  if (t.includes('first') || t.includes('1st')) return 0;
  if (t.includes('second') || t.includes('2nd')) return 1;
  if (t.includes('third') || t.includes('3rd')) return 2;
  if (t.includes('fourth') || t.includes('4th')) return 3;
  if (t.includes('fifth') || t.includes('5th')) return 4;
  if (t.includes('last')) return -1;
  return null;
}

export function useAIAssistant() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, role, isAuthenticated } = useAuth();
  const {
    items: cartItems,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    subtotal,
    deliveryFee,
    total,
    setIsCartOpen,
  } = useCart();

  const [isOpen, setIsOpen] = useState(false);
  const [state, setState] = useState<AssistantState>('IDLE');
  const [statusMessage, setStatusMessage] = useState<string>('Ready');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isVoiceMuted, setIsVoiceMuted] = useState(false);
  const [isAiEnabled, setIsAiEnabled] = useState(true);
  const [aiMode, setAiMode] = useState<'HYBRID' | 'UI_ONLY' | 'FULL_AI'>('HYBRID');

  // Conversational Context Memory
  const [displayedProducts, setDisplayedProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<ProviderInfo | null>(null);
  const [awaitingContext, setAwaitingContext] = useState<
    | 'NONE'
    | 'PRODUCT_CHOICE'
    | 'QUANTITY'
    | 'PROVIDER_CHOICE'
    | 'CHECKOUT_CONFIRM'
    | 'ADDRESS_CHOICE'
    | 'CANCEL_CONFIRM'
    | 'LAUNDRY_CONFIRM'
  >('NONE');

  const [pendingCancelOrderId, setPendingCancelOrderId] = useState<string | null>(null);
  const [cachedOrders, setCachedOrders] = useState<any[]>([]);
  const [cachedLaundryOrders, setCachedLaundryOrders] = useState<any[]>([]);

  const recognitionRef = useRef<any>(null);
  const hasGreetedRef = useRef<boolean>(false);
  const isSpeakingRef = useRef<boolean>(false);

  // Student first name extraction from logged in session
  const studentFirstName =
    user?.student?.fullName?.split(' ')[0] ||
    user?.username ||
    (user?.email ? user.email.split('@')[0] : null);

  // Saved student delivery address
  const getSavedAddress = useCallback(() => {
    const hall =
      typeof window !== 'undefined'
        ? localStorage.getItem('cb_selected_hall') || user?.student?.hall?.name || (user?.student as any)?.hallNumber || 'Hall 11'
        : 'Hall 11';
    const room =
      typeof window !== 'undefined'
        ? localStorage.getItem('cb_room_number') || user?.student?.roomNumber || 'Room 304'
        : 'Room 304';
    return { hall, room, fullAddress: `${hall}, ${room}` };
  }, [user]);

  // Check remote AI Agent Status from admin config
  useEffect(() => {
    if (isAuthenticated && role === 'STUDENT') {
      apiRequest('/api/ai/config')
        .then((res) => {
          if (res && res.success) {
            setIsAiEnabled(res.enabled !== false);
            if (res.mode) setAiMode(res.mode);
          }
        })
        .catch(() => {
          setIsAiEnabled(true);
        });
    }
  }, [isAuthenticated, role]);

  // Prefetch student orders in background (zero voice latency when student asks)
  useEffect(() => {
    if (isAuthenticated && role === 'STUDENT') {
      apiRequest('/api/orders')
        .then((res) => {
          if (res && res.success && Array.isArray(res.orders)) {
            setCachedOrders(res.orders);
          }
        })
        .catch(() => {});

      apiRequest('/api/laundry/orders')
        .then((res) => {
          if (res && res.success && Array.isArray(res.orders)) {
            setCachedLaundryOrders(res.orders);
          }
        })
        .catch(() => {});
    }
  }, [isAuthenticated, role]);

  // Setup Web Speech Recognition
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-IN'; // Tailored for campus students

      rec.onstart = () => {
        setState('LISTENING');
        setStatusMessage('Listening...');
      };

      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          handleStudentInput(transcript);
        }
      };

      rec.onerror = (event: any) => {
        console.warn('[AI Assistant Speech Error]', event.error);
        setState('IDLE');
        setStatusMessage('Ready');
      };

      rec.onend = () => {
        if (!isSpeakingRef.current) {
          setState('IDLE');
          setStatusMessage('Ready');
        }
      };

      recognitionRef.current = rec;
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
    };
  }, []);

  // Text-To-Speech (TTS) Voice output
  const speakVoice = useCallback(
    (text: string) => {
      if (typeof window === 'undefined' || isVoiceMuted) return;

      try {
        window.speechSynthesis.cancel();

        // Clean speech of emojis and symbols
        const cleanText = text
          .replace(/[👋🎤🛒📦₹✓↩📍🥟👔👕👖🛏️🧖🛋️⚠️🚚]/g, '')
          .replace(/[*_~`#]/g, '')
          .replace(/ABC Provider/gi, 'A B C Provider')
          .trim();

        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.lang = 'en-IN';

        utterance.onstart = () => {
          isSpeakingRef.current = true;
          setState('SPEAKING');
          setStatusMessage('Speaking...');
        };

        utterance.onend = () => {
          isSpeakingRef.current = false;
          setState('IDLE');
          setStatusMessage('Ready');
        };

        utterance.onerror = () => {
          isSpeakingRef.current = false;
          setState('IDLE');
          setStatusMessage('Ready');
        };

        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.warn('[TTS Error]', err);
        isSpeakingRef.current = false;
        setState('IDLE');
        setStatusMessage('Ready');
      }
    },
    [isVoiceMuted]
  );

  // Trigger Personalized Greeting when first opened
  useEffect(() => {
    if (isOpen && !hasGreetedRef.current) {
      hasGreetedRef.current = true;
      const greeting = studentFirstName
        ? `Hello ${studentFirstName} 👋 How can I help you today?`
        : `Hello 👋 How can I help you today?`;

      setMessages([
        {
          id: `msg_${Date.now()}`,
          sender: 'ai',
          text: greeting,
          timestamp: new Date(),
        },
      ]);
      speakVoice(greeting);
    }
  }, [isOpen, studentFirstName, speakVoice]);

  // Start Voice Recording
  const startListening = () => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch (e) {
        try {
          recognitionRef.current.stop();
          setTimeout(() => recognitionRef.current.start(), 150);
        } catch {}
      }
    } else {
      setStatusMessage('Voice recognition not supported in this browser.');
    }
  };

  // Stop Voice Recording or Speaking
  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setState('IDLE');
    setStatusMessage('Ready');
  };

  // Helper to append AI message, update status and speak
  const addAiMessage = (
    text: string,
    actionType?: ChatMessage['actionType'],
    actionData?: any
  ) => {
    const aiMsg: ChatMessage = {
      id: `msg_ai_${Date.now()}`,
      sender: 'ai',
      text,
      timestamp: new Date(),
      actionType,
      actionData,
      suggestedProducts: Array.isArray(actionData) ? actionData : undefined,
    };

    setMessages((prev) => [...prev, aiMsg]);
    setState('SPEAKING');
    setStatusMessage('Speaking...');
    speakVoice(text);
  };

  // Main Conversational NLU Logic (UI-FIRST, Multi-Facility Support)
  const handleStudentInput = async (inputText: string) => {
    const text = inputText.trim();
    if (!text) return;

    // Add student message to transcript
    const studentMsg: ChatMessage = {
      id: `msg_st_${Date.now()}`,
      sender: 'student',
      text,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, studentMsg]);

    setState('UNDERSTANDING');
    setStatusMessage('Understanding...');

    const lower = text.toLowerCase();
    const studentName = studentFirstName || '';
    const { hall: savedHall, room: savedRoom, fullAddress } = getSavedAddress();

    // ==========================================
    // 1. CONTEXTUAL REPLIES (AWAITING PROMPTS)
    // ==========================================

    // Case A: Awaiting Cancellation Confirmation
    if (awaitingContext === 'CANCEL_CONFIRM' && pendingCancelOrderId) {
      if (
        lower.includes('yes') ||
        lower.includes('cancel') ||
        lower.includes('confirm') ||
        lower.includes('sure') ||
        lower.includes('do it')
      ) {
        setState('WORKING');
        setStatusMessage('Cancelling order...');
        try {
          const res = await apiRequest(`/api/orders/${pendingCancelOrderId}/cancel`, {
            method: 'POST',
            body: JSON.stringify({ reason: 'Cancelled by student via AI Voice Assistant' }),
          });

          if (res.success) {
            addAiMessage(
              res.explanation || res.message || 'Order cancelled successfully. Any eligible refund has been initiated to your student refund account.',
              'CANCEL_SUCCESS'
            );
          } else {
            addAiMessage(res.message || 'Unable to cancel order at this stage.');
          }
        } catch (err: any) {
          addAiMessage(err.message || 'Failed to cancel order.');
        }
        setAwaitingContext('NONE');
        setPendingCancelOrderId(null);
        return;
      }

      if (lower.includes('no') || lower.includes('wait') || lower.includes('keep') || lower.includes('stop')) {
        addAiMessage('Order cancellation aborted. Your order remains active and safe.');
        setAwaitingContext('NONE');
        setPendingCancelOrderId(null);
        return;
      }
    }

    // Case B: Awaiting Order Placement Confirmation
    if (awaitingContext === 'CHECKOUT_CONFIRM') {
      if (
        lower.includes('yes') ||
        lower.includes('confirm') ||
        lower.includes('place') ||
        lower.includes('order') ||
        lower.includes('sure') ||
        lower.includes('do it')
      ) {
        setState('WORKING');
        setStatusMessage('Working...');

        if (pathname !== '/checkout') {
          router.push('/checkout');
        }

        // Trigger order placement via standard campus checkout mechanism
        setTimeout(() => {
          const checkoutBtn = document.querySelector('button[type="submit"]') as HTMLButtonElement;
          if (checkoutBtn && !checkoutBtn.disabled) {
            checkoutBtn.click();
          }
        }, 800);

        const aiReply = `Placing your order now using your saved delivery address: ${fullAddress}. Your order is being confirmed via Campus Basket!`;
        addAiMessage(aiReply, 'ORDER_PLACED');
        setAwaitingContext('NONE');
        return;
      }

      if (
        lower.includes('no') ||
        lower.includes('wait') ||
        lower.includes('stop') ||
        lower.includes('change') ||
        lower.includes('not this') ||
        lower.includes('cancel')
      ) {
        addAiMessage(`No problem. What would you like instead?`);
        setAwaitingContext('NONE');
        return;
      }
    }

    // Case C: Awaiting Quantity for Selected Product
    if (awaitingContext === 'QUANTITY' && selectedProduct) {
      const qty = parseNumberFromText(lower);
      if (qty && qty > 0) {
        addItem(selectedProduct, qty, false);
        const providerName = selectedProvider ? selectedProvider.name : 'Campus Basket';
        const aiReply = `You have ${qty} ${selectedProduct.name} from ${providerName}. Would you like to continue to checkout?`;
        addAiMessage(aiReply, 'CART_ADD', { product: selectedProduct, quantity: qty });
        setAwaitingContext('CHECKOUT_CONFIRM');
        return;
      }
    }

    // Case D: Awaiting Product Choice between options (e.g. "Veg" or "Chicken")
    if (awaitingContext === 'PRODUCT_CHOICE' && displayedProducts.length > 0) {
      let chosen: Product | undefined;
      const ordinalIdx = parseOrdinalIndex(lower);

      if (ordinalIdx !== null) {
        chosen =
          ordinalIdx === -1
            ? displayedProducts[displayedProducts.length - 1]
            : displayedProducts[ordinalIdx];
      } else if (lower.includes('chicken')) {
        chosen = displayedProducts.find((p) => p.name.toLowerCase().includes('chicken'));
      } else if (lower.includes('veg') && !lower.includes('non-veg')) {
        chosen = displayedProducts.find((p) => p.name.toLowerCase().includes('veg'));
      } else {
        chosen = displayedProducts.find((p) =>
          lower.split(' ').some((w) => p.name.toLowerCase().includes(w))
        );
      }

      if (chosen) {
        setSelectedProduct(chosen);
        const aiReply = `How many plates would you like?`;
        addAiMessage(aiReply, 'CLARIFY', { product: chosen });
        setAwaitingContext('QUANTITY');
        return;
      }
    }

    // ==========================================
    // 2. LAUNDRY SUPPORT (FULL FACILITY CONTROL)
    // ==========================================
    if (
      lower.includes('laundry') ||
      lower.includes('clothes') ||
      lower.includes('dhobi') ||
      lower.includes('wash clothes') ||
      lower.includes('wash shirts') ||
      lower.includes('steam press')
    ) {
      // 2A. Track Laundry
      if (lower.includes('track') || lower.includes('status') || lower.includes('where')) {
        setState('WORKING');
        setStatusMessage('Checking laundry status...');

        let laundryOrders = cachedLaundryOrders;
        if (laundryOrders.length === 0) {
          try {
            const res = await apiRequest('/api/laundry/orders');
            if (res.success && Array.isArray(res.orders)) {
              laundryOrders = res.orders;
              setCachedLaundryOrders(res.orders);
            }
          } catch {}
        }

        const activeJob = laundryOrders.find(
          (j: any) => !['COMPLETED', 'CANCELLED'].includes(j.status)
        );

        if (activeJob) {
          const otpInfo = activeJob.pickupOtp
            ? ` Pickup OTP: ${activeJob.pickupOtp}.`
            : activeJob.deliveryOtp
            ? ` Delivery OTP: ${activeJob.deliveryOtp}.`
            : '';

          const aiReply = `Your laundry booking #${activeJob.orderNumber || activeJob.trackingNumber} is currently ${activeJob.status.replace(/_/g, ' ')}.${otpInfo} Opening laundry order details for you!`;
          router.push('/laundry');
          addAiMessage(aiReply, 'LAUNDRY_TRACK', activeJob);
          return;
        } else if (laundryOrders.length > 0) {
          const lastJob = laundryOrders[0];
          const aiReply = `Your previous laundry booking #${lastJob.orderNumber || lastJob.trackingNumber} was completed. Opening your laundry orders history.`;
          router.push('/laundry');
          addAiMessage(aiReply, 'LAUNDRY_TRACK', lastJob);
          return;
        } else {
          const aiReply = `You have no active laundry bookings. Would you like to schedule a room pickup now?`;
          router.push('/laundry/book');
          addAiMessage(aiReply, 'LAUNDRY_BOOK');
          return;
        }
      }

      // 2B. Laundry Complaint / Issue
      if (lower.includes('complaint') || lower.includes('complain') || lower.includes('late') || lower.includes('lost') || lower.includes('damaged')) {
        const aiReply = `I'm sorry about the laundry issue. I'm opening the Campus Laundry complaint section so you can submit your issue directly to the supervisor.`;
        router.push('/laundry');
        addAiMessage(aiReply, 'COMPLAINT_OPEN');
        return;
      }

      // 2C. Book Laundry with Garment Selection (e.g. "Book laundry for 5 shirts")
      const qty = parseNumberFromText(lower) || 5;
      let garmentType = 'Shirt';
      if (lower.includes('pant')) garmentType = 'Pants';
      if (lower.includes('jean')) garmentType = 'Jeans';
      if (lower.includes('t-shirt') || lower.includes('tshirt')) garmentType = 'T-Shirt';
      if (lower.includes('towel')) garmentType = 'Towel';
      if (lower.includes('bedsheet')) garmentType = 'Bedsheet';

      const unitRate = garmentType === 'Jeans' ? 25 : garmentType === 'Pants' ? 20 : 15;
      const sub = unitRate * qty;
      const totalAmount = sub + qty * 1; // + ₹1 service fee per garment

      // Set identical address and draft across entire booking & tracking flow
      const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
      const laundryDraft = {
        items: [{ itemType: garmentType, quantity: qty, unitPrice: unitRate }],
        hallName: savedHall,
        roomNumber: savedRoom,
        pickupDate: tomorrow,
        preferredPickupTime: '08:00 AM - 10:00 AM (Morning Slot)',
        preferredReturnTime: 'Tomorrow • 05:00 PM - 07:00 PM (24h Express)',
        clothPhotos: []
      };

      if (typeof window !== 'undefined') {
        localStorage.setItem('cb_laundry_draft', JSON.stringify(laundryDraft));
      }

      const aiReply = `Sure ${studentName}. I have prepared a laundry booking for ${qty} ${garmentType}s (₹${totalAmount} total) using your saved address: ${fullAddress}. Opening Laundry checkout for you to review!`;
      router.push('/laundry/checkout');
      addAiMessage(aiReply, 'LAUNDRY_BOOK', laundryDraft);
      return;
    }

    // ==========================================
    // 3. ORDER TRACKING & "WHERE IS MY ORDER"
    // ==========================================
    if (
      lower.includes('track') ||
      lower.includes('where is my order') ||
      lower.includes('status of my order') ||
      lower.includes('live tracking') ||
      lower.includes('track my order')
    ) {
      setState('WORKING');
      setStatusMessage('Finding active orders...');

      let ordersList = cachedOrders;
      if (ordersList.length === 0) {
        try {
          const res = await apiRequest('/api/orders');
          if (res.success && Array.isArray(res.orders)) {
            ordersList = res.orders;
            setCachedOrders(res.orders);
          }
        } catch {}
      }

      const ACTIVE_STATUSES = [
        'PENDING', 'PENDING_PAYMENT', 'CONFIRMED', 'ACCEPTED',
        'PREPARING', 'READY', 'READY_FOR_PICKUP', 'DELIVERY_ASSIGNED',
        'PICKED_UP', 'OUT_FOR_DELIVERY'
      ];

      const activeOrder = ordersList.find((o) => ACTIVE_STATUSES.includes(o.status));

      if (activeOrder) {
        const itemNames = activeOrder.items?.map((i: any) => i.productName || i.name).join(', ') || 'Campus items';
        const aiReply = `Your order #${activeOrder.orderNumber} (${itemNames}) is currently ${activeOrder.status.replace(/_/g, ' ')}. Opening live tracking for you!`;
        router.push(`/orders/${activeOrder.id}/track?id=${activeOrder.id}`);
        addAiMessage(aiReply, 'TRACK_ORDER', activeOrder);
        return;
      } else if (ordersList.length > 0) {
        const lastOrder = ordersList[0];
        const aiReply = `Your latest order #${lastOrder.orderNumber} is marked as ${lastOrder.status.replace(/_/g, ' ')}. Opening order details.`;
        router.push(`/orders/${lastOrder.id}/track?id=${lastOrder.id}`);
        addAiMessage(aiReply, 'TRACK_ORDER', lastOrder);
        return;
      } else {
        addAiMessage(`You have no orders yet. Would you like to check out today's food menu?`);
        return;
      }
    }

    // ==========================================
    // 4. ORDER CANCELLATION
    // ==========================================
    if (lower.includes('cancel order') || lower.includes('cancel my order')) {
      setState('WORKING');
      setStatusMessage('Checking cancellation eligibility...');

      let ordersList = cachedOrders;
      if (ordersList.length === 0) {
        try {
          const res = await apiRequest('/api/orders');
          if (res.success && Array.isArray(res.orders)) {
            ordersList = res.orders;
            setCachedOrders(res.orders);
          }
        } catch {}
      }

      const activeOrder = ordersList.find(
        (o) => !['DELIVERED', 'CANCELLED', 'REFUNDED'].includes(o.status)
      );

      if (!activeOrder) {
        addAiMessage(`You don't have an active order that can be cancelled.`);
        return;
      }

      // Check cancellation eligibility
      const allowedCancellationStatuses = ['PENDING', 'PENDING_PAYMENT', 'CONFIRMED', 'ACCEPTED'];
      if (!allowedCancellationStatuses.includes(activeOrder.status)) {
        addAiMessage(
          `Order #${activeOrder.orderNumber} is already in the ${activeOrder.status.replace(/_/g, ' ')} stage. Per Campus Basket policy, orders cannot be cancelled once food preparation or delivery dispatch has begun.`
        );
        return;
      }

      // Eligible: Must ask for explicit confirmation before irreversible action
      setPendingCancelOrderId(activeOrder.id);
      setAwaitingContext('CANCEL_CONFIRM');
      addAiMessage(
        `Are you sure you want to cancel Order #${activeOrder.orderNumber} (Total: ₹${activeOrder.totalAmount})? Say 'Yes, cancel it' to confirm cancellation.`,
        'CANCEL_PROMPT',
        activeOrder
      );
      return;
    }

    // ==========================================
    // 5. ORDER HISTORY & DETAILS
    // ==========================================
    if (
      lower.includes('order history') ||
      lower.includes('previous orders') ||
      lower.includes('past orders') ||
      lower.includes('my orders') ||
      lower.includes('show my orders')
    ) {
      router.push('/orders');
      const count = cachedOrders.length;
      const aiReply = `Opening your Order History. You have placed ${count > 0 ? count : ''} orders with Campus Basket.`;
      addAiMessage(aiReply, 'ORDER_HISTORY');
      return;
    }

    if (
      lower.includes('what did i order') ||
      lower.includes('latest order') ||
      lower.includes('last order') ||
      lower.includes('order details')
    ) {
      let ordersList = cachedOrders;
      if (ordersList.length === 0) {
        try {
          const res = await apiRequest('/api/orders');
          if (res.success && Array.isArray(res.orders)) {
            ordersList = res.orders;
            setCachedOrders(res.orders);
          }
        } catch {}
      }

      if (ordersList.length > 0) {
        const latest = ordersList[0];
        const itemsText = latest.items?.map((i: any) => `${i.quantity}x ${i.productName || i.name}`).join(', ') || 'items';
        const aiReply = `Your latest order #${latest.orderNumber} contains ${itemsText} totaling ₹${latest.totalAmount} (Status: ${latest.status.replace(/_/g, ' ')}). Opening full details!`;
        router.push(`/orders/${latest.id}/track?id=${latest.id}`);
        addAiMessage(aiReply, 'ORDER_DETAIL', latest);
        return;
      } else {
        addAiMessage(`You haven't placed any orders yet. What would you like to order today?`);
        return;
      }
    }

    // ==========================================
    // 6. REFUND & REFUND ACCOUNT DETAILS
    // ==========================================
    if (
      lower.includes('refund') ||
      lower.includes('refund details') ||
      lower.includes('refund account') ||
      lower.includes('where is my refund')
    ) {
      router.push('/dashboard?tab=refunds');
      addAiMessage(
        `Opening your Refund & Cancellations section. Approved refunds are credited directly to your saved student refund account or UPI within 24–48 hours per platform policy.`,
        'REFUND_VIEW'
      );
      return;
    }

    // ==========================================
    // 7. COMPLAINTS & SUPPORT
    // ==========================================
    if (
      lower.includes('complaint') ||
      lower.includes('complain') ||
      lower.includes('support') ||
      lower.includes('report an issue') ||
      lower.includes('help ticket')
    ) {
      router.push('/dashboard?tab=support');
      addAiMessage(
        `I'm opening the Campus Support and Complaints portal so you can submit your issue directly to campus administration.`,
        'COMPLAINT_OPEN'
      );
      return;
    }

    // ==========================================
    // 8. PROFILE & ACCOUNT NAVIGATION
    // ==========================================
    if (
      lower.includes('profile') ||
      lower.includes('my account') ||
      lower.includes('my room') ||
      lower.includes('my hostel')
    ) {
      router.push('/dashboard?tab=profile');
      addAiMessage(
        `Opening your Student Profile. You are currently registered in ${fullAddress}.`,
        'PROFILE_VIEW'
      );
      return;
    }

    // ==========================================
    // 9. ADDRESS & ROOM NUMBER
    // ==========================================
    if (lower.includes('address') || lower.includes('saved address')) {
      addAiMessage(`Using your saved campus delivery address: ${fullAddress}. Ready for room delivery!`);
      return;
    }

    // ==========================================
    // 10. QUANTITY MODIFICATIONS ON ACTIVE CART
    // ==========================================
    if (
      lower.includes('make it') ||
      lower.includes('actually make it') ||
      lower.includes('change to') ||
      lower.includes('add one more') ||
      lower.includes('add two more') ||
      lower.includes('remove one')
    ) {
      const targetItem =
        (selectedProduct && cartItems.find((i) => i.productId === selectedProduct.id)) ||
        cartItems[cartItems.length - 1];

      if (!targetItem) {
        addAiMessage(`Your cart is currently empty. What would you like to add?`);
        return;
      }

      if (lower.includes('add one more')) {
        updateQuantity(targetItem.productId, targetItem.quantity + 1);
        addAiMessage(`Added one more. You now have ${targetItem.quantity + 1} ${targetItem.name}.`, 'CART_UPDATE');
        return;
      }

      if (lower.includes('remove one')) {
        const nextQty = targetItem.quantity - 1;
        if (nextQty <= 0) {
          removeItem(targetItem.productId);
          addAiMessage(`Removed ${targetItem.name} from your cart.`, 'CART_UPDATE');
        } else {
          updateQuantity(targetItem.productId, nextQty);
          addAiMessage(`Removed one. You now have ${nextQty} ${targetItem.name}.`, 'CART_UPDATE');
        }
        return;
      }

      const newQty = parseNumberFromText(lower);
      if (newQty && newQty > 0) {
        updateQuantity(targetItem.productId, newQty);
        addAiMessage(`Updated quantity to ${newQty} ${targetItem.name} in your cart.`, 'CART_UPDATE');
        return;
      }
    }

    // ==========================================
    // 11. CART VIEW & CLEAR
    // ==========================================
    if (
      lower.includes('open cart') ||
      lower.includes('show cart') ||
      lower.includes('view basket') ||
      lower.includes('show my basket') ||
      lower.includes("what's in my cart") ||
      lower.includes('view cart')
    ) {
      setIsCartOpen(true);
      if (cartItems.length === 0) {
        addAiMessage(`Your cart is currently empty. Would you like to check out today's food menu?`, 'CART_OPEN');
      } else {
        const itemSummary = cartItems.map((i) => `${i.quantity}x ${i.name}`).join(', ');
        addAiMessage(
          `Your cart has ${itemSummary} (Total: ₹${total.toFixed(0)}). Would you like to continue to checkout?`,
          'CART_OPEN'
        );
        setAwaitingContext('CHECKOUT_CONFIRM');
      }
      return;
    }

    if (lower.includes('clear cart') || lower.includes('empty basket')) {
      clearCart();
      addAiMessage(`Your cart has been cleared. What would you like to order instead?`);
      return;
    }

    // ==========================================
    // 12. CHECKOUT & FINAL CONFIRMATION
    // ==========================================
    if (
      lower.includes('checkout') ||
      lower.includes('go to checkout') ||
      lower.includes('proceed to checkout') ||
      lower.includes('place order') ||
      lower.includes('place it')
    ) {
      if (cartItems.length === 0) {
        addAiMessage(`Your cart is empty. Please add items before going to checkout.`);
        return;
      }

      const itemsDesc = cartItems.map((i) => `${i.quantity} ${i.name}`).join(', ');
      const aiReply = `Your cart contains ${itemsDesc}. Your total is ₹${total.toFixed(
        0
      )}. Would you like me to place the order?`;

      if (pathname !== '/checkout') {
        router.push('/checkout');
      }

      addAiMessage(aiReply, 'NAVIGATE_CHECKOUT');
      setAwaitingContext('CHECKOUT_CONFIRM');
      return;
    }

    // ==========================================
    // 13. PROVIDER SPECIFIC FILTERING (e.g. "I want ABC provider")
    // ==========================================
    const matchedProv = FALLBACK_PROVIDERS.find(
      (p) => lower.includes(p.shortName.toLowerCase()) || lower.includes(p.name.toLowerCase())
    );

    if (matchedProv && (lower.includes('provider') || lower.includes('from') || lower.includes('show'))) {
      setSelectedProvider(matchedProv);
      filterProductsByProvider(matchedProv);
      return;
    }

    // ==========================================
    // 14. CHEAPEST ITEM LOOKUP
    // ==========================================
    if (lower.includes('cheapest') || lower.includes('lowest price')) {
      const pool = displayedProducts.length > 0 ? displayedProducts : FALLBACK_STORE_PRODUCTS;
      const sorted = [...pool].sort((a, b) => a.price - b.price);
      const cheapest = sorted[0];
      if (cheapest) {
        setSelectedProduct(cheapest);
        setDisplayedProducts([cheapest]);
        addAiMessage(
          `The cheapest option is ${cheapest.name} at ₹${cheapest.price}. Would you like me to add it to your basket?`,
          'SEARCH',
          cheapest
        );
        setAwaitingContext('QUANTITY');
        return;
      }
    }

    // ==========================================
    // 15. PRODUCT SEARCH & MATCHING (LOCAL UI FIRST)
    // ==========================================
    const keywords = ['momo', 'biryani', 'curry', 'paneer', 'samosa', 'roll', 'dosa', 'paper', 'pen', 'apple', 'fruit', 'snack', 'tea', 'coffee'];
    const matchedKeyword = keywords.find((k) => lower.includes(k));

    let matched: Product[] = [];

    if (matchedKeyword) {
      matched = FALLBACK_STORE_PRODUCTS.filter(
        (p) =>
          p.name.toLowerCase().includes(matchedKeyword) ||
          p.description.toLowerCase().includes(matchedKeyword) ||
          (p.tags && p.tags.toLowerCase().includes(matchedKeyword))
      );
    } else {
      const tokens = lower
        .replace(/^(i want|find|show me|search for|give me|add|order|get)\s+/i, '')
        .trim()
        .split(/\s+/);

      matched = FALLBACK_STORE_PRODUCTS.filter((p) => {
        const pName = p.name.toLowerCase();
        const pTags = (p.tags || '').toLowerCase();
        return tokens.some((tok) => tok.length > 2 && (pName.includes(tok) || pTags.includes(tok)));
      });
    }

    if (matched.length > 0) {
      setDisplayedProducts(matched);

      const quantityFound = parseNumberFromText(lower);
      const chickenSpecific = matched.find((p) => p.name.toLowerCase().includes('chicken'));
      const vegSpecific = matched.find((p) => p.name.toLowerCase().includes('veg'));

      if (quantityFound && chickenSpecific && lower.includes('chicken')) {
        setSelectedProduct(chickenSpecific);
        addItem(chickenSpecific, quantityFound, false);
        addAiMessage(
          `Added ${quantityFound} ${chickenSpecific.name} to your cart. Would you like to continue to checkout?`,
          'CART_ADD',
          chickenSpecific
        );
        setAwaitingContext('CHECKOUT_CONFIRM');
        return;
      }

      if (quantityFound && vegSpecific && lower.includes('veg') && !lower.includes('non-veg')) {
        setSelectedProduct(vegSpecific);
        addItem(vegSpecific, quantityFound, false);
        addAiMessage(
          `Added ${quantityFound} ${vegSpecific.name} to your cart. Would you like to continue to checkout?`,
          'CART_ADD',
          vegSpecific
        );
        setAwaitingContext('CHECKOUT_CONFIRM');
        return;
      }

      if (matched.length > 1) {
        const prefix = studentName ? `Sure ${studentName}. ` : 'Sure. ';
        const optionsList = matched
          .slice(0, 3)
          .map((p) => `${p.name} for ₹${p.price}`)
          .join(' and ');

        const aiReply = `${prefix}I found ${matched.length} options: ${optionsList}. Which one would you prefer?`;
        addAiMessage(aiReply, 'SEARCH', matched);
        setAwaitingContext('PRODUCT_CHOICE');
        return;
      }

      const single = matched[0];
      setSelectedProduct(single);
      const aiReply = `${single.name} is available for ₹${single.price}. How many would you like?`;
      addAiMessage(aiReply, 'SEARCH', [single]);
      setAwaitingContext('QUANTITY');
      return;
    }

    // ==========================================
    // 16. HYBRID / SERVER BACKEND FALLBACK
    // ==========================================
    if (aiMode === 'HYBRID' || aiMode === 'FULL_AI') {
      try {
        const res = await apiRequest('/api/ai/query', {
          method: 'POST',
          body: JSON.stringify({ message: text, studentName }),
        });

        if (res.success && res.matchedProducts && res.matchedProducts.length > 0) {
          setDisplayedProducts(res.matchedProducts);
          const first = res.matchedProducts[0];
          setSelectedProduct(first);
          addAiMessage(
            `I found ${first.name} for ₹${first.price}. How many plates would you like?`,
            'SEARCH',
            res.matchedProducts
          );
          setAwaitingContext('QUANTITY');
          return;
        } else if (res.mode === 'UI_ONLY') {
          setAiMode('UI_ONLY');
        }
      } catch {}
    }

    // Not Found fallback
    addAiMessage(
      `I couldn't find that item in Campus Basket. I can help you with Food & Momos, Express Laundry, Order Tracking, Order History, Refunds, or Complaints. What would you like?`
    );
  };

  // Helper to filter and report products by provider
  const filterProductsByProvider = (provider: ProviderInfo) => {
    const providerProducts = FALLBACK_STORE_PRODUCTS.filter(
      (p) => p.providerId === provider.id || p.tags?.toLowerCase().includes(provider.shortName.toLowerCase())
    );

    if (providerProducts.length > 0) {
      setDisplayedProducts(providerProducts);
      const desc = providerProducts.map((p) => `${p.name} for ₹${p.price}`).join(' and ');
      const aiReply = `${provider.shortName} has ${desc}. Which one would you like?`;
      addAiMessage(aiReply, 'FILTER', providerProducts);
      setAwaitingContext('PRODUCT_CHOICE');
    } else {
      addAiMessage(
        `That provider doesn't currently have this item available. Would you like another provider?`
      );
    }
  };

  // Reset/Clear conversation
  const clearConversation = () => {
    setMessages([]);
    hasGreetedRef.current = false;
    setSelectedProduct(null);
    setSelectedProvider(null);
    setDisplayedProducts([]);
    setAwaitingContext('NONE');
    setPendingCancelOrderId(null);
    stopListening();
  };

  return {
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
    displayedProducts,
    selectedProduct,
  };
}
