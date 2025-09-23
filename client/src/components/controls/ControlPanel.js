import React from 'react';
import { useAI } from '../../context/AIContext';

const ControlPanel = ({ autoPublish, setAutoPublish, aiInteraction, setAiInteraction }) => {
  const { createAICharacter, aiCharacters, createPost, generateAIPosts, generateAIInteractions, updateAutomationSettings, resetAutomationSettings } = useAI();
  
  const handleCreateAI = () => {
    // In a real app, this would open a modal with a form
    // For now, we'll just create a random AI
    
    const personalities = ['friendly', 'analytical', 'creative', 'humorous', 'philosophical'];
    const professions = ['artist', 'scientist', 'writer', 'programmer', 'chef', 'teacher'];
    const interests = ['technology', 'art', 'music', 'science', 'literature', 'food', 'travel'];
    
    const randomName = `AI_${Math.floor(Math.random() * 1000)}`;
    const randomPersonality = personalities[Math.floor(Math.random() * personalities.length)];
    const randomProfession = professions[Math.floor(Math.random() * professions.length)];
    const randomInterests = [
      interests[Math.floor(Math.random() * interests.length)],
      interests[Math.floor(Math.random() * interests.length)]
    ];
    
    const aiData = {
      name: randomName,
      personality: randomPersonality,
      profession: randomProfession,
      interests: randomInterests,
      goal: `To be the best ${randomProfession} in the AI community`
    };
    
    createAICharacter(aiData);
  };
  
  const handlePublishAll = async () => {
    try {
      await generateAIPosts();
    } catch (error) {
      console.error('Error generating posts:', error);
    }
  };
  
  const handleResetSettings = async () => {
    try {
      await resetAutomationSettings();
      setAutoPublish(true);
      setAiInteraction(true);
      alert('Settings have been reset to defaults');
    } catch (error) {
      console.error('Error resetting settings:', error);
    }
  };
  
  // Handle automation settings changes
  const handleAutomationChange = async (setting, value) => {
    try {
      if (setting === 'autoPublish') {
        setAutoPublish(value);
        await updateAutomationSettings({ autoPublishEnabled: value });
      } else if (setting === 'aiInteraction') {
        setAiInteraction(value);
        await updateAutomationSettings({ aiInteractionEnabled: value });
      }
    } catch (error) {
      console.error(`Error updating ${setting}:`, error);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
      <h2 className="text-xl font-bold mb-4">Control Panel</h2>
      
      <div className="space-y-4">
        <div>
          <button 
            onClick={handleCreateAI}
            className="w-full btn btn-primary mb-2"
          >
            Create New AI Character
          </button>
          
          <button 
            onClick={handlePublishAll}
            className="w-full btn btn-secondary"
            disabled={aiCharacters.length === 0}
          >
            Make All AIs Post
          </button>
        </div>
        
        <div className="border-t border-gray-200 pt-4">
          <h3 className="text-lg font-semibold mb-3">Automation</h3>
          
          <div className="flex justify-between items-center mb-3">
            <label htmlFor="auto-publish" className="font-medium">
              Auto-Publish
            </label>
            <div className="relative inline-block w-12 h-6 transition duration-200 ease-in-out rounded-full">
              <input
                id="auto-publish"
                type="checkbox"
                className="absolute w-6 h-6 transition duration-200 ease-in-out bg-white border-2 border-gray-300 rounded-full appearance-none cursor-pointer peer checked:right-0 checked:bg-primary checked:border-primary"
                checked={autoPublish}
                onChange={() => handleAutomationChange('autoPublish', !autoPublish)}
              />
              <label
                htmlFor="auto-publish"
                className="block w-full h-full bg-gray-300 rounded-full peer-checked:bg-primary-light cursor-pointer"
              ></label>
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <label htmlFor="ai-interaction" className="font-medium">
              AI Interaction
            </label>
            <div className="relative inline-block w-12 h-6 transition duration-200 ease-in-out rounded-full">
              <input
                id="ai-interaction"
                type="checkbox"
                className="absolute w-6 h-6 transition duration-200 ease-in-out bg-white border-2 border-gray-300 rounded-full appearance-none cursor-pointer peer checked:right-0 checked:bg-primary checked:border-primary"
                checked={aiInteraction}
                onChange={() => handleAutomationChange('aiInteraction', !aiInteraction)}
              />
              <label
                htmlFor="ai-interaction"
                className="block w-full h-full bg-gray-300 rounded-full peer-checked:bg-primary-light cursor-pointer"
              ></label>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-200">
            <button 
              onClick={handleResetSettings}
              className="w-full btn bg-gray-200 text-gray-700 hover:bg-gray-300 text-sm"
            >
              Reset to Default Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ControlPanel;