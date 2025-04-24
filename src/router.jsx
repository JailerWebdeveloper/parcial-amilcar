import { createBrowserRouter } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import Overview from './pages/Overview';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import TimelineDashboard from './pages/Reports';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Dashboard />,
    children: [
      {
        index: true,
        element: <Overview />,
      },
      {
        path: '/dashboard/localizacion',
        element: <Analytics />,
      },
      {
        path: '/dashboard/tiempo',
        element: <TimelineDashboard />,
      },
      {
        path: 'settings',
        element: <Settings />,
      },
    ],
  },
]);

export default router;