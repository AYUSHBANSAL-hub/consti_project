import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './dialog';
import OrSeparator from './orSeparator';
import { Separator } from '@radix-ui/react-separator';
import { FaCloudUploadAlt, FaDatabase, FaGoogleDrive, FaCloud } from 'react-icons/fa'; // Example icons

interface SideMenuProps {
  isVisible: boolean;
  onClose: () => void;
  onOpen: () => void;
}

const SideMenu: React.FC<SideMenuProps> = ({ isVisible, onClose, onOpen }) => {
  const [isMouseNearEdge, setIsMouseNearEdge] = useState(false);
  const [isSubmenuVisible, setIsSubmenuVisible] = useState(false);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (event.clientX <= 10) {
        setIsMouseNearEdge(true);
        onOpen();
      } else {
        setIsMouseNearEdge(false);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [onOpen]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isVisible) {
      document.addEventListener('keydown', handleKeyDown);
    } else {
      document.removeEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isVisible, onClose]);

  const toggleSubmenu = () => {
    setIsSubmenuVisible(prev => !prev);
  };

  return (
    <div className="relative">
      {/* Overlay */}
      {isVisible && (
        <div
          className="fixed inset-0 bg-black opacity-50"
          style={{ zIndex: 50 }}
          onClick={onClose}
        ></div>
      )}

      <div
        className={`fixed top-0 left-0 h-full bg-gradient-to-b from-gray-100 to-gray-300 rounded-lg shadow-lg transform ${
          isVisible ? 'translate-x-0' : '-translate-x-full'
        } transition-transform duration-300 ease-in-out`}
        style={{ width: '250px', zIndex: 100 }}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex flex-col items-start justify-start h-screen p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-2 right-2 text-gray-600 hover:text-gray-900 text-2xl"
            aria-label="Close side menu"
          >
            ×
          </button>
          <div className="w-full">
            <h1 className="text-4xl font-bold text-center mb-6 text-blue-600">Titan</h1>

            {/* Main menu item with dropdown */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2
                className="text-lg font-medium mb-4 cursor-pointer flex items-center"
                onClick={toggleSubmenu}
              >
                <FaCloudUploadAlt className="mr-2 text-blue-600" />
                {isSubmenuVisible ? 'Upload Files ^' : 'Upload Files >'}
              </h2>

              {isSubmenuVisible && (
                <div className="flex flex-col gap-2">
                  <div className="p-2 flex items-center text-blue-600 hover:bg-gray-200 rounded cursor-pointer">
                    <FaCloud className="mr-2" />
                    Upload from your computer
                  </div>
                  <Separator />
                  <Dialog>
                    <DialogTrigger asChild>
                      <div className="p-2 flex items-center text-blue-600 hover:bg-gray-200 rounded cursor-pointer">
                        <FaCloud className="mr-2" />
                        Connect to cloud
                      </div>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Connect to cloud</DialogTitle>
                        <DialogDescription>Connect to cloud to upload files</DialogDescription>
                      </DialogHeader>

                      <div className="grid grid-cols-1 gap-3">
                        <div className="p-2 flex items-center text-blue-600 hover:bg-gray-200 rounded cursor-pointer">
                          <FaDatabase className="mr-2" />
                          Connect with any database
                        </div>
                        <div className="p-2 flex items-center text-blue-600 hover:bg-gray-200 rounded cursor-pointer">
                          <FaGoogleDrive className="mr-2" />
                          Connect with drive
                        </div>
                        <div className="p-2 flex items-center text-blue-600 hover:bg-gray-200 rounded cursor-pointer">
                          <FaCloud className="mr-2" />
                          Connect with GCS
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SideMenu;
