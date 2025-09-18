
'use server';

import { getMarketInsights } from '@/ai/flows/ai-market-insights';
import type { MarketInsightsInput } from '@/ai/flows/ai-market-insights';
import { adminDb, ServerValue, isAdminConfigured } from './firebase-admin';
import { ref, update, set, push, get, runTransaction, query, orderByChild, endAt, equalTo } from 'firebase/database';
import { revalidatePath } from 'next/cache';
import type { TranslationKey } from './translations';
import { randomUUID } from 'crypto';

export type ReceiptStatus = 'Processing' | 'Successful' | 'Failed';
export type WithdrawalStatus = 'Pending' | 'Successful' | 'Failed';
export type TicketStatus = 'Open' | 'Closed' | 'Pending';
export type MessageSender = 'User' | 'Support';
export type NotificationType = 'ticket' | 'withdrawal' | 'deposit' | 'general' | 'referral' | 'order';

export interface TicketMessage {
    sender: MessageSender;
    text: string;
    timestamp: number;
}
export interface Ticket {
    id: string;
    userId: string;
    userEmail: string;
    userDisplayName: string;
    subject: string;
    status: TicketStatus;
    createdAt: number;
    ticketNumber: string;
    messages: TicketMessage[] | Record<string, TicketMessage>; // Allow for old object structure
    userHasRead?: boolean;
}

export interface Receipt {
    id: string;
    userId: string;
    userEmail: string;
    amount: number;
    pair: string;
    date: number; // timestamp
    status: ReceiptStatus;
    transactionId: string;
}


export interface Withdrawal {
  id: string;
  userId: string;
  userEmail: string;
  amount: number;
  asset: string;
  walletAddress: string;
  date: number; // timestamp
  status: WithdrawalStatus;
}


// --- Notification Helper ---
export async function createNotification(userId: string, message: string, type: NotificationType, link?: string, isAdminTarget: boolean = false) {
    if (!isAdminConfigured) {
        console.error('Cannot create notification: Firebase Admin is not configured.');
        return;
    }
    try {
        const path = isAdminTarget ? `admin-notifications` : `notifications/${userId}`;
        const notificationsRef = ref(adminDb, path);
        const newNotificationRef = push(notificationsRef);
        await set(newNotificationRef, {
            message,
            type,
            link: link || null,
            timestamp: ServerValue.TIMESTAMP,
            read: false,
        });
    } catch (error) {
        console.error(`Failed to create notification for ${isAdminTarget ? 'admin' : `user ${userId}`}:`, error);
    }
}

export async function getMarketInsightsAction(input: MarketInsightsInput) {
  try {
    const insights = await getMarketInsights(input);
    if (!insights) {
      return { error: 'Received an empty response from the AI model.' };
    }
    return { data: insights };
  } catch (error) {
    console.error('Error in getMarketInsightsAction:', error);
    return { error: 'Failed to generate market insights. Please try again later.' };
  }
}

export async function updateManipulationModeAction(enabled: boolean) {
    if (!isAdminConfigured) return { success: false, error: 'Firebase not configured.' };
    try {
        const settingsRef = ref(adminDb, 'settings/manipulationMode');
        await set(settingsRef, enabled);
        return { success: true };
    } catch (error: any) {
        console.error("Failed to update manipulation mode:", error);
        return { success: false, error: error.message || 'Failed to update setting.' };
    }
}

export async function resolveOrderAction(orderId: string, status: 'Completed' | 'Failed') {
    if (!isAdminConfigured) return { success: false, error: 'Firebase not configured.' };
    try {
        const orderRef = ref(adminDb, `orders/${orderId}`);
        const orderSnapshot = await get(orderRef);
        if (!orderSnapshot.exists()) {
            return { success: false, error: 'Order not found.' };
        }

        const order = orderSnapshot.val();
        if (order.status !== 'Pending' && order.status !== 'Now Processing') {
            return { success: true, message: 'Order already resolved.' };
        }

        const userRef = ref(adminDb, `users/${order.userId}`);
        const updates: { [key: string]: any } = {};

        updates[`/orders/${orderId}/status`] = status;

        if (status === 'Completed') {
            const profitRate = typeof order.profitRate === 'number' && order.profitRate > 0 ? order.profitRate : 0;
            const profitAmount = Number(order.total) * (profitRate / 100);
            const amountToReturn = Number(order.total) + profitAmount;
            
            await runTransaction(userRef, (currentData) => {
                if (currentData) {
                    if (!currentData.portfolio) currentData.portfolio = {};
                    currentData.portfolio['USDT'] = (currentData.portfolio['USDT'] || 0) + amountToReturn;
                }
                return currentData;
            });
        }
        
        const message = `Your order ${order.transactionId || orderId} for ${order.pair}/USDT has been ${status}.`;
        updates[`/notifications/${order.userId}/${push(ref(adminDb, `notifications/${order.userId}`)).key}`] = {
            message: message,
            type: 'order',
            link: '/trader-dashboard/trade',
            timestamp: ServerValue.TIMESTAMP,
            read: false,
        };
        
        await update(ref(adminDb), updates);
        revalidatePath('/trader-dashboard/trade');
        return { success: true };

    } catch (error: any) {
        console.error(`Failed to resolve order ${orderId}:`, error);
        return { success: false, error: `Failed to resolve order.` };
    }
}


export async function processExpiredOrdersAction() {
  if (!isAdminConfigured) {
    return { success: false, error: "Firebase Admin not configured." };
  }

  try {
    const settingsRef = ref(adminDb, "settings/manipulationMode");
    const settingsSnapshot = await get(settingsRef);
    const manipulationMode = settingsSnapshot.val() ?? false;

    if (manipulationMode) {
      // In manual mode, just update status to "Now Processing"
      const pendingOrdersQuery = query(ref(adminDb, "orders"), orderByChild("status"), equalTo("Pending"));
      const pendingSnapshot = await get(pendingOrdersQuery);
      if (pendingSnapshot.exists()) {
          const now = Date.now();
          const updates: { [key: string]: any } = {};
          pendingSnapshot.forEach(child => {
              const orderId = child.key!;
              const order = child.val();
              if (now >= order.expiresAt) {
                  updates[`/orders/${orderId}/status`] = "Now Processing";
              }
          });
          if (Object.keys(updates).length > 0) {
              await update(ref(adminDb), updates);
          }
      }
      return { success: true, message: "Manual mode: Expired orders moved to 'Now Processing'." };
    }

    // Auto Win Mode Logic
    const ordersRef = ref(adminDb, "orders");
    const pendingOrdersQuery = query(ordersRef, orderByChild("status"), equalTo("Pending"));
    const ordersSnapshot = await get(pendingOrdersQuery);

    if (!ordersSnapshot.exists()) {
      return { success: true, message: "No pending orders to process." };
    }
    
    const now = Date.now();
    const updates: { [key: string]: any } = {};
    let processedCount = 0;

    for (const child of (ordersSnapshot.val() ? Object.entries(ordersSnapshot.val()) : [])) {
        const [orderId, order] = child as [string, any];

        if (now >= order.expiresAt) {
            processedCount++;
            updates[`/orders/${orderId}/status`] = "Completed";

            const profitRate = typeof order.profitRate === "number" && order.profitRate > 0 ? order.profitRate : 0;
            const profitAmount = Number(order.total) * (profitRate / 100);
            const amountToReturn = Number(order.total) + profitAmount;
            
            const userRef = ref(adminDb, `users/${order.userId}`);
            await runTransaction(userRef, (currentData) => {
                if (currentData) {
                    if (!currentData.portfolio) currentData.portfolio = {};
                    currentData.portfolio['USDT'] = (currentData.portfolio['USDT'] || 0) + amountToReturn;
                }
                return currentData;
            });


            const message = `Your order ${order.transactionId || orderId} for ${order.pair}/USDT has been Completed.`;
            const notificationRefKey = push(ref(adminDb, `notifications/${order.userId}`)).key;
            if(notificationRefKey) {
                updates[`/notifications/${order.userId}/${notificationRefKey}`] = {
                    message: message,
                    type: "order",
                    link: "/trader-dashboard/trade",
                    timestamp: ServerValue.TIMESTAMP,
                    read: false,
                };
            }
        }
    }

    if (Object.keys(updates).length > 0) {
      await update(ref(adminDb), updates);
      revalidatePath("/trader-dashboard/trade");
      return { success: true, processedCount };
    }
    
    return { success: true, message: "No expired orders to process." };

  } catch (error: any) {
    console.error("Failed to process expired orders:", error);
    return { success: false, error: error.message || "Failed to process expired orders." };
  }
}

export async function sendExpirationRemindersAction() {
    if (!isAdminConfigured) {
        return { success: false, error: 'Firebase not configured.' };
    }
    
    try {
        const ordersRef = ref(adminDb, 'orders');
        const ordersSnapshot = await get(ordersRef);
        if (!ordersSnapshot.exists()) {
            return { success: true, message: 'No orders found.' };
        }

        const now = Date.now();
        const reminderWindow = now + 30 * 1000; // 30 seconds from now
        const updates: { [key: string]: any } = {};
        let remindersSent = 0;
        
        ordersSnapshot.forEach(child => {
            const orderId = child.key!;
            const order = child.val();

            const isRemindable = (order.status === 'Pending') &&
                                  !order.reminded &&
                                  order.expiresAt > now &&
                                  order.expiresAt <= reminderWindow;
            
            if (isRemindable) {
                const message = `Order #${order.transactionId} for ${order.userEmail} is expiring in ~30 seconds.`;
                updates[`/orders/${orderId}/reminded`] = true;
                
                const adminNotifRef = push(ref(adminDb, 'admin-notifications'));
                updates[`/admin-notifications/${adminNotifRef.key}`] = {
                    message: message,
                    type: 'order',
                    link: '/trader-dashboard/trade',
                    timestamp: ServerValue.TIMESTAMP,
                    read: false,
                };
                remindersSent++;
            }
        });

        if (remindersSent > 0) {
            await update(ref(adminDb), updates);
        }
        
        return { success: true, remindersSent };

    } catch (error: any) {
        console.error('Error sending expiration reminders:', error);
        return { success: false, error: error.message || 'Failed to send reminders.' };
    }
}
