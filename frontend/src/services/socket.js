// frontend/src/services/socket.js
import { io } from 'socket.io-client';

// Use the same URL as your backend API
// const URL = 'http://localhost:5001';
const URL = 'https://itmanagement.bylinelms.com';

export const socket = io(URL, {
  autoConnect: false // We will connect manually from the component
});