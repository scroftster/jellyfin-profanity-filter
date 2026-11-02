/**
 * Dashboard Page Component
 * Main configuration page for the profanity filter plugin
 */

import React, { useState } from 'react';
import { FilterWord } from '../components/wordManager';
import { WordManager } from '../components/wordManager';

export interface DashboardProps {
  words: FilterWord[];
  onAddWord: (word: Omit<FilterWord, 'id'>) => void;
  onUpdateWord: (word: FilterWord) => void;
  onDeleteWord: (id: string) => void;
  onToggleWord: (id: string) => void;
}

export function Dashboard(props: DashboardProps): JSX.Element {
  const { words, onAddWord, onUpdateWord, onDeleteWord, onToggleWord } = props;
  
  const [filterEnabled, setFilterEnabled] = React.useState(true);
  const [confidenceThreshold, setConfidenceThreshold] = React.useState(0.5);
  const [actionOnProfanity, setActionOnProfanity] = React.useState<'mute' | 'skip' | 'both'>('both');

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>Jellyfin Profanity Filter</h1>
      
      {/* Global Settings */}
      <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
        <h2>Global Settings</h2>
        
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          {/* Enable/Disable Toggle */}
          <div style={{ flex: '1', minWidth: '200px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
              Enable Filter
            </label>
            <input
              type="checkbox"
              checked={filterEnabled}
              onChange={(e) => setFilterEnabled(e.target.checked)}
              style={{ marginRight: '10px' }}
            />
          </div>
          
          {/* Confidence Threshold */}
          <div style={{ flex: '1', minWidth: '200px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
              Confidence Threshold: {confidenceThreshold.toFixed(2)}
            </label>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.1"
              value={confidenceThreshold}
              onChange={(e) => setConfidenceThreshold(parseFloat(e.target.value))}
            />
          </div>
          
          {/* Action on Profanity */}
          <div style={{ flex: '1', minWidth: '200px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
              Action on Profanity Detected
            </label>
            <select
              value={actionOnProfanity}
              onChange={(e) => setActionOnProfanity(e.target.value as any)}
              style={{ width: '100%', padding: '8px' }}
            >
              <option value="mute">Mute (Pause Playback)</option>
              <option value="skip">Skip (Delay Resume)</option>
              <option value="both">Both Mute and Skip</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Word Manager */}
      <WordManager
        words={words}
        onAddWord={onAddWord}
        onUpdateWord={onUpdateWord}
        onDeleteWord={onDeleteWord}
        onToggleWord={onToggleWord}
      />
    </div>
  );
}
