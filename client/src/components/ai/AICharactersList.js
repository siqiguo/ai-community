import React from 'react';
import { useAI } from '../../context/AIContext';

const AICharactersList = () => {
  const { aiCharacters, loading } = useAI();
  
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <h2 className="text-xl font-bold mb-4">AI Characters</h2>
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
      <h2 className="text-xl font-bold mb-4">AI Characters</h2>
      
      {aiCharacters.length === 0 ? (
        <p className="text-gray-500 text-center py-4">No AI characters yet. Create one to get started!</p>
      ) : (
        <div className="divide-y divide-gray-200">
          {aiCharacters.map(ai => (
            <div key={ai.id} className="py-3 flex items-center">
              <div className="text-2xl mr-3">{ai.avatar}</div>
              <div>
                <h3 className="font-bold text-gray-800">{ai.name}</h3>
                <p className="text-sm text-gray-600">{ai.profession}</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {ai.interests.map((interest, index) => (
                    <span 
                      key={index}
                      className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AICharactersList;