import React from 'react';

const ComingSoon: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-screen bg-gray-900 text-white">
      <h1 className="text-4xl font-bold mb-4 text-green-400">Coming Soon!</h1>
      <p className="text-lg text-gray-300">This feature is currently under development.</p>
      <p className="text-lg text-gray-300">Check back later!</p>
    </div>
  );
};

export default ComingSoon;
