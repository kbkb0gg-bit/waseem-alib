import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, signOut, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import firebaseConfig from "../../firebase-applet-config.json";

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = () => signInWithPopup(auth, googleProvider);
export const signInWithGoogleRedirect = () => signInWithRedirect(auth, googleProvider);
export const registerWithEmail = (email: string, password: string) => createUserWithEmailAndPassword(auth, email, password);
export const loginWithEmail = (email: string, password: string) => signInWithEmailAndPassword(auth, email, password);
export const sendVerificationEmail = (user: any) => sendEmailVerification(user);
export const logout = () => signOut(auth);
