import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  sendEmailVerification,
  type User,
  type AuthError
} from 'firebase/auth';
import { auth } from '@/config/firebase';
import { analyticsService } from '@/services/analytics';

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  confirmPassword: string;
}

export class AuthService {
  private static instance: AuthService;
  
  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  private constructor() {}

  async login(credentials: LoginCredentials): Promise<AuthUser> {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth, 
        credentials.email, 
        credentials.password
      );
      
      // Check if email is verified
      if (!userCredential.user.emailVerified) {
        await signOut(auth);
        // Track failed login attempt
        analyticsService.trackError('Login failed - Email not verified', 'auth_service');
        throw new Error('Please verify your email before signing in. Check your inbox for the verification link.');
      }
      
      // Track successful login
      analyticsService.trackLogin('email');
      analyticsService.setUserId(userCredential.user.uid);
      
      return this.mapFirebaseUser(userCredential.user);
    } catch (error) {
      // Track login error
      analyticsService.trackError(`Login failed - ${(error as AuthError).code}`, 'auth_service');
      throw this.handleAuthError(error as AuthError);
    }
  }

  async register(credentials: RegisterCredentials): Promise<void> {
    if (credentials.password !== credentials.confirmPassword) {
      // Track password mismatch error
      analyticsService.trackError('Registration failed - Password mismatch', 'auth_service');
      throw new Error('Passwords do not match');
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        credentials.email, 
        credentials.password
      );
      
      // Send email verification
      await sendEmailVerification(userCredential.user);
      
      // Track successful registration
      analyticsService.trackSignup('email');
      
      // Sign out immediately - no automatic login
      await signOut(auth);
    } catch (error) {
      // Track registration error
      analyticsService.trackError(`Registration failed - ${(error as AuthError).code}`, 'auth_service');
      throw this.handleAuthError(error as AuthError);
    }
  }

  async logout(): Promise<void> {
    try {
      // Track logout event
      analyticsService.logEvent('logout');
      
      await signOut(auth);
    } catch (error) {
      // Track logout error
      analyticsService.trackError(`Logout failed - ${(error as AuthError).code}`, 'auth_service');
      throw this.handleAuthError(error as AuthError);
    }
  }

  async sendPasswordReset(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(auth, email);
      
      // Track password reset request
      analyticsService.logEvent('password_reset_requested');
    } catch (error) {
      // Track password reset error
      analyticsService.trackError(`Password reset failed - ${(error as AuthError).code}`, 'auth_service');
      throw this.handleAuthError(error as AuthError);
    }
  }

  getCurrentUser(): AuthUser | null {
    const user = auth.currentUser;
    return user ? this.mapFirebaseUser(user) : null;
  }

  onAuthStateChanged(callback: (user: AuthUser | null) => void): () => void {
    return onAuthStateChanged(auth, (user) => {
      callback(user ? this.mapFirebaseUser(user) : null);
    });
  }

  private mapFirebaseUser(user: User): AuthUser {
    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName
    };
  }

  private handleAuthError(error: AuthError): Error {
    switch (error.code) {
      case 'auth/user-not-found':
        return new Error('No user found with this email address');
      case 'auth/wrong-password':
        return new Error('Incorrect password');
      case 'auth/email-already-in-use':
        return new Error('Email is already registered');
      case 'auth/weak-password':
        return new Error('Password is too weak');
      case 'auth/invalid-email':
        return new Error('Invalid email address');
      case 'auth/network-request-failed':
        return new Error('Network error. Please check your connection');
      case 'auth/user-disabled':
        return new Error('This account has been disabled');
      case 'auth/too-many-requests':
        return new Error('Too many failed attempts. Please try again later');
      default:
        return new Error(error.message || 'Authentication failed');
    }
  }
}