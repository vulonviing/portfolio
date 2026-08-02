import test from 'node:test';
import assert from 'node:assert/strict';
import { isHandheldPhone, isPortraitViewport } from '../src/platform/handheld.js';

test('recognizes a touch-first phone without relying on a user-agent string', () => {
  assert.equal(isHandheldPhone({
    coarsePointer: true,
    maxTouchPoints: 5,
    noHover: true,
    screenHeight: 844,
    screenWidth: 390,
  }), true);
});

test('recognizes an Android phone through userAgentData.mobile', () => {
  assert.equal(isHandheldPhone({
    maxTouchPoints: 5,
    screenHeight: 915,
    screenWidth: 412,
    userAgentDataMobile: true,
  }), true);
});

test('does not treat a narrow desktop window as a phone', () => {
  assert.equal(isHandheldPhone({
    coarsePointer: false,
    maxTouchPoints: 0,
    noHover: false,
    screenHeight: 844,
    screenWidth: 390,
  }), false);
});

test('does not apply the phone-only stage to tablets or touch laptops', () => {
  assert.equal(isHandheldPhone({
    coarsePointer: true,
    maxTouchPoints: 5,
    noHover: true,
    screenHeight: 1024,
    screenWidth: 768,
  }), false);
  assert.equal(isHandheldPhone({
    coarsePointer: true,
    maxTouchPoints: 10,
    noHover: false,
    screenHeight: 768,
    screenWidth: 1366,
  }), false);
});

test('derives portrait state from the live viewport', () => {
  assert.equal(isPortraitViewport({ height: 844, width: 390 }), true);
  assert.equal(isPortraitViewport({ height: 390, width: 844 }), false);
});
