import React, { useState } from 'react';

const Contributors = () => {
  const [samples, setSamples] = useState([
    { id: 1, name: 'Benjamin', createdAt: '2025-06-27' },
    { id: 2, name: 'Terrance', createdAt: '2025-06-27' },
    { id: 3, name: 'Qi Bin', createdAt: '2025-06-27' },
  ]);

  const addDummySample = () => {
    const newId = samples.length + 1;
    const newSample = {
      id: newId,
      name: `Sample ${String.fromCharCode(64 + newId)}`, 
      createdAt: new Date().toISOString().split('T')[0],
    };
    setSamples([...samples, newSample]);
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>📦 Contributors to be included</h2>
      <button onClick={addDummySample} style={styles.button}>
        ➕ Add Contributor
      </button>
      <ul style={styles.list}>
        {samples.map(sample => (
          <li key={sample.id} style={styles.listItem}>
            <strong>{sample.name}</strong> - Created on {sample.createdAt}
          </li>
        ))}
      </ul>
    </div>
  );
};

const styles = {
  container: {
    padding: '1.5rem',
    maxWidth: '600px',
    margin: '0 auto',
    backgroundColor: '#f9f9f9',
    borderRadius: '12px',
    boxShadow: '0 0 12px rgba(0,0,0,0.1)',
  },
  title: {
    textAlign: 'center',
    marginBottom: '1rem',
  },
  button: {
    marginBottom: '1rem',
    padding: '0.5rem 1rem',
    backgroundColor: '#4caf50',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  list: {
    listStyle: 'none',
    paddingLeft: 0,
  },
  listItem: {
    padding: '0.5rem 0',
    borderBottom: '1px solid #ccc',
  },
};

export default Contributors;