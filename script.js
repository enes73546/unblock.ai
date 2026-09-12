async function getActiveFreeModel() {
  try {
    const response = await fetch('https://openrouter.ai/api/v1/models');
    const data = await response.json();
    
    // Filter models that are marked free
    const freeModels = data.data.filter(model => model.id.endsWith(':free'));
    
    if (freeModels.length > 0) {
      return freeModels[0].id;
    }
  } catch (error) {
    console.error('Failed to fetch available models:', error);
  }
  // Fallback slug
  return 'google/gemma-2-9b-it:free';
}

async function sendMessage() {
  const input = document.getElementById('user-input');
  const chatBox = document.getElementById('chat-box');
  const message = input.value.trim();
  if (!message) return;

  chatBox.innerHTML += `<div class="message user">${message}</div>`;
  input.value = '';
  chatBox.scrollTop = chatBox.scrollHeight;

  const apiKey = typeof API_KEY !== 'undefined' ? API_KEY : '';

  const activeModel = await getActiveFreeModel();

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
      chatBox.innerHTML += `<div class="message ai">${aiMessage}</div>`;
    } else if (data.error) {
      chatBox.innerHTML += `<div class="message ai">API Error (${activeModel}): ${data.error.message}</div>`;
    } else {
      chatBox.innerHTML += `<div class="message ai">Unexpected response format.</div>`;
    }
  } catch (error) {
    chatBox.innerHTML += `<div class="message ai">Network error connecting to API.</div>`;
  }
  chatBox.scrollTop = chatBox.scrollHeight;
}