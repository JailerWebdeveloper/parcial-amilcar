import { useState } from 'react';

const Settings = () => {
  const [settings, setSettings] = useState({
    notifications: true,
    darkMode: false,
    dataRefreshRate: '5'
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings({
      ...settings,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Here you would typically send the settings to your API
    alert('Settings saved!');
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-6">Settings</h2>
      
      <div className="bg-white rounded-lg shadow p-6">
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-4">Preferences</h3>
            
            <div className="flex items-center justify-between py-3 border-b">
              <div>
                <p className="font-medium">Enable Notifications</p>
                <p className="text-sm text-gray-500">Receive alerts and updates</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="notifications"
                  checked={settings.notifications}
                  onChange={handleChange}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between py-3 border-b">
              <div>
                <p className="font-medium">Dark Mode</p>
                <p className="text-sm text-gray-500">Use dark theme</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="darkMode"
                  checked={settings.darkMode}
                  onChange={handleChange}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
          
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-4">Data Settings</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data Refresh Rate (minutes)
              </label>
              <select 
                name="dataRefreshRate"
                value={settings.dataRefreshRate}
                onChange={handleChange}
                className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
              >
                <option value="1">1 minute</option>
                <option value="5">5 minutes</option>
                <option value="15">15 minutes</option>
                <option value="30">30 minutes</option>
                <option value="60">1 hour</option>
              </select>
            </div>
          </div>
          
          <div className="flex justify-end">
            <button 
              type="submit"
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
            >
              Save Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Settings;