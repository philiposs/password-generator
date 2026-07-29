import assert from "node:assert/strict";
import { webcrypto } from "node:crypto";
import test from "node:test";
import {
  calculateEntropy,
  generatePassword,
  getCharacterSets,
  getStrength,
} from "../src/password.js";

const defaults = {
  length: 24,
  lowercase: true,
  uppercase: true,
  numbers: true,
  symbols: true,
  excludeAmbiguous: false,
};

test("generates the requested length and includes every selected character type", () => {
  const password = generatePassword(defaults, webcrypto);

  assert.equal(password.length, 24);
  assert.match(password, /[a-z]/);
  assert.match(password, /[A-Z]/);
  assert.match(password, /[0-9]/);
  assert.match(password, /[!@#$%^&*()\-_=+\[\]{};:,.?]/);
});

test("excludes ambiguous characters", () => {
  const password = generatePassword(
    { ...defaults, length: 128, symbols: false, excludeAmbiguous: true },
    webcrypto,
  );

  assert.doesNotMatch(password, /[Il1O0o|]/);
});

test("requires at least one character type", () => {
  assert.throws(
    () => generatePassword({
      ...defaults,
      lowercase: false,
      uppercase: false,
      numbers: false,
      symbols: false,
    }, webcrypto),
    /Select at least one character type/,
  );
});

test("validates password length", () => {
  assert.throws(() => generatePassword({ ...defaults, length: 3 }, webcrypto), /between 4 and 128/);
  assert.throws(() => generatePassword({ ...defaults, length: 129 }, webcrypto), /between 4 and 128/);
});

test("calculates entropy and strength from the active pool", () => {
  const entropy = calculateEntropy(defaults);

  assert.ok(entropy > 100);
  assert.deepEqual(getStrength(entropy), { label: "Strong", level: 4 });
  assert.equal(getCharacterSets(defaults).length, 4);
});
