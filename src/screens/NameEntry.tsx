import React, { useState } from 'react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { PrivateScreen } from '../components/PrivateScreen';
import { useGameStore } from '../store/gameStore';
import { useTranslation } from '../hooks/useTranslation';
import { getSpies } from '../utils/gameLogic';

export function NameEntry() {
  const [playerName, setPlayerName] = useState('');
  const [showRole, setShowRole] = useState(false);
  const [currentPlayerRole, setCurrentPlayerRole] = useState<'spy' | 'resistance' | null>(null);
  const [currentPlayerId, setCurrentPlayerId] = useState<string | null>(null);
  const { players, totalPlayers, addPlayer } = useGameStore();
  const { t } = useTranslation();

  // Find the next player that needs a name
  const currentPlayerIndex = players.findIndex(p => p.name.startsWith('Player '));
  const hasMorePlayers = currentPlayerIndex !== -1;

  const handleSubmitName = () => {
    if (playerName.trim() && hasMorePlayers) {
      const placeholderPlayer = players[currentPlayerIndex];
      const role = placeholderPlayer?.role ?? null;
      
      addPlayer(playerName.trim());
      
      // Show the role to the player
      setCurrentPlayerRole(role);
      setCurrentPlayerId(placeholderPlayer?.id ?? null);
      setShowRole(true);
      setPlayerName('');
    }
  };

  const handleRoleScreenClose = () => {
    setShowRole(false);
    setCurrentPlayerRole(null);
    setCurrentPlayerId(null);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmitName();
    }
  };

  if (showRole && currentPlayerRole) {
    const spies = getSpies(players);
    const otherSpies = currentPlayerId
      ? spies.filter(spy => spy.id !== currentPlayerId)
      : spies;

    return (
      <PrivateScreen onClose={handleRoleScreenClose}>
        <div className="text-center space-y-6">
          <h2 className="text-2xl font-bold text-white">
            {t('nameEntry.yourRole')}
          </h2>
          
          <div className={`text-6xl font-bold ${
            currentPlayerRole === 'spy' ? 'text-red-500' : 'text-blue-500'
          }`}>
            {currentPlayerRole === 'spy' ? t('nameEntry.spy') : t('nameEntry.resistance')}
          </div>
          
          <p className="text-gray-300 max-w-sm">
            {t(`nameEntry.roleDescription.${currentPlayerRole}`)}
          </p>
          
          {currentPlayerRole === 'spy' && otherSpies.length > 0 && (
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-red-400 mb-2">
                {t('nameEntry.spyList')}
              </h3>
              <ul className="text-white space-y-1">
                {otherSpies.map((spy, index) => (
                  <li key={index} className="font-medium">
                    {spy.name}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </PrivateScreen>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 safe-area-padding">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            {t('nameEntry.title')}
          </h1>
          <p className="text-gray-400">
            {t('nameEntry.playerNumber', { number: totalPlayers - players.filter(p => p.name.startsWith('Player ')).length + 1 })}
          </p>
        </div>

        <Card>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                {t('nameEntry.enterName')}
              </label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                onKeyPress={handleKeyPress}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[48px]"
                placeholder={t('nameEntry.enterName')}
                autoFocus
              />
            </div>

            <Button
              onClick={handleSubmitName}
              disabled={!playerName.trim()}
              fullWidth
              size="lg"
            >
              {t('common.next')}
            </Button>
          </div>
        </Card>

        {players.length > 0 && (
          <div className="mt-6 text-center">
            <p className="text-gray-400 text-sm">
              {players.filter(p => !p.name.startsWith('Player ')).length} / {totalPlayers} players added
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 
