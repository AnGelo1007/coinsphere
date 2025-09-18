
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
  type User
} from 'firebase/auth';
import { ref, set, get, onDisconnect, serverTimestamp, update, onValue } from "firebase/database";
import { auth, db, isConfigured } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import type { UserProfile } from '@/services/user-service';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  googleLoading: boolean;
  isAdmin: boolean;
  isVerified: boolean;
  login: (email: string, password: string) => Promise<any>;
  signup: (email: string, password: string, fullName: string) => Promise<any>;
  logout: () => Promise<void>;
  loginWithGoogle: () => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ADMIN_EMAIL = "admin@trading.com";

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
  const [googleLoading, setGoogleLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  
  const logout = useCallback(async () => {
    if (!isConfigured || !auth) return;
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
    if (!user || !isConfigured || !db) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const userRef = ref(db, `users/${user.uid}`);
    
    const unsubscribeProfile = onValue(userRef, (snapshot) => {
      if (snapshot.exists()) {
        const profileData = snapshot.val();
        
        if (!profileData.referralCode) {
            const newReferralCode = generateReferralCode(user.uid);
            profileData.referralCode = newReferralCode;
            const updates: { [key: string]: any } = {
              [`/users/${user.uid}/referralCode`]: newReferralCode,
              [`/referralCodes/${newReferralCode}`]: user.uid,
            };
            update(ref(db), updates).catch(err => {
                console.error("Failed to add referral code for existing user:", err);
            });
        }

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
    if (!isConfigured || !auth || !db) {
      toast({ variant: "destructive", title: "Login Failed", description: "Firebase is not configured. Please add your credentials to .env.local and restart the server." });
      throw new Error("Firebase not initialized");
    }
    const signInCredential = await signInWithEmailAndPassword(auth, email, password);
    const loggedInUser = signInCredential.user;
    const userRef = ref(db, 'users/' + loggedInUser.uid);
    
    const profileSnapshot = await get(userRef);
    const profile = profileSnapshot.val();

    if (profile && !profile.active) {
        await signOut(auth);
        throw new Error("Your account has been deactivated. Please contact customer support.");
    }
    
    const updates: any = { lastLogin: new Date().toISOString() };

    if (loggedInUser.email === ADMIN_EMAIL) {
        updates.isAdmin = true;
    }
    
    if (profile) {
        await update(userRef, updates);
    }
    
    return signInCredential;
  }, [toast]);
  
  const signup = useCallback(async (email: string, password: string, fullName: string) => {
    if (!isConfigured || !auth || !db) {
      toast({ variant: "destructive", title: "Signup Failed", description: "Firebase is not configured. Please add your credentials to .env.local and restart the server." });
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
    
  const loginWithGoogle = useCallback(async () => {
    if (!isConfigured || !auth || !db) {
      toast({ variant: "destructive", title: "Google Sign-In Failed", description: "Firebase is not configured. Please add your credentials to .env.local and restart the server." });
      throw new Error("Firebase not initialized");
    }
    setGoogleLoading(true);
    const googleProvider = new GoogleAuthProvider();
    try {
      const userCredential = await signInWithPopup(auth, googleProvider);
      const googleUser = userCredential.user;
      
      const userRef = ref(db, 'users/' + googleUser.uid);
      const profileSnapshot = await get(userRef);
      let profile = profileSnapshot.val();

      if (profile && !profile.active) {
          await signOut(auth);
          throw new Error("Your account has been deactivated. Please contact customer support.");
      } else if (!profile) {
          const referralCode = generateReferralCode(googleUser.uid);
          const newProfile: Omit<UserProfile, 'walletBalance' | 'online' | 'lastSeen' | 'invites' | 'referralCount' | 'portfolio'> = {
              uid: googleUser.uid,
              email: googleUser.email!,
              displayName: googleUser.displayName || googleUser.email!,
              createdAt: new Date().toISOString(),
              active: true,
              verified: false,
              lastLogin: new Date().toISOString(),
              referralCode: referralCode,
          };
          
          const updates: { [key: string]: any } = {};
          updates[`/users/${googleUser.uid}`] = newProfile;
          updates[`/referralCodes/${referralCode}`] = googleUser.uid;
          
          await update(ref(db), updates);

          setUserProfile(newProfile as UserProfile);
      } else {
          // Existing user, just update last login
          const updates: any = { lastLogin: new Date().toISOString() };
          if (!profile.referralCode) {
              const referralCode = generateReferralCode(googleUser.uid);
              updates.referralCode = referralCode;
              await set(ref(db, `/referralCodes/${referralCode}`), googleUser.uid);
              await update(ref(db, `/users/${googleUser.uid}`), { referralCode: referralCode });
          }
          await update(ref(db, `/users/${googleUser.uid}`), updates);
      }
      
      return userCredential;
    } catch (error: any) {
        console.error("Google Sign-In Error:", error);
        // Do not toast specific error messages that might confuse the user, just throw.
        throw error;
    } finally {
      setGoogleLoading(false);
    }
  }, [toast]);


  const value = {
    user,
    userProfile,
    loading,
    googleLoading,
    isAdmin,
    isVerified,
    login,
    signup,
    logout,
    loginWithGoogle
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
