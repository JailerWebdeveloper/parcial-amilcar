// src/components/Dashboard.jsx
import React, { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import {
  BarChart2,
  MapPin,
  Calendar,
  Menu,
  X
} from 'lucide-react';

const Dashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const navItems = [
    {
      name: 'General',
      path: '/',
      icon: <BarChart2 size={20} />
    },
    {
      name: 'Localización',
      path: '/dashboard/localizacion',
      icon: <MapPin size={20} />
    },
    {
      name: 'Tiempo',
      path: '/dashboard/tiempo',
      icon: <Calendar size={20} />
    }
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-gray-800 text-white transition-all duration-300 ease-in-out`}>
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          {sidebarOpen && <h2 className="text-xl font-bold">Dashboard</h2>}
          <button onClick={toggleSidebar} className="p-1 rounded-md hover:bg-gray-700">
            {sidebarOpen ? <X size={20}/> : <Menu size={20}/>}
          </button>
        </div>

        <nav className="mt-6">
          <ul>
            {navItems.map(item => (
              <li key={item.name} className="px-4 py-2">
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center ${isActive ? 'text-blue-400' : 'text-gray-300'} hover:text-white transition-colors`
                  }
                >
                  <span className="mr-3">{item.icon}</span>
                  {sidebarOpen && <span>{item.name}</span>}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <header className="bg-white shadow-sm">
          <div className="px-6 py-4">
            <h1 className="text-2xl font-semibold text-gray-800">Data Dashboard</h1>
          </div>
        </header>
        
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
