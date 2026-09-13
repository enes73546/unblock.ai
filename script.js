let uvPrefix = '/uv/service/';

document.addEventListener('DOMContentLoaded', () => {
  const savedKey = localStorage.getItem('unblock_api_key');
  const savedPrompt = localStorage.getItem('unblock_system_prompt');
  const savedModel = localStorage.getItem('unblock_model_pref') || 'inclusionai/ling-3.0-flash:free';
  const savedFontSize = localStorage.getItem('unblock_font_size') || 'medium';
  const savedUvPrefix = localStorage.getItem('unblock_uv_prefix');
  const savedTheme = localStorage.getItem('unblock_theme') || 'dark';

  if (savedKey) document.getElementById('custom-api-key').value = savedKey;
  if (savedPrompt) document.getElementById('system-prompt').value = savedPrompt;
  if (savedUvPrefix) {
    uvPrefix = savedUvPrefix;
    document.getElementById('uv-prefix').value = savedUvPrefix;
  }

  applyTheme(savedTheme);

  if (typeof Ultraviolet !== 'undefined' && navigator.serviceWorker) {
    navigator.serviceWorker.register('/uv/sw.js', { scope: uvPrefix })
      .catch(err => console.warn('UV Service Worker registration failed:', err));
  }

  const settingsSelect = document.getElementById('model-preference');
  const promptBarSelect = document.getElementById('model-selector');
  if (settingsSelect) settingsSelect.value = savedModel;
  if (promptBarSelect) promptBarSelect.value = savedModel;

  applyFontSize(savedFontSize);
  document.getElementById('font-size').value = savedFontSize;
});

function getUvUrl(url) {
  if (typeof __uv$config !== 'undefined' && __uv$config.encodeUrl) {
    return __uv$config.prefix + __uv$config.encodeUrl(url);
  }
  return url;
}

function showPage(pageId) {
  document.getElementById('chat-view').style.display = 'none';
  document.getElementById('settings-view').style.display = 'none';
  document.getElementById('nav-chat-btn').classList.remove('active-link');
  document.getElementById('nav-settings-btn').classList.remove('active-link');

  document.getElementById(pageId).style.display = 'flex';
  if (pageId === 'chat-view') {
    document.getElementById('nav-chat-btn').classList.add('active-link');
  } else {
    document.getElementById('nav-settings-btn').classList.add('active-link');
  }
}

function toggleTheme() {
  const isLight = document.body.classList.contains('light-theme');
  const newTheme = isLight ? 'dark' : 'light';
  applyTheme(newTheme);
  localStorage.setItem('unblock_theme', newTheme);
}

function applyTheme(theme) {
  if (theme === 'light') {
    document.body.classList.remove('dark-theme');
    document.body.classList.add('light-theme');
  } else {
    document.body.classList.remove('light-theme');
    document.body.classList.add('dark-theme');
  }
}

function updateSelectedModel(value) {
  localStorage.setItem('unblock_model_pref', value);
  const settingsSelect = document.getElementById('model-preference');
  const promptBarSelect = document.getElementById('model-selector');
  if (settingsSelect) settingsSelect.value = value;
  if (promptBarSelect) promptBarSelect.value = value;
}

function updateFontSize(size) {
  applyFontSize(size);
  localStorage.setItem('unblock_font_size', size);
}

function applyFontSize(size) {
  const chatBox = document.getElementById('chat-box');
  if (!chatBox) return;
  chatBox.classList.remove('font-small', 'font-medium', 'font-large');
  chatBox.classList.add(`font-${size}`);
}

function saveSettings() {
  const apiKey = document.getElementById('custom-api-key').value.trim();
  const systemPrompt = document.getElementById('system-prompt').value.trim();
  const selectedModel = document.getElementById('model-preference').value;
  const prefixInput = document.getElementById('uv-prefix').value.trim();

  localStorage.setItem('unblock_api_key', apiKey);
  localStorage.setItem('unblock_system_prompt', systemPrompt);
  localStorage.setItem('unblock_model_pref', selectedModel);
  if (prefixInput) localStorage.setItem('unblock_uv_prefix', prefixInput);

  const promptBarSelect = document.getElementById('model-selector');
  if (promptBarSelect) promptBarSelect.value = selectedModel;

  const status = document.getElementById('settings-status');
  status.textContent = 'Settings saved!';
  setTimeout(() => { status.textContent = ''; }, 2000);
}

async function getActiveFreeModels() {
  try {
    const targetUrl = getUvUrl('https://openrouter.ai/api/v1/models');
    const response = await fetch(targetUrl);
    const data = await response.json();
    return data.data.filter(model => model.id.endsWith(':free'));
  } catch (error) {
    console.error('Failed to fetch available models via UV:', error);
    return [];
  }
}

async function sendMessage() {
  const input = document.getElementById('user-input');
  const chatBox = document.getElementById('chat-box');
  const message = input.value.trim();
  if (!message) return;

  chatBox.innerHTML += `<div class="message user">${message}</div>`;
  input.value = '';
  chatBox.scrollTop = chatBox.scrollHeight;

  const localKey = localStorage.getItem('unblock_api_key');
  const apiKey = localKey || (typeof API_KEY !== 'undefined' ? API_KEY : '');

  const freeModels = await getActiveFreeModels();
  
  if (freeModels.length === 0) {
    chatBox.innerHTML += `<div class="message ai">No free models currently available.</div>`;
    return;
  }

  const userModelPref = localStorage.getItem('unblock_model_pref') || 'auto';
  let modelsToTry = freeModels.map(m => m.id);

  if (userModelPref !== 'auto') {
    modelsToTry.sort((a, b) => a === userModelPref ? -1 : 1);
  } else {
    modelsToTry.sort((a, b) => a.includes('ling') ? -1 : 1);
  }

  const systemPrompt = localStorage.getItem('unblock_system_prompt');
  const messages = [];
  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }
  messages.push({ role: 'user', content: message });

  let success = false;
  const endpointUrl = getUvUrl('https://openrouter.ai/api/v1/chat/completions');

  for (const activeModel of modelsToTry) {
    try {
      const response = await fetch(endpointUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: activeModel,
          messages: messages
        })
      });

      const data = await response.json();

      if (data.choices && data.choices[0] && data.choices[0].message) {
        const aiMessage = data.choices[0].message.content;
        const formattedMessage = typeof marked !== 'undefined' ? marked.parse(aiMessage) : aiMessage;
        
        chatBox.innerHTML += `<div class="message ai">${formattedMessage}</div>`;
        success = true;
        break;
      }
    } catch (error) {
      console.warn(`Model ${activeModel} failed via UV, trying next...`);
    }
  }

  if (!success) {
    chatBox.innerHTML += `<div class="message ai">API Error: All free model providers are currently offline.</div>`;
  }

  chatBox.scrollTop = chatBox.scrollHeight;
}