import { Navigate, Route, Routes } from 'react-router-dom';
import { WebviewRoutes } from '../../shared/messages';
import { BitmapPage } from '../pages/BitmapPage';
import { HomePage } from '../pages/HomePage';

export function AppRoutes() {
  return (
    <Routes>
      <Route path={WebviewRoutes.home} element={<HomePage />} />
      <Route path={WebviewRoutes.bitmap} element={<BitmapPage />} />
      <Route path="*" element={<Navigate to={WebviewRoutes.bitmap} replace />} />
    </Routes>
  );
}
