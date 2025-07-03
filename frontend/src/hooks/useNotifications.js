// src/hooks/useNotifications.js

import { useState, useEffect } from 'react';

export const useNotifications = () => {
    const [permission, setPermission] = useState(Notification.permission);

    useEffect(() => {
        if (Notification.permission === 'default') {
            Notification.requestPermission().then(setPermission);
        }
    }, []);

    const showNotification = (title, options) => {
        if (permission === 'granted') {
            new Notification(title, options);
        }
    };

    return { showNotification };
};