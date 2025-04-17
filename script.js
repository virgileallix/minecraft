document.addEventListener('DOMContentLoaded', function() {
    // Configuration Discord
    const DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/1362399809537048627/Are9RBBOYaThb-Ks4S3hwq9HtqpciIRAxVh7BmJwMh6wbCQ75kSlrhiujv7vRvd_NxSb';// À remplacer par l'URL de votre webhook
    const DISCORD_SERVER_ID = '1361440270448722020'; // ID de votre serveur Discord
    const DISCORD_CHANNEL_ID = '1361432323006009375'; // ID du canal global
    
    // Éléments DOM
    const playerList = document.getElementById('player-list');
    const serverStatus = document.getElementById('server-status');
    const refreshPlayers = document.getElementById('refresh-players');
    const refreshStatus = document.getElementById('refresh-status');
    const copyAddress = document.getElementById('copy-address');
    const toast = document.getElementById('toast');
    const refreshTimerEl = document.getElementById('refresh-timer');
    const refreshTimerStatusEl = document.getElementById('refresh-timer-status');
    const onlineCountEl = document.getElementById('online-count');
    
    // Éléments DOM pour les joueurs Minecraft
    const refreshPlayerTimerEl = document.getElementById('refresh-player-timer');
    const refreshPlayerTimerStatusEl = document.getElementById('refresh-player-timer-status');
    const refreshPlayerProgressEl = document.getElementById('refresh-player-progress');
    
    // Éléments DOM pour les utilisateurs du site
    const onlineUsersList = document.getElementById('online-users-list');
    const refreshOnlineUsers = document.getElementById('refresh-online-users');
    const refreshUsersTimerEl = document.getElementById('refresh-users-timer');
    const refreshUsersTimerStatusEl = document.getElementById('refresh-users-timer-status');
    const refreshUsersProgressEl = document.getElementById('refresh-users-progress');
    
    // Éléments DOM pour l'authentification et le chat
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
    const chatInputField = document.getElementById('chat-input-field');
    const sendButton = document.getElementById('send-button');
    
    // Éléments DOM pour les onglets du chat
    const chatTabs = document.querySelectorAll('.chat-tab');
    const discordContainer = document.querySelector('.discord-container');
    
    // URLs des APIs
    const playersApiUrl = 'https://panel.omgserv.com/json/447820/players';
    const statusApiUrl = 'https://panel.omgserv.com/json/447820/status';
    
    // Intervalle de rafraîchissement (10 secondes)
    const refreshInterval = 10000;
    let lastRefreshTime = Date.now();
    let lastPlayersRefreshTime = Date.now();
    let lastUsersRefreshTime = Date.now();
    let refreshTimer;
    let playersRefreshTimer;
    let usersRefreshTimer;
    
    // État de l'utilisateur
    let currentUser = null;
    
    // Base de données simulée pour les utilisateurs (localStorage)
    function getUsers() {
        const users = localStorage.getItem('btssio_craft_users');
        return users ? JSON.parse(users) : [];
    }
    
    function saveUsers(users) {
        localStorage.setItem('btssio_craft_users', JSON.stringify(users));
    }
    
    // Gestion des utilisateurs connectés
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
            // Ajouter l'utilisateur à la liste des utilisateurs en ligne
            onlineUsers.push({
                id: currentUser.id,
                username: currentUser.username,
                lastActivity: Date.now()
            });
            saveOnlineUsers(onlineUsers);
        }
    }
    
    // Mettre à jour la liste des utilisateurs en ligne
    function updateOnlineUsersList() {
        if (!onlineUsersList) return;
        
        const onlineUsers = getOnlineUsers();
        
        // Supprimer les utilisateurs inactifs depuis plus de 5 minutes
        const now = Date.now();
        const activeUsers = onlineUsers.filter(user => {
            return (now - user.lastActivity) < 5 * 60 * 1000; // 5 minutes
        });
        
        if (activeUsers.length !== onlineUsers.length) {
            saveOnlineUsers(activeUsers);
        }
        
        // Mettre à jour l'interface
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
            
            // Ajouter des écouteurs d'événements aux boutons de chat
            const chatWithButtons = onlineUsersList.querySelectorAll('.chat-with');
            chatWithButtons.forEach(button => {
                button.addEventListener('click', function() {
                    const username = this.dataset.username;
                    if (currentUser) {
                        // Envoyer un message privé
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
    
    // Fonction pour obtenir le temps écoulé depuis une date
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
    
    // Vérifier si l'utilisateur est déjà connecté
    function checkLoggedInUser() {
        const loggedUser = localStorage.getItem('btssio_craft_current_user');
        if (loggedUser) {
            currentUser = JSON.parse(loggedUser);
            updateAuthUI();
            enableChat();
            updateUserLastActivity(currentUser.id);
        }
    }
    
    // Mettre à jour l'interface utilisateur d'authentification
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
    
    // Activer le chat pour les utilisateurs connectés
    function enableChat() {
        if (currentUser) {
            chatInputField.disabled = false;
            sendButton.disabled = false;
            chatInputField.placeholder = "Tapez votre message...";
            
            // Ajouter un message de bienvenue
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
    
    // Ajouter un message au chat
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
        
        // Faire défiler jusqu'au dernier message
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    // Fonction pour envoyer un message webhook Discord
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
    
    // Gérer l'envoi de messages
    function handleSendMessage() {
        if (!currentUser || !chatInputField.value.trim()) return;
        
        const message = chatInputField.value.trim();
        
        // Vérifier si c'est un message privé
        let target = null;
        let cleanMessage = message;
        
        if (message.startsWith('@')) {
            const firstSpace = message.indexOf(' ');
            if (firstSpace > 0) {
                target = message.substring(1, firstSpace);
                cleanMessage = message.substring(firstSpace + 1);
            }
        }
        
        // Ajouter le message au chat local
        addChatMessage({
            sender: currentUser.username,
            message: message
        });
        
        // Envoyer le message à Discord via le webhook
        sendDiscordWebhookMessage(message, currentUser.username)
            .then(success => {
                if (!success) {
                    console.warn('Échec de l\'envoi du message à Discord. Retour au comportement local.');
                    simulateMessageResponse(message, target);
                }
            })
            .catch(error => {
                console.error('Erreur lors de l\'envoi du message:', error);
                // Fallback au comportement local
                simulateMessageResponse(message, target);
            });
        
        // Mettre à jour l'activité de l'utilisateur
        updateUserLastActivity(currentUser.id);
        
        // Effacer le champ de saisie
        chatInputField.value = '';
    }
    
    // Simuler une réponse (pour le comportement local)
    function simulateMessageResponse(message, target) {
        // Vérifier si c'est un message privé
        if (target) {
            // Simuler une réponse privée
            setTimeout(() => {
                addChatMessage({
                    sender: target,
                    message: `@${currentUser.username} Salut ! J'ai bien reçu ton message privé.`
                });
            }, 1000 + Math.random() * 2000);
        } else {
            // Simuler une réponse du serveur
            setTimeout(() => {
                const responses = [
                    "Merci pour ton message !",
                    "N'oublie pas de rejoindre notre serveur Discord !",
                    "Tu peux aussi nous suivre sur les réseaux sociaux.",
                    "As-tu besoin d'aide pour quelque chose ?",
                    "N'hésite pas à poser des questions si tu as besoin d'aide."
                ];
                
                const randomResponse = responses[Math.floor(Math.random() * responses.length)];
                
                addChatMessage({
                    sender: 'server',
                    message: randomResponse
                });
            }, 1000 + Math.random() * 2000);
        }
    }
    
    // Initialiser les onglets du chat
    function initChatTabs() {
        if (!chatTabs.length || !chatMessages || !discordContainer) return;
        
        chatTabs.forEach(tab => {
            tab.addEventListener('click', function() {
                // Désactiver tous les onglets
                chatTabs.forEach(t => t.classList.remove('active'));
                
                // Activer l'onglet cliqué
                this.classList.add('active');
                
                // Afficher le contenu correspondant
                const tabType = this.getAttribute('data-tab');
                
                if (tabType === 'local') {
                    chatMessages.style.display = 'flex';
                    discordContainer.style.display = 'none';
                } else if (tabType === 'discord') {
                    chatMessages.style.display = 'none';
                    discordContainer.style.display = 'block';
                }
            });
        });
    }
    
    // Fonctions de récupération des données
    async function fetchData(url) {
        try {
            // Tentative directe
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
            
            // Tentative avec proxies CORS si nécessaire
            try {
                return await fetchWithCorsProxy(url);
            } catch (proxyError) {
                console.error('Erreur avec les proxies CORS:', proxyError);
                throw error;
            }
        }
    }
    
    // Fonction pour essayer plusieurs proxies CORS en cas de problème CORS
    async function fetchWithCorsProxy(url) {
        // Liste des proxies CORS à essayer
        const corsProxies = [
            'https://corsproxy.io/?',
            'https://cors-anywhere.herokuapp.com/',
            'https://api.allorigins.win/raw?url='
        ];
        
        // Essayer chaque proxy jusqu'à ce qu'un fonctionne
        for (const proxy of corsProxies) {
            try {
                const response = await fetch(proxy + encodeURIComponent(url));
                if (!response.ok) {
                    throw new Error(`Réponse HTTP non valide: ${response.status}`);
                }
                return await response.json();
            } catch (error) {
                console.warn(`Échec avec le proxy ${proxy}:`, error);
                // Continuer à essayer avec le proxy suivant
            }
        }
        
        // Si aucun proxy ne fonctionne, lancer une erreur
        throw new Error('Tous les proxys CORS ont échoué');
    }
    
    // Fonction pour afficher les notifications toast
    function showToast(message, icon = 'check-circle', isSuccess = true) {
        if (!toast) return;
        
        const toastIcon = toast.querySelector('.toast-icon i');
        const toastMessage = toast.querySelector('.toast-message');
        
        if (toastIcon && toastMessage) {
            toastIcon.className = `fas fa-${icon}`;
            toastIcon.style.color = isSuccess ? 'var(--primary)' : 'var(--accent)';
            toastMessage.textContent = message;
            
            toast.classList.add('show');
            
            // Masquer après 3 secondes
            setTimeout(() => {
                toast.classList.remove('show');
            }, 3000);
        }
    }
    
    // Fonction pour obtenir l'URL de l'avatar du joueur
    function getPlayerAvatarUrl(username) {
        // Utilisation du service mc-heads.net pour obtenir les avatars
        return `https://mc-heads.net/avatar/${username}/40`;
    }
    
    // Fonction pour charger les joueurs
    async function loadPlayers() {
        if (!playerList) return;
        
        // État de chargement
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
            // Charger les données
            const data = await fetchData(playersApiUrl);
            
            // Vider la liste des joueurs
            playerList.innerHTML = '';
            
            // Mettre à jour le compteur de joueurs en ligne
            if (onlineCountEl) {
                onlineCountEl.textContent = data.players ? data.players.length : 0;
            }
            
            // Vérifier si des joueurs sont connectés
            if (!data.players || data.players.length === 0) {
                // Aucun joueur connecté
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
                // Afficher chaque joueur
                data.players.forEach(player => {
                    // Créer l'élément pour le joueur
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
                    
                    // Ajouter le joueur à la liste
                    playerList.appendChild(playerItem);
                });
            }
        } catch (error) {
            console.error('Erreur avec l\'API des joueurs:', error);
            
            // Afficher un message d'erreur
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
    
    // Fonction pour charger le statut du serveur
    async function loadServerStatus() {
        if (!serverStatus) return;
        
        try {
            // Charger les données
            const data = await fetchData(statusApiUrl);
            
            if (data && data.status) {
                const status = data.status;
                const isOnline = status.online;
                
                // Statut en ligne/hors ligne
                const statusValue = serverStatus.querySelector('.status-item:nth-child(1) .status-value');
                if (statusValue) {
                    statusValue.innerHTML = isOnline ? 
                        '<span class="status-online">En ligne</span>' : 
                        '<span class="status-offline">Hors ligne</span>';
                }
                
                // CPU
                const cpuValue = serverStatus.querySelector('.status-item:nth-child(2) .status-value');
                if (cpuValue) {
                    cpuValue.innerHTML = isOnline ? 
                        `<div class="progress-bar"><div class="progress-fill" style="width: ${status.cpu}%"></div><span>${status.cpu}%</span></div>` : 
                        'N/C';
                }
                
                // RAM
                const ramValue = serverStatus.querySelector('.status-item:nth-child(3) .status-value');
                if (ramValue) {
                    const ramPercent = isOnline ? Math.round((status.ram / (status.players.max * 512 * 1024)) * 100) : 0;
                    ramValue.innerHTML = isOnline ? 
                        `<div class="progress-bar"><div class="progress-fill" style="width: ${ramPercent}%"></div><span>${Math.round(status.ram / 1024)} Mo</span></div>` : 
                        'N/C';
                }
                
                // Joueurs
                const playersValue = serverStatus.querySelector('.status-item:nth-child(4) .status-value');
                if (playersValue) {
                    const playersPercent = isOnline ? Math.round((status.players.online / status.players.max) * 100) : 0;
                    playersValue.innerHTML = isOnline ? 
                        `<div class="progress-bar"><div class="progress-fill" style="width: ${playersPercent}%"></div><span>${status.players.online} / ${status.players.max}</span></div>` : 
                        'N/C';
                }
                
                // Mettre à jour le compteur de joueurs en ligne
                if (onlineCountEl) {
                    onlineCountEl.textContent = isOnline ? status.players.online : 0;
                }
            } else {
                throw new Error('Format de données invalide');
            }
        } catch (error) {
            console.error('Erreur avec l\'API de statut:', error);
            
            // Afficher un état d'erreur pour chaque élément
            const statusValues = serverStatus.querySelectorAll('.status-value');
            if (statusValues) {
                statusValues.forEach(value => {
                    value.innerHTML = '<span class="status-error">Erreur</span>';
                });
            }
        }
    }
    
    // Fonction pour mettre à jour le timer de rafraîchissement du statut
    function updateRefreshTimer() {
        if (!refreshTimerEl || !refreshTimerStatusEl) return;
        
        const now = Date.now();
        const timeElapsed = now - lastRefreshTime;
        const timeRemaining = Math.max(0, refreshInterval - timeElapsed);
        const secondsRemaining = Math.ceil(timeRemaining / 1000);
        
        // Mettre à jour l'affichage du timer
        refreshTimerEl.textContent = secondsRemaining;
        refreshTimerStatusEl.textContent = secondsRemaining;
        
        // Mettre à jour la barre de progression
        const progressBar = document.getElementById('refresh-progress');
        if (progressBar) {
            const percentage = (timeElapsed / refreshInterval) * 100;
            progressBar.style.width = `${percentage}%`;
        }
        
        // Si le temps est écoulé, rafraîchir les données
        if (timeElapsed >= refreshInterval) {
            loadServerStatus();
            lastRefreshTime = now;
        }
    }
    
    // Fonction pour mettre à jour le timer de rafraîchissement des joueurs
    function updatePlayersRefreshTimer() {
        if (!refreshPlayerTimerEl || !refreshPlayerTimerStatusEl) return;
        
        const now = Date.now();
        const timeElapsed = now - lastPlayersRefreshTime;
        const timeRemaining = Math.max(0, refreshInterval - timeElapsed);
        const secondsRemaining = Math.ceil(timeRemaining / 1000);
        
        // Mettre à jour l'affichage du timer
        refreshPlayerTimerEl.textContent = secondsRemaining;
        refreshPlayerTimerStatusEl.textContent = secondsRemaining;
        
        // Mettre à jour la barre de progression
        if (refreshPlayerProgressEl) {
            const percentage = (timeElapsed / refreshInterval) * 100;
            refreshPlayerProgressEl.style.width = `${percentage}%`;
        }
        
        // Si le temps est écoulé, rafraîchir les données
        if (timeElapsed >= refreshInterval) {
            loadPlayers();
            lastPlayersRefreshTime = now;
        }
    }
    
    // Fonction pour mettre à jour le timer de rafraîchissement des utilisateurs
    function updateUsersRefreshTimer() {
        if (!refreshUsersTimerEl || !refreshUsersTimerStatusEl) return;
        
        const now = Date.now();
        const timeElapsed = now - lastUsersRefreshTime;
        const timeRemaining = Math.max(0, refreshInterval - timeElapsed);
        const secondsRemaining = Math.ceil(timeRemaining / 1000);
        
        // Mettre à jour l'affichage du timer
        refreshUsersTimerEl.textContent = secondsRemaining;
        refreshUsersTimerStatusEl.textContent = secondsRemaining;
        
        // Mettre à jour la barre de progression
        if (refreshUsersProgressEl) {
            const percentage = (timeElapsed / refreshInterval) * 100;
            refreshUsersProgressEl.style.width = `${percentage}%`;
        }
        
        // Si le temps est écoulé, rafraîchir les données
        if (timeElapsed >= refreshInterval) {
            updateOnlineUsersList();
            lastUsersRefreshTime = now;
        }
    }
    
    // Mettre à jour les événements récents
    function updateServerEvents() {
        const timelineEl = document.querySelector('.timeline');
        if (!timelineEl) return;
        
        // Obtenir la date et l'heure actuelles formatées
        const now = new Date();
        const formattedDateTime = `${now.toLocaleDateString()} - ${now.toLocaleTimeString()}`;
        
        // Créer un nouvel événement pour la mise à jour
        const newEvent = document.createElement('div');
        newEvent.className = 'timeline-item';
        newEvent.innerHTML = `
            <div class="timeline-time">${formattedDateTime}</div>
            <div class="timeline-title">Actualisation des données</div>
            <div class="timeline-desc">Les données du serveur ont été mises à jour automatiquement.</div>
        `;
        
        // Ajouter l'événement au début de la timeline
        timelineEl.insertBefore(newEvent, timelineEl.firstChild);
        
        // Limiter à 5 événements
        if (timelineEl.children.length > 5) {
            timelineEl.removeChild(timelineEl.lastChild);
        }
    }
    
    // Copier l'adresse du serveur
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
    
    // Événement de clic sur le bouton de rafraîchissement des joueurs
    if (refreshPlayers) {
        refreshPlayers.addEventListener('click', function() {
            const icon = this.querySelector('i');
            if (icon) icon.classList.add('spinning');
            
            loadPlayers();
            lastPlayersRefreshTime = Date.now();
            
            // Retirer la classe spinning après 1 seconde
            setTimeout(() => {
                if (icon) icon.classList.remove('spinning');
            }, 1000);
            
            // Mettre à jour les événements
            updateServerEvents();
        });
    }
    
    // Événement de clic sur le bouton de rafraîchissement du statut
    if (refreshStatus) {
        refreshStatus.addEventListener('click', function() {
            const icon = this.querySelector('i');
            if (icon) icon.classList.add('spinning');
            
            loadServerStatus();
            lastRefreshTime = Date.now();
            
            // Retirer la classe spinning après 1 seconde
            setTimeout(() => {
                if (icon) icon.classList.remove('spinning');
            }, 1000);
            
            // Mettre à jour les événements
            updateServerEvents();
        });
    }
    
    // Événement de clic sur le bouton de rafraîchissement des utilisateurs en ligne
    if (refreshOnlineUsers) {
        refreshOnlineUsers.addEventListener('click', function() {
            const icon = this.querySelector('i');
            if (icon) icon.classList.add('spinning');
            
            updateOnlineUsersList();
            lastUsersRefreshTime = Date.now();
            
            // Retirer la classe spinning après 1 seconde
            setTimeout(() => {
                if (icon) icon.classList.remove('spinning');
            }, 1000);
        });
    }
    
    // Mettre en place l'animation de "battement de cœur" du serveur
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
    
    // Événements pour le système d'authentification
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
    
    // Fermer le modal en cliquant en dehors
    window.addEventListener('click', function(event) {
        if (event.target === loginModal) {
            loginModal.classList.remove('active');
        }
    });
    
    // Gestion des onglets
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const tabName = this.dataset.tab;
            
            // Activer l'onglet sélectionné
            tabButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // Afficher le contenu de l'onglet sélectionné
            tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === `${tabName}-tab`) {
                    content.classList.add('active');
                }
            });
        });
    });
    
    // Gestion du formulaire de connexion
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const username = document.getElementById('login-username').value.trim();
            const password = document.getElementById('login-password').value.trim();
            
            if (!username || !password) {
                showToast('Veuillez remplir tous les champs', 'exclamation-circle', false);
                return;
            }
            
            // Vérifier les identifiants
            const users = getUsers();
            const user = users.find(u => u.username.toLowerCase() === username.toLowerCase());
            
            if (!user || user.password !== password) {
                showToast('Identifiants incorrects', 'exclamation-circle', false);
                return;
            }
            
            // Connexion réussie
            currentUser = { username: user.username, id: user.id };
            localStorage.setItem('btssio_craft_current_user', JSON.stringify(currentUser));
            
            // Mettre à jour l'interface
            updateAuthUI();
            enableChat();
            
            // Mettre à jour la liste des utilisateurs en ligne
            updateUserLastActivity(user.id);
            updateOnlineUsersList();
            
            // Fermer le modal
            loginModal.classList.remove('active');
            
            // Notifier l'utilisateur
            showToast(`Bienvenue, ${currentUser.username} !`);
            
            // Réinitialiser le formulaire
            loginForm.reset();
        });
    }
    
    // Gestion du formulaire d'inscription
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
            
            // Vérifier si l'utilisateur existe déjà
            const users = getUsers();
            if (users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
                showToast('Ce nom d\'utilisateur est déjà pris', 'exclamation-circle', false);
                return;
            }
            
            // Créer un nouvel utilisateur
            const newUser = {
                id: Date.now().toString(),
                username: username,
                password: password
            };
            
            // Ajouter l'utilisateur à la base de données
            users.push(newUser);
            saveUsers(users);
            
            // Connecter l'utilisateur
            currentUser = { username: newUser.username, id: newUser.id };
            localStorage.setItem('btssio_craft_current_user', JSON.stringify(currentUser));
            
            // Mettre à jour l'interface
            updateAuthUI();
            enableChat();
            
            // Mettre à jour la liste des utilisateurs en ligne
            updateUserLastActivity(newUser.id);
            updateOnlineUsersList();
            
            // Fermer le modal
            loginModal.classList.remove('active');
            
            // Notifier l'utilisateur
            showToast(`Compte créé avec succès ! Bienvenue, ${currentUser.username} !`);
            
            // Réinitialiser le formulaire
            registerForm.reset();
            
            // Ajouter un message dans la chronologie
            const timelineEl = document.querySelector('.timeline');
            if (timelineEl) {
                const now = new Date();
                const formattedDateTime = `${now.toLocaleDateString()} - ${now.toLocaleTimeString()}`;
                
                const newEvent = document.createElement('div');
                newEvent.className = 'timeline-item';
                newEvent.innerHTML = `
                    <div class="timeline-time">${formattedDateTime}</div>
                    <div class="timeline-title">Nouvel utilisateur</div>
                    <div class="timeline-desc">${username} a rejoint le serveur.</div>
                `;
                
                timelineEl.insertBefore(newEvent, timelineEl.firstChild);
                
                if (timelineEl.children.length > 5) {
                    timelineEl.removeChild(timelineEl.lastChild);
                }
            }
        });
    }
    
    // Gestion de la déconnexion
    if (logoutButton) {
        logoutButton.addEventListener('click', function() {
            if (currentUser) {
                // Mettre à jour l'état en ligne
                const onlineUsers = getOnlineUsers();
                const userIndex = onlineUsers.findIndex(u => u.id === currentUser.id);
                if (userIndex !== -1) {
                    onlineUsers.splice(userIndex, 1);
                    saveOnlineUsers(onlineUsers);
                }
                
                // Supprimer les données de l'utilisateur local
                localStorage.removeItem('btssio_craft_current_user');
                currentUser = null;
                
                // Mettre à jour l'interface
                updateAuthUI();
                
                // Désactiver le chat
                chatInputField.disabled = true;
                sendButton.disabled = true;
                chatInputField.placeholder = "Connectez-vous pour envoyer un message...";
                
                // Mettre à jour la liste des utilisateurs en ligne
                updateOnlineUsersList();
                
                // Notifier l'utilisateur
                showToast('Vous avez été déconnecté');
            }
        });
    }
    
    // Gestion de l'envoi de messages
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
    
    // Démarrer le rafraîchissement automatique
    function startAutoRefresh() {
        // Charger les données immédiatement
        loadServerStatus();
        loadPlayers();
        updateOnlineUsersList();
        
        lastRefreshTime = Date.now();
        lastPlayersRefreshTime = Date.now();
        lastUsersRefreshTime = Date.now();
        
        // Démarrer les timers de rafraîchissement
        refreshTimer = setInterval(updateRefreshTimer, 1000);
        playersRefreshTimer = setInterval(updatePlayersRefreshTimer, 1000);
        usersRefreshTimer = setInterval(updateUsersRefreshTimer, 1000);
        
        // Ajouter un message Discord dans le chat local
        addChatMessage({
            sender: 'server',
            message: `Pour voir tous les messages en temps réel, basculez vers l'onglet Discord. <i class="fab fa-discord" style="color: var(--discord);"></i>`
        });
    }
    
    // Initialiser l'application
    startAutoRefresh();
    setupHeartbeat();
    checkLoggedInUser();
    initChatTabs();
    
    // Vérifier si le document est visible et ajuster le rafraîchissement
    document.addEventListener('visibilitychange', function() {
        if (document.hidden) {
            // Suspendre le rafraîchissement automatique
            clearInterval(refreshTimer);
            clearInterval(playersRefreshTimer);
            clearInterval(usersRefreshTimer);
        } else {
            // Reprendre le rafraîchissement automatique
            clearInterval(refreshTimer);
            clearInterval(playersRefreshTimer);
            clearInterval(usersRefreshTimer);
            
            refreshTimer = setInterval(updateRefreshTimer, 1000);
            playersRefreshTimer = setInterval(updatePlayersRefreshTimer, 1000);
            usersRefreshTimer = setInterval(updateUsersRefreshTimer, 1000);
            
            // Rafraîchir immédiatement les données
            loadServerStatus();
            loadPlayers();
            updateOnlineUsersList();
            
            lastRefreshTime = Date.now();
            lastPlayersRefreshTime = Date.now();
            lastUsersRefreshTime = Date.now();
            
            // Mettre à jour l'activité de l'utilisateur
            if (currentUser) {
                updateUserLastActivity(currentUser.id);
            }
        }
    });
    
    // Mettre à jour périodiquement l'activité de l'utilisateur connecté
    if (currentUser) {
        setInterval(() => {
            updateUserLastActivity(currentUser.id);
        }, 60000); // Toutes les minutes
    }
    
    // Ajouter un événement pour détecter l'activité de l'utilisateur
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