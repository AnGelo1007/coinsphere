
'use server';

import { getAdminApp } from './firebase-admin';
import { revalidatePath } from 'next/cache';
import { get, query, orderByChild, equalTo, ref, update } from 'firebase/database';
import { getStorage } from 'firebase-admin/storage';


export async function deleteUserDataAction(uid: string) {
  try {
    const { db: adminDb, app: adminApp } = getAdminApp();
    const storage = getStorage(adminApp);
    
    // Get user data to find their referral code and other associations
    const userDbRef = adminDb.ref(`users/${uid}`);
    const userSnapshot = await userDbRef.once('value');
    const userData = userSnapshot.val();
    
    const updates: { [key: string]: null } = {};
    
    // 1. Mark user's main record for deletion
    updates[`/users/${uid}`] = null;
    updates[`/notifications/${uid}`] = null;
    updates[`/announcements/${uid}`] = null;

    
    // 2. If the user had a referral code, mark it for deletion
    if (userData?.referralCode) {
        updates[`/referralCodes/${userData.referralCode}`] = null;
    }

    // 3. Mark user's receipts for deletion and delete associated files from Storage
    const receiptsRef = adminDb.ref('receipts');
    const receiptsQuery = query(receiptsRef, orderByChild('userId'), equalTo(uid));
    const receiptsSnapshot = await get(receiptsQuery);
    if (receiptsSnapshot.exists()) {
        receiptsSnapshot.forEach(child => {
            const receiptData = child.val();
            if (receiptData.filePath) {
                // No need to await this, let it run in the background
                storage.bucket().file(receiptData.filePath).delete().catch(e => console.error(`Failed to delete storage file ${receiptData.filePath}`, e));
            }
            updates[`/receipts/${child.key}`] = null;
        });
    }
    
    // 4. Mark user's tickets for deletion
    const ticketsRef = adminDb.ref('tickets');
    const ticketsQuery = query(ticketsRef, orderByChild('userId'), equalTo(uid));
    const ticketsSnapshot = await get(ticketsQuery);
     if (ticketsSnapshot.exists()) {
        ticketsSnapshot.forEach(child => {
            updates[`/tickets/${child.key}`] = null;
        });
    }
    
    // 5. Mark user's orders for deletion
    const ordersRef = adminDb.ref('orders');
    const ordersQuery = query(ordersRef, orderByChild('userId'), equalTo(uid));
    const ordersSnapshot = await get(ordersQuery);
     if (ordersSnapshot.exists()) {
        ordersSnapshot.forEach(child => {
            updates[`/orders/${child.key}`] = null;
        });
    }
    
    // 6. Mark user's withdrawals for deletion
    const withdrawalsRef = adminDb.ref('withdrawals');
    const withdrawalsQuery = query(withdrawalsRef, orderByChild('userId'), equalTo(uid));
    const withdrawalsSnapshot = await get(withdrawalsQuery);
     if (withdrawalsSnapshot.exists()) {
        withdrawalsSnapshot.forEach(child => {
            updates[`/withdrawals/${child.key}`] = null;
        });
    }

    // 7. If this user was invited by someone, remove them from the inviter's list and decrement count
    if (userData?.invitedBy) {
        const inviterRef = adminDb.ref(`users/${userData.invitedBy}`);
        const inviterSnapshot = await get(inviterRef);
        if (inviterSnapshot.exists()) {
            updates[`/users/${userData.invitedBy}/invites/${uid}`] = null;
            const currentCount = inviterSnapshot.val().referralCount || 0;
            updates[`/users/${userData.invitedBy}/referralCount`] = Math.max(0, currentCount - 1);
        }
    }


    // Perform a multi-path update to delete all associated data at once
    await adminDb.ref().update(updates);

    revalidatePath('/trader-dashboard/admin');
    
    return { success: true };

  } catch (error: any) {
    console.error("Failed to delete user data from database:", error);
    return { success: false, error: 'Failed to delete the user data from the database.' };
  }
}
