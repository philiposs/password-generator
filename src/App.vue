<script setup>
import { computed, nextTick, onMounted, ref, watch } from "vue";
import {
  BookOpen,
  Check,
  Copy,
  Grid2X2,
  KeyRound,
  RefreshCw,
  ShieldCheck,
} from "@lucide/vue";
import {
  calculateEntropy,
  calculatePassphraseEntropy,
  generatePassphrase,
  generatePassword,
  getStrength,
} from "./password.js";

const mode = ref("random");
const length = ref(20);
const lowercase = ref(true);
const uppercase = ref(true);
const numbers = ref(true);
const symbols = ref(true);
const excludeAmbiguous = ref(true);
const wordCount = ref(6);
const separator = ref("-");
const capitalize = ref(false);
const includeNumber = ref(false);
const password = ref("");
const statusMessage = ref("");
const statusType = ref("");
const passwordOutput = ref(null);

const options = computed(() => ({
  length: length.value,
  lowercase: lowercase.value,
  uppercase: uppercase.value,
  numbers: numbers.value,
  symbols: symbols.value,
  excludeAmbiguous: excludeAmbiguous.value,
}));

const passphraseOptions = computed(() => ({
  wordCount: wordCount.value,
  separator: separator.value,
  capitalize: capitalize.value,
  includeNumber: includeNumber.value,
}));

const entropy = computed(() => {
  if (!password.value) return 0;
  return mode.value === "random"
    ? calculateEntropy(options.value)
    : calculatePassphraseEntropy(passphraseOptions.value);
});
const strength = computed(() => getStrength(entropy.value));

const createPassword = () => {
  try {
    password.value = mode.value === "random"
      ? generatePassword(options.value)
      : generatePassphrase(passphraseOptions.value);
    statusMessage.value = "";
    statusType.value = "";
  } catch (error) {
    password.value = "";
    statusMessage.value = error.message || "The password could not be generated.";
    statusType.value = "error";
  }
};

const copyPassword = async () => {
  if (!password.value) return;

  try {
    await navigator.clipboard.writeText(password.value);
  } catch {
    passwordOutput.value?.select();
    document.execCommand("copy");
  }

  statusMessage.value = "Copied to clipboard.";
  statusType.value = "success";
};

const normalizeLength = () => {
  length.value = Math.min(128, Math.max(4, Number(length.value) || 4));
};

const normalizeWordCount = () => {
  wordCount.value = Math.min(10, Math.max(6, Math.round(Number(wordCount.value) || 6)));
};

watch([mode, options, passphraseOptions], createPassword);
onMounted(async () => {
  await nextTick();
  createPassword();
});
</script>

<template>
  <div class="page">
    <header class="site-header">
      <div class="shell header-row">
        <a class="brand" href="/" aria-label="Password Generator home">
          <span class="brand-mark" aria-hidden="true"><KeyRound :size="20" /></span>
          <span>
            <strong>Password Generator</strong>
            <small>chleb.app</small>
          </span>
        </a>
        <div class="header-actions">
          <a class="hub-link" href="https://tools.chleb.app" title="All tools" aria-label="All tools">
            <Grid2X2 :size="18" aria-hidden="true" />
          </a>
          <span class="privacy">
            <span class="privacy-dot"></span>
            Runs locally in your browser
          </span>
        </div>
      </div>
    </header>

    <main class="shell main-content">
      <div class="intro">
        <p class="eyebrow">PASSWORD UTILITY</p>
        <h1>Password generator</h1>
        <p>Create strong, unique passwords or memorable passphrases on your device.</p>
      </div>

      <section class="generator" aria-labelledby="generator-title">
        <h2 id="generator-title" class="visually-hidden">Password generator</h2>

        <div class="generator-strip">
          <span>WEB CRYPTO</span>
          <span class="strip-line" aria-hidden="true"></span>
          <span>{{ mode === "random" ? "RANDOM PASSWORD" : "MEMORABLE PASSPHRASE" }}</span>
        </div>

        <div class="mode-picker" role="group" aria-label="Password type">
          <button
            type="button"
            :class="{ selected: mode === 'random' }"
            :aria-pressed="mode === 'random'"
            @click="mode = 'random'"
          >
            <KeyRound :size="17" aria-hidden="true" />
            Random
          </button>
          <button
            type="button"
            :class="{ selected: mode === 'memorable' }"
            :aria-pressed="mode === 'memorable'"
            @click="mode = 'memorable'"
          >
            <BookOpen :size="17" aria-hidden="true" />
            Memorable
          </button>
        </div>

        <div class="password-result">
          <div class="field-head">
            <label for="password-output">Generated password</label>
            <span>{{ password.length }} characters</span>
          </div>
          <div class="output-wrap">
            <textarea
              id="password-output"
              ref="passwordOutput"
              :value="password"
              readonly
              spellcheck="false"
              aria-describedby="strength-summary"
              :placeholder="mode === 'random' ? 'Choose at least one character type...' : 'Your passphrase will appear here...'"
            ></textarea>
            <button
              class="icon-button copy-button"
              type="button"
              title="Copy password"
              aria-label="Copy password"
              :disabled="!password"
              @click="copyPassword"
            >
              <Copy :size="18" aria-hidden="true" />
            </button>
          </div>

          <div id="strength-summary" class="strength-row">
            <div class="strength-meter" aria-hidden="true">
              <span
                v-for="segment in 4"
                :key="segment"
                :class="{ active: password && segment <= strength.level }"
              ></span>
            </div>
            <p>
              <strong>{{ password ? strength.label : "Unavailable" }}</strong>
              <span v-if="password">Estimated {{ entropy }} bits</span>
            </p>
          </div>
        </div>

        <div v-if="mode === 'random'" class="settings">
          <div class="length-control">
            <div class="setting-title">
              <div>
                <h3>Password length</h3>
                <p>Longer passwords provide more entropy.</p>
              </div>
              <input
                v-model.number="length"
                class="length-input"
                type="number"
                min="4"
                max="128"
                aria-label="Password length"
                @blur="normalizeLength"
              />
            </div>
            <input
              v-model.number="length"
              type="range"
              min="4"
              max="128"
              step="1"
              aria-label="Password length"
            />
            <div class="range-labels" aria-hidden="true">
              <span>4</span>
              <span>128</span>
            </div>
          </div>

          <fieldset class="character-options">
            <legend>Character types</legend>
            <label>
              <span>
                <strong>Lowercase</strong>
                <small>abcdefghijklmnopqrstuvwxyz</small>
              </span>
              <input v-model="lowercase" type="checkbox" />
              <span class="checkbox" aria-hidden="true"><Check :size="14" /></span>
            </label>
            <label>
              <span>
                <strong>Uppercase</strong>
                <small>ABCDEFGHIJKLMNOPQRSTUVWXYZ</small>
              </span>
              <input v-model="uppercase" type="checkbox" />
              <span class="checkbox" aria-hidden="true"><Check :size="14" /></span>
            </label>
            <label>
              <span>
                <strong>Numbers</strong>
                <small>0123456789</small>
              </span>
              <input v-model="numbers" type="checkbox" />
              <span class="checkbox" aria-hidden="true"><Check :size="14" /></span>
            </label>
            <label>
              <span>
                <strong>Symbols</strong>
                <small>!@#$%^&amp;*()-_=+</small>
              </span>
              <input v-model="symbols" type="checkbox" />
              <span class="checkbox" aria-hidden="true"><Check :size="14" /></span>
            </label>
          </fieldset>

          <label class="ambiguous-option">
            <span>
              <strong>Exclude ambiguous characters</strong>
              <small>Removes characters such as I, l, 1, O, 0, and o.</small>
            </span>
            <input v-model="excludeAmbiguous" type="checkbox" />
            <span class="switch" aria-hidden="true"></span>
          </label>
        </div>

        <div v-else class="settings memorable-settings">
          <div class="length-control">
            <div class="setting-title">
              <div>
                <h3>Number of words</h3>
                <p>Six random words is the recommended minimum.</p>
              </div>
              <input
                v-model.number="wordCount"
                class="length-input"
                type="number"
                min="6"
                max="10"
                aria-label="Number of words"
                @blur="normalizeWordCount"
              />
            </div>
            <input
              v-model.number="wordCount"
              type="range"
              min="6"
              max="10"
              step="1"
              aria-label="Number of words"
            />
            <div class="range-labels" aria-hidden="true">
              <span>6</span>
              <span>10</span>
            </div>
          </div>

          <div class="passphrase-options">
            <label class="separator-option" for="separator">
              <span>
                <strong>Separator</strong>
                <small>Choose how the words are joined.</small>
              </span>
              <select id="separator" v-model="separator">
                <option value="-">Hyphen (-)</option>
                <option value=".">Period (.)</option>
                <option value="_">Underscore (_)</option>
                <option value=" ">Space</option>
              </select>
            </label>
            <fieldset class="character-options passphrase-toggles">
              <legend class="visually-hidden">Passphrase options</legend>
              <label>
                <span>
                  <strong>Capitalize words</strong>
                  <small>Useful when a site requires uppercase letters.</small>
                </span>
                <input v-model="capitalize" type="checkbox" />
                <span class="checkbox" aria-hidden="true"><Check :size="14" /></span>
              </label>
              <label>
                <span>
                  <strong>Add a number</strong>
                  <small>Appends a random digit after the last word.</small>
                </span>
                <input v-model="includeNumber" type="checkbox" />
                <span class="checkbox" aria-hidden="true"><Check :size="14" /></span>
              </label>
            </fieldset>
          </div>
        </div>

        <div class="toolbar">
          <p class="security-note">
            <ShieldCheck :size="17" aria-hidden="true" />
            Generated with Web Crypto
            <a
              v-if="mode === 'memorable'"
              href="https://www.eff.org/dice"
              target="_blank"
              rel="noopener noreferrer"
            >EFF wordlist</a>
          </p>
          <p class="status" :class="statusType" role="status" aria-live="polite">
            {{ statusMessage }}
          </p>
          <div class="actions">
            <button class="button secondary" type="button" @click="createPassword">
              <RefreshCw :size="18" aria-hidden="true" />
              Generate again
            </button>
            <button class="button primary" type="button" :disabled="!password" @click="copyPassword">
              <Copy :size="18" aria-hidden="true" />
              Copy password
            </button>
          </div>
        </div>
      </section>
    </main>

    <footer>
      <div class="shell footer-row">
        <p>chleb.app</p>
        <p>Simple, private, and processed locally.</p>
      </div>
    </footer>
  </div>
</template>
