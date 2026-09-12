async function getActiveFreeModels() {
  try {
    const response = await fetch('https://openrouter.ai/api/v1/models');
    const data = await response.json();
    return data.data.filter(model => model.id.endsWith(':free'));
  } catch (error) {
    console.error('Failed to fetch available models:', error);
    return [];
  }
}

async function sendMessage() {
  const input = document.getElementById('user-input');
  const chatBox = document.getElementById('chat-box');
  const modelLabel = document.getElementById('model-label');
  const message = input.value.trim();
  if (!message) return;

  chatBox.innerHTML += `<div class="message user">${message}</div>`;
  input.value = '';
  chatBox.scrollTop = chatBox.scrollHeight;

  const apiKey = typeof API_KEY !== 'undefined' ? API_KEY : '';

  const freeModels = await getActiveFreeModels();
  
  if (freeModels.length === 0) {
    chatBox.innerHTML += `<div class="message ai">No free models currently available.</div>`;
    return;
  }

  let modelsToTry = freeModels.map(m => m.id);
  modelsToTry.sort((a, b) => a.includes('ling') ? -1 : 1);

  let success = false;

  for (const activeModel of modelsToTry) {
    if (modelLabel) {
      if (activeModel.includes('ling')) {
        modelLabel.textContent = 'Ling 3.0 Flash';
      } else {
        modelLabel.textContent = activeModel
          .replace(':free', '')
          .split('/')
          .pop()
          .replace(/-/g, ' ');
      }
    }

    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: activeModel,
          messages: [{ role: 'user', content: message }]
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
      console.warn(`Model ${activeModel} failed, trying next...`);
    }
  }

  if (!success) {
    chatBox.innerHTML += `<div class="message ai">API Error: All free model providers are currently offline.</div>`;
  }

  chatBox.scrollTop = chatBox.scrollHeight;
}