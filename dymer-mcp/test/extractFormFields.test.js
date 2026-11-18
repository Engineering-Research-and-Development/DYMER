import test from 'node:test';
import assert from 'node:assert/strict';
import { extractFormFields } from '../utils/extractFormFields.js';

test('estrae campi annidati senza duplicati', () => {
  const structure = {
    child: [
      { name: 'title', label: 'Titolo', type: 'text' },
      { child: [{ name: 'description', type: 'textarea' }] },
      { name: 'title', label: 'Duplicato' }
    ]
  };
  assert.deepEqual(extractFormFields(structure), [
    { name: 'title', label: 'Titolo', type: 'text' },
    { name: 'description', type: 'textarea' }
  ]);
});
