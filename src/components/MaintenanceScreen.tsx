import React from 'react';
import technicalWorkImage from '@/assets/technical-work.png';

interface MaintenanceScreenProps {
  message?: string;
}

export const MaintenanceScreen = ({ message }: MaintenanceScreenProps) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black flex items-center justify-center p-4">
      <div className="max-w-2xl mx-auto text-center">
        <div className="mb-8">
          <img 
            src={technicalWorkImage} 
            alt="Technical Work" 
            className="w-full h-auto max-w-lg mx-auto rounded-lg shadow-2xl"
          />
        </div>
        
        <div className="bg-black/40 backdrop-blur-sm rounded-lg p-8 border border-white/10">
          <h1 className="text-4xl font-bold text-white mb-4">
            Технические работы
          </h1>
          
          <p className="text-lg text-gray-300 mb-6">
            {message || 'Ведутся технические работы. Игра временно недоступна.'}
          </p>
          
          <div className="flex items-center justify-center space-x-2 text-primary">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            <span className="text-sm">Обновление системы...</span>
          </div>
          
          <p className="text-sm text-gray-400 mt-4">
            Приносим извинения за временные неудобства
          </p>
        </div>
      </div>
    </div>
  );
};