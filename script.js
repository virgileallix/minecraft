document.addEventListener('DOMContentLoaded', function() {
    
    const DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/1362399809537048627/Are9RBBOYaThb-Ks4S3hwq9HtqpciIRAxVh7BmJwMh6wbCQ75kSlrhiujv7vRvd_NxSb';
    const DISCORD_SERVER_ID = '1361440270448722020'; 
    const DISCORD_CHANNEL_ID = '1361432323006009375';
    
    const MINECRAFT_API_URL = 'https://panel.omgserv.com/json/447820';
    const MINECRAFT_CHAT_API = 'http://votre-serveur-minecraft.com/api/chat';
    
    const playerList = document.getElementById('player-list');
    const serverStatus = document.getElementById('server-status');
    const refreshPlayers = document.getElementById('refresh-players');
    const refreshStatus = document.getElementById('refresh-status');
    const copyAddress = document.getElementById('copy-address');
    const toast = document.getElementById('toast');
    const refreshTimerEl = document.getElementById('refresh-timer');
    const refreshTimerStatusEl = document.getElementById('refresh-timer-status');
    const onlineCountEl = document.getElementById('online-count');
    
    const refreshPlayerTimerEl = document.getElementById('refresh-player-timer');
    const refreshPlayerTimerStatusEl = document.getElementById('refresh-player-timer-status');
    const refreshPlayerProgressEl = document.getElementById('refresh-player-progress');
    
    const onlineUsersList = document.getElementById('online-users-list');
    const refreshOnlineUsers = document.getElementById('refresh-online-users');
    const refreshUsersTimerEl = document.getElementById('refresh-users-timer');
    const refreshUsersTimerStatusEl = document.getElementById('refresh-users-timer-status');
    const refreshUsersProgressEl = document.getElementById('refresh-users-progress');
    
    const loginButton = document.getElementById('login-button');
    const userProfile = document.getElementById('user-profile');
    const loginModal = document.getElementById('login-modal');
    const closeModal = document.getElementById('close-modal');
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const usernameDisplay = document.getElementById('username-display');
    const userAvatar = document.getElementById('user-avatar');
    const logoutButton = document.getElementById('logout-button');
    const chatMessages = document.getElementById('chat-messages');
    const minecraftMessages = document.getElementById('minecraft-messages');
    const chatInputField = document.getElementById('chat-input-field');
    const sendButton = document.getElementById('send-button');
    
    const chatTabs = document.querySelectorAll('.chat-tab');
    const discordContainer = document.getElementById('discord-container');
    
    const playersApiUrl = `${MINECRAFT_API_URL}/players`;
    const statusApiUrl = `${MINECRAFT_API_URL}/status`;
    
    const refreshInterval = 10000;
    let lastRefreshTime = Date.now();
    let lastPlayersRefreshTime = Date.now();
    let lastUsersRefreshTime = Date.now();
    let lastChatRefreshTime = Date.now();
    let refreshTimer;
    let playersRefreshTimer;
    let usersRefreshTimer;
    let chatRefreshTimer;
    
    let currentUser = null;
    
    let messageHistory = {
        local: [],
        minecraft: [],
        discord: []
    };
    
    function storeMessage(type, messageData) {
        messageHistory[type].push(messageData);
        
        if (messageHistory[type].length > 100) {
            messageHistory[type].shift();
        }
    }
    
    function getUsers() {
        const users = localStorage.getItem('btssio_craft_users');
        return users ? JSON.parse(users) : [];
    }
    
    function saveUsers(users) {
        localStorage.setItem('btssio_craft_users', JSON.stringify(users));
    }
    
    function getOnlineUsers() {
        const onlineUsers = localStorage.getItem('btssio_craft_online_users');
        return onlineUsers ? JSON.parse(onlineUsers) : [];
    }
    
    function saveOnlineUsers(users) {
        localStorage.setItem('btssio_craft_online_users', JSON.stringify(users));
    }
    
    function updateUserLastActivity(userId) {
        const onlineUsers = getOnlineUsers();
        const userIndex = onlineUsers.findIndex(u => u.id === userId);
        
        if (userIndex !== -1) {
            onlineUsers[userIndex].lastActivity = Date.now();
            saveOnlineUsers(onlineUsers);
        } else if (currentUser) {
            onlineUsers.push({
                id: currentUser.id,
                username: currentUser.username,
                lastActivity: Date.now()
            });
            saveOnlineUsers(onlineUsers);
        }
    }
    
    function updateOnlineUsersList() {
        if (!onlineUsersList) return;
        
        const onlineUsers = getOnlineUsers();
        
        const now = Date.now();
        const activeUsers = onlineUsers.filter(user => {
            return (now - user.lastActivity) < 5 * 60 * 1000;
        });
        
        if (activeUsers.length !== onlineUsers.length) {
            saveOnlineUsers(activeUsers);
        }
        
        onlineUsersList.innerHTML = '';
        
        if (activeUsers.length === 0) {
            onlineUsersList.innerHTML = `
                <li class="user-item">
                    <div class="user-avatar">
                        <i class="fas fa-user-slash"></i>
                    </div>
                    <div class="user-info">
                        <div class="user-name">Aucun utilisateur en ligne</div>
                        <div class="user-status">Soyez le premier à vous connecter !</div>
                    </div>
                </li>
            `;
        } else {
            activeUsers.forEach(user => {
                const isCurrentUser = currentUser && user.id === currentUser.id;
                const userItem = document.createElement('li');
                userItem.className = 'user-item';
                
                const lastActivity = new Date(user.lastActivity);
                const timeAgo = getTimeAgo(lastActivity);
                
                userItem.innerHTML = `
                    <div class="user-avatar">
                        <img src="${getPlayerAvatarUrl(user.username)}" alt="${user.username}">
                    </div>
                    <div class="user-info">
                        <div class="user-name">${user.username} ${isCurrentUser ? '(Vous)' : ''}</div>
                        <div class="user-status ${timeAgo.status}">${timeAgo.text}</div>
                    </div>
                    ${isCurrentUser ? '' : `
                    <div class="user-actions">
                        <button class="user-action-button chat-with" data-username="${user.username}">
                            <i class="fas fa-comment"></i>
                        </button>
                    </div>
                    `}
                `;
                
                onlineUsersList.appendChild(userItem);
            });
            
            const chatWithButtons = onlineUsersList.querySelectorAll('.chat-with');
            chatWithButtons.forEach(button => {
                button.addEventListener('click', function() {
                    const username = this.dataset.username;
                    if (currentUser) {
                        document.querySelector('.chat-tab[data-tab="local"]').click();
                        const messageInput = document.getElementById('chat-input-field');
                        if (messageInput) {
                            messageInput.value = `@${username} `;
                            messageInput.focus();
                        }
                    }
                });
            });
            const userItems = onlineUsersList.querySelectorAll('.user-item');
            userItems.forEach(item => {
                item.addEventListener('dblclick', function() {
                    const username = this.querySelector('.user-name').textContent.split(' ')[0];
                    if (currentUser && username !== currentUser.username) {
                        document.querySelector('.chat-tab[data-tab="local"]').click();
                        
                        const messageInput = document.getElementById('chat-input-field');
                        if (messageInput) {
                            messageInput.value = `@${username} `;
                            messageInput.focus();
                        }
                    }
                });
            });
        }
    }
    
    function getTimeAgo(date) {
        const now = new Date();
        const diffMs = now - date;
        const diffSec = Math.floor(diffMs / 1000);
        const diffMin = Math.floor(diffSec / 60);
        
        if (diffMin < 1) {
            return { text: 'En ligne maintenant', status: 'online' };
        } else if (diffMin < 5) {
            return { text: `En ligne il y a ${diffMin} minute${diffMin > 1 ? 's' : ''}`, status: 'online' };
        } else {
            return { text: `Inactif depuis ${diffMin} minutes`, status: 'idle' };
        }
    }
    
    function checkLoggedInUser() {
        const loggedUser = localStorage.getItem('btssio_craft_current_user');
        if (loggedUser) {
            currentUser = JSON.parse(loggedUser);
            updateAuthUI();
            enableChat();
            updateUserLastActivity(currentUser.id);
        }
    }
    
    function updateAuthUI() {
        if (currentUser) {
            loginButton.style.display = 'none';
            userProfile.style.display = 'flex';
            usernameDisplay.textContent = currentUser.username;
            userAvatar.src = getPlayerAvatarUrl(currentUser.username);
        } else {
            loginButton.style.display = 'flex';
            userProfile.style.display = 'none';
        }
    }
    
    function enableChat() {
        if (currentUser) {
            chatInputField.disabled = false;
            sendButton.disabled = false;
            chatInputField.placeholder = "Tapez votre message...";
            
            addChatMessage({
                sender: 'server',
                message: `Bienvenue, ${currentUser.username} ! Vous pouvez maintenant participer au chat.`
            });
        } else {
            chatInputField.disabled = true;
            sendButton.disabled = true;
            chatInputField.placeholder = "Connectez-vous pour envoyer un message...";
        }
    }
    
    function addChatMessage(messageData) {
        if (!chatMessages) return;
        
        const messageElem = document.createElement('div');
        messageElem.className = `chat-message ${messageData.sender === 'server' ? 'server' : 'user'}`;
        
        if (messageData.sender === 'server') {
            messageElem.innerHTML = `<strong>Serveur:</strong> ${messageData.message}`;
        } else {
            messageElem.innerHTML = `<strong>${messageData.sender}:</strong> ${messageData.message}`;
        }
        
        chatMessages.appendChild(messageElem);
        
        storeMessage('local', messageData);
        
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    function addMinecraftMessage(messageData) {
        if (!minecraftMessages) return;
        
        const messageElem = document.createElement('div');
        messageElem.className = `chat-message minecraft`;
        messageElem.innerHTML = `<strong>${messageData.sender}:</strong> ${messageData.message}`;
        
        minecraftMessages.appendChild(messageElem);
        
        storeMessage('minecraft', messageData);
        
        minecraftMessages.scrollTop = minecraftMessages.scrollHeight;
        
        const minecraftTab = document.querySelector('.chat-tab[data-tab="minecraft"]');
        if (minecraftTab && !minecraftTab.classList.contains('active')) {
            minecraftTab.classList.add('has-new-messages');
        }
    }
    
    async function sendDiscordWebhookMessage(message, username) {
        if (!message || !message.trim()) {
            return false;
        }
        
        try {
            const response = await fetch(DISCORD_WEBHOOK_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    content: message,
                    username: username ? `${username} (Site Web)` : 'Site Web BTSSIO Craft',
                    avatar_url: username ? `https://mc-heads.net/avatar/${username}/64` : ''
                })
            });
            
            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }
            
            return true;
        } catch (error) {
            console.error('Erreur lors de l\'envoi du message webhook:', error);
            return false;
        }
    }
    
    async function sendMinecraftMessage(message, username) {
        if (!message || !message.trim()) {
            return false;
        }
        
        try {
            const response = await fetch(MINECRAFT_CHAT_API, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: message,
                    sender: username || 'Invité',
                    source: 'web'
                })
            });
            
            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }
            
            return true;
        } catch (error) {
            console.error('Erreur lors de l\'envoi du message Minecraft:', error);
            return false;
        }
    }
    
    async function fetchDiscordMessages() {
        if (!DISCORD_BOT_TOKEN) {
            console.warn('Token Discord non configuré, impossible de récupérer les messages.');
            return [];
        }
        
        try {
            const response = await fetch(`https://discord.com/api/v9/channels/${DISCORD_CHANNEL_ID}/messages?limit=50`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bot ${DISCORD_BOT_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }
            
            const messages = await response.json();
            return messages.map(msg => ({
                id: msg.id,
                sender: msg.author.username,
                message: msg.content,
                timestamp: new Date(msg.timestamp).getTime(),
                source: 'discord'
            }));
        } catch (error) {
            console.error('Erreur lors de la récupération des messages Discord:', error);
            return [];
        }
    }
    
    async function fetchMinecraftMessages() {
        try {
            const response = await fetch(`${MINECRAFT_CHAT_API}/recent`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }
            
            const messages = await response.json();
            return messages.map(msg => ({
                id: msg.id,
                sender: msg.sender,
                message: msg.message,
                timestamp: new Date(msg.timestamp).getTime(),
                source: 'minecraft'
            }));
        } catch (error) {
            console.error('Erreur lors de la récupération des messages Minecraft:', error);
            return [];
        }
    }
    
    async function refreshChatMessages() {
        const minecraftMsgs = await fetchMinecraftMessages();
        
        const existingMcMsgIds = messageHistory.minecraft.map(msg => msg.id);
        const newMcMessages = minecraftMsgs.filter(msg => !existingMcMsgIds.includes(msg.id));
        
        newMcMessages.forEach(msg => {
            addMinecraftMessage({
                sender: msg.sender,
                message: msg.message
            });
        });
        
        if (DISCORD_BOT_TOKEN) {
            const discordMsgs = await fetchDiscordMessages();
            
            const existingDiscordMsgIds = messageHistory.discord.map(msg => msg.id);
            const newDiscordMessages = discordMsgs.filter(msg => !existingDiscordMsgIds.includes(msg.id));
            
            newDiscordMessages.forEach(msg => {
                storeMessage('discord', msg);
            });
            
            if (newDiscordMessages.length > 0) {
                const discordTab = document.querySelector('.chat-tab[data-tab="discord"]');
                if (discordTab && !discordTab.classList.contains('active')) {
                    discordTab.classList.add('has-new-messages');
                }
            }
        }
    }
    
    function handleSendMessage() {
        if (!currentUser || !chatInputField.value.trim()) return;
        
        const message = chatInputField.value.trim();
        
        let target = null;
        let cleanMessage = message;
        
        if (message.startsWith('@')) {
            const firstSpace = message.indexOf(' ');
            if (firstSpace > 0) {
                target = message.substring(1, firstSpace);
                cleanMessage = message.substring(firstSpace + 1);
            }
        }
        
        const messageClass = target ? 'private' : 'user';
        
        const messagePrefix = target ? `<span class="private-indicator">[MP à ${target}]</span> ` : '';
        
        const messageContent = messagePrefix + cleanMessage;
        
        const messageElem = document.createElement('div');
        messageElem.className = `chat-message ${messageClass}`;
        messageElem.innerHTML = `<strong>${currentUser.username}:</strong> ${messageContent}`;
        chatMessages.appendChild(messageElem);
        
        storeMessage('local', {
            sender: currentUser.username,
            message: messageContent,
            timestamp: Date.now(),
            source: 'local'
        });
        
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        const activeTab = document.querySelector('.chat-tab.active');
        if (activeTab) {
            const tabType = activeTab.getAttribute('data-tab');
            
            if (tabType === 'local' || tabType === 'discord') {
                sendDiscordWebhookMessage(message, currentUser.username)
                    .then(success => {
                        if (!success) {
                            console.warn('Échec de l\'envoi du message à Discord.');
                            showToast('Échec de l\'envoi du message à Discord', 'exclamation-circle', false);
                        }
                    });
            }
            
            if (tabType === 'local' || tabType === 'minecraft') {
                sendMinecraftMessage(message, currentUser.username)
                    .then(success => {
                        if (!success) {
                            console.warn('Échec de l\'envoi du message à Minecraft.');
                            showToast('Échec de l\'envoi du message à Minecraft', 'exclamation-circle', false);
                        }
                    });
            }
        } else {
            sendDiscordWebhookMessage(message, currentUser.username);
            sendMinecraftMessage(message, currentUser.username);
        }
        
        updateUserLastActivity(currentUser.id);
        
        chatInputField.value = '';
    }
    
    function initChatTabs() {
        if (!chatTabs.length) return;
        
        const localChat = document.getElementById('chat-messages');
        const minecraftChat = document.getElementById('minecraft-messages');
        const discordContainer = document.getElementById('discord-container');
        
        if (!localChat || !minecraftChat || !discordContainer) {
            console.error('Éléments du chat introuvables');
            return;
        }
        
        chatTabs.forEach(tab => {
            tab.addEventListener('click', function() {
                chatTabs.forEach(t => {
                    t.classList.remove('active');
                    t.classList.remove('has-new-messages');
                });
                
                this.classList.add('active');
                
                localChat.style.display = 'none';
                minecraftChat.style.display = 'none';
                discordContainer.style.display = 'none';
                
                const tabType = this.getAttribute('data-tab');
                
                if (tabType === 'local') {
                    localChat.style.display = 'flex';
                } else if (tabType === 'minecraft') {
                    minecraftChat.style.display = 'flex';
                } else if (tabType === 'discord') {
                    discordContainer.style.display = 'block';
                }
            });
        });
        
        localChat.style.display = 'flex';
        minecraftChat.style.display = 'none';
        discordContainer.style.display = 'none';
    }
    
    async function fetchData(url) {
        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                },
                cache: 'no-store'
            });
            
            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error(`Erreur lors de la récupération des données: ${error.message}`);
            
            try {
                return await fetchWithCorsProxy(url);
            } catch (proxyError) {
                console.error('Erreur avec les proxies CORS:', proxyError);
                throw error;
            }
        }
    }
    
    async function fetchWithCorsProxy(url) {
        const corsProxies = [
            'https://corsproxy.io/?',
            'https://cors-anywhere.herokuapp.com/',
            'https://api.allorigins.win/raw?url='
        ];
        
        for (const proxy of corsProxies) {
            try {
                const response = await fetch(proxy + encodeURIComponent(url));
                if (!response.ok) {
                    throw new Error(`Réponse HTTP non valide: ${response.status}`);
                }
                return await response.json();
            } catch (error) {
                console.warn(`Échec avec le proxy ${proxy}:`, error);
            }
        }
        
        throw new Error('Tous les proxys CORS ont échoué');
    }
    
    function showToast(message, icon = 'check-circle', isSuccess = true) {
        if (!toast) return;
        
        const toastIcon = toast.querySelector('.toast-icon i');
        const toastMessage = toast.querySelector('.toast-message');
        
        if (toastIcon && toastMessage) {
            toastIcon.className = `fas fa-${icon}`;
            toastIcon.style.color = isSuccess ? 'var(--primary)' : 'var(--accent)';
            toastMessage.textContent = message;
            
            toast.classList.add('show');
            
            setTimeout(() => {
                toast.classList.remove('show');
            }, 3000);
        }
    }
    
    function getPlayerAvatarUrl(username) {
        return `https://mc-heads.net/avatar/${username}/40`;
    }
    
    async function loadPlayers() {
        if (!playerList) return;
        
        if (playerList.querySelectorAll('.player-item').length === 0) {
            playerList.innerHTML = `
                <li class="player-item loading">
                    <div class="player-avatar">
                        <i class="fas fa-spinner fa-spin"></i>
                    </div>
                    <div class="player-info">
                        <div class="player-name">Chargement...</div>
                        <div class="player-status">Récupération des joueurs</div>
                    </div>
                </li>
            `;
        }
        
        try {
            const data = await fetchData(playersApiUrl);
            
            playerList.innerHTML = '';
            
            if (onlineCountEl) {
                onlineCountEl.textContent = data.players ? data.players.length : 0;
            }
            
            if (!data.players || data.players.length === 0) {
                playerList.innerHTML = `
                    <li class="player-item no-players">
                        <div class="player-avatar">
                            <i class="fas fa-user-slash"></i>
                        </div>
                        <div class="player-info">
                            <div class="player-name">Aucun joueur connecté</div>
                            <div class="player-status">Soyez le premier à rejoindre !</div>
                        </div>
                    </li>
                `;
            } else {
                data.players.forEach(player => {
                    const playerItem = document.createElement('li');
                    playerItem.className = 'player-item';
                    playerItem.innerHTML = `
                        <div class="player-avatar">
                            <img src="${getPlayerAvatarUrl(player)}" alt="${player}" class="player-head" />
                        </div>
                        <div class="player-info">
                            <div class="player-name">${player}</div>
                            <div class="player-status">En ligne</div>
                        </div>
                        <div class="player-stats">
                            <div class="player-stat">
                                <i class="fas fa-clock"></i>
                                <span>En jeu</span>
                            </div>
                        </div>
                    `;
                    
                    playerList.appendChild(playerItem);
                });
            }
        } catch (error) {
            console.error('Erreur avec l\'API des joueurs:', error);
            
            if (playerList.querySelectorAll('.player-item').length === 0) {
                playerList.innerHTML = `
                    <li class="player-item error-state">
                        <div class="player-avatar"><i class="fas fa-exclamation-triangle"></i></div>
                        <div class="player-info">
                            <div class="player-name">Erreur de connexion</div>
                            <div class="player-status">Impossible de récupérer les données des joueurs</div>
                        </div>
                    </li>
                `;
            }
        }
    }
    
    async function loadServerStatus() {
        if (!serverStatus) return;
        
        try {
            const data = await fetchData(statusApiUrl);
            
            if (data && data.status) {
                const status = data.status;
                const isOnline = status.online;
                
                const statusValue = serverStatus.querySelector('.status-item:nth-child(1) .status-value');
                if (statusValue) {
                    statusValue.innerHTML = isOnline ? 
                        '<span class="status-online">En ligne</span>' : 
                        '<span class="status-offline">Hors ligne</span>';
                }
                
                const cpuValue = serverStatus.querySelector('.status-item:nth-child(2) .status-value');
                if (cpuValue) {
                    cpuValue.innerHTML = isOnline ? 
                        `<div class="progress-bar"><div class="progress-fill" style="width: ${status.cpu}%"></div><span>${status.cpu}%</span></div>` : 
                        'N/C';
                }
                
                const ramValue = serverStatus.querySelector('.status-item:nth-child(3) .status-value');
                if (ramValue) {
                    const ramPercent = isOnline ? Math.round((status.ram / (status.players.max * 512 * 1024)) * 100) : 0;
                    ramValue.innerHTML = isOnline ? 
                        `<div class="progress-bar"><div class="progress-fill" style="width: ${ramPercent}%"></div><span>${Math.round(status.ram / 1024)} Mo</span></div>` : 
                        'N/C';
                }
                
                const playersValue = serverStatus.querySelector('.status-item:nth-child(4) .status-value');
                if (playersValue) {
                    const playersPercent = isOnline ? Math.round((status.players.online / status.players.max) * 100) : 0;
                    playersValue.innerHTML = isOnline ? 
                        `<div class="progress-bar"><div class="progress-fill" style="width: ${playersPercent}%"></div><span>${status.players.online} / ${status.players.max}</span></div>` : 
                        'N/C';
                }
                
                if (onlineCountEl) {
                    onlineCountEl.textContent = isOnline ? status.players.online : 0;
                }
            } else {
                throw new Error('Format de données invalide');
            }
        } catch (error) {
            console.error('Erreur avec l\'API de statut:', error);
            
            const statusValues = serverStatus.querySelectorAll('.status-value');
            if (statusValues) {
                statusValues.forEach(value => {
                    value.innerHTML = '<span class="status-error">Erreur</span>';
                });
            }
        }
    }
    
    function updateRefreshTimer() {
        if (!refreshTimerEl || !refreshTimerStatusEl) return;
        
        const now = Date.now();
        const timeElapsed = now - lastRefreshTime;
        const timeRemaining = Math.max(0, refreshInterval - timeElapsed);
        const secondsRemaining = Math.ceil(timeRemaining / 1000);
        
        refreshTimerEl.textContent = secondsRemaining;
        refreshTimerStatusEl.textContent = secondsRemaining;
        
        const progressBar = document.getElementById('refresh-progress');
        if (progressBar) {
            const percentage = (timeElapsed / refreshInterval) * 100;
            progressBar.style.width = `${percentage}%`;
        }
        
        if (timeElapsed >= refreshInterval) {
            loadServerStatus();
            lastRefreshTime = now;
        }
    }
    
    function updatePlayersRefreshTimer() {
        if (!refreshPlayerTimerEl || !refreshPlayerTimerStatusEl) return;
        
        const now = Date.now();
        const timeElapsed = now - lastPlayersRefreshTime;
        const timeRemaining = Math.max(0, refreshInterval - timeElapsed);
        const secondsRemaining = Math.ceil(timeRemaining / 1000);
        
        refreshPlayerTimerEl.textContent = secondsRemaining;
        refreshPlayerTimerStatusEl.textContent = secondsRemaining;
        
        if (refreshPlayerProgressEl) {
            const percentage = (timeElapsed / refreshInterval) * 100;
            refreshPlayerProgressEl.style.width = `${percentage}%`;
        }
        
        if (timeElapsed >= refreshInterval) {
            loadPlayers();
            lastPlayersRefreshTime = now;
        }
    }
    
    function updateUsersRefreshTimer() {
        if (!refreshUsersTimerEl || !refreshUsersTimerStatusEl) return;
        
        const now = Date.now();
        const timeElapsed = now - lastUsersRefreshTime;
        const timeRemaining = Math.max(0, refreshInterval - timeElapsed);
        const secondsRemaining = Math.ceil(timeRemaining / 1000);
        
        refreshUsersTimerEl.textContent = secondsRemaining;
        refreshUsersTimerStatusEl.textContent = secondsRemaining;
        
        if (refreshUsersProgressEl) {
            const percentage = (timeElapsed / refreshInterval) * 100;
            refreshUsersProgressEl.style.width = `${percentage}%`;
        }
        
        if (timeElapsed >= refreshInterval) {
            updateOnlineUsersList();
            lastUsersRefreshTime = now;
        }
    }
    
    function updateChatRefreshTimer() {
        const now = Date.now();
        const timeElapsed = now - lastChatRefreshTime;
        
        if (timeElapsed >= 5000) {
            refreshChatMessages();
            lastChatRefreshTime = now;
        }
    }
    
    function updateServerEvents() {
        const timelineEl = document.querySelector('.timeline');
        if (!timelineEl) return;
        
        const now = new Date();
        const formattedDateTime = `${now.toLocaleDateString()} - ${now.toLocaleTimeString()}`;
        
        const newEvent = document.createElement('div');
        newEvent.className = 'timeline-item';
        newEvent.innerHTML = `
            <div class="timeline-time">${formattedDateTime}</div>
            <div class="timeline-title">Actualisation des données</div>
            <div class="timeline-desc">Les données du serveur ont été mises à jour automatiquement.</div>
        `;
        
        timelineEl.insertBefore(newEvent, timelineEl.firstChild);
        
        if (timelineEl.children.length > 5) {
            timelineEl.removeChild(timelineEl.lastChild);
        }
    }
    
    function addServerEvent(title, desc) {
        const timelineEl = document.querySelector('.timeline');
        if (!timelineEl) return;
        
        const now = new Date();
        const formattedDateTime = `${now.toLocaleDateString()} - ${now.toLocaleTimeString()}`;
        
        const newEvent = document.createElement('div');
        newEvent.className = 'timeline-item';
        newEvent.innerHTML = `
            <div class="timeline-time">${formattedDateTime}</div>
            <div class="timeline-title">${title}</div>
            <div class="timeline-desc">${desc}</div>
        `;
        
        timelineEl.insertBefore(newEvent, timelineEl.firstChild);
        
        if (timelineEl.children.length > 5) {
            timelineEl.removeChild(timelineEl.lastChild);
        }
    }
    
    async function syncChat() {
        try {
            await refreshChatMessages();
            lastChatRefreshTime = Date.now();
            return true;
        } catch (error) {
            console.error('Erreur lors de la synchronisation du chat:', error);
            return false;
        }
    }
    
    if (copyAddress) {
        copyAddress.addEventListener('click', function() {
            const serverAddress = document.querySelector('.address-text').textContent;
            navigator.clipboard.writeText(serverAddress)
                .then(() => {
                    showToast('Adresse du serveur copiée !');
                })
                .catch(() => {
                    showToast('Impossible de copier l\'adresse', 'exclamation-circle', false);
                });
        });
    }
    
    if (refreshPlayers) {
        refreshPlayers.addEventListener('click', function() {
            const icon = this.querySelector('i');
            if (icon) icon.classList.add('spinning');
            
            loadPlayers();
            lastPlayersRefreshTime = Date.now();
            
            setTimeout(() => {
                if (icon) icon.classList.remove('spinning');
            }, 1000);
            
            updateServerEvents();
        });
    }
    
    if (refreshStatus) {
        refreshStatus.addEventListener('click', function() {
            const icon = this.querySelector('i');
            if (icon) icon.classList.add('spinning');
            
            loadServerStatus();
            lastRefreshTime = now;
            
            setTimeout(() => {
                if (icon) icon.classList.remove('spinning');
            }, 1000);
            
            updateServerEvents();
        });
    }
    
    if (refreshOnlineUsers) {
        refreshOnlineUsers.addEventListener('click', function() {
            const icon = this.querySelector('i');
            if (icon) icon.classList.add('spinning');
            
            updateOnlineUsersList();
            lastUsersRefreshTime = Date.now();
            
            setTimeout(() => {
                if (icon) icon.classList.remove('spinning');
            }, 1000);
        });
    }
    
    function setupHeartbeat() {
        const serverHeartbeat = document.getElementById('server-heartbeat');
        if (serverHeartbeat) {
            setInterval(() => {
                serverHeartbeat.classList.add('pulse');
                setTimeout(() => {
                    serverHeartbeat.classList.remove('pulse');
                }, 300);
            }, 2000);
        }
    }
    
    if (loginButton) {
        loginButton.addEventListener('click', function() {
            if (loginModal) {
                loginModal.classList.add('active');
            }
        });
    }
    
    if (closeModal) {
        closeModal.addEventListener('click', function() {
            if (loginModal) {
                loginModal.classList.remove('active');
            }
        });
    }
    
    window.addEventListener('click', function(event) {
        if (event.target === loginModal) {
            loginModal.classList.remove('active');
        }
    });
    
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const tabName = this.dataset.tab;
            
            tabButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === `${tabName}-tab`) {
                    content.classList.add('active');
                }
            });
        });
    });
    
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const username = document.getElementById('login-username').value.trim();
            const password = document.getElementById('login-password').value.trim();
            
            if (!username || !password) {
                showToast('Veuillez remplir tous les champs', 'exclamation-circle', false);
                return;
            }
            
            const users = getUsers();
            const user = users.find(u => u.username.toLowerCase() === username.toLowerCase());
            
            if (!user || user.password !== password) {
                showToast('Identifiants incorrects', 'exclamation-circle', false);
                return;
            }
            
            currentUser = { username: user.username, id: user.id };
            localStorage.setItem('btssio_craft_current_user', JSON.stringify(currentUser));
            
            updateAuthUI();
            enableChat();
            
            updateUserLastActivity(user.id);
            updateOnlineUsersList();
            
            loginModal.classList.remove('active');
            
            showToast(`Bienvenue, ${currentUser.username} !`);
            
            addServerEvent('Connexion', `${currentUser.username} s'est connecté au chat.`);
            
            loginForm.reset();
        });
    }
    
    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const username = document.getElementById('register-username').value.trim();
            const password = document.getElementById('register-password').value.trim();
            const confirmPassword = document.getElementById('register-confirm').value.trim();
            
            if (!username || !password || !confirmPassword) {
                showToast('Veuillez remplir tous les champs', 'exclamation-circle', false);
                return;
            }
            
            if (password !== confirmPassword) {
                showToast('Les mots de passe ne correspondent pas', 'exclamation-circle', false);
                return;
            }
            
            const users = getUsers();
            if (users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
                showToast('Ce nom d\'utilisateur est déjà pris', 'exclamation-circle', false);
                return;
            }
            
            const newUser = {
                id: Date.now().toString(),
                username: username,
                password: password
            };
            
            users.push(newUser);
            saveUsers(users);
            
            currentUser = { username: newUser.username, id: newUser.id };
            localStorage.setItem('btssio_craft_current_user', JSON.stringify(currentUser));
            
            updateAuthUI();
            enableChat();
            
            updateUserLastActivity(newUser.id);
            updateOnlineUsersList();
            
            loginModal.classList.remove('active');
            
            showToast(`Compte créé avec succès ! Bienvenue, ${currentUser.username} !`);
            
            addServerEvent('Nouvel utilisateur', `${username} a créé un compte et rejoint le serveur.`);
            
            registerForm.reset();
        });
    }
    
    if (logoutButton) {
        logoutButton.addEventListener('click', function() {
            if (currentUser) {
                const onlineUsers = getOnlineUsers();
                const userIndex = onlineUsers.findIndex(u => u.id === currentUser.id);
                if (userIndex !== -1) {
                    onlineUsers.splice(userIndex, 1);
                    saveOnlineUsers(onlineUsers);
                }
                
                addServerEvent('Déconnexion', `${currentUser.username} s'est déconnecté du chat.`);
                
                localStorage.removeItem('btssio_craft_current_user');
                currentUser = null;
                
                updateAuthUI();
                
                chatInputField.disabled = true;
                sendButton.disabled = true;
                chatInputField.placeholder = "Connectez-vous pour envoyer un message...";
                
                updateOnlineUsersList();
                
                showToast('Vous avez été déconnecté');
            }
        });
    }
    
    if (sendButton) {
        sendButton.addEventListener('click', handleSendMessage);
    }
    
    if (chatInputField) {
        chatInputField.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                handleSendMessage();
            }
        });
    }
    
    function addSyncChatButton() {
        const chatWidget = document.querySelector('.chat-widget');
        if (!chatWidget) return;
        
        const syncButton = document.createElement('button');
        syncButton.className = 'mc-button-small sync-button';
        syncButton.innerHTML = '<i class="fas fa-sync"></i> Synchroniser les messages';
        syncButton.style.marginTop = '5px';
        syncButton.style.width = '100%';
        
        syncButton.addEventListener('click', async function() {
            const icon = this.querySelector('i');
            if (icon) icon.classList.add('spinning');
            
            const success = await syncChat();
            
            if (success) {
                showToast('Messages synchronisés avec succès');
            } else {
                showToast('Erreur lors de la synchronisation des messages', 'exclamation-circle', false);
            }
            
            setTimeout(() => {
                if (icon) icon.classList.remove('spinning');
            }, 1000);
        });
        
        const chatInput = chatWidget.querySelector('.chat-input');
        if (chatInput) {
            chatInput.after(syncButton);
        }
    }
    
    function startAutoRefresh() {
        loadServerStatus();
        loadPlayers();
        updateOnlineUsersList();
        refreshChatMessages();
        
        lastRefreshTime = Date.now();
        lastPlayersRefreshTime = Date.now();
        lastUsersRefreshTime = Date.now();
        lastChatRefreshTime = Date.now();
        
        refreshTimer = setInterval(updateRefreshTimer, 1000);
        playersRefreshTimer = setInterval(updatePlayersRefreshTimer, 1000);
        usersRefreshTimer = setInterval(updateUsersRefreshTimer, 1000);
        chatRefreshTimer = setInterval(updateChatRefreshTimer, 1000);
        
        addChatMessage({
            sender: 'server',
            message: `Bienvenue sur le chat du serveur BTSSIO Craft ! Les messages sont synchronisés entre le site web, Discord et Minecraft.`
        });
        
        addSyncChatButton();
    }
    
    startAutoRefresh();
    setupHeartbeat();
    checkLoggedInUser();
    initChatTabs();
    
    document.addEventListener('visibilitychange', function() {
        if (document.hidden) {
            clearInterval(refreshTimer);
            clearInterval(playersRefreshTimer);
            clearInterval(usersRefreshTimer);
            clearInterval(chatRefreshTimer);
        } else {
            clearInterval(refreshTimer);
            clearInterval(playersRefreshTimer);
            clearInterval(usersRefreshTimer);
            clearInterval(chatRefreshTimer);
            
            refreshTimer = setInterval(updateRefreshTimer, 1000);
            playersRefreshTimer = setInterval(updatePlayersRefreshTimer, 1000);
            usersRefreshTimer = setInterval(updateUsersRefreshTimer, 1000);
            chatRefreshTimer = setInterval(updateChatRefreshTimer, 1000);
            
            loadServerStatus();
            loadPlayers();
            updateOnlineUsersList();
            refreshChatMessages();
            
            lastRefreshTime = Date.now();
            lastPlayersRefreshTime = Date.now();
            lastUsersRefreshTime = Date.now();
            lastChatRefreshTime = Date.now();
            
            if (currentUser) {
                updateUserLastActivity(currentUser.id);
            }
        }
    });
    
    if (currentUser) {
        setInterval(() => {
            updateUserLastActivity(currentUser.id);
        }, 60000);
    }
    
    document.addEventListener('click', function() {
        if (currentUser) {
            updateUserLastActivity(currentUser.id);
        }
    });
    
    document.addEventListener('keypress', function() {
        if (currentUser) {
            updateUserLastActivity(currentUser.id);
        }
    });
});
