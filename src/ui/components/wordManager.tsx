/**
 * Word Manager Component
 * UI for managing filtered words with variations support
 */

export interface FilterWord {
  id: string;
  word: string;
  category: 'slang' | 'explicit' | 'offensive' | 'custom';
  enabled: boolean;
}

export interface WordManagerProps {
  words: FilterWord[];
  onAddWord: (word: Omit<FilterWord, 'id'>) => void;
  onUpdateWord: (word: FilterWord) => void;
  onDeleteWord: (id: string) => void;
  onToggleWord: (id: string) => void;
}

export function WordManager(props: WordManagerProps): JSX.Element {
  const { words, onAddWord, onUpdateWord, onDeleteWord, onToggleWord } = props;
  
  const [newWord, setNewWord] = React.useState('');
  const [category, setCategory] = React.useState<FilterWord['category']>('custom');

  const handleAddWord = () => {
    if (newWord.trim()) {
      onAddWord({
        word: newWord.trim(),
        category,
        enabled: true
      });
      setNewWord('');
      setCategory('custom');
    }
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    onDeleteWord(id);
  };

  const handleToggle = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    onToggleWord(id);
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h2>Word Manager</h2>
      
      {/* Add Word Form */}
      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          value={newWord}
          onChange={(e) => setNewWord(e.target.value)}
          placeholder="Enter word to filter (e.g., F#ck, G#d)"
          style={{ padding: '8px', marginRight: '10px', width: '300px' }}
        />
        
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as FilterWord['category'])}
          style={{ padding: '8px', marginRight: '10px' }}
        >
          <option value="custom">Custom</option>
          <option value="slang">Slang</option>
          <option value="explicit">Explicit</option>
          <option value="offensive">Offensive</option>
        </select>
        
        <button onClick={handleAddWord} style={{ padding: '8px 16px' }}>
          Add Word
        </button>
      </div>

      {/* Word List */}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #ddd' }}>
            <th style={{ padding: '10px', textAlign: 'left' }}>Word</th>
            <th style={{ padding: '10px', textAlign: 'left' }}>Category</th>
            <th style={{ padding: '10px', textAlign: 'center' }}>Enabled</th>
            <th style={{ padding: '10px', textAlign: 'right' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {words.map((word) => (
            <tr key={word.id} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '10px' }}>{word.word}</td>
              <td style={{ padding: '10px' }}>{word.category}</td>
              <td style={{ padding: '10px', textAlign: 'center' }}>
                <input
                  type="checkbox"
                  checked={word.enabled}
                  onChange={(e) => onToggleWord(word.id)}
                  onClick={(e) => e.stopPropagation()}
                />
              </td>
              <td style={{ padding: '10px', textAlign: 'right' }}>
                <button
                  onClick={(e) => handleDelete(e, word.id)}
                  style={{ padding: '4px 8px', backgroundColor: '#ff4444', color: 'white', border: 'none', borderRadius: '4px' }}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {words.length === 0 && (
        <p style={{ textAlign: 'center', color: '#666' }}>
          No words added yet. Add a word above to start filtering.
        </p>
      )}
    </div>
  );
}
