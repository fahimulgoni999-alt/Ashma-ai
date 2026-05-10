    <script>
        const API_KEY = "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";
        
        let chatHistory = JSON.parse(localStorage.getItem('vibe_chat_history')) || [
            { "role": "system", "content": "You are a chill best friend AI. You can see images. If she asks you to 'draw' or 'create an image', tell her to start the message with /draw." }
        ];

        const msgDiv = document.getElementById('messages');

        window.onload = () => {
            if (chatHistory.length <= 1) {
                msgDiv.innerHTML = `<div class="bubble bot">yo! i can see photos, remember our chats, and now i can DRAW. just type "/draw" followed by what you want to see! 🎨</div>`;
            } else {
                chatHistory.slice(1).forEach(msg => renderMessage(msg.role, msg.content));
            }
            msgDiv.scrollTop = msgDiv.scrollHeight;
        };

        let selectedImageBase64 = null;

        // Image Selection (For AI to see)
        document.getElementById('file-input').addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onloadend = () => {
                selectedImageBase64 = reader.result;
                document.getElementById('img-preview').src = selectedImageBase64;
                document.getElementById('img-preview-container').style.display = 'block';
            };
            reader.readAsDataURL(file);
        });

        function clearSelectedImage() {
            selectedImageBase64 = null;
            document.getElementById('file-input').value = "";
            document.getElementById('img-preview-container').style.display = 'none';
        }

        function clearHistory() {
            if(confirm("Clear all previous messages?")) {
                localStorage.removeItem('vibe_chat_history');
                location.reload();
            }
        }

        function renderMessage(role, content) {
            let html = "";
            if (Array.isArray(content)) {
                content.forEach(item => {
                    if (item.type === "text") html += `<div>${item.text}</div>`;
                    if (item.type === "image_url") html += `<img src="${item.image_url.url}" class="chat-img">`;
                });
            } else {
                html = `<div>${content}</div>`;
            }
            const cls = role === "user" ? "user" : "bot";
            msgDiv.innerHTML += `<div class="bubble ${cls}">${html}</div>`;
        }

        async function sendMessage() {
            const input = document.getElementById('user-input');
            const userText = input.value.trim();
            if (!userText && !selectedImageBase64) return;

            // CHECK IF SHE WANTS TO DRAW
            if (userText.toLowerCase().startsWith("/draw")) {
                handleDraw(userText.replace("/draw", "").trim());
                input.value = "";
                return;
            }

            let apiContent = [];
            if (selectedImageBase64) apiContent.push({ type: "image_url", image_url: { url: selectedImageBase64 } });
            if (userText) apiContent.push({ type: "text", text: userText });

            renderMessage("user", apiContent);
            chatHistory.push({ "role": "user", "content": apiContent });
            localStorage.setItem('vibe_chat_history', JSON.stringify(chatHistory));

            input.value = "";
            clearSelectedImage();
            msgDiv.scrollTop = msgDiv.scrollHeight;

            const thinkingId = "think-" + Date.now();
            msgDiv.innerHTML += `<div class="bubble bot" id="${thinkingId}">...</div>`;
            msgDiv.scrollTop = msgDiv.scrollHeight;

            try {
                const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                    method: "POST",
                    headers: { "Authorization": `Bearer ${API_KEY}`, "Content-Type": "application/json" },
                    body: JSON.stringify({ "model": "google/gemini-2.0-flash-001", "messages": chatHistory })
                });
                const data = await response.json();
                const aiReply = data.choices[0].message.content.toLowerCase();
                document.getElementById(thinkingId).innerText = aiReply;
                chatHistory.push({ "role": "assistant", "content": aiReply });
                localStorage.setItem('vibe_chat_history', JSON.stringify(chatHistory));
            } catch (error) {
                document.getElementById(thinkingId).innerText = "glitch. try again.";
            }
            msgDiv.scrollTop = msgDiv.scrollHeight;
        }

        async function handleDraw(prompt) {
            if (!prompt) return;
            const msgDiv = document.getElementById('messages');
            
            // Show User command
            msgDiv.innerHTML += `<div class="bubble user">/draw ${prompt}</div>`;
            
            // Generate Image URL (Pollinations AI)
            const encodedPrompt = encodeURIComponent(prompt);
            const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&nologo=true`;

            // Show AI response with image
            const aiContent = [
                { type: "text", text: `here is your ${prompt}:` },
                { type: "image_url", image_url: { url: imageUrl } }
            ];
            
            setTimeout(() => {
                renderMessage("assistant", aiContent);
                chatHistory.push({ "role": "assistant", "content": aiContent });
                localStorage.setItem('vibe_chat_history', JSON.stringify(chatHistory));
                msgDiv.scrollTop = msgDiv.scrollHeight;
            }, 1000);
        }

        document.getElementById("user-input").addEventListener("keypress", (e) => {
            if (e.key === "Enter") sendMessage();
        });
    </script>
