'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database, Notification } from '@/types/supabase';
import { motion, AnimatePresence } from 'framer-motion';

function isValidNotification(obj: any): obj is Notification {
  return (
    obj &&
    typeof obj.id === 'string' &&
    typeof obj.user_id === 'string' &&
    typeof obj.title === 'string' &&
    typeof obj.is_read === 'boolean' &&
    typeof obj.created_at === 'string'
  );
}

export default function Notification() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const supabase = createClientComponentClient<Database>();

  useEffect(() => {
    async function fetchNotifications() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching notifications:', error);
        return;
      }

      if (Array.isArray(data)) {
        setNotifications((data as unknown[]).filter(isValidNotification));
      }
    }

    fetchNotifications();
  }, [supabase]);

  const removeNotification = async (id: string) => {
    setNotifications((prev: Notification[]) => prev.filter((n: Notification) => n.id !== id));
    await supabase.from('notifications').delete().eq('id', id);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <AnimatePresence>
        {notifications.map((notification) => {
          const notif = notification as Notification;
          return (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, y: 50, scale: 0.3 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
              className="bg-white rounded-lg shadow-lg p-4 mb-4 max-w-sm"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-gray-800">{notif.title}</p>
                  {notif.body && (
                    <p className="text-sm text-gray-600 mt-1">{notif.body}</p>
                  )}
                </div>
                <button
                  onClick={() => removeNotification(notif.id)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <svg
                    className="h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
} 