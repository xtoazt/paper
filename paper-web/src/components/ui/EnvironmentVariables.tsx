/**
 * Environment Variables Component
 * Manage environment variables for projects
 */

import { useState } from 'react';

export function EnvironmentVariables({ projectId }: { projectId: string | null }) {
  const [vars, setVars] = useState([
    { key: 'DATABASE_URL', value: 'postgresql://...', masked: true },
    { key: 'API_KEY', value: 'sk_live_...', masked: true },
    { key: 'NODE_ENV', value: 'production', masked: false }
  ]);

  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');

  const addVariable = () => {
    if (newKey && newValue) {
      setVars([...vars, { key: newKey, value: newValue, masked: true }]);
      setNewKey('');
      setNewValue('');
    }
  };

  return (
    <div className="env-variables">
      <h2>Environment Variables</h2>

      <div className="add-var-form">
        <input
          type="text"
          placeholder="KEY"
          value={newKey}
          onChange={(e) => setNewKey(e.target.value)}
        />
        <input
          type="text"
          placeholder="Value"
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
        />
        <button onClick={addVariable}>Add Variable</button>
      </div>

      <div className="vars-list">
        {vars.map((v, index) => (
          <div key={index} className="var-item">
            <span className="var-key">{v.key}</span>
            <span className="var-value">
              {v.masked ? '••••••••' : v.value}
            </span>
            <div className="var-actions">
              <button className="edit-btn">Edit</button>
              <button className="delete-btn">Delete</button>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        .env-variables {
          padding: 2rem;
        }

        .env-variables h2 {
          font-size: 1.5rem;
          margin-bottom: 1.5rem;
        }

        .add-var-form {
          display: flex;
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .add-var-form input {
          flex: 1;
          padding: 0.75rem;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          font-size: 0.95rem;
        }

        .add-var-form button {
          padding: 0.75rem 1.5rem;
          background: #667eea;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
        }

        .vars-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .var-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
        }

        .var-key {
          font-weight: 600;
          color: #374151;
          min-width: 200px;
        }

        .var-value {
          flex: 1;
          color: #6b7280;
          font-family: monospace;
        }

        .var-actions {
          display: flex;
          gap: 0.5rem;
        }

        .edit-btn, .delete-btn {
          padding: 0.5rem 1rem;
          border: 1px solid #e5e7eb;
          background: white;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.85rem;
        }

        .delete-btn {
          color: #ef4444;
          border-color: #fee2e2;
        }

        .delete-btn:hover {
          background: #fee2e2;
        }
      `}</style>
    </div>
  );
}
