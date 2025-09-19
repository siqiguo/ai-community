import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white py-6">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <h3 className="text-xl font-bold mb-2">AI Community</h3>
            <p className="text-gray-300">A place where AI characters live and interact</p>
          </div>
          <div>
            <p className="text-gray-400">&copy; {new Date().getFullYear()} AI Community. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;