'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type DeliveryStatus =
  | 'ASSIGNED'
  | 'ACCEPTED'
  | 'TO_PICKUP'
  | 'AT_PICKUP'
  | 'PICKED_UP'
  | 'IN_TRANSIT'
  | 'AT_HOSTEL'
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

  activeOrder: ActiveDeliveryOrder | null;
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
}

const DeliveryContext = createContext<DeliveryContextType | undefined>(undefined);

const INITIAL_ACTIVE_ORDER: ActiveDeliveryOrder = {
  id: 'order-10294',
  orderNumber: '#CB10294',
  studentName: 'Sourav',
  studentPhone: '+91 98765 43210',
  pickupLocation: 'Campus Cafeteria & Canteen',
  pickupStation: 'Food Court Station #2 (Counter A)',
  destination: 'Hall 11 • Room 123',
  distance: '0.8 km',
  eta: '8 mins',
  earning: 35,
  status: 'ACCEPTED',
  items: ['1x Veg Thali Deluxe', '1x Fresh Lime Soda', '1x Roasted Papad'],
  otpRequired: '4829',
  isOtpVerified: false,
  acceptedAt: '7:42 PM',
  specialInstructions: 'Please leave with roommate if room door is closed. Call on arrival.',
};

const INITIAL_AVAILABLE_ORDERS: AvailableOrder[] = [
  {
    id: 'req-10301',
    orderNumber: '#CB10301',
    studentName: 'Ankit Verma',
    pickupLocation: 'Campus Cafeteria',
    destination: 'Hall 8 • Room 201',
    distance: '1.2 km',
    eta: '12 mins',
    earning: 40,
    itemsCount: 2,
    urgency: 'HIGH',
    timeAgo: 'Just now',
  },
  {
    id: 'req-10305',
    orderNumber: '#CB10305',
    studentName: 'Rahul Roy',
    pickupLocation: 'Nescafe Corner',
    destination: 'Hall 3 • Room 304',
    distance: '0.6 km',
    eta: '7 mins',
    earning: 30,
    itemsCount: 1,
    urgency: 'NORMAL',
    timeAgo: '2m ago',
  },
  {
    id: 'req-10312',
    orderNumber: '#CB10312',
    studentName: 'Priya Sharma',
    pickupLocation: 'Central Night Canteen',
    destination: 'Mother Teresa Hall (MTH) • Room 42',
    distance: '1.4 km',
    eta: '14 mins',
    earning: 45,
    itemsCount: 3,
    urgency: 'HIGH',
    timeAgo: '4m ago',
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
    description: 'Order #CB10301 is waiting for runner acceptance near Campus Cafeteria.',
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
  {
    id: 'notif-4',
    title: 'High Demand Surge',
    description: 'Demand surge around Hall 11 & 14! Additional ₹15 incentive per order active till 11:00 PM.',
    time: '1 hour ago',
    type: 'bonus',
    read: true,
  },
];

export const DeliveryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [showOfflineConfirmModal, setShowOfflineConfirmModal] = useState<boolean>(false);
  const [activeOrder, setActiveOrder] = useState<ActiveDeliveryOrder | null>(INITIAL_ACTIVE_ORDER);
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

  // Auto-hide success toast after 4 seconds
  useEffect(() => {
    if (successToast) {
      const timer = setTimeout(() => {
        setSuccessToast(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [successToast]);

  const toggleOnline = () => {
    if (isOnline && activeOrder) {
      // Cannot go offline without confirmation if active delivery in progress
      setShowOfflineConfirmModal(true);
      return;
    }
    setIsOnline((prev) => !prev);
    setSuccessToast(!isOnline ? 'You are now ONLINE. Receiving delivery requests.' : 'You are now OFFLINE.');
  };

  const confirmGoOffline = () => {
    setShowOfflineConfirmModal(false);
    setIsOnline(false);
    setSuccessToast('You went offline. Active delivery remains assigned to your account.');
  };

  const advanceActiveStatus = () => {
    if (!activeOrder) return;

    const statusFlow: DeliveryStatus[] = [
      'ASSIGNED',
      'ACCEPTED',
      'TO_PICKUP',
      'AT_PICKUP',
      'PICKED_UP',
      'IN_TRANSIT',
      'AT_HOSTEL',
      'DELIVERED',
    ];

    const currentIndex = statusFlow.indexOf(activeOrder.status);
    if (currentIndex === -1 || currentIndex >= statusFlow.length - 1) return;

    const nextStatus = statusFlow[currentIndex + 1];

    if (nextStatus === 'DELIVERED') {
      if (!activeOrder.isOtpVerified) {
        setSuccessToast('Please verify 4-digit student OTP first before marking delivered!');
        return;
      }
      completeDelivery();
      return;
    }

    setActiveOrder((prev) => (prev ? { ...prev, status: nextStatus } : null));

    const statusLabels: Record<DeliveryStatus, string> = {
      ASSIGNED: 'Order Assigned',
      ACCEPTED: 'Accepted Order',
      TO_PICKUP: 'Heading to Pickup Location',
      AT_PICKUP: 'Arrived at Cafeteria / Canteen',
      PICKED_UP: 'Order Picked Up! Moving towards Hostel',
      IN_TRANSIT: 'In Transit across Campus',
      AT_HOSTEL: 'Arrived at Hostel Gate / Block',
      DELIVERED: 'Order Delivered Successfully!',
    };

    setSuccessToast(statusLabels[nextStatus]);
  };

  const verifyDeliveryOtp = (enteredOtp: string): boolean => {
    if (!activeOrder) return false;
    if (enteredOtp.trim() === activeOrder.otpRequired) {
      setActiveOrder((prev) => (prev ? { ...prev, isOtpVerified: true } : null));
      setSuccessToast('✓ OTP Verified! You can now mark order as Delivered.');
      return true;
    }
    return false;
  };

  const completeDelivery = () => {
    if (!activeOrder) return;

    const deliveredEarning = activeOrder.earning;
    const completedHistoryItem: HistoryOrder = {
      id: `h-${Date.now()}`,
      orderNumber: activeOrder.orderNumber,
      pickupLocation: activeOrder.pickupLocation,
      destination: activeOrder.destination,
      date: `Today • ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      earning: deliveredEarning,
      status: 'Completed',
      itemsSummary: activeOrder.items.join(', '),
    };

    // Update stats
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

    // Clear active order
    setActiveOrder(null);

    // Show celebratory toast
    setSuccessToast(`🎉 Order ${activeOrder.orderNumber} Delivered! ₹${deliveredEarning} added to today's earnings.`);

    // Add notification
    setNotifications((prev) => [
      {
        id: `notif-${Date.now()}`,
        title: 'Delivery Completed',
        description: `Order ${activeOrder.orderNumber} successfully delivered to ${activeOrder.destination}. ₹${deliveredEarning} credited.`,
        time: 'Just now',
        type: 'bonus',
        read: false,
      },
      ...prev,
    ]);
  };

  const acceptAvailableOrder = (orderId: string) => {
    const target = availableOrders.find((o) => o.id === orderId);
    if (!target) return;

    if (activeOrder) {
      setSuccessToast('You already have an ongoing active delivery. Complete it first!');
      return;
    }

    const newActive: ActiveDeliveryOrder = {
      id: target.id,
      orderNumber: target.orderNumber,
      studentName: target.studentName,
      studentPhone: '+91 94321 88765',
      pickupLocation: target.pickupLocation,
      pickupStation: 'Main Campus Dining Hub (Counter B)',
      destination: target.destination,
      distance: target.distance,
      eta: target.eta,
      earning: target.earning,
      status: 'ACCEPTED',
      items: ['Campus Quick Pack (Combo Meals)'],
      otpRequired: '7391',
      isOtpVerified: false,
      acceptedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      specialInstructions: 'Call upon reaching hostel security gate.',
    };

    setActiveOrder(newActive);
    setAvailableOrders((prev) => prev.filter((o) => o.id !== orderId));
    setTodayStats((prev) => ({
      ...prev,
      totalToday: prev.totalToday + 1,
      pendingToday: prev.pendingToday + 1,
    }));
    setSuccessToast(`✓ Accepted Order ${target.orderNumber}. Next action: Navigate to ${target.pickupLocation}`);
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
        activeOrder,
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
