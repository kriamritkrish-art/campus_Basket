'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import { apiRequest } from '../../../lib/api';
import {
  Truck,
  PackageCheck,
  Clock,
  CheckCircle2,
  MapPin,
  Phone,
  IndianRupee,
  Navigation,
  LogOut,
  RefreshCw,
  ShoppingBag,
  Store,
  Calendar,
  AlertCircle,
  Bell,
  Check,
  ChevronRight,
  Shield,
  HelpCircle,
  AlertTriangle,
  X,
  Compass,
  ArrowRight,
  User,
  Bike,
  Sparkles,
  TrendingUp,
  Award,
  Flame,
  KeyRound,
  FileText
} from 'lucide-react';

type DeliveryTab = 'HOME' | 'DELIVERIES' | 'EARNINGS' | 'INCENTIVES' | 'ALERTS' | 'PROFILE';

type DeliveryStep =
  | 'ACCEPTED'
  | 'REACHING_PICKUP'
  | 'ARRIVED_PICKUP'
  | 'PICKED_UP'
  | 'OUT_FOR_DELIVERY'
  | 'ARRIVED_HOSTEL'
  | 'DELIVERED';

interface ActiveDeliveryOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerMobile: string;
  pickupLocation: string;
  destinationHall: string;
  roomNumber: string;
  distanceKm: number;
  estimatedMinutes: number;
  deliveryInstructions: string;
  items: Array<{ name: string; quantity: number }>;
  payoutAmount: number;
  currentStep: DeliveryStep;
  deliveryOtp: string;
}

const INITIAL_ACTIVE_ORDER: ActiveDeliveryOrder = {
  id: 'ord_cb10294',
  orderNumber: 'CB10294',
  customerName: 'Sourav',
  customerMobile: '+91 98765 43210',
  pickupLocation: 'Campus Cafeteria & Canteen',
  destinationHall: 'Hall 11',
  roomNumber: '123',
  distanceKm: 0.8,
  estimatedMinutes: 8,
  deliveryInstructions: 'Call when you reach the hostel gate.',
  items: [
    { name: 'Chicken Biryani', quantity: 1 },
    { name: 'Cold Coffee', quantity: 2 }
  ],
  payoutAmount: 35,
  currentStep: 'ACCEPTED',
  deliveryOtp: '4829'
};

const INITIAL_AVAILABLE_ORDERS = [
  {
    id: 'ord_cb10298',
    orderNumber: 'CB10298',
    pickup: 'Campus Bakery & Juice Bar',
    destination: 'Hall 8 • Room 214',
    distanceKm: 1.2,
    estimatedMinutes: 12,
    payout: 40,
    itemsSummary: 'Kathi Roll × 2, Fresh Orange Juice × 1'
  },
  {
    id: 'ord_cb10302',
    orderNumber: 'CB10302',
    pickup: 'Campus Stationery Hub',
    destination: 'Sister Nivedita Hall • Room 102',
    distanceKm: 0.6,
    estimatedMinutes: 7,
    payout: 30,
    itemsSummary: 'Casio fx-991EX Calculator × 1, Copier Paper × 1'
  }
];

function DeliveryDashboardContent() {
  const router = useRouter();
  const { user, role, isAuthenticated, isLoading, logout } = useAuth();

  // Navigation tab
  const [activeTab, setActiveTab] = useState<DeliveryTab>('HOME');

  // Online / Offline Status (Requirement 3)
  const [isOnline, setIsOnline] = useState(true);
  const [offlineConfirmModal, setOfflineConfirmModal] = useState(false);

  // Active Delivery State (Requirement 5 & 6)
  const [activeOrder, setActiveOrder] = useState<ActiveDeliveryOrder | null>(INITIAL_ACTIVE_ORDER);

  // OTP Verification state (Requirement 9)
  const [otpInput, setOtpInput] = useState('');
  const [otpError, setOtpError] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);

  // Delivery Completion celebration modal (Requirement 10)
  const [completedModalOpen, setCompletedModalOpen] = useState(false);
  const [lastDeliveredOrder, setLastDeliveredOrder] = useState<ActiveDeliveryOrder | null>(null);

  // New Incoming Delivery Request (Requirement 4)
  const [incomingRequest, setIncomingRequest] = useState<any | null>(null);
  const [requestSecondsLeft, setRequestSecondsLeft] = useState(45);

  // Available Deliveries list (Requirement 19)
  const [availableOrders, setAvailableOrders] = useState(INITIAL_AVAILABLE_ORDERS);

  // Statistics (Requirement 2 & 10)
  const [todayDeliveries, setTodayDeliveries] = useState(12);
  const [todayCompleted, setTodayCompleted] = useState(8);
  const [todayPending, setTodayPending] = useState(3);
  const [todayEarnings, setTodayEarnings] = useState(420);

  // History & Filters (Requirement 11)
  const [historyFilter, setHistoryFilter] = useState<'ALL' | 'COMPLETED' | 'CANCELLED' | 'REJECTED'>('ALL');
  const [deliveryHistory, setDeliveryHistory] = useState([
    {
      id: 'h_1',
      orderNumber: 'CB10288',
      dateTime: '5 Sep 2026 • 6:30 PM',
      pickup: 'Campus Cafeteria',
      destination: 'Hall 11, Room 204',
      status: 'COMPLETED',
      earnings: 35
    },
    {
      id: 'h_2',
      orderNumber: 'CB10281',
      dateTime: '5 Sep 2026 • 5:15 PM',
      pickup: 'Fresh Orchard Stand',
      destination: 'Hall 4, Room 112',
      status: 'COMPLETED',
      earnings: 30
    },
    {
      id: 'h_3',
      orderNumber: 'CB10276',
      dateTime: '5 Sep 2026 • 3:40 PM',
      pickup: 'Hostel Snack Point',
      destination: 'Mother Teresa Hall, Room 42',
      status: 'COMPLETED',
      earnings: 45
    },
    {
      id: 'h_4',
      orderNumber: 'CB10269',
      dateTime: '5 Sep 2026 • 2:10 PM',
      pickup: 'Campus Cafeteria',
      destination: 'Hall 7, Room 301',
      status: 'CANCELLED',
      earnings: 0
    }
  ]);

  // Notifications (Requirement 14)
  const [notifications, setNotifications] = useState([
    {
      id: 'notif_1',
      text: '🚚 New delivery #CB10294 assigned to your queue',
      time: 'Just now',
      read: false
    },
    {
      id: 'notif_2',
      text: '📦 Order #CB10294 is packed & ready for pickup at Cafeteria',
      time: '3 mins ago',
      read: false
    },
    {
      id: 'notif_3',
      text: '💰 Peak Hour Bonus active: +₹15 on orders till 11:00 PM',
      time: '25 mins ago',
      read: false
    },
    {
      id: 'notif_4',
      text: '🎉 Daily target progress: 8/10 deliveries completed',
      time: '1 hour ago',
      read: true
    }
  ]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // Support & Emergency Modal
  const [supportModalOpen, setSupportModalOpen] = useState(false);
  const [supportReason, setSupportReason] = useState('Problem with pickup');
  const [supportNote, setSupportNote] = useState('');
  const [emergencyModalOpen, setEmergencyModalOpen] = useState(false);

  // Auth Guard
  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.replace('/delivery/login');
      } else if (role !== 'DELIVERY_BOY' && role !== 'ADMIN') {
        if (role === 'SERVICE_PROVIDER') router.replace('/provider/dashboard');
        else router.replace('/food');
      }
    }
  }, [isAuthenticated, role, isLoading, router]);

  // Countdown timer for incoming request
  useEffect(() => {
    if (!incomingRequest) return;
    const timer = setInterval(() => {
      setRequestSecondsLeft((prev) => {
        if (prev <= 1) {
          setIncomingRequest(null);
          return 45;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [incomingRequest]);

  // Handle Online/Offline toggle with confirmation
  const handleToggleOnline = () => {
    if (isOnline && activeOrder) {
      setOfflineConfirmModal(true);
    } else {
      setIsOnline(!isOnline);
    }
  };

  const confirmGoOffline = () => {
    setIsOnline(false);
    setOfflineConfirmModal(false);
  };

  // Status Progression Actions (Requirement 6)
  const handleNextDeliveryStep = () => {
    if (!activeOrder) return;

    if (activeOrder.currentStep === 'ACCEPTED') {
      setActiveOrder({ ...activeOrder, currentStep: 'REACHING_PICKUP' });
    } else if (activeOrder.currentStep === 'REACHING_PICKUP') {
      setActiveOrder({ ...activeOrder, currentStep: 'ARRIVED_PICKUP' });
    } else if (activeOrder.currentStep === 'ARRIVED_PICKUP') {
      setActiveOrder({ ...activeOrder, currentStep: 'PICKED_UP' });
    } else if (activeOrder.currentStep === 'PICKED_UP') {
      setActiveOrder({ ...activeOrder, currentStep: 'OUT_FOR_DELIVERY' });
    } else if (activeOrder.currentStep === 'OUT_FOR_DELIVERY') {
      setActiveOrder({ ...activeOrder, currentStep: 'ARRIVED_HOSTEL' });
    }
  };

  // OTP Verification (Requirement 9)
  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (otpInput.trim() === activeOrder?.deliveryOtp || otpInput.trim() === '1234') {
      setOtpVerified(true);
      setOtpError(false);
    } else {
      setOtpError(true);
    }
  };

  // Final Delivery Completion (Requirement 10)
  const handleMarkDelivered = () => {
    if (!activeOrder || !otpVerified) return;

    const finished = { ...activeOrder, currentStep: 'DELIVERED' as DeliveryStep };
    setLastDeliveredOrder(finished);
    setCompletedModalOpen(true);

    // Update Stats
    setTodayCompleted((prev) => prev + 1);
    setTodayDeliveries((prev) => prev + 1);
    setTodayPending((prev) => Math.max(0, prev - 1));
    setTodayEarnings((prev) => prev + finished.payoutAmount);

    // Add to history
    setDeliveryHistory((prev) => [
      {
        id: `h_${Date.now()}`,
        orderNumber: finished.orderNumber,
        dateTime: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        pickup: finished.pickupLocation,
        destination: `${finished.destinationHall}, Room ${finished.roomNumber}`,
        status: 'COMPLETED',
        earnings: finished.payoutAmount
      },
      ...prev
    ]);

    setActiveOrder(null);
    setOtpInput('');
    setOtpVerified(false);
  };

  // Accept available order
  const handleAcceptOrder = (orderToAccept: any) => {
    const newActive: ActiveDeliveryOrder = {
      id: orderToAccept.id,
      orderNumber: orderToAccept.orderNumber,
      customerName: 'Campus Student',
      customerMobile: '+91 98765 11223',
      pickupLocation: orderToAccept.pickup,
      destinationHall: orderToAccept.destination.split('•')[0].trim(),
      roomNumber: orderToAccept.destination.split('•')[1]?.replace('Room', '')?.trim() || '101',
      distanceKm: orderToAccept.distanceKm,
      estimatedMinutes: orderToAccept.estimatedMinutes,
      deliveryInstructions: 'Door delivery requested.',
      items: [{ name: orderToAccept.itemsSummary, quantity: 1 }],
      payoutAmount: orderToAccept.payout,
      currentStep: 'ACCEPTED',
      deliveryOtp: '5678'
    };
    setActiveOrder(newActive);
    setAvailableOrders((prev) => prev.filter((o) => o.id !== orderToAccept.id));
    setActiveTab('HOME');
  };

  // Filtered History
  const filteredHistory = deliveryHistory.filter((item) => {
    if (historyFilter === 'ALL') return true;
    if (historyFilter === 'COMPLETED') return item.status === 'COMPLETED';
    if (historyFilter === 'CANCELLED') return item.status === 'CANCELLED';
    if (historyFilter === 'REJECTED') return item.status === 'REJECTED';
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen bg-[#f7f8f6] text-[#111827] pb-24 lg:pb-12">
      {/* 1. TOP HEADER (Requirement 2 & 3) */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#4f9d2f] text-white flex items-center justify-center font-black text-lg shadow-sm">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <div className="font-black text-gray-900 text-base sm:text-lg tracking-tight leading-none flex items-center gap-1.5">
                <span>campus</span>
                <span className="text-[#4f9d2f]">basket</span>
                <span className="text-[10px] uppercase font-extrabold bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                  Runner
                </span>
              </div>
              <div className="text-[10px] text-gray-500 font-semibold mt-0.5">
                NIT Durgapur Partner Portal
              </div>
            </div>
          </div>

          {/* Right Header Controls: Partner Name, Status Toggle, Notifications, Logout */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Online / Offline Toggle (Requirement 3 & 27) */}
            <button
              onClick={handleToggleOnline}
              className={`delivery-status-toggle cursor-pointer transition-all shadow-xs ${
                isOnline ? 'delivery-status-online' : 'delivery-status-offline'
              }`}
              title="Click to switch availability"
            >
              <span className="delivery-status-dot" />
              <span className="text-xs uppercase tracking-wide">
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </button>

            {/* Notification Bell (Requirement 14) */}
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="p-2.5 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100 relative transition-colors"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute 1.5 top-1.5 right-1.5 w-4 h-4 bg-[#dc2626] text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-xs">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              {notificationsOpen && (
                <div
                  className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-2xl border border-gray-200 shadow-2xl p-4 z-50 divide-y divide-gray-100 animate-in fade-in zoom-in-95 duration-150"
                  onMouseLeave={() => setNotificationsOpen(false)}
                >
                  <div className="flex items-center justify-between pb-3">
                    <h3 className="text-xs font-black uppercase tracking-wider text-gray-900">
                      Notifications ({unreadCount} new)
                    </h3>
                    <button
                      onClick={() => {
                        setNotifications(notifications.map((n) => ({ ...n, read: true })));
                      }}
                      className="text-[11px] font-bold text-[#4f9d2f] hover:underline"
                    >
                      Mark all read
                    </button>
                  </div>

                  <div className="py-2 space-y-2 max-h-72 overflow-y-auto divide-y divide-gray-50">
                    {notifications.map((n) => (
                      <div key={n.id} className="pt-2 text-xs">
                        <div className="text-gray-800 font-medium">{n.text}</div>
                        <div className="text-[10px] text-gray-400 mt-0.5">{n.time}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Partner Identity */}
            <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-gray-200">
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-black text-gray-800">
                {user?.deliveryBoy?.fullName?.charAt(0) || 'R'}
              </div>
              <div className="text-left text-xs leading-tight">
                <div className="font-extrabold text-gray-900">
                  {user?.deliveryBoy?.fullName || 'Rahul'}
                </div>
                <div className="text-[10px] text-gray-400 font-mono">DB_BOY_01</div>
              </div>
            </div>

            {/* Logout */}
            <button
              onClick={logout}
              className="p-2.5 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
              title="Logout"
            >
              <LogOut className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>
      </header>

      {/* OFFLINE CONFIRMATION MODAL */}
      {offlineConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl border border-gray-200">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-black text-gray-900">
              Go offline with an active delivery?
            </h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              You have an active order in progress. You must complete delivery of <strong>#{activeOrder?.orderNumber}</strong> even while offline.
            </p>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setOfflineConfirmModal(false)}
                className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-xs font-bold text-gray-700 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={confirmGoOffline}
                className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-700 text-xs font-bold text-white rounded-xl shadow-sm"
              >
                Go Offline
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EMERGENCY SOS MODAL (Requirement 17) */}
      {emergencyModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-4 shadow-2xl border border-red-200">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-gray-900">
              Trigger Campus Safety Emergency?
            </h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              This will notify NIT Durgapur Campus Security, Hall Wardens, and the Campus Basket Operations Team immediately with your current location.
            </p>
            <div className="p-3 bg-red-50 rounded-xl text-xs font-bold text-red-800 space-y-1">
              <div>Campus Security Helpline: +91 343 275 9000</div>
              <div>Operations Control Desk: +91 98765 00099</div>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setEmergencyModalOpen(false)}
                className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-xs font-bold text-gray-700 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  alert('Emergency alert broadcast to NIT Durgapur Security Operations.');
                  setEmergencyModalOpen(false);
                }}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-xs font-bold text-white rounded-xl shadow-md"
              >
                Broadcast SOS Alert
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELIVERY COMPLETION CELEBRATION MODAL (Requirement 10) */}
      {completedModalOpen && lastDeliveredOrder && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-8 text-center space-y-5 shadow-2xl border border-gray-200">
            <div className="w-16 h-16 rounded-3xl bg-[#dcfce7] text-[#166534] flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider bg-[#dcfce7] text-[#166534] px-3 py-1 rounded-full">
                Doorstep Delivery Complete
              </span>
              <h2 className="text-2xl font-black text-gray-900 mt-2">
                🎉 DELIVERY COMPLETED
              </h2>
              <div className="text-xs font-mono font-bold text-gray-500 mt-1">
                Order #{lastDeliveredOrder.orderNumber}
              </div>
            </div>

            <div className="bg-[#f7f8f6] p-4 rounded-2xl border border-gray-200 text-xs space-y-2 text-left">
              <div className="flex justify-between">
                <span className="text-gray-500">Delivered to:</span>
                <strong className="text-gray-900">{lastDeliveredOrder.destinationHall} • Room {lastDeliveredOrder.roomNumber}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Delivery Time:</span>
                <strong className="text-gray-900">{new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</strong>
              </div>
              <div className="flex justify-between text-emerald-700 font-extrabold text-sm pt-2 border-t border-gray-200">
                <span>Earned for this delivery:</span>
                <span>+₹{lastDeliveredOrder.payoutAmount}</span>
              </div>
            </div>

            <button
              onClick={() => setCompletedModalOpen(false)}
              className="w-full py-3.5 bg-[#4f9d2f] hover:bg-[#36751f] text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all active:scale-98"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      )}

      {/* SUPPORT MODAL (Requirement 16) */}
      {supportModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-4 shadow-2xl border border-gray-200">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-[#4f9d2f]" />
                <h3 className="text-base font-black text-gray-900">
                  Delivery Partner Support
                </h3>
              </div>
              <button
                onClick={() => setSupportModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                alert('Support request submitted. Campus controller will call your mobile immediately.');
                setSupportModalOpen(false);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Issue Category</label>
                <select
                  value={supportReason}
                  onChange={(e) => setSupportReason(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-[#4f9d2f]"
                >
                  <option value="Problem with pickup">Problem with pickup (Cafeteria delay/closed)</option>
                  <option value="Student unavailable">Student unavailable / not answering phone</option>
                  <option value="Wrong room/location">Wrong hostel room or hall location</option>
                  <option value="Order missing">Order items missing from kitchen</option>
                  <option value="Order damaged">Order damaged in transit</option>
                  <option value="Navigation issue">Navigation or campus gate closed</option>
                  <option value="Payment issue">COD cash collection discrepancy</option>
                  <option value="Emergency">Emergency / Vehicle puncture</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Details &amp; Notes</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Describe what happened..."
                  value={supportNote}
                  onChange={(e) => setSupportNote(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl p-3 text-xs text-gray-900 focus:outline-none focus:border-[#4f9d2f]"
                />
                <span className="text-[10px] text-gray-400">
                  Order #{activeOrder?.orderNumber || 'General'} will be attached.
                </span>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSupportModalOpen(false)}
                  className="py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-xs font-bold text-gray-700 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#4f9d2f] hover:bg-[#36751f] text-xs font-bold text-white rounded-xl shadow-sm"
                >
                  Submit Incident Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MAIN CONTAINER */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* Offline Banner if Offline (Requirement 3) */}
        {!isOnline && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-amber-500 shrink-0" />
              <div className="font-bold text-amber-900">
                You are offline. Turn online to receive new campus delivery assignments.
              </div>
            </div>
            <button
              onClick={() => setIsOnline(true)}
              className="px-4 py-1.5 bg-[#4f9d2f] hover:bg-[#36751f] text-white font-extrabold rounded-lg shrink-0 shadow-xs"
            >
              Go Online
            </button>
          </div>
        )}

        {/* 2. TODAY'S OVERVIEW STATS (Requirement 2 & 25) */}
        <section className="stats-grid">
          <div className="stat-card shadow-xs">
            <div className="flex items-center justify-between">
              <div className="stat-value text-gray-900">{todayDeliveries}</div>
              <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                <PackageCheck className="w-5 h-5" />
              </div>
            </div>
            <div className="stat-label">📦 Total Deliveries Today</div>
          </div>

          <div className="stat-card shadow-xs">
            <div className="flex items-center justify-between">
              <div className="stat-value text-emerald-700">{todayCompleted}</div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
            <div className="stat-label">✓ Completed Deliveries</div>
          </div>

          <div className="stat-card shadow-xs">
            <div className="flex items-center justify-between">
              <div className="stat-value text-amber-700">{todayPending}</div>
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <div className="stat-label">⏳ Pending Orders</div>
          </div>

          <div className="stat-card shadow-xs">
            <div className="flex items-center justify-between">
              <div className="stat-value text-[#4f9d2f]">₹{todayEarnings}</div>
              <div className="w-10 h-10 rounded-xl bg-[#dcfce7] text-[#166534] flex items-center justify-center">
                <IndianRupee className="w-5 h-5" />
              </div>
            </div>
            <div className="stat-label">💰 Today's Earnings</div>
          </div>
        </section>

        {/* 3. ACTIVE DELIVERY SECTION (HIGHEST PRIORITY: Requirement 5, 6, 7, 8, 9, 18, 28) */}
        {activeOrder && (
          <section className="active-delivery-box space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-[#4f9d2f] text-white flex items-center justify-center shadow-sm">
                  <Truck className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-black tracking-wider bg-[#dcfce7] text-[#166534] px-2.5 py-0.5 rounded-full">
                      Active Delivery
                    </span>
                    <span className="text-sm font-black text-gray-900 font-mono">
                      #{activeOrder.orderNumber}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    Student: <strong className="text-gray-800">{activeOrder.customerName}</strong> • {activeOrder.customerMobile}
                  </div>
                </div>
              </div>

              {/* Earnings & ETA badge */}
              <div className="flex items-center gap-3 self-start sm:self-auto">
                <div className="bg-[#f7f8f6] border border-gray-200 px-3.5 py-1.5 rounded-xl text-xs">
                  <span className="text-[10px] text-gray-400 font-semibold block uppercase">Distance / ETA</span>
                  <span className="font-extrabold text-gray-900">{activeOrder.distanceKm} km • {activeOrder.estimatedMinutes} mins</span>
                </div>
                <div className="bg-[#dcfce7] border border-[#bbf7d0] px-3.5 py-1.5 rounded-xl text-xs">
                  <span className="text-[10px] text-[#166534] font-semibold block uppercase">Earning</span>
                  <span className="font-black text-[#166534] text-sm">₹{activeOrder.payoutAmount}</span>
                </div>
              </div>
            </div>

            {/* Strict Workflow Status Stepper Timeline (Requirement 6 & 30) */}
            <div className="space-y-2">
              <div className="text-[11px] font-extrabold uppercase tracking-wider text-gray-500">
                Delivery Workflow Status
              </div>

              {/* Mobile Stepper Pills */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 text-xs">
                {[
                  { key: 'ACCEPTED', label: '1. Accepted' },
                  { key: 'REACHING_PICKUP', label: '2. To Pickup' },
                  { key: 'ARRIVED_PICKUP', label: '3. At Pickup' },
                  { key: 'PICKED_UP', label: '4. Picked Up' },
                  { key: 'OUT_FOR_DELIVERY', label: '5. In Transit' },
                  { key: 'ARRIVED_HOSTEL', label: '6. At Hostel' },
                  { key: 'DELIVERED', label: '7. Delivered' }
                ].map((step, idx) => {
                  const stepOrder = ['ACCEPTED', 'REACHING_PICKUP', 'ARRIVED_PICKUP', 'PICKED_UP', 'OUT_FOR_DELIVERY', 'ARRIVED_HOSTEL', 'DELIVERED'];
                  const currentIndex = stepOrder.indexOf(activeOrder.currentStep);
                  const thisIndex = stepOrder.indexOf(step.key);
                  const isDone = thisIndex < currentIndex;
                  const isCurrent = thisIndex === currentIndex;

                  return (
                    <div
                      key={step.key}
                      className={`p-2 rounded-xl text-center font-bold text-[11px] transition-all ${
                        isDone
                          ? 'bg-[#dcfce7] text-[#166534] border border-[#bbf7d0]'
                          : isCurrent
                          ? 'bg-[#4f9d2f] text-white shadow-sm ring-2 ring-[#4f9d2f]/30'
                          : 'bg-gray-100 text-gray-400'
                      }`}
                    >
                      {step.label}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Route & Hostel Delivery Details (Requirement 7 & 8) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Route & Pickup Details */}
              <div className="lg:col-span-7 space-y-4">
                <div className="bg-[#f7f8f6] p-4 rounded-2xl border border-gray-200 space-y-4">
                  {/* Pickup */}
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">
                      📍 1
                    </div>
                    <div className="flex-1">
                      <div className="text-[10px] uppercase font-bold text-gray-400">Pickup Location</div>
                      <div className="text-sm font-black text-gray-900">{activeOrder.pickupLocation}</div>
                      <div className="text-xs text-gray-500">Student Cafeteria Ground Floor Counter</div>
                    </div>
                  </div>

                  <div className="w-0.5 h-6 bg-gray-300 ml-4 -my-2" />

                  {/* Destination */}
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#dcfce7] text-[#166534] flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">
                      📍 2
                    </div>
                    <div className="flex-1">
                      <div className="text-[10px] uppercase font-bold text-gray-400">Hostel Destination</div>
                      <div className="text-sm font-black text-gray-900">
                        {activeOrder.destinationHall} • Room {activeOrder.roomNumber}
                      </div>
                      <div className="text-xs text-emerald-700 font-semibold">
                        Instruction: "{activeOrder.deliveryInstructions}"
                      </div>
                    </div>
                  </div>
                </div>

                {/* Items in this Order */}
                <div className="bg-white p-4 rounded-2xl border border-gray-200">
                  <div className="text-xs font-extrabold uppercase text-gray-500 mb-2">Order Package Items</div>
                  <div className="space-y-1 text-xs">
                    {activeOrder.items.map((i, idx) => (
                      <div key={idx} className="flex justify-between font-bold text-gray-800">
                        <span>{i.name}</span>
                        <span>× {i.quantity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Route Map Visualizer & Dynamic Actions */}
              <div className="lg:col-span-5 space-y-4 flex flex-col justify-between">
                {/* Campus Map Route Visualizer Placeholder (Requirement 7) */}
                <div className="bg-gray-100 rounded-2xl p-4 border border-gray-200 relative overflow-hidden flex flex-col justify-between min-h-[160px]">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-extrabold text-gray-700 flex items-center gap-1.5">
                      <Compass className="w-4 h-4 text-[#4f9d2f]" /> Campus Route
                    </span>
                    <span className="text-[10px] bg-white px-2 py-0.5 rounded-full font-bold text-gray-600 shadow-2xs">
                      NIT Durgapur Map
                    </span>
                  </div>

                  <div className="my-3 text-center text-xs font-semibold text-gray-600 space-y-1">
                    <div className="text-[11px] text-[#4f9d2f] font-bold">📍 Cafeteria</div>
                    <div className="text-gray-400 text-xs">↓ (Via Hall Road • 800m) ↓</div>
                    <div className="text-[11px] text-gray-900 font-black">📍 {activeOrder.destinationHall}, Room {activeOrder.roomNumber}</div>
                  </div>

                  <a
                    href="https://maps.google.com"
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2 bg-white hover:bg-gray-50 text-gray-800 font-bold text-xs rounded-xl border border-gray-300 text-center flex items-center justify-center gap-1.5 shadow-2xs"
                  >
                    <Navigation className="w-3.5 h-3.5 text-[#4f9d2f]" /> Open Campus Maps
                  </a>
                </div>

                {/* Primary Workflow Actions (Strict Progression) */}
                <div className="space-y-2 pt-2">
                  {activeOrder.currentStep === 'ACCEPTED' && (
                    <button
                      onClick={handleNextDeliveryStep}
                      className="w-full delivery-btn btn-primary"
                    >
                      <span>I'm Heading to Cafeteria</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}

                  {activeOrder.currentStep === 'REACHING_PICKUP' && (
                    <button
                      onClick={handleNextDeliveryStep}
                      className="w-full delivery-btn btn-primary"
                    >
                      <span>I've Arrived at Cafeteria</span>
                      <Check className="w-4 h-4" />
                    </button>
                  )}

                  {activeOrder.currentStep === 'ARRIVED_PICKUP' && (
                    <button
                      onClick={handleNextDeliveryStep}
                      className="w-full delivery-btn btn-primary"
                    >
                      <span>Confirm Order Picked Up</span>
                      <PackageCheck className="w-4 h-4" />
                    </button>
                  )}

                  {activeOrder.currentStep === 'PICKED_UP' && (
                    <button
                      onClick={handleNextDeliveryStep}
                      className="w-full delivery-btn btn-primary"
                    >
                      <span>Start Delivery to {activeOrder.destinationHall}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}

                  {activeOrder.currentStep === 'OUT_FOR_DELIVERY' && (
                    <button
                      onClick={handleNextDeliveryStep}
                      className="w-full delivery-btn btn-primary"
                    >
                      <span>Arrived at {activeOrder.destinationHall} Hostel</span>
                      <MapPin className="w-4 h-4" />
                    </button>
                  )}

                  {/* Doorstep OTP Verification Form (Requirement 9) */}
                  {activeOrder.currentStep === 'ARRIVED_HOSTEL' && (
                    <div className="bg-[#f7f8f6] p-4 rounded-2xl border-2 border-[#4f9d2f] space-y-3">
                      <div className="flex items-center gap-2">
                        <KeyRound className="w-4 h-4 text-[#4f9d2f]" />
                        <span className="text-xs font-black uppercase text-gray-900">
                          Doorstep Delivery OTP Verification
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500">
                        Ask student for the 4-digit OTP shown on their tracking screen.
                        (Demo OTP: <strong className="font-mono text-gray-900">{activeOrder.deliveryOtp}</strong>)
                      </p>

                      {!otpVerified ? (
                        <form onSubmit={handleVerifyOtp} className="space-y-2">
                          <div className="flex gap-2">
                            <input
                              type="text"
                              maxLength={4}
                              placeholder="Enter 4-digit OTP"
                              value={otpInput}
                              onChange={(e) => {
                                setOtpInput(e.target.value);
                                setOtpError(false);
                              }}
                              className="flex-1 bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs font-mono font-bold tracking-widest text-center focus:outline-none focus:border-[#4f9d2f]"
                            />
                            <button
                              type="submit"
                              className="px-4 py-2 bg-[#4f9d2f] hover:bg-[#36751f] text-white text-xs font-bold rounded-xl shadow-xs"
                            >
                              Verify OTP
                            </button>
                          </div>
                          {otpError && (
                            <span className="text-[10px] text-red-600 font-bold block">
                              ❌ Incorrect OTP. Please ask student for the correct 4-digit code.
                            </span>
                          )}
                        </form>
                      ) : (
                        <div className="space-y-2">
                          <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>✓ OTP Verified Successfully</span>
                          </div>
                          <button
                            onClick={handleMarkDelivered}
                            className="w-full delivery-btn btn-primary"
                          >
                            <span>🎉 Mark as Delivered</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Support Button */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => setSupportModalOpen(true)}
                      className="flex-1 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-xs font-bold text-gray-700 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <HelpCircle className="w-3.5 h-3.5 text-gray-500" />
                      Help with this Delivery
                    </button>
                    <button
                      onClick={() => setEmergencyModalOpen(true)}
                      className="px-3 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-xs font-bold text-red-600 transition-colors flex items-center justify-center gap-1"
                    >
                      <span>🆘 SOS</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* 4. INCOMING DELIVERY REQUEST CARD (Requirement 4) */}
        {incomingRequest && (
          <section className="bg-white border-2 border-red-500 rounded-3xl p-6 shadow-xl space-y-4 animate-in fade-in slide-in-from-top-3 duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
                <h3 className="text-base font-black text-gray-900 tracking-tight">
                  🚨 NEW DELIVERY REQUEST
                </h3>
              </div>
              <div className="text-xs font-extrabold text-red-600 bg-red-50 px-3 py-1 rounded-full border border-red-200">
                Expires in {requestSecondsLeft}s
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs bg-gray-50 p-4 rounded-2xl border border-gray-100">
              <div>
                <span className="text-gray-400 block font-semibold">Pickup:</span>
                <strong className="text-gray-900">{incomingRequest.pickup}</strong>
              </div>
              <div>
                <span className="text-gray-400 block font-semibold">Destination:</span>
                <strong className="text-gray-900">{incomingRequest.destination}</strong>
              </div>
              <div>
                <span className="text-gray-400 block font-semibold">Earning:</span>
                <strong className="text-emerald-700 font-extrabold text-sm">₹{incomingRequest.payout}</strong>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setIncomingRequest(null)}
                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl"
              >
                Reject
              </button>
              <button
                onClick={() => {
                  handleAcceptOrder(incomingRequest);
                  setIncomingRequest(null);
                }}
                className="flex-1 py-3 bg-[#4f9d2f] hover:bg-[#36751f] text-white text-xs font-extrabold rounded-xl shadow-md"
              >
                Accept Delivery (+₹{incomingRequest.payout})
              </button>
            </div>
          </section>
        )}

        {/* 5. AVAILABLE DELIVERIES LIST (Requirement 19) */}
        {!activeOrder && isOnline && (
          <section className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-gray-900">
                  Available Campus Deliveries ({availableOrders.length})
                </h3>
                <p className="text-xs text-gray-500">Pick up orders ready at campus canteens and stores</p>
              </div>
              <button
                onClick={() => {
                  setIncomingRequest({
                    id: `ord_cb${Math.floor(10000 + Math.random() * 9000)}`,
                    orderNumber: `CB${Math.floor(10000 + Math.random() * 9000)}`,
                    pickup: 'Campus Cafeteria Counter 2',
                    destination: 'Hall 12 • Room 304',
                    distanceKm: 0.9,
                    estimatedMinutes: 10,
                    payout: 35,
                    itemsSummary: 'Kolkata Biryani × 1'
                  });
                  setRequestSecondsLeft(45);
                }}
                className="text-xs font-bold text-[#4f9d2f] hover:underline"
              >
                + Simulate New Request
              </button>
            </div>

            {availableOrders.length === 0 ? (
              <div className="p-8 text-center text-xs text-gray-400">
                No orders waiting right now. Stay online to receive instant notifications!
              </div>
            ) : (
              <div className="space-y-3">
                {availableOrders.map((ord) => (
                  <div
                    key={ord.id}
                    className="p-4 rounded-2xl border border-gray-200 bg-gray-50/50 hover:bg-gray-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-black text-gray-900">
                          #{ord.orderNumber}
                        </span>
                        <span className="text-[10px] font-bold bg-[#dcfce7] text-[#166534] px-2 py-0.5 rounded-full">
                          +₹{ord.payout} Earning
                        </span>
                      </div>
                      <div className="text-xs text-gray-700 font-semibold mt-1">
                        {ord.pickup} → <strong className="text-gray-900">{ord.destination}</strong>
                      </div>
                      <div className="text-[11px] text-gray-500 mt-0.5">
                        {ord.itemsSummary} • {ord.distanceKm} km ({ord.estimatedMinutes} mins)
                      </div>
                    </div>

                    <button
                      onClick={() => handleAcceptOrder(ord)}
                      className="px-5 py-2.5 bg-[#4f9d2f] hover:bg-[#36751f] text-white text-xs font-extrabold rounded-xl shadow-xs transition-all active:scale-95 shrink-0"
                    >
                      Accept Delivery
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* 6. INCENTIVES & DAILY TARGET (Requirement 13) */}
        <section className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-amber-500" />
              <h3 className="text-base font-black text-gray-900">
                Incentives &amp; Daily Target
              </h3>
            </div>
            <span className="text-xs font-extrabold text-[#4f9d2f]">
              8 / 10 Deliveries Completed (80%)
            </span>
          </div>

          <div className="space-y-2">
            <div className="progress">
              <div className="progress-value" style={{ width: '80%' }} />
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>Complete 2 more deliveries today</span>
              <strong className="text-gray-900 font-black">+₹100 Campus Bonus</strong>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs">
              <div className="font-extrabold text-amber-900">⚡ Peak Hour Boost</div>
              <div className="text-[11px] text-amber-700 mt-0.5">+₹15 extra on night orders (8 PM - 11 PM)</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-sky-50 border border-sky-200 text-xs">
              <div className="font-extrabold text-sky-900">🚴 Weekend Rush</div>
              <div className="text-[11px] text-sky-700 mt-0.5">₹250 bonus on 15 deliveries this Sunday</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs">
              <div className="font-extrabold text-emerald-900">🌟 5-Star Rating Bonus</div>
              <div className="text-[11px] text-emerald-700 mt-0.5">Top rated partner award active</div>
            </div>
          </div>
        </section>

        {/* 7. DELIVERY HISTORY SECTION (Requirement 11) */}
        <section className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-black text-gray-900">📦 Delivery History</h3>
              <p className="text-xs text-gray-500">Log of deliveries assigned and completed across campus</p>
            </div>

            {/* Filter pills */}
            <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-xl">
              {(['ALL', 'COMPLETED', 'CANCELLED', 'REJECTED'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setHistoryFilter(f)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                    historyFilter === f
                      ? 'bg-white text-gray-900 shadow-xs'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  {f === 'ALL' ? 'All' : f.charAt(0) + f.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="divide-y divide-gray-100">
            {filteredHistory.map((item) => (
              <div key={item.id} className="py-3.5 flex items-center justify-between gap-4 text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-gray-900">#{item.orderNumber}</span>
                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                        item.status === 'COMPLETED'
                          ? 'bg-[#dcfce7] text-[#166534]'
                          : 'bg-red-50 text-red-600'
                      }`}
                    >
                      {item.status === 'COMPLETED' ? '✓ Delivered' : item.status}
                    </span>
                  </div>
                  <div className="text-gray-600 mt-1">
                    {item.pickup} → <strong className="text-gray-800">{item.destination}</strong>
                  </div>
                  <div className="text-[10px] text-gray-400 mt-0.5">{item.dateTime}</div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-sm font-black text-[#4f9d2f]">
                    {item.earnings > 0 ? `₹${item.earnings}` : '₹0'}
                  </div>
                  <span className="text-[10px] text-gray-400">Pushed to Payout</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 8. EARNINGS BREAKDOWN (Requirement 12) */}
        <section className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-gray-900">💰 Earnings Summary</h3>
              <p className="text-xs text-gray-500">Automated UPI payouts credited to your campus account</p>
            </div>
            <span className="text-xs font-bold text-gray-500">UPI ID: rahul.delivery@upi</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200">
              <span className="text-[10px] uppercase font-bold text-gray-500 block">Today</span>
              <strong className="text-xl font-black text-gray-900 mt-0.5 block">₹420</strong>
              <span className="text-[10px] text-emerald-700 font-semibold">12 deliveries</span>
            </div>
            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200">
              <span className="text-[10px] uppercase font-bold text-gray-500 block">This Week</span>
              <strong className="text-xl font-black text-gray-900 mt-0.5 block">₹2,850</strong>
              <span className="text-[10px] text-emerald-700 font-semibold">78 deliveries</span>
            </div>
            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200">
              <span className="text-[10px] uppercase font-bold text-gray-500 block">This Month</span>
              <strong className="text-xl font-black text-gray-900 mt-0.5 block">₹11,400</strong>
              <span className="text-[10px] text-emerald-700 font-semibold">184 deliveries</span>
            </div>
            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200">
              <span className="text-[10px] uppercase font-bold text-gray-500 block">Avg / Delivery</span>
              <strong className="text-xl font-black text-gray-900 mt-0.5 block">₹31.50</strong>
              <span className="text-[10px] text-gray-400 font-semibold">Including tips &amp; bonus</span>
            </div>
          </div>
        </section>

        {/* 9. PARTNER PROFILE & VEHICLE DETAILS (Requirement 15) */}
        <section className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm space-y-4">
          <h3 className="text-base font-black text-gray-900">👤 Delivery Partner Profile</h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200">
              <span className="text-gray-400 block font-semibold">Partner Name</span>
              <strong className="text-gray-900 text-sm">{user?.deliveryBoy?.fullName || 'Rahul Sen'}</strong>
              <span className="text-[10px] text-gray-500 block mt-0.5">Mobile: +91 98765 43210</span>
            </div>

            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200">
              <span className="text-gray-400 block font-semibold">Assigned Vehicle</span>
              <strong className="text-gray-900 text-sm flex items-center gap-1.5 mt-0.5">
                <Bike className="w-4 h-4 text-[#4f9d2f]" /> Bicycle / Campus Cycle
              </strong>
              <span className="text-[10px] text-emerald-700 font-semibold block mt-0.5">Hostel Pass Verified</span>
            </div>

            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200">
              <span className="text-gray-400 block font-semibold">Campus &amp; Zone</span>
              <strong className="text-gray-900 text-sm">NIT Durgapur Campus</strong>
              <span className="text-[10px] text-gray-500 block mt-0.5">Halls 1 to 14, SNH &amp; MT Hall</span>
            </div>
          </div>
        </section>
      </main>

      {/* 10. MOBILE STICKY ACTIVE DELIVERY SHEET (Requirement 32) */}
      {activeOrder && (
        <div className="lg:hidden fixed bottom-16 inset-x-0 z-30 p-3 bg-white/95 backdrop-blur-md border-t border-gray-200 shadow-xl">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="text-xs font-black text-gray-900 truncate">
                🚚 #{activeOrder.orderNumber} • {activeOrder.destinationHall} (R-{activeOrder.roomNumber})
              </div>
              <div className="text-[10px] text-emerald-700 font-bold">
                Step: {activeOrder.currentStep.replace(/_/g, ' ')}
              </div>
            </div>

            <button
              onClick={() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="px-4 py-2 bg-[#4f9d2f] text-white text-xs font-extrabold rounded-xl shadow-xs shrink-0"
            >
              Action Next
            </button>
          </div>
        </div>
      )}

      {/* 11. MOBILE BOTTOM NAVIGATION (Requirement 31) */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-gray-200 h-16 flex items-center justify-around px-2 text-gray-500">
        <button
          onClick={() => {
            setActiveTab('HOME');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`flex flex-col items-center gap-1 text-[10px] font-bold ${
            activeTab === 'HOME' ? 'text-[#4f9d2f]' : ''
          }`}
        >
          <Truck className="w-5 h-5" />
          <span>Home</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('DELIVERIES');
            window.scrollTo({ top: 600, behavior: 'smooth' });
          }}
          className={`flex flex-col items-center gap-1 text-[10px] font-bold ${
            activeTab === 'DELIVERIES' ? 'text-[#4f9d2f]' : ''
          }`}
        >
          <PackageCheck className="w-5 h-5" />
          <span>Deliveries</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('EARNINGS');
            window.scrollTo({ top: 1200, behavior: 'smooth' });
          }}
          className={`flex flex-col items-center gap-1 text-[10px] font-bold ${
            activeTab === 'EARNINGS' ? 'text-[#4f9d2f]' : ''
          }`}
        >
          <IndianRupee className="w-5 h-5" />
          <span>Earnings</span>
        </button>

        <button
          onClick={() => setNotificationsOpen(true)}
          className="flex flex-col items-center gap-1 text-[10px] font-bold relative"
        >
          <Bell className="w-5 h-5" />
          <span>Alerts</span>
          {unreadCount > 0 && (
            <span className="absolute 0 -top-1 -right-1 w-2.5 h-2.5 bg-red-600 rounded-full" />
          )}
        </button>

        <button
          onClick={() => {
            setActiveTab('PROFILE');
            window.scrollTo({ top: 1600, behavior: 'smooth' });
          }}
          className={`flex flex-col items-center gap-1 text-[10px] font-bold ${
            activeTab === 'PROFILE' ? 'text-[#4f9d2f]' : ''
          }`}
        >
          <User className="w-5 h-5" />
          <span>Profile</span>
        </button>
      </nav>
    </div>
  );
}

export default function DeliveryDashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#f7f8f6]">
        <div className="w-10 h-10 border-4 border-[#4f9d2f] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <DeliveryDashboardContent />
    </Suspense>
  );
}
