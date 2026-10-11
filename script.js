let currentMode = 'encode'; // 'encode' (Warm Amber) or 'decode' (Emerald)
    let currentPalette = 'classic'; // 'classic' or 'rose'

    /*
      The Hebrew alphabet comprises 22 standard letters (Alef to Tav, U+05D0 to U+05EA)
      plus 5 sofit / final letter forms (Khaf, Mem, Nun, Pe, Tsadi).
      
      We construct a 26-character sequence of Hebrew letters corresponding to 
      the 26 English alphabet letters (A-Z):
      Index 0..21: The 22 standard Hebrew letters
      Index 22..25: The first 4 final forms (ך, ם, ן, ף)
      This provides a direct 1:1 reversible mapping with 26 letters!
      
      To preserve Latin capitalization reversibly without altering text flow,
      uppercase letters get a subtle, standard Hebrew vowel point (Dagesh / dot U+05BC).
      Lower-case letters remain plain Hebrew characters.
      Numbers, punctuation, linebreaks, and symbols remain untouched.
    */
    const HEBREW_ALPHABET = [
      '\u05D0', // 0: Alef  -> a
      '\u05D1', // 1: Bet   -> b
      '\u05D2', // 2: Gimel -> c
      '\u05D3', // 3: Dalet -> d
      '\u05D4', // 4: He    -> e
      '\u05D5', // 5: Vav   -> f
      '\u05D6', // 6: Zayin -> g
      '\u05D7', // 7: Het   -> h
      '\u05D8', // 8: Tet   -> i
      '\u05D9', // 9: Yod   -> j
      '\u05DA', // 10: Kaf  -> k
      '\u05DC', // 11: Lamed-> l
      '\u05DD', // 12: Mem  -> m
      '\u05DE', // 13: Nun  -> n
      '\u05DF', // 14: Samekh -> o
      '\u05E0', // 15: Ayin -> p
      '\u05E1', // 16: Pe   -> q
      '\u05E2', // 17: Tsadi-> r
      '\u05E3', // 18: Qof  -> s
      '\u05E4', // 19: Resh -> t
      '\u05E5', // 20: Shin -> u
      '\u05E6', // 21: Tav  -> v
      '\u05E7', // 22: Qof2 / Sofit Kaf -> w
      '\u05E8', // 23: Resh2 / Sofit Mem -> x
      '\u05E9', // 24: Shin2 / Sofit Nun -> y
      '\u05EA'  // 25: Tav2 / Sofit Pe  -> z
    ];

    const DAGESH_MARK = '\u05BC'; // Marks uppercase letter in Hebrew

    // Build reverse map for fast O(1) lookup
    const HEBREW_TO_INDEX = new Map();
    HEBREW_ALPHABET.forEach((char, idx) => {
      HEBREW_TO_INDEX.set(char, idx);
    });

    const inputArea = document.getElementById('input-text');
    const outputBox = document.getElementById('output-text');
    const keyInput = document.getElementById('secret-key');
    const inputCount = document.getElementById('input-count');
    const outputCount = document.getElementById('output-count');
    const toast = document.getElementById('toast');
    const pasteHint = document.getElementById('paste-hint');

    // Parse passcode into a shift offset modulo 26
    function parseShift(keyStr) {
      if (!keyStr || keyStr.length === 0) return 0;
      
      const parsedNum = parseInt(keyStr, 10);
      if (!isNaN(parsedNum) && /^-?\d+$/.test(keyStr.trim())) {
        return ((parsedNum % 26) + 26) % 26;
      }

      // If passphrase or word, compute deterministic shift hash
      let hash = 0;
      for (let i = 0; i < keyStr.length; i++) {
        hash = (hash * 31 + keyStr.charCodeAt(i)) % 26;
      }
      return (hash + 26) % 26;
    }

    function encodeToHebrew(text, keyStr) {
      if (!text) return '';
      const shift = parseShift(keyStr);
      let result = '';

      for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const code = text.charCodeAt(i);

        if (code >= 65 && code <= 90) {
          // Uppercase Latin (A-Z)
          const index = code - 65;
          const shiftedIndex = (index + shift) % 26;
          // Attach Dagesh mark to designate uppercase
          result += HEBREW_ALPHABET[shiftedIndex] + DAGESH_MARK;
        } else if (code >= 97 && code <= 122) {
          // Lowercase Latin (a-z)
          const index = code - 97;
          const shiftedIndex = (index + shift) % 26;
          result += HEBREW_ALPHABET[shiftedIndex];
        } else {
          // Numbers, punctuation, emojis, spaces preserved untouched
          result += char;
        }
      }
      return result;
    }

    function decodeFromHebrew(text, keyStr) {
      if (!text) return '';
      const shift = parseShift(keyStr);
      let result = '';

      for (let i = 0; i < text.length; i++) {
        const char = text[i];

        if (HEBREW_TO_INDEX.has(char)) {
          const index = HEBREW_TO_INDEX.get(char);
          const originalIndex = (index - shift + 26) % 26;

          // Check if followed by uppercase mark (Dagesh)
          const hasUppercaseMark = (i + 1 < text.length && text[i + 1] === DAGESH_MARK);
          if (hasUppercaseMark) {
            result += String.fromCharCode(65 + originalIndex);
            i++; // skip past the dagesh
          } else {
            result += String.fromCharCode(97 + originalIndex);
          }
        } else if (char === DAGESH_MARK) {
          // Stray mark ignored if encountered out-of-order
          continue;
        } else {
          // Non-encoded character (punctuation, numbers, spacing)
          result += char;
        }
      }
      return result;
    }

    function processText() {
      const text = inputArea.value;
      const key = keyInput.value;
      const isEncoding = (currentMode === 'encode');

      inputCount.textContent = `${text.length} chars`;

      if (!text) {
        outputBox.textContent = 'Result will appear here...';
        outputBox.classList.add('empty');
        outputBox.classList.remove('decoded-view');
        outputCount.textContent = '0 chars';
        return;
      }

      const result = isEncoding ? encodeToHebrew(text, key) : decodeFromHebrew(text, key);
      outputBox.textContent = result;
      outputBox.classList.remove('empty');

      if (isEncoding) {
        outputBox.classList.remove('decoded-view');
      } else {
        outputBox.classList.add('decoded-view');
      }

      outputCount.textContent = `${result.length} chars`;
    }

    function switchMode(mode) {
      currentMode = mode;
      
      const tabEncode = document.getElementById('tab-encode');
      const tabDecode = document.getElementById('tab-decode');
      const inputLabel = document.getElementById('input-label');
      const outputLabel = document.getElementById('output-label');
      const modeBadge = document.getElementById('mode-badge');

      if (mode === 'encode') {
        // ENCODE = Warm Amber
        document.body.classList.remove('mode-decode');
        tabEncode.classList.add('active');
        tabDecode.classList.remove('active');
        modeBadge.textContent = 'Encode Mode';
        inputLabel.textContent = 'Original Message (English)';
        outputLabel.textContent = 'Encoded Result (Script)';
        inputArea.placeholder = 'Type your message in English...';
      } else {
        // DECODE = Emerald Green
        document.body.classList.add('mode-decode');
        tabDecode.classList.add('active');
        tabEncode.classList.remove('active');
        modeBadge.textContent = 'Decode Mode';
        inputLabel.textContent = 'Encoded Message (Script)';
        outputLabel.textContent = 'Decoded Result (English)';
        inputArea.placeholder = 'Paste encoded script here to decode...';
      }

      processText();
    }

    // Palette Switcher: Classic (Slate) vs Rose
    function togglePalette() {
      const themeBtnName = document.getElementById('theme-name');
      if (currentPalette === 'classic') {
        currentPalette = 'rose';
        document.body.classList.add('theme-rose');
        themeBtnName.textContent = 'Rose';
        showToast('Switched to Rose style');
      } else {
        currentPalette = 'classic';
        document.body.classList.remove('theme-rose');
        themeBtnName.textContent = 'Classic';
        showToast('Switched to Classic style');
      }
    }

    function toggleKeyVisibility() {
      const eyeIcon = document.getElementById('eye-icon');
      if (keyInput.type === 'password') {
        keyInput.type = 'text';
        eyeIcon.innerHTML = `
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
          <line x1="1" y1="1" x2="23" y2="23"></line>
        `;
        showToast('Passcode revealed');
      } else {
        keyInput.type = 'password';
        eyeIcon.innerHTML = `
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
          <circle cx="12" cy="12" r="3"></circle>
        `;
        showToast('Passcode hidden');
      }
    }

    function generateRandomKey() {
      const rand = Math.floor(Math.random() * 900) + 100;
      keyInput.value = rand;
      showToast(`Key set to ${rand}`);
      processText();
    }

    function clearInput() {
      inputArea.value = '';
      pasteHint.style.display = 'none';
      processText();
      inputArea.focus();
    }

    function swapInputOutput() {
      if (outputBox.classList.contains('empty') || !outputBox.textContent) return;
      const currentOutput = outputBox.textContent;
      
      switchMode(currentMode === 'encode' ? 'decode' : 'encode');
      inputArea.value = currentOutput;
      processText();
      showToast('Swapped input & output');
    }

    async function copyResult() {
      if (outputBox.classList.contains('empty') || !outputBox.textContent) {
        showToast('Nothing to copy yet');
        return;
      }

      const text = outputBox.textContent;
      let copied = false;

      // Primary: Modern Clipboard API
      if (navigator.clipboard && window.isSecureContext) {
        try {
          await navigator.clipboard.writeText(text);
          copied = true;
        } catch (err) {
          copied = false;
        }
      }

      // Fallback: execCommand with DOM textarea
      if (!copied) {
        try {
          const tempArea = document.createElement('textarea');
          tempArea.value = text;
          tempArea.style.position = 'fixed';
          tempArea.style.left = '-9999px';
          tempArea.style.top = '0';
          tempArea.setAttribute('readonly', '');
          document.body.appendChild(tempArea);
          tempArea.focus();
          tempArea.select();
          tempArea.setSelectionRange(0, 999999);
          copied = document.execCommand('copy');
          document.body.removeChild(tempArea);
        } catch (e) {
          copied = false;
        }
      }

      if (copied) {
        triggerCopyFeedback();
        showToast('Copied to clipboard');
      } else {
        showToast('Press & hold text to copy');
      }
    }

    function triggerCopyFeedback() {
      const copyBtn = document.getElementById('btn-copy');
      const copyLabel = document.getElementById('copy-label');
      const copyIcon = document.getElementById('copy-icon');

      copyBtn.classList.add('copied');
      copyLabel.textContent = 'Copied!';
      copyIcon.innerHTML = '<polyline points="20 6 9 17 4 12"></polyline>';

      setTimeout(() => {
        copyBtn.classList.remove('copied');
        copyLabel.textContent = 'Copy';
        copyIcon.innerHTML = '<rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>';
      }, 1600);
    }

    async function pasteFromClipboard() {
      let pasted = false;

      if (navigator.clipboard && navigator.clipboard.readText) {
        try {
          const text = await navigator.clipboard.readText();
          if (text) {
            inputArea.value = text;
            pasteHint.style.display = 'none';
            processText();
            showToast('Pasted from clipboard');
            pasted = true;
          }
        } catch (err) {
          pasted = false;
        }
      }

      if (!pasted) {
        pasteHint.style.display = 'block';
        inputArea.focus();
        showToast('Tap text box to paste');
      }
    }

    async function shareResult() {
      if (outputBox.classList.contains('empty') || !outputBox.textContent) {
        showToast('Nothing to share yet');
        return;
      }

      const text = outputBox.textContent;

      if (navigator.share) {
        try {
          await navigator.share({
            title: 'Whisper Message',
            text: text
          });
        } catch (err) {
          // User cancelled
        }
      } else {
        copyResult();
      }
    }

    let toastTimer;
    function showToast(msg) {
      clearTimeout(toastTimer);
      toast.textContent = msg;
      toast.classList.add('show');
      toastTimer = setTimeout(() => {
        toast.classList.remove('show');
      }, 2000);
    }

    document.getElementById('theme-btn').addEventListener('click', togglePalette);
    document.getElementById('tab-encode').addEventListener('click', () => switchMode('encode'));
    document.getElementById('tab-decode').addEventListener('click', () => switchMode('decode'));
    document.getElementById('toggle-key-visibility').addEventListener('click', toggleKeyVisibility);
    document.getElementById('generate-key-btn').addEventListener('click', generateRandomKey);
    document.getElementById('btn-paste').addEventListener('click', pasteFromClipboard);
    document.getElementById('btn-clear').addEventListener('click', clearInput);
    document.getElementById('btn-swap').addEventListener('click', swapInputOutput);
    document.getElementById('btn-copy').addEventListener('click', copyResult);
    document.getElementById('btn-share').addEventListener('click', shareResult);

    // Attach real-time listeners
    inputArea.addEventListener('input', () => {
      pasteHint.style.display = 'none';
      processText();
    });
    keyInput.addEventListener('input', processText);

    // Initial render
    processText();

    if ('serviceWorker' in navigator && window.isSecureContext) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./service-worker.js')
          .catch(error => console.error('Service worker registration failed:', error));
      });
    }
