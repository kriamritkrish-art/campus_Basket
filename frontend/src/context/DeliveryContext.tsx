'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiRequest } from '../lib/api';

export type DeliveryStatus =
  | 'ASSIGNED'
  | 'DELIVERY_ASSIGNED'
  | 'PICKUP_READY'
  | 'READY_FOR_PICKUP'
  | 'PICKED_UP'
  | 'IN_TRANSIT'
  | 'OUT_FOR_DELIVERY'
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
  studentPhone?: string;
  pickupLocation: string;
  destination: string;
  distance: string;
  eta: string;
  earning: number;
  itemsCount: number;
  items?: string[];
  itemsSummary?: string;
  urgency: 'NORMAL' | 'HIGH';
  timeAgo: string;
  status?: string;
  specialInstructions?: string;
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

  advanceOrderStatus: (orderId: string) => Promise<void>;
  verifyOrderOtp: (orderId: string, enteredOtp: string) => Promise<boolean>;
  deliverOrder: (orderId: string) => Promise<void>;

  // Legacy aliases for backward compatibility
  advanceActiveStatus: () => void;
  verifyDeliveryOtp: (enteredOtp: string) => Promise<boolean>;
  completeDelivery: () => void;

  availableOrders: AvailableOrder[];
  acceptAvailableOrder: (orderId: string) => Promise<void>;
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

  refreshData: () => Promise<void>;
}

const DeliveryContext = createContext<DeliveryContextType | undefined>(undefined);

export const DeliveryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [showOfflineConfirmModal, setShowOfflineConfirmModal] = useState<boolean>(false);
  const [activeOrders, setActiveOrders] = useState<ActiveDeliveryOrder[]>([]);
  const [availableOrders, setAvailableOrders] = useState<AvailableOrder[]>([]);
  const [deliveryHistory, setDeliveryHistory] = useState<HistoryOrder[]>([]);
  const [notifications, setNotifications] = useState<RunnerNotification[]>([]);

  const [todayStats, setTodayStats] = useState<TodayStats>({
    totalToday: 0,
    completedToday: 0,
    pendingToday: 0,
    earningsToday: 0,
    weekEarnings: 0,
    monthEarnings: 0,
    avgPerDelivery: 35,
    dailyTarget: 10,
  });

  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState<boolean>(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [otpModalOrder, setOtpModalOrder] = useState<ActiveDeliveryOrder | null>(null);

  const maxActiveSlots = 5;

  // Auto-hide toast
  useEffect(() => {
    if (successToast) {
      const timer = setTimeout(() => {
        setSuccessToast(null);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [successToast]);

  // Fetch real data from backend
  const fetchDeliveryData = useCallback(async () => {
    try {
      // 1. Dashboard & Online Status & Stats
      const dashRes = await apiRequest('/api/delivery/dashboard').catch(() => null);
      if (dashRes?.success) {
        if (typeof dashRes.deliveryBoy?.activeStatus === 'boolean') {
          setIsOnline(dashRes.deliveryBoy.activeStatus);
        }
        if (dashRes.stats) {
          setTodayStats({
            totalToday: dashRes.stats.totalToday || 0,
            completedToday: dashRes.stats.completedToday || 0,
            pendingToday: dashRes.stats.pendingToday || 0,
            earningsToday: dashRes.stats.earningsToday || 0,
            weekEarnings: dashRes.stats.weekEarnings || 0,
            monthEarnings: dashRes.stats.monthEarnings || 0,
            avgPerDelivery: dashRes.stats.avgPerDelivery || 35,
            dailyTarget: dashRes.stats.dailyTarget || 10,
          });
        }
      }

      // 2. Active Orders (assigned, excluding DELIVERED)
      const activeRes = await apiRequest('/api/delivery/orders').catch(() => null);
      if (activeRes?.success && Array.isArray(activeRes.orders)) {
        setActiveOrders(activeRes.orders);
      }

      // 3. Available Orders (unassigned orders for online runner)
      const availRes = await apiRequest('/api/delivery/available').catch(() => null);
      if (availRes?.success) {
        if (availRes.isOnline === false) {
          setAvailableOrders([]);
        } else if (Array.isArray(availRes.orders)) {
          setAvailableOrders(availRes.orders);
        }
      }

      // 4. Delivery History (DELIVERED orders)
      const histRes = await apiRequest('/api/delivery/history').catch(() => null);
      if (histRes?.success && Array.isArray(histRes.orders)) {
        setDeliveryHistory(histRes.orders);
      }
    } catch {
      // Silent catch for polling
    }
  }, []);

  // Poll backend every 6 seconds so new orders appear immediately
  useEffect(() => {
    fetchDeliveryData();
    const interval = setInterval(() => {
      fetchDeliveryData();
    }, 6000);
    return () => clearInterval(interval);
  }, [fetchDeliveryData]);

  // Toggle Online / Offline
  const toggleOnline = async () => {
    if (isOnline && activeOrders.length > 0) {
      setShowOfflineConfirmModal(true);
      return;
    }

    const nextState = !isOnline;
    setIsOnline(nextState);
    if (!nextState) {
      setAvailableOrders([]);
    }

    try {
      const res = await apiRequest('/api/delivery/status', {
        method: 'PATCH',
        body: JSON.stringify({ isOnline: nextState }),
      });
      if (res.success) {
        setSuccessToast(nextState ? 'You are now ONLINE. Orders will appear.' : 'You are now OFFLINE.');
        fetchDeliveryData();
      }
    } catch (err: any) {
      setSuccessToast(err.message || 'Status update failed.');
    }
  };

  const confirmGoOffline = async () => {
    setShowOfflineConfirmModal(false);
    setIsOnline(false);
    setAvailableOrders([]);

    try {
      await apiRequest('/api/delivery/status', {
        method: 'PATCH',
        body: JSON.stringify({ isOnline: false }),
      });
      setSuccessToast('Went offline. Active deliveries remain assigned.');
      fetchDeliveryData();
    } catch {
      setSuccessToast('Went offline.');
    }
  };

  // Accept an Available Order
  const acceptAvailableOrder = async (orderId: string) => {
    if (activeOrders.length >= maxActiveSlots) {
      setSuccessToast(`Maximum active capacity reached (${maxActiveSlots}/${maxActiveSlots}). Complete an order first!`);
      return;
    }

    try {
      const res = await apiRequest(`/api/delivery/orders/${orderId}/accept`, {
        method: 'POST',
      });
      if (res.success) {
        setSuccessToast(`✓ Order accepted! Ready for dispatch.`);
        await fetchDeliveryData();
      } else {
        setSuccessToast(res.message || 'Could not accept order.');
      }
    } catch (err: any) {
      setSuccessToast(err.message || 'Failed to accept order.');
    }
  };

  const rejectAvailableOrder = (orderId: string) => {
    setAvailableOrders((prev) => prev.filter((o) => o.id !== orderId));
    setSuccessToast(`Declined request. Available pool updated.`);
  };

  // Deliver an Order: Finalizes delivery, removes from active, adds to history
  const deliverOrder = async (orderId: string) => {
    try {
      const res = await apiRequest(`/api/delivery/orders/${orderId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'DELIVERED', notes: 'Delivered at student doorstep' }),
      });

      if (res.success) {
        // Immediately remove from active orders
        setActiveOrders((prev) => prev.filter((o) => o.id !== orderId && o.orderNumber !== orderId));
        setSuccessToast(`🎉 Order marked as Delivered! ₹35 credited.`);
        await fetchDeliveryData();
      } else {
        setSuccessToast(res.message || 'Failed to mark as delivered.');
      }
    } catch (err: any) {
      setSuccessToast(err.message || 'Failed to complete delivery.');
    }
  };

  // Advance Status (One-Tap Action)
  const advanceOrderStatus = async (orderId: string) => {
    const target = activeOrders.find((o) => o.id === orderId || o.orderNumber === orderId);
    if (!target) return;

    // Normalizing status mapping to backend enum
    if (target.status === 'DELIVERY_ASSIGNED' || target.status === 'ASSIGNED') {
      try {
        const res = await apiRequest(`/api/delivery/orders/${target.id}/status`, {
          method: 'PATCH',
          body: JSON.stringify({ status: 'PICKED_UP', notes: 'Runner picked up order from cafeteria/store' }),
        });
        if (res.success) {
          setSuccessToast(`✓ ${target.orderNumber} Picked Up`);
          await fetchDeliveryData();
        }
      } catch (err: any) {
        setSuccessToast(err.message || 'Update failed');
      }
      return;
    }

    if (target.status === 'PICKUP_READY' || target.status === 'READY_FOR_PICKUP') {
      try {
        const res = await apiRequest(`/api/delivery/orders/${target.id}/status`, {
          method: 'PATCH',
          body: JSON.stringify({ status: 'PICKED_UP', notes: 'Runner picked up order' }),
        });
        if (res.success) {
          setSuccessToast(`✓ ${target.orderNumber} Picked Up`);
          await fetchDeliveryData();
        }
      } catch (err: any) {
        setSuccessToast(err.message || 'Update failed');
      }
      return;
    }

    if (target.status === 'PICKED_UP') {
      try {
        const res = await apiRequest(`/api/delivery/orders/${target.id}/status`, {
          method: 'PATCH',
          body: JSON.stringify({ status: 'OUT_FOR_DELIVERY', notes: 'In transit to student hostel' }),
        });
        if (res.success) {
          setSuccessToast(`✓ ${target.orderNumber} is now Out for Delivery`);
          await fetchDeliveryData();
        }
      } catch (err: any) {
        setSuccessToast(err.message || 'Update failed');
      }
      return;
    }

    if (target.status === 'IN_TRANSIT' || target.status === 'OUT_FOR_DELIVERY') {
      // Prompt for OTP or deliver
      if (!target.isOtpVerified) {
        setOtpModalOrder(target);
        return;
      }
      await deliverOrder(target.id);
      return;
    }

    if (target.status === 'AT_HOSTEL') {
      if (!target.isOtpVerified) {
        setOtpModalOrder(target);
        return;
      }
      await deliverOrder(target.id);
      return;
    }

    if (target.status === 'OTP_VERIFIED') {
      await deliverOrder(target.id);
      return;
    }

    await deliverOrder(target.id);
  };

  // Verify Order OTP collected from student
  const verifyOrderOtp = async (orderId: string, enteredOtp: string): Promise<boolean> => {
    const target = activeOrders.find((o) => o.id === orderId || o.orderNumber === orderId);
    if (!target) return false;

    try {
      const res = await apiRequest(`/api/delivery/orders/${target.id}/verify-otp`, {
        method: 'POST',
        body: JSON.stringify({ otp: enteredOtp.trim() })
      });
      if (res.success) {
        setActiveOrders((prev) =>
          prev.map((ord) => {
            if (ord.id === target.id) {
              return { ...ord, isOtpVerified: true, status: 'OTP_VERIFIED' };
            }
            return ord;
          })
        );
        setOtpModalOrder(null);
        setSuccessToast(`✓ OTP Verified for ${target.orderNumber}! Now tap Mark Delivered.`);
        return true;
      }
    } catch {
      // Offline / fallback fallback check
      const expectedCode = target.orderNumber.replace(/\D/g, '').slice(-4);
      if (enteredOtp.trim() === expectedCode || enteredOtp.trim() === target.orderNumber.slice(-4)) {
        setActiveOrders((prev) =>
          prev.map((ord) => {
            if (ord.id === target.id) {
              return { ...ord, isOtpVerified: true, status: 'OTP_VERIFIED' };
            }
            return ord;
          })
        );
        setOtpModalOrder(null);
        setSuccessToast(`✓ OTP Verified for ${target.orderNumber}! Now tap Mark Delivered.`);
        return true;
      }
    }
    return false;
  };

  const advanceActiveStatus = () => {
    if (activeOrders.length > 0) {
      advanceOrderStatus(activeOrders[0].id);
    }
  };

  const verifyDeliveryOtp = async (enteredOtp: string): Promise<boolean> => {
    if (activeOrders.length > 0) {
      return await verifyOrderOtp(activeOrders[0].id, enteredOtp);
    }
    return false;
  };

  const completeDelivery = () => {
    if (activeOrders.length > 0) {
      deliverOrder(activeOrders[0].id);
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
        refreshData: fetchDeliveryData,
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
