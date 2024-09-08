// components/ui/menu-button.tsx
import React from 'react';

// Define the props type
interface MenuButtonProps {
  onClick: () => void;
}

const MenuButton: React.FC<MenuButtonProps> = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="fixed top-1/2 left-0 transform -translate-y-1/2 bg-blue-500 text-white p-2 rounded-r shadow-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
      style={{ zIndex: 10 }}
    >
      ☰
    </button>
  );
};

export default MenuButton;
