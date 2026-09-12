async function sendMessage() {
  const input = document.getElementById('user-input');
  const chatBox = document.getElementById('chat-box');
  const message = input.value.trim();
  if (!message) return;

  chatBox.innerHTML += `<div class="message user">${message}</div>`;
  input.value = '';
  chatBox.scrollTop = chatBox.scrollHeight;

  const apiKey = 'YOUR_API_KEY';

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [{ role: 'user', content: message }]
      })
    });

    const data = await response.json();
    const aiMessage = data.choices?.[0]?.message?.content || 'Error getting response.';
    chatBox.innerHTML += `<div class="message ai">${aiMessage}</div>`;
  } catch (error) {
    chatBox.innerHTML += `<div class="message ai">Error connecting to AI API.</div>`;
  }
  chatBox.scrollTop = chatBox.scrollHeight;
}