import { HashRouter } from 'react-router-dom';
import { AppRoutes } from './routes/AppRoutes';
import { RouteBridge } from './routes/RouteBridge';

const initialRoute = window.__WEBVIEW_INITIAL_ROUTE__ ?? '/bitmap';

const App: React.FC = () => {
  return (
    <HashRouter window={window}>
      <RouteBridge />
      <AppRoutes />
    </HashRouter>
  );
};

if (!window.location.hash) {
  window.location.hash = initialRoute;
}

export default App;
