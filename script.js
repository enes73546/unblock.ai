async function sendMessage() {
  const input = document.getElementById('user-input');
  const chatBox = document.getElementById('chat-box');
  const message = input.value.trim();
  if (!message) return;

  chatBox.innerHTML += `<div class="message user">${message}</div>`;
  input.value = '';
  chatBox.scrollTop = chatBox.scrollHeight;

  // Pulls key automatically from config.js
  const apiKey = typeof API_KEY !== 'undefined' ? API_KEY : '';

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-3.3-70b-instruct:free',
        messages: [{ role: 'user', content: message }]
      })
    });

    const data = await response.json();

    if (data.choices && data.choices[0] && data.choices[0].message) {
      const aiMessage = data.choices[0].message.content;
      chatBox.innerHTML += `<div class="message ai">${aiMessage}</div>`;
    } else if (data.error) {
      chatBox.innerHTML += `<div class="message ai">API Error: ${data.error.message}</div>`;
    } else {
      chatBox.innerHTML += `<div class="message ai">Unexpected response format.</div>`;
    }
  } catch (error) {
    chatBox.innerHTML += `<div class="message ai">Network error connecting to API.</div>`;
  }
  chatBox.scrollTop = chatBox.scrollHeight;
}