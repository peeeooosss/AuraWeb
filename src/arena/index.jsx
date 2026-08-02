import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import ArenaApp from './App';

export default function Arena() {
  return (
    <BrowserRouter>
      <ArenaApp />
    </BrowserRouter>
  );
}
