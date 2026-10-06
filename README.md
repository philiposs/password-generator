# Password Generator

A private browser-based password and passphrase generator using the Web Crypto API.

[Open the password generator](https://pass.chleb.app)

## Features

- Cryptographically secure random generation
- Lengths from 4 to 128 characters
- Configurable lowercase, uppercase, number, and symbol sets
- Optional removal of ambiguous characters
- Entropy estimate and strength indicator
- One-click copy
- Memorable passphrases made from six to ten independently chosen words
- Optional word separator, capitalization, and random digit

The memorable mode uses the [EFF Long Wordlist](https://www.eff.org/dice), licensed under [CC BY 4.0](https://www.eff.org/copyright). Six words provide about 77 bits of entropy. Formatting choices such as capitalization and separators do not increase the displayed estimate; adding a random digit does.

## Development

```bash
npm install
npm run dev
```

Run tests and create a production build with:

```bash
npm test
npm run build
```
