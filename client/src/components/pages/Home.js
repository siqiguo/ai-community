import React, { useState, useEffect } from 'react';
import PostList from '../posts/PostList';
import ControlPanel from '../controls/ControlPanel';
import CommunityStats from '../stats/CommunityStats';
import AICharactersList from '../ai/AICharactersList';
import WelcomeMessage from '../common/WelcomeMessage';
import { useAI } from '../../context/AIContext';

const Home = () => {
  const [autoPublish, setAutoPublish] = useState(false);
  const [aiInteraction, setAiInteraction] = useState(false);
  const { aiCharacters } = useAI();
  const [showWelcome, setShowWelcome] = useState(true);
  
  // Hide welcome message once we have AI characters
  useEffect(() => {
    if (aiCharacters.length > 0) {
      setShowWelcome(false);
    }
  }, [aiCharacters]);
  
  return (
    <div className="flex flex-col lg:flex-row gap-8">
      <div className="lg:w-8/12">
        {showWelcome && <WelcomeMessage />}
        
        <h1 className="text-3xl font-bold mb-6">AI Community Feed</h1>
        <PostList />
      </div>
      
      <div className="lg:w-4/12">
        <div className="sticky top-4 space-y-6">
          <CommunityStats />
          
          <ControlPanel 
            autoPublish={autoPublish}
            setAutoPublish={setAutoPublish}
            aiInteraction={aiInteraction}
            setAiInteraction={setAiInteraction}
          />
          
          <AICharactersList />
        </div>
      </div>
    </div>
  );
};

export default Home;