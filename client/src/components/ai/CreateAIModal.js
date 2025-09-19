import React, { useState } from 'react';
import { useAI } from '../../context/AIContext';

const CreateAIModal = ({ isOpen, onClose }) => {
  const { createAICharacter, loading } = useAI();
  
  const [formData, setFormData] = useState({
    name: '',
    personality: '',
    profession: '',
    interests: '',
    goal: ''
  });
  
  const { name, personality, profession, interests, goal } = formData;
  
  const onChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  
  const handleSubmit = async e => {
    e.preventDefault();
    
    // Convert interests string to array
    const interestsArray = interests.split(',').map(interest => interest.trim());
    
    const aiData = {
      name,
      personality,
      profession,
      interests: interestsArray,
      goal
    };
    
    await createAICharacter(aiData);
    onClose();
    
    // Reset form
    setFormData({
      name: '',
      personality: '',
      profession: '',
      interests: '',
      goal: ''
    });
  };
  
  // If not open, don't render
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <h2 className="text-2xl font-bold mb-6">Create AI Character</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="name" className="block text-gray-700 font-medium mb-1">Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={name}
              onChange={onChange}
              className="w-full p-2 border border-gray-300 rounded focus:ring focus:ring-primary-light focus:outline-none"
              placeholder="AI character name"
              required
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="personality" className="block text-gray-700 font-medium mb-1">Personality</label>
            <select
              id="personality"
              name="personality"
              value={personality}
              onChange={onChange}
              className="w-full p-2 border border-gray-300 rounded focus:ring focus:ring-primary-light focus:outline-none"
              required
            >
              <option value="">Select personality</option>
              <option value="friendly">Friendly</option>
              <option value="analytical">Analytical</option>
              <option value="creative">Creative</option>
              <option value="humorous">Humorous</option>
              <option value="philosophical">Philosophical</option>
            </select>
          </div>
          
          <div className="mb-4">
            <label htmlFor="profession" className="block text-gray-700 font-medium mb-1">Profession</label>
            <input
              type="text"
              id="profession"
              name="profession"
              value={profession}
              onChange={onChange}
              className="w-full p-2 border border-gray-300 rounded focus:ring focus:ring-primary-light focus:outline-none"
              placeholder="e.g., Artist, Scientist, Writer"
              required
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="interests" className="block text-gray-700 font-medium mb-1">Interests</label>
            <input
              type="text"
              id="interests"
              name="interests"
              value={interests}
              onChange={onChange}
              className="w-full p-2 border border-gray-300 rounded focus:ring focus:ring-primary-light focus:outline-none"
              placeholder="e.g., technology, art, music (comma separated)"
              required
            />
          </div>
          
          <div className="mb-6">
            <label htmlFor="goal" className="block text-gray-700 font-medium mb-1">Goal</label>
            <textarea
              id="goal"
              name="goal"
              value={goal}
              onChange={onChange}
              className="w-full p-2 border border-gray-300 rounded focus:ring focus:ring-primary-light focus:outline-none"
              placeholder="What does this AI character want to achieve?"
              rows="3"
              required
            ></textarea>
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded font-medium text-gray-700 hover:bg-gray-100"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create AI'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateAIModal;