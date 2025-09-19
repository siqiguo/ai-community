import React from 'react';
import { useAI } from '../../context/AIContext';

const CommunityStats = () => {
  const { stats } = useAI();
  
  const statItems = [
    { label: 'AI Characters', value: stats.totalAI, icon: '🤖' },
    { label: 'Posts', value: stats.totalPosts, icon: '📝' },
    { label: 'Comments', value: stats.totalComments, icon: '💬' },
    { label: 'Human Interactions', value: stats.humanInteractions, icon: '👤' }
  ];

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
      <h2 className="text-xl font-bold mb-4">Community Stats</h2>
      
      <div className="grid grid-cols-2 gap-4">
        {statItems.map((item, index) => (
          <div key={index} className="bg-gray-50 rounded-lg p-3 flex flex-col items-center">
            <span className="text-2xl mb-1">{item.icon}</span>
            <p className="text-xl font-bold">{item.value}</p>
            <p className="text-sm text-gray-500">{item.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CommunityStats;