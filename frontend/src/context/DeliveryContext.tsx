'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type DeliveryStatus =
  | 'ASSIGNED'
  | 'PICKUP_READY'
  | 'PICKED_UP'
  | 'IN_TRANSIT'
  | 'AT_HOSTEL'
  | 'OTP_VERIFIED'
  | 'DELIVERED';

export interface ActiveDeliveryOrder {
  id: string;
  orderNumber: string;
  studentName: string;
  studentPhone: string;
  pickupLocation: string;
  pickupStation: string;
  destination: string;
  distance: string;
  eta: string;
  earning: number;
  status: DeliveryStatus;
  items: string[];
  otpRequired: string;
  isOtpVerified: boolean;
  acceptedAt: string;
  specialInstructions?: string;
  priority?: 'HIGH' | 'NORMAL';
  dueInText?: string;
}

export interface AvailableOrder {
  id: string;
  orderNumber: string;
  studentName: string;
  pickupLocation: string;
  destination: string;
  distance: string;
  eta: string;
  earning: number;
  itemsCount: number;
  urgency: 'NORMAL' | 'HIGH';
  timeAgo: string;
}

export interface HistoryOrder {
  id: string;
  orderNumber: string;
  pickupLocation: string;
  destination: string;
  date: string;
  earning: number;
  status: 'Completed' | 'Cancelled' | 'Rejected';
  itemsSummary: string;
}

export interface RunnerNotification {
  id: string;
  title: string;
  description: string;
  orderId?: string;
  time: string;
  type: 'order' | 'bonus' | 'alert' | 'system';
  read: boolean;
}

export interface TodayStats {
  totalToday: number;
  completedToday: number;
  pendingToday: number;
  earningsToday: number;
  weekEarnings: number;
  monthEarnings: number;
  avgPerDelivery: number;
  dailyTarget: number;
}

interface DeliveryContextType {
  isOnline: boolean;
  toggleOnline: () => void;
  showOfflineConfirmModal: boolean;
  setShowOfflineConfirmModal: (val: boolean) => void;
  confirmGoOffline: () => void;

  // Multiple Active Orders (Independent statuses)
  activeOrders: ActiveDeliveryOrder[];
  activeOrder: ActiveDeliveryOrder | null;
  maxActiveSlots: number;

  advanceOrderStatus: (orderId: string) => void;
  verifyOrderOtp: (orderId: string, enteredOtp: string) => boolean;
  deliverOrder: (orderId: string) => void;

  // Legacy aliases for backward compatibility
  advanceActiveStatus: () => void;
  verifyDeliveryOtp: (enteredOtp: string) => boolean;
  completeDelivery: () => void;

  availableOrders: AvailableOrder[];
  acceptAvailableOrder: (orderId: string) => void;
  rejectAvailableOrder: (orderId: string) => void;

  deliveryHistory: HistoryOrder[];
  todayStats: TodayStats;
  notifications: RunnerNotification[];
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;

  sidebarCollapsed: boolean;
  setSidebarCollapsed: (val: boolean | ((prev: boolean) => boolean)) => void;
  mobileDrawerOpen: boolean;
  setMobileDrawerOpen: (val: boolean) => void;

  successToast: string | null;
  setSuccessToast: (msg: string | null) => void;

  // Global OTP Modal trigger
  otpModalOrder: ActiveDeliveryOrder | null;
  setOtpModalOrder: (order: ActiveDeliveryOrder | null) => void;
}

const DeliveryContext = createContext<DeliveryContextType | undefined>(undefined);

const INITIAL_ACTIVE_ORDERS: ActiveDeliveryOrder[] = [
  {
    id: 'order-10294',
    orderNumber: '#CB10294',
    studentName: 'Sourav',
    studentPhone: '+91 98765 43210',
    pickupLocation: 'Campus Cafeteria & Canteen',
    pickupStation: 'Food Court Station #2 (Counter A)',
    destination: 'Hall 11 • Room 123',
    distance: '0.8 km',
    eta: '8 min',
    earning: 35,
    status: 'PICKED_UP',
    items: ['1x Veg Thali Deluxe', '1x Fresh Lime Soda', '1x Roasted Papad'],
    otpRequired: '4829',
    isOtpVerified: false,
    acceptedAt: '7:42 PM',
    priority: 'NORMAL',
    dueInText: 'Due in 8 min',
    specialInstructions: 'Please call when you reach the hostel gate.',
  },
  {
    id: 'order-10301',
    orderNumber: '#CB10301',
    studentName: 'Ankit Verma',
    studentPhone: '+91 98321 44556',
    pickupLocation: 'Campus Cafeteria',
    pickupStation: 'Main Dining Counter B',
    destination: 'Hall 8 • Room 201',
    distance: '1.2 km',
    eta: '6 min',
    earning: 40,
    status: 'PICKUP_READY',
    items: ['2x Chicken Kathi Roll', '1x Thums Up (Can)'],
    otpRequired: '3012',
    isOtpVerified: false,
    acceptedAt: '7:50 PM',
    priority: 'HIGH',
    dueInText: 'Delivery due in 6 min',
    specialInstructions: 'Meet near Hall 8 cycle stand. If locked, call room 201.',
  },
  {
    id: 'order-10304',
    orderNumber: '#CB10304',
    studentName: 'Rahul Roy',
    studentPhone: '+91 97482 11223',
    pickupLocation: 'Nescafe Corner',
    pickupStation: 'Kiosk Booth 1',
    destination: 'Hall 3 • Room 304',
    distance: '0.6 km',
    eta: '4 min',
    earning: 30,
    status: 'IN_TRANSIT',
    items: ['1x Maggi Double Masala', '1x Iced Cold Coffee'],
    otpRequired: '8520',
    isOtpVerified: false,
    acceptedAt: '7:46 PM',
    priority: 'NORMAL',
    dueInText: 'Due in 4 min',
    specialInstructions: 'Room on 3rd floor. Leave with floor prefect if door closed.',
  },
];

const INITIAL_AVAILABLE_ORDERS: AvailableOrder[] = [
  {
    id: 'req-10312',
    orderNumber: '#CB10312',
    studentName: 'Priya Sharma',
    pickupLocation: 'Central Night Canteen',
    destination: 'Mother Teresa Hall (MTH) • Room 42',
    distance: '1.4 km',
    eta: '14 min',
    earning: 45,
    itemsCount: 3,
    urgency: 'HIGH',
    timeAgo: 'Just now',
  },
  {
    id: 'req-10318',
    orderNumber: '#CB10318',
    studentName: 'Vikram Sethi',
    pickupLocation: 'Campus Bakery & Juice Bar',
    destination: 'Hall 14 • Room 412',
    distance: '1.1 km',
    eta: '11 min',
    earning: 38,
    itemsCount: 2,
    urgency: 'NORMAL',
    timeAgo: '3m ago',
  },
];

const INITIAL_HISTORY: HistoryOrder[] = [
  {
    id: 'h-10276',
    orderNumber: '#CB10276',
    pickupLocation: 'Hostel Snack Point',
    destination: 'Mother Teresa Hall, Room 42',
    date: '5 Sep 2026 • 3:40 PM',
    earning: 45,
    status: 'Completed',
    itemsSummary: '2x Cold Coffee, 1x Veg Sandwich',
  },
  {
    id: 'h-10268',
    orderNumber: '#CB10268',
    pickupLocation: 'Campus Bakery',
    destination: 'Hall 14, Room 412',
    date: '5 Sep 2026 • 2:15 PM',
    earning: 35,
    status: 'Completed',
    itemsSummary: '1x Chocolate Muffin, 1x Green Tea',
  },
  {
    id: 'h-10255',
    orderNumber: '#CB10255',
    pickupLocation: 'Nescafe Kiosk',
    destination: 'Hall 7, Room 108',
    date: '5 Sep 2026 • 1:05 PM',
    earning: 40,
    status: 'Completed',
    itemsSummary: '1x Maggi Double Masala, 1x Iced Tea',
  },
  {
    id: 'h-10242',
    orderNumber: '#CB10242',
    pickupLocation: 'Main Canteen',
    destination: 'SN Hall, Room 215',
    date: '5 Sep 2026 • 11:30 AM',
    earning: 50,
    status: 'Completed',
    itemsSummary: '1x Paneer Butter Masala Combo, 2x Naan',
  },
  {
    id: 'h-10230',
    orderNumber: '#CB10230',
    pickupLocation: 'Night Mess',
    destination: 'Hall 10, Room 311',
    date: '5 Sep 2026 • 10:15 AM',
    earning: 0,
    status: 'Cancelled',
    itemsSummary: 'Item out of stock at canteen',
  },
  {
    id: 'h-10218',
    orderNumber: '#CB10218',
    pickupLocation: 'Food Station',
    destination: 'Hall 4, Room 12',
    date: '5 Sep 2026 • 9:45 AM',
    earning: 0,
    status: 'Rejected',
    itemsSummary: 'Order outside active shift hours',
  },
  {
    id: 'h-10204',
    orderNumber: '#CB10204',
    pickupLocation: 'Campus Cafeteria',
    destination: 'Hall 11, Room 204',
    date: '5 Sep 2026 • 8:50 AM',
    earning: 35,
    status: 'Completed',
    itemsSummary: '1x Dosa Special, 1x Filter Coffee',
  },
  {
    id: 'h-10199',
    orderNumber: '#CB10199',
    pickupLocation: 'Juice Bar',
    destination: 'Hall 2, Room 114',
    date: '5 Sep 2026 • 8:15 AM',
    earning: 30,
    status: 'Completed',
    itemsSummary: '2x Fresh Watermelon Juice',
  },
];

const INITIAL_NOTIFICATIONS: RunnerNotification[] = [
  {
    id: 'notif-1',
    title: 'New Delivery Assigned',
    description: 'Order #CB10301 is ready for runner pickup near Campus Cafeteria.',
    orderId: '#CB10301',
    time: '2 min ago',
    type: 'order',
    read: false,
  },
  {
    id: 'notif-2',
    title: 'Bonus Unlocked',
    description: 'You earned ₹100 daily target bonus for completing 8 deliveries!',
    time: '15 min ago',
    type: 'bonus',
    read: false,
  },
  {
    id: 'notif-3',
    title: 'Order Ready for Pickup',
    description: 'Order #CB10294 has been packed and tagged at Campus Cafeteria Counter A.',
    orderId: '#CB10294',
    time: '20 min ago',
    type: 'alert',
    read: false,
  },
];

export const DeliveryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [showOfflineConfirmModal, setShowOfflineConfirmModal] = useState<boolean>(false);
  const [activeOrders, setActiveOrders] = useState<ActiveDeliveryOrder[]>(INITIAL_ACTIVE_ORDERS);
  const [availableOrders, setAvailableOrders] = useState<AvailableOrder[]>(INITIAL_AVAILABLE_ORDERS);
  const [deliveryHistory, setDeliveryHistory] = useState<HistoryOrder[]>(INITIAL_HISTORY);
  const [notifications, setNotifications] = useState<RunnerNotification[]>(INITIAL_NOTIFICATIONS);

  const [todayStats, setTodayStats] = useState<TodayStats>({
    totalToday: 12,
    completedToday: 8,
    pendingToday: 3,
    earningsToday: 420,
    weekEarnings: 2850,
    monthEarnings: 11400,
    avgPerDelivery: 31.50,
    dailyTarget: 10,
  });

  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState<boolean>(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [otpModalOrder, setOtpModalOrder] = useState<ActiveDeliveryOrder | null>(null);

  const maxActiveSlots = 5;

  // Auto-hide success toast after 3.5 seconds
  useEffect(() => {
    if (successToast) {
      const timer = setTimeout(() => {
        setSuccessToast(null);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [successToast]);

  const toggleOnline = () => {
    if (isOnline && activeOrders.length > 0) {
      setShowOfflineConfirmModal(true);
      return;
    }
    setIsOnline((prev) => !prev);
    setSuccessToast(!isOnline ? 'You are now ONLINE. Ready for orders.' : 'You are now OFFLINE.');
  };

  const confirmGoOffline = () => {
    setShowOfflineConfirmModal(false);
    setIsOnline(false);
    setSuccessToast('Went offline. Active deliveries remain assigned.');
  };

  /**
   * One-tap status update for an independent order.
   * Updates ONLY the specified order without reloading or navigating away.
   */
  const advanceOrderStatus = (orderId: string) => {
    const target = activeOrders.find((o) => o.id === orderId || o.orderNumber === orderId);
    if (!target) return;

    const statusFlow: DeliveryStatus[] = [
      'ASSIGNED',
      'PICKUP_READY',
      'PICKED_UP',
      'IN_TRANSIT',
      'AT_HOSTEL',
      'OTP_VERIFIED',
      'DELIVERED',
    ];

    const currentIndex = statusFlow.indexOf(target.status);
    if (currentIndex === -1) return;

    // If currently at hostel and not verified, open OTP modal
    if (target.status === 'AT_HOSTEL' && !target.isOtpVerified) {
      setOtpModalOrder(target);
      return;
    }

    // If currently OTP_VERIFIED, deliver
    if (target.status === 'OTP_VERIFIED') {
      deliverOrder(target.id);
      return;
    }

    const nextStatus = statusFlow[currentIndex + 1];
    if (!nextStatus || nextStatus === 'DELIVERED') {
      deliverOrder(target.id);
      return;
    }

    // Update ONLY this specific order
    setActiveOrders((prev) =>
      prev.map((ord) => {
        if (ord.id === target.id) {
          return { ...ord, status: nextStatus };
        }
        return ord;
      })
    );

    const toastMessages: Record<DeliveryStatus, string> = {
      ASSIGNED: `✓ ${target.orderNumber} assigned`,
      PICKUP_READY: `✓ ${target.orderNumber} accepted. Ready for pickup.`,
      PICKED_UP: `✓ ${target.orderNumber} picked up from canteen`,
      IN_TRANSIT: `✓ ${target.orderNumber} is now In Transit`,
      AT_HOSTEL: `✓ ${target.orderNumber} reached student hostel`,
      OTP_VERIFIED: `✓ ${target.orderNumber} OTP verified`,
      DELIVERED: `✓ ${target.orderNumber} Delivered!`,
    };

    setSuccessToast(toastMessages[nextStatus] || `✓ ${target.orderNumber} updated`);
  };

  /**
   * Verify OTP for a specific order
   */
  const verifyOrderOtp = (orderId: string, enteredOtp: string): boolean => {
    const target = activeOrders.find((o) => o.id === orderId || o.orderNumber === orderId);
    if (!target) return false;

    if (enteredOtp.trim() === target.otpRequired) {
      setActiveOrders((prev) =>
        prev.map((ord) => {
          if (ord.id === target.id) {
            return { ...ord, isOtpVerified: true, status: 'OTP_VERIFIED' };
          }
          return ord;
        })
      );
      setOtpModalOrder(null);
      setSuccessToast(`✓ OTP Verified for ${target.orderNumber}! Now ready to mark delivered.`);
      return true;
    }
    return false;
  };

  /**
   * Finalize delivery of an order:
   * Removes from active, adds to history, updates stats.
   */
  const deliverOrder = (orderId: string) => {
    const target = activeOrders.find((o) => o.id === orderId || o.orderNumber === orderId);
    if (!target) return;

    const deliveredEarning = target.earning;
    const completedHistoryItem: HistoryOrder = {
      id: `h-${Date.now()}`,
      orderNumber: target.orderNumber,
      pickupLocation: target.pickupLocation,
      destination: target.destination,
      date: `Today • ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      earning: deliveredEarning,
      status: 'Completed',
      itemsSummary: target.items.join(', '),
    };

    // Remove ONLY this order from active
    setActiveOrders((prev) => prev.filter((ord) => ord.id !== target.id));

    // Update today's stats
    setTodayStats((prev) => {
      const newCompleted = prev.completedToday + 1;
      const newEarnings = prev.earningsToday + deliveredEarning;
      const newPending = Math.max(0, prev.pendingToday - 1);
      const newWeekEarnings = prev.weekEarnings + deliveredEarning;
      const newMonthEarnings = prev.monthEarnings + deliveredEarning;
      const newAvg = Number((newEarnings / newCompleted).toFixed(2));

      return {
        ...prev,
        completedToday: newCompleted,
        pendingToday: newPending,
        earningsToday: newEarnings,
        weekEarnings: newWeekEarnings,
        monthEarnings: newMonthEarnings,
        avgPerDelivery: newAvg,
      };
    });

    // Add to history
    setDeliveryHistory((prev) => [completedHistoryItem, ...prev]);

    // Toast
    setSuccessToast(`🎉 ${target.orderNumber} marked as Delivered! ₹${deliveredEarning} credited.`);

    // Notification
    setNotifications((prev) => [
      {
        id: `notif-${Date.now()}`,
        title: 'Delivery Completed',
        description: `Order ${target.orderNumber} delivered to ${target.destination}. ₹${deliveredEarning} credited to wallet.`,
        time: 'Just now',
        type: 'bonus',
        read: false,
      },
      ...prev,
    ]);
  };

  // Legacy convenience wrappers (delegating to first active order)
  const advanceActiveStatus = () => {
    if (activeOrders.length > 0) {
      advanceOrderStatus(activeOrders[0].id);
    }
  };

  const verifyDeliveryOtp = (enteredOtp: string): boolean => {
    if (activeOrders.length > 0) {
      return verifyOrderOtp(activeOrders[0].id, enteredOtp);
    }
    return false;
  };

  const completeDelivery = () => {
    if (activeOrders.length > 0) {
      deliverOrder(activeOrders[0].id);
    }
  };

  const acceptAvailableOrder = (orderId: string) => {
    const target = availableOrders.find((o) => o.id === orderId);
    if (!target) return;

    if (activeOrders.length >= maxActiveSlots) {
      setSuccessToast(`Maximum active capacity reached (${maxActiveSlots}/${maxActiveSlots}). Complete an order first!`);
      return;
    }

    const newActive: ActiveDeliveryOrder = {
      id: target.id,
      orderNumber: target.orderNumber,
      studentName: target.studentName,
      studentPhone: '+91 94321 88765',
      pickupLocation: target.pickupLocation,
      pickupStation: 'Food Court Counter C',
      destination: target.destination,
      distance: target.distance,
      eta: target.eta,
      earning: target.earning,
      status: 'PICKUP_READY',
      items: ['Campus Meal Combo Pack'],
      otpRequired: '7391',
      isOtpVerified: false,
      acceptedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      priority: target.urgency === 'HIGH' ? 'HIGH' : 'NORMAL',
      dueInText: `Due in ${target.eta}`,
      specialInstructions: 'Call student upon arrival.',
    };

    setActiveOrders((prev) => [newActive, ...prev]);
    setAvailableOrders((prev) => prev.filter((o) => o.id !== orderId));
    setTodayStats((prev) => ({
      ...prev,
      totalToday: prev.totalToday + 1,
      pendingToday: prev.pendingToday + 1,
    }));
    setSuccessToast(`✓ Accepted ${target.orderNumber}. Tap [CONFIRM PICKUP] on card when ready.`);
  };

  const rejectAvailableOrder = (orderId: string) => {
    const target = availableOrders.find((o) => o.id === orderId);
    setAvailableOrders((prev) => prev.filter((o) => o.id !== orderId));
    if (target) {
      setSuccessToast(`Declined request ${target.orderNumber}. Available pool updated.`);
    }
  };

  const markNotificationRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setSuccessToast('All notifications marked as read.');
  };

  return (
    <DeliveryContext.Provider
      value={{
        isOnline,
        toggleOnline,
        showOfflineConfirmModal,
        setShowOfflineConfirmModal,
        confirmGoOffline,

        activeOrders,
        activeOrder: activeOrders[0] || null,
        maxActiveSlots,

        advanceOrderStatus,
        verifyOrderOtp,
        deliverOrder,

        advanceActiveStatus,
        verifyDeliveryOtp,
        completeDelivery,

        availableOrders,
        acceptAvailableOrder,
        rejectAvailableOrder,
        deliveryHistory,
        todayStats,
        notifications,
        markNotificationRead,
        markAllNotificationsRead,
        sidebarCollapsed,
        setSidebarCollapsed,
        mobileDrawerOpen,
        setMobileDrawerOpen,
        successToast,
        setSuccessToast,

        otpModalOrder,
        setOtpModalOrder,
      }}
    >
      {children}
    </DeliveryContext.Provider>
  );
};

export const useDelivery = () => {
  const context = useContext(DeliveryContext);
  if (!context) {
    throw new Error('useDelivery must be used within a DeliveryProvider');
  }
  return context;
};
