import assert from "node:assert/strict";
import { webcrypto } from "node:crypto";
import test from "node:test";
import {
  calculateEntropy,
  calculatePassphraseEntropy,
  generatePassphrase,
  generatePassword,
  getCharacterSets,
  getStrength,
} from "../src/password.js";
import { EFF_WORDS } from "../src/eff-words.js";

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

const passphraseDefaults = {
  wordCount: 6,
  separator: " ",
  capitalize: false,
  includeNumber: false,
};

test("generates six words from the full EFF list", () => {
  const words = generatePassphrase(passphraseDefaults, webcrypto).split(" ");

  assert.equal(EFF_WORDS.length, 7776);
  assert.equal(new Set(EFF_WORDS).size, 7776);
  assert.equal(words.length, 6);
  assert.ok(words.every((word) => EFF_WORDS.includes(word)));
});

test("supports capitalization, separators, and a random digit", () => {
  const zeroCrypto = { getRandomValues: (buffer) => buffer.fill(0) };
  const passphrase = generatePassphrase({
    ...passphraseDefaults,
    separator: "-",
    capitalize: true,
    includeNumber: true,
  }, zeroCrypto);

  assert.equal(passphrase, "Abacus-Abacus-Abacus-Abacus-Abacus-Abacus-0");
});

test("validates passphrase options and secure randomness", () => {
  assert.throws(() => generatePassphrase({ ...passphraseDefaults, wordCount: 5 }, webcrypto), /between 6 and 10/);
  assert.throws(() => generatePassphrase({ ...passphraseDefaults, wordCount: 11 }, webcrypto), /between 6 and 10/);
  assert.throws(() => generatePassphrase({ ...passphraseDefaults, separator: "/" }, webcrypto), /valid word separator/);
  assert.throws(() => generatePassphrase(passphraseDefaults, null), /Secure random generation/);
});

test("passphrase entropy counts random choices, not formatting", () => {
  const basic = calculatePassphraseEntropy(passphraseDefaults);

  assert.equal(basic, Math.round(6 * Math.log2(7776)));
  assert.equal(calculatePassphraseEntropy({ ...passphraseDefaults, capitalize: true, separator: "-" }), basic);
  assert.equal(calculatePassphraseEntropy({ ...passphraseDefaults, includeNumber: true }),
    Math.round(6 * Math.log2(7776) + Math.log2(10)));
  assert.equal(calculatePassphraseEntropy({ ...passphraseDefaults, wordCount: 5 }), 0);
});
