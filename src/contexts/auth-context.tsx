
'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  onAuthStateChanged, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
  sendPasswordResetEmail,
  type User
} from 'firebase/auth';
import { ref, get, onDisconnect, serverTimestamp, update, onValue } from "firebase/database";
import { auth, db, isConfigured } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import type { UserProfile } from '@/services/user-service';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  isVerified: boolean;
  login: (email: string, password: string) => Promise<any>;
  signup: (email: string, password: string, fullName: string) => Promise<any>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ADMIN_EMAIL = "admin@coinsphere.com";

function generateReferralCode(uid: string) {
  return uid.substring(uid.length - 6).toUpperCase();
}

const setupPresence = (userId: string) => {
  if (!isConfigured || !db) return;
  const userStatusRef = ref(db, `users/${userId}`);
  onDisconnect(userStatusRef).update({
    online: false,
    lastSeen: serverTimestamp(),
  }).then(() => {
    update(userStatusRef, {
      online: true,
      lastSeen: serverTimestamp(),
    });
  });
};


export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  
  const logout = useCallback(async () => {
    if (!auth) return;
    if (auth.currentUser && db) {
      const userStatusRef = ref(db, 'users/' + auth.currentUser.uid);
      try {
          await update(userStatusRef, {
              online: false,
              lastSeen: serverTimestamp()
          });
      } catch (error) {
          console.error("Failed to update user status on logout:", error);
      }
    }
    await signOut(auth);
    router.push('/login');
  }, [router]);

  useEffect(() => {
    if (!isConfigured || !auth) {
        setLoading(false);
        return;
    }
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (!user) {
        setUserProfile(null);
        setIsAdmin(false);
        setIsVerified(false);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user || !db) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const userRef = ref(db, `users/${user.uid}`);
    
    const unsubscribeProfile = onValue(userRef, (snapshot) => {
      if (snapshot.exists()) {
        const profileData = snapshot.val();
        
        const profile: UserProfile = { uid: user.uid, ...profileData };
        
        if (profile.active === false && !profile.isAdmin) {
          logout();
          toast({
            variant: 'destructive',
            title: 'Account Deactivated',
            description: 'Your account has been deactivated by an administrator.',
          });
          return;
        }
        
        setUserProfile(profile);
        setIsVerified(profile.verified || false);
        setIsAdmin(profile.isAdmin || false);
      } else {
         // This case handles a user authenticated with Firebase Auth
         // but without a corresponding record in the Realtime Database.
         // This can happen if the database record was deleted manually.
         // We should probably log them out to force a clean slate.
         console.warn(`User ${user.uid} is authenticated but has no database record. Logging out.`);
         logout();
      }
      setLoading(false);
    }, (error) => {
      console.error("Firebase profile listener error:", error);
      setUserProfile(null);
      setLoading(false);
    });

    setupPresence(user.uid);
    
    return () => unsubscribeProfile();
  }, [user, logout, toast]);
  

  const login = useCallback(async (email: string, password: string) => {
    if (!auth || !db) {
      toast({ variant: "destructive", title: "Login Failed", description: "Firebase is not configured. Please check your environment variables." });
      throw new Error("Firebase not initialized");
    }
    const signInCredential = await signInWithEmailAndPassword(auth, email, password);
    const loggedInUser = signInCredential.user;
    const userRef = ref(db, 'users/' + loggedInUser.uid);
    
    const profileSnapshot = await get(userRef);
    const profile = profileSnapshot.val();
    
    const isLoggingInAsAdmin = loggedInUser.email === ADMIN_EMAIL;
    const isAccountActive = profile ? profile.active !== false : true;

    if (!isAccountActive && !isLoggingInAsAdmin) {
        await signOut(auth);
        throw new Error("Your account has been deactivated. Please contact customer support.");
    }
    
    const updates: any = { lastLogin: new Date().toISOString() };

    if (isLoggingInAsAdmin) {
        updates.isAdmin = true;
    }
    
    if (profile) {
        await update(userRef, updates);
    }
    
    return signInCredential;
  }, [toast]);
  
  const signup = useCallback(async (email: string, password: string, fullName: string) => {
    if (!auth || !db) {
      toast({ variant: "destructive", title: "Signup Failed", description: "Firebase is not configured. Please check your environment variables." });
      throw new Error("Firebase not initialized");
    }
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const newUser = userCredential.user;
    
    await updateProfile(newUser, { displayName: fullName });
    
    const referralCode = generateReferralCode(newUser.uid);

    const newProfile: Omit<UserProfile, 'walletBalance' | 'online' | 'lastSeen' | 'invites' | 'referralCount' | 'portfolio'> = {
        uid: newUser.uid,
        email: newUser.email!,
        displayName: fullName,
        createdAt: new Date().toISOString(),
        active: true,
        verified: false,
        lastLogin: new Date().toISOString(),
        isAdmin: email === ADMIN_EMAIL,
        referralCode: referralCode,
    };
    
    const updates: { [key: string]: any } = {};
    updates[`/users/${newUser.uid}`] = newProfile;
    updates[`/referralCodes/${referralCode}`] = newUser.uid;
    
    await update(ref(db), updates);
    
    setUserProfile(newProfile as UserProfile);

    return userCredential;
  }, [toast]);

  const resetPassword = useCallback(async (email: string) => {
    if (!auth) {
      throw new Error("Firebase not configured.");
    }
    await sendPasswordResetEmail(auth, email);
  }, []);

  const value = {
    user,
    userProfile,
    loading,
    isAdmin,
    isVerified,
    login,
    signup,
    logout,
    resetPassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
