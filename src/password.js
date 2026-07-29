const CHARACTER_SETS = {
  lowercase: "abcdefghijklmnopqrstuvwxyz",
  uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  numbers: "0123456789",
  symbols: "!@#$%^&*()-_=+[]{};:,.?",
};

const AMBIGUOUS_CHARACTERS = new Set("Il1O0o|");
const UINT32_RANGE = 0x100000000;

const secureRandomInt = (max, cryptoProvider) => {
  if (!Number.isInteger(max) || max < 1) {
    throw new Error("The random range must be a positive integer.");
  }

  const limit = Math.floor(UINT32_RANGE / max) * max;
  const buffer = new Uint32Array(1);

  do {
    cryptoProvider.getRandomValues(buffer);
  } while (buffer[0] >= limit);

  return buffer[0] % max;
};

const pickCharacter = (characters, cryptoProvider) =>
  characters[secureRandomInt(characters.length, cryptoProvider)];

const shuffle = (characters, cryptoProvider) => {
  for (let index = characters.length - 1; index > 0; index -= 1) {
    const swapIndex = secureRandomInt(index + 1, cryptoProvider);
    [characters[index], characters[swapIndex]] = [characters[swapIndex], characters[index]];
  }

  return characters;
};

export const getCharacterSets = (options) => {
  const enabledSets = Object.entries(CHARACTER_SETS)
    .filter(([name]) => options[name])
    .map(([, characters]) => characters);

  if (!options.excludeAmbiguous) return enabledSets;

  return enabledSets.map((characters) =>
    [...characters].filter((character) => !AMBIGUOUS_CHARACTERS.has(character)).join(""),
  );
};

export const generatePassword = (options, cryptoProvider = globalThis.crypto) => {
  const length = Number(options.length);
  if (!Number.isInteger(length) || length < 4 || length > 128) {
    throw new Error("Password length must be between 4 and 128.");
  }

  if (!cryptoProvider?.getRandomValues) {
    throw new Error("Secure random generation is not available.");
  }

  const characterSets = getCharacterSets(options);
  if (!characterSets.length) {
    throw new Error("Select at least one character type.");
  }

  if (length < characterSets.length) {
    throw new Error("Password length is too short for the selected character types.");
  }

  const pool = characterSets.join("");
  const password = characterSets.map((characters) => pickCharacter(characters, cryptoProvider));

  while (password.length < length) {
    password.push(pickCharacter(pool, cryptoProvider));
  }

  return shuffle(password, cryptoProvider).join("");
};

export const calculateEntropy = (options) => {
  const poolSize = getCharacterSets(options).join("").length;
  return poolSize ? Math.round(Number(options.length) * Math.log2(poolSize)) : 0;
};

export const getStrength = (entropy) => {
  if (entropy < 40) return { label: "Weak", level: 1 };
  if (entropy < 60) return { label: "Fair", level: 2 };
  if (entropy < 90) return { label: "Good", level: 3 };
  return { label: "Strong", level: 4 };
};
