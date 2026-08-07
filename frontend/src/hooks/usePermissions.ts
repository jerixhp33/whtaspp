import { useState, useEffect, useCallback } from 'react';
import {
  PermissionState,
  notificationsCapability,
  microphoneCapability,
  cameraCapability,
  contactsCapability,
  filesCapability,
  platform
} from '@/capabilities';

export interface PermissionsStateMap {
  notifications: PermissionState;
  microphone: PermissionState;
  camera: PermissionState;
  contacts: PermissionState;
  files: PermissionState;
}

export function usePermissions() {
  const [permissions, setPermissions] = useState<PermissionsStateMap>({
    notifications: 'prompt',
    microphone: 'prompt',
    camera: 'prompt',
    contacts: 'prompt',
    files: 'granted',
  });
  const [loading, setLoading] = useState(true);

  const refreshPermissions = useCallback(async () => {
    try {
      const [notif, mic, cam, cont, files] = await Promise.all([
        notificationsCapability.getStatus(),
        microphoneCapability.getStatus(),
        cameraCapability.getStatus(),
        contactsCapability.getStatus(),
        filesCapability.getStatus(),
      ]);

      setPermissions({
        notifications: notif,
        microphone: mic,
        camera: cam,
        contacts: cont,
        files: files,
      });
    } catch (err) {
      console.warn('Error refreshing permissions:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshPermissions();

    // Auto-refresh when app gains focus or returns from background/settings
    const onFocus = () => refreshPermissions();
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        refreshPermissions();
      }
    };

    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [refreshPermissions]);

  const requestNotification = async () => {
    const res = await notificationsCapability.request();
    setPermissions((prev) => ({ ...prev, notifications: res }));
    return res;
  };

  const requestMicrophone = async () => {
    const res = await microphoneCapability.request();
    setPermissions((prev) => ({ ...prev, microphone: res }));
    return res;
  };

  const requestCamera = async () => {
    const res = await cameraCapability.request();
    setPermissions((prev) => ({ ...prev, camera: res }));
    return res;
  };

  const requestContacts = async () => {
    const res = await contactsCapability.request();
    setPermissions((prev) => ({ ...prev, contacts: res }));
    return res;
  };

  return {
    permissions,
    loading,
    refreshPermissions,
    requestNotification,
    requestMicrophone,
    requestCamera,
    requestContacts,
    platformName: platform.getPlatformName(),
    isInstalled: platform.isInstalled(),
  };
}
