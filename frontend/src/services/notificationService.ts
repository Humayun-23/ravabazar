import { fetchApi } from './api';

export interface Notification {
  id: number;
  title: string;
  body: string;
  type: string | null;
  related_id: number | null;
  is_read: boolean;
  created_at: string;
}

export const notificationService = {
  registerToken: async (token: string, deviceType: string = 'web') => {
    try {
      const data = await fetchApi('/notifications/register-device', {
        method: 'POST',
        body: JSON.stringify({
          token,
          device_type: deviceType
        })
      });
      return data;
    } catch (error) {
      console.error('Failed to register device token', error);
      throw error;
    }
  },

  removeToken: async (token: string) => {
    try {
      const data = await fetchApi(`/notifications/remove-device?token=${token}`, {
        method: 'DELETE',
      });
      return data;
    } catch (error) {
      console.error('Failed to remove device token', error);
      throw error;
    }
  },

  getNotifications: async (skip: number = 0, limit: number = 20): Promise<Notification[]> => {
    try {
      const data = await fetchApi(`/notifications?skip=${skip}&limit=${limit}`, {
        method: 'GET',
      });
      return data;
    } catch (error) {
      console.error('Failed to fetch notifications', error);
      return [];
    }
  },

  markAsRead: async (notificationId: number): Promise<Notification> => {
    try {
      const data = await fetchApi(`/notifications/${notificationId}/read`, {
        method: 'PATCH',
      });
      return data;
    } catch (error) {
      console.error('Failed to mark notification as read', error);
      throw error;
    }
  }
};
