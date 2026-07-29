<script setup>
import { computed, nextTick, onMounted, ref, watch } from "vue";
import {
  Check,
  Copy,
  KeyRound,
  RefreshCw,
  ShieldCheck,
} from "@lucide/vue";
import {
  calculateEntropy,
  generatePassword,
  getStrength,
} from "./password.js";

const length = ref(20);
const lowercase = ref(true);
const uppercase = ref(true);
const numbers = ref(true);
const symbols = ref(true);
const excludeAmbiguous = ref(true);
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

const entropy = computed(() => calculateEntropy(options.value));
const strength = computed(() => getStrength(entropy.value));

const createPassword = () => {
  try {
    password.value = generatePassword(options.value);
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

watch(options, createPassword, { deep: true });
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
        <span class="privacy">
          <span class="privacy-dot"></span>
          Runs locally in your browser
        </span>
      </div>
    </header>

    <main class="shell main-content">
      <div class="intro">
        <p class="eyebrow">PASSWORD UTILITY</p>
        <h1>Random password generator</h1>
        <p>Create strong, unique passwords using secure randomness on your device.</p>
      </div>

      <section class="generator" aria-labelledby="generator-title">
        <h2 id="generator-title" class="visually-hidden">Random password generator</h2>

        <div class="generator-strip">
          <span>WEB CRYPTO</span>
          <span class="strip-line" aria-hidden="true"></span>
          <span>RANDOM PASSWORD</span>
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
              placeholder="Choose at least one character type..."
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
                :class="{ active: segment <= strength.level }"
              ></span>
            </div>
            <p>
              <strong>{{ strength.label }}</strong>
              <span>Estimated {{ entropy }} bits</span>
            </p>
          </div>
        </div>

        <div class="settings">
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

        <div class="toolbar">
          <p class="security-note">
            <ShieldCheck :size="17" aria-hidden="true" />
            Generated with Web Crypto
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
