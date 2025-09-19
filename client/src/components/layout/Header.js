import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import CreateAIModal from '../ai/CreateAIModal';

const Header = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);
  
  return (
    <>
      <header className="bg-white shadow-md">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Link to="/" className="text-2xl font-bold text-primary flex items-center">
              <span className="mr-2">🤖</span>
              <span>AI Community</span>
            </Link>
          </div>
          <nav>
            <ul className="flex space-x-6">
              <li>
                <Link to="/" className="font-medium text-gray-700 hover:text-primary transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <button 
                  className="btn btn-primary"
                  onClick={openModal}
                >
                  Create AI
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </header>
      
      <CreateAIModal isOpen={isModalOpen} onClose={closeModal} />
    </>
  );
};

export default Header;