import test from 'node:test';
import assert from 'node:assert/strict';
import {
  copyFor,
  DEFAULT_LANGUAGE,
  LANGUAGE_STORAGE_KEY,
  noteName,
  readStoredLanguage,
  sectionLabel,
  storeLanguage,
} from '../src/i18n.js';

function memoryStorage(initialValue = null) {
  let value = initialValue;
  return {
    getItem(key) {
      return key === LANGUAGE_STORAGE_KEY ? value : null;
    },
    setItem(key, next) {
      if (key === LANGUAGE_STORAGE_KEY) value = next;
    },
  };
}

test('English is the default and an explicit language choice is remembered', () => {
  const storage = memoryStorage();
  assert.equal(DEFAULT_LANGUAGE, 'en');
  assert.equal(readStoredLanguage(storage), 'en');
  assert.equal(storeLanguage('tr', storage), 'tr');
  assert.equal(readStoredLanguage(storage), 'tr');
  assert.equal(storeLanguage('unsupported', storage), 'en');
});

test('interface copy, note names and song sections switch together', () => {
  assert.equal(copyFor('en').step, 'STEP');
  assert.equal(copyFor('tr').step, 'ADIM');
  assert.equal(noteName(61, 'en'), 'C♯');
  assert.equal(noteName(61, 'tr'), 'Do♯');
  assert.equal(sectionLabel('wish', 'en'), 'I wish');
  assert.equal(sectionLabel('verse-2', 'en'), 'Didn’t I say?');
  assert.equal(sectionLabel('chorus', 'en'), 'You wouldn’t understand');
  assert.equal(sectionLabel('wish', 'tr'), 'Dilerim ki');
  assert.equal(sectionLabel('verse-2', 'tr'), 'Demedim mi?');
  assert.equal(sectionLabel('chorus', 'tr'), 'Anlamazdın');
});
