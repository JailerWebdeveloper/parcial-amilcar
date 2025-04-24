import React, { useState } from 'react';

export const Tabs = ({ children, value, onValueChange, className = '' }) => {
  const [activeTab, setActiveTab] = useState(value);

  const handleTabChange = (tabValue) => {
    setActiveTab(tabValue);
    if (onValueChange) {
      onValueChange(tabValue);
    }
  };

  // Clone children with props
  const enhancedChildren = React.Children.map(children, child => {
    if (!React.isValidElement(child)) return child;
    
    if (child.type === TabsList || child.type === TabsContent) {
      return React.cloneElement(child, {
        activeTab,
        onTabChange: handleTabChange
      });
    }
    return child;
  });

  return (
    <div className={`w-full ${className}`}>
      {enhancedChildren}
    </div>
  );
};

export const TabsList = ({ children, activeTab, onTabChange, className = '' }) => {
  // Clone children with props
  const enhancedChildren = React.Children.map(children, child => {
    if (!React.isValidElement(child)) return child;
    
    if (child.type === TabsTrigger) {
      return React.cloneElement(child, {
        isActive: activeTab === child.props.value,
        onTabChange
      });
    }
    return child;
  });

  return (
    <div className={`flex border-b border-gray-200 ${className}`}>
      {enhancedChildren}
    </div>
  );
};

export const TabsTrigger = ({ children, value, isActive, onTabChange, className = '' }) => (
  <button
    className={`px-4 py-2 text-sm font-medium ${
      isActive 
        ? 'border-b-2 border-blue-600 text-blue-600' 
        : 'text-gray-500 hover:text-gray-700'
    } ${className}`}
    onClick={() => onTabChange(value)}
  >
    {children}
  </button>
);

export const TabsContent = ({ children, value, activeTab, className = '' }) => {
  if (value !== activeTab) return null;
  
  return (
    <div className={`mt-4 ${className}`}>
      {children}
    </div>
  );
};