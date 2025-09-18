
'use server';
import { db } from '@/lib/firebase';
import { ref, get } from 'firebase/database';

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  lastLogin: string;
  createdAt: string;
  active: boolean;
  online: boolean;
  walletBalance: number; // Represents total value in USDT
  portfolio?: {
    [assetSymbol: string]: number; // e.g., { BTC: 0.5, ETH: 10, USDT: 5000 }
  };
  lastSeen?: number; // timestamp
  verified: boolean;
  firstName?: string;
  lastName?: string;
  birthdate?: string;
  walletAddress?: string;
  country?: string;
  state?: string;
  isAdmin?: boolean;
  referralCode?: string;
  invitedBy?: string;
  invites?: Record<string, boolean>; // To store UIDs of invited users
  referralCount?: number;
}

// In a real application, you would implement proper admin checks here.
// For this prototype, we are assuming this function is only called by an authorized admin.
export async function getAllUsers(): Promise<UserProfile[]> {
  try {
    const usersRef = ref(db, 'users');
    const snapshot = await get(usersRef);

    if (snapshot.exists()) {
      const usersData = snapshot.val();
      
      return Object.keys(usersData).map(uid => {
        const user = usersData[uid];
        return {
          ...user,
          uid: uid,
          online: user.online || false, // Read real-time online status from DB
          walletBalance: user.walletBalance || Math.floor(Math.random() * 50000),
          active: user.active !== false, // Default to true if not set
        };
      });
    }
    return [];
  } catch (error) {
    console.error("Failed to fetch all users:", error);
    return [];
  }
}
