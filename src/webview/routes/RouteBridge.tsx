import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Notifications, WebviewRoutes } from '../../shared/messages';
import {
  notifyReady,
  notifyRouteChanged,
  startMessenger,
  webviewMessenger,
} from '../messenger/webviewMessenger';

export function RouteBridge() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    startMessenger();

    const initialRoute = window.__WEBVIEW_INITIAL_ROUTE__;
    if (initialRoute && initialRoute !== location.pathname) {
      navigate(initialRoute, { replace: true });
      notifyReady(initialRoute);
      return;
    }

    notifyReady(location.pathname || WebviewRoutes.bitmap);
  }, []);

  useEffect(() => {
    notifyRouteChanged(location.pathname);
  }, [location.pathname]);

  useEffect(() => {
    const disposable = webviewMessenger.onNotification(Notifications.navigateTo, (payload) => {
      navigate(payload.path);
    });

    return () => disposable.dispose();
  }, [navigate]);

  return null;
}
