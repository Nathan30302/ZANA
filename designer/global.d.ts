declare module '@expo/vector-icons';
declare module 'expo-router';
declare module '@react-native-async-storage/async-storage';
declare module 'zustand';

// Fallback for any other modules without types in this workspace
declare module '*-image' { const x: any; export default x; }

export {};
