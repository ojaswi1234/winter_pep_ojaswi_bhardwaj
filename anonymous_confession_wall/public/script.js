document.addEventListener('DOMContentLoaded', () => {

    const navFeed              = document.getElementById('nav-feed');
    const navHistory           = document.getElementById('nav-history');
    const feedView             = document.getElementById('feed-view');
    const historyView          = document.getElementById('history-view');
    const confessionsContainer = document.getElementById('confessions-container');
    const historyContainer     = document.getElementById('history-container');
    const writeSecretBtn       = document.getElementById('write-secret-btn');
    const secretModal          = document.getElementById('secret-modal');
    const confessionForm       = document.getElementById('confession-form');
    const authSidebarSection   = document.getElementById('auth-sidebar-section');
    const welcomeText          = document.getElementById('welcome-text');
    const profileCardName      = document.getElementById('profile-card-name');
    const profileCardImg       = document.getElementById('profile-card-img');
    const userSecretsCount     = document.getElementById('user-secrets-count');
    const userHeartsCount      = document.getElementById('user-hearts-count');

    let isAuthenticated = false;

    function timeAgo(dateStr) {
        const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
        if (diff < 60)    return `${diff}s ago`;
        if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
        return `${Math.floor(diff / 86400)}d ago`;
    }

    const moodIcons = {
        'Study Stress': 'fas fa-book',
        'Crush':        'fas fa-heart',
        'Funny':        'fas fa-laugh-beam',
        'Campus Life':  'fas fa-university',
        'Rant':         'fas fa-angry',
        'Other':        'fas fa-comment',
    };

    function updateSpotlight(confessions) {
        const spotlightSelect = document.getElementById('spotlight-select');
        const spotlightContent = document.getElementById('spotlight-content');
        
        const categories = ['All', ...Object.keys(moodIcons)]; 
        
        if (spotlightSelect.options.length <= 1) {
            spotlightSelect.innerHTML = categories.map(cat => 
                `<option value="${cat}">${cat}</option>`
            ).join('');
            
            spotlightSelect.addEventListener('change', () => {
                renderSpotlight(spotlightSelect.value, confessions);
            });
        }
        
        renderSpotlight(spotlightSelect.value || 'All', confessions);
    }

    function renderSpotlight(category, confessions) {
        const spotlightContent = document.getElementById('spotlight-content');
        
        let filtered = confessions;
        if (category !== 'All') {
            filtered = confessions.filter(c => (c.tags || []).includes(category));
        }

        if (filtered.length === 0) {
            spotlightContent.innerHTML = '<div class="spotlight-placeholder">No confessions in this category yet.</div>';
            return;
        }

        const topPost = filtered.reduce((prev, current) => {
            const prevLikes = prev.reactions?.like || 0;
            const currentLikes = current.reactions?.like || 0;
            return (prevLikes > currentLikes) ? prev : current;
        });

        const icon = moodIcons[topPost.tags?.[0]] || 'fas fa-comment';

        spotlightContent.innerHTML = `
            <div class="spotlight-card">
                <div class="card-header" style="margin-bottom:10px; opacity:0.8; font-size:0.9rem">
                    <span><i class="fas fa-crown spotlight-crown"></i> Top ${category} Secret</span>
                    <span style="float:right"><i class="${icon}"></i> ${topPost.tags?.[0]}</span>
                </div>
                <div class="card-content">"${topPost.text}"</div>
                <div class="card-footer">
                    <span>${timeAgo(topPost.createdAt)}</span>
                    <span style="color:var(--highlight-yellow)"><i class="fas fa-heart"></i> ${topPost.reactions?.like || 0} Lights</span>
                </div>
            </div>`;
    }

    async function loadAiForecast() {
        const forecastEl = document.getElementById('ai-forecast-content');
        if (!forecastEl) return;

        try {
            let dots = 0;
            const loadingInterval = setInterval(() => {
                dots = (dots + 1) % 4;
                forecastEl.textContent = 'Connecting to weather satellite' + '.'.repeat(dots);
            }, 500);

            const res = await api('/confessions/forecast');
            const data = await res.json();
            
            clearInterval(loadingInterval);
            
            if (data.forecast) {
                forecastEl.textContent = '';
                let i = 0;
                const txt = data.forecast;
                const typeWriter = () => {
                    if (i < txt.length) {
                        forecastEl.textContent += txt.charAt(i);
                        i++;
                        setTimeout(typeWriter, 30);
                    }
                };
                typeWriter();
            } else {
                forecastEl.textContent = "Atmospheric interference. Cannot predict mood.";
            }
        } catch (e) {
            forecastEl.textContent = "AI Satellite Offline.";
        }
    }

    async function api(url, method = 'GET', body = null) {
        const opts = { method, headers: { 'Content-Type': 'application/json' } };
        if (body) opts.body = JSON.stringify(body);
        return fetch(url, opts);
    }

    const searchInput = document.querySelector('.search-box input');

    searchInput.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase().trim();
        const allCards = document.querySelectorAll('.confession-card');

        let hasResult = false;
        allCards.forEach(card => {
            const text = card.querySelector('.card-content').textContent.toLowerCase();
            const tag  = card.querySelector('.tag-badge').textContent.toLowerCase();
            
            if (text.includes(term) || tag.includes(term)) {
                card.style.display = 'block';
                hasResult = true;
            } else {
                card.style.display = 'none';
            }
        });
    });

    function updateWidgets(confessions) {
        updateSpotlight(confessions);

        const tagScores = {};
        
        confessions.forEach(c => {
            const reactions = c.reactions || {};
            const score = 1 
                + (reactions.like || 0) * 2 
                + (reactions.love || 0) * 3 
                + (reactions.laugh || 0) * 2;

            (c.tags || []).forEach(tag => {
                tagScores[tag] = (tagScores[tag] || 0) + score;
            });
        });

        const sorted = Object.entries(tagScores).sort((a, b) => b[1] - a[1]);
        if (!sorted.length) return;

        const [topMood, topScore] = sorted[0];
        const totalScore = Object.values(tagScores).reduce((a, b) => a + b, 0);
        const pct   = Math.round((topScore / totalScore) * 100);

        const moodWidget = document.querySelector('.mood-widget');
        if (moodWidget) {
            moodWidget.innerHTML = `
                <div class="widget-header">Campus Vibe</div>
                <div class="mood-meter">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px">
                        <span style="font-weight:600;color:var(--accent)">${topMood}</span>
                        <span style="font-size:0.8rem;color:var(--text-muted)">${pct}% Intensity</span>
                    </div>
                    <div class="progress-bar"><div class="fill" style="width:${pct}%"></div></div>
                    <div style="margin-top:8px;font-size:0.75rem;color:var(--text-muted)">Based on total engagement</div>
                </div>`;
        }

        const topicsCloud = document.querySelector('.tags-cloud');
        if (topicsCloud) {
            topicsCloud.innerHTML = sorted.slice(0, 8)
                .map(([tag]) => `<span class="tag">#${tag.replace(/\s+/g, '').toLowerCase()}</span>`)
                .join('');
        }
    }

    async function loadConfessions() {
        try {
            const data = await (await fetch('/confessions')).json();
            updateWidgets(data);
            confessionsContainer.innerHTML = data.length
                ? data.map(c => {
                    const tag  = c.tags?.[0] || 'Campus Life';
                    const icon = moodIcons[tag] || 'fas fa-comment';
                    return `
                        <div class="confession-card">
                            <div class="card-header">
                                <span class="tag-badge"><i class="${icon}"></i> ${tag}</span>
                                <span class="time-ago">${timeAgo(c.createdAt)}</span>
                            </div>
                            <div class="card-content">${c.text}</div>
                            <div class="card-footer">
                                <div class="anon-id"><i class="fas fa-mask"></i> Anon #${c._id.slice(-4)}</div>
                                <div class="card-stats">
                                    <div class="stat" onclick="reactTo('${c._id}','like')">
                                        <i class="far fa-heart"></i> ${c.reactions?.like || 0}
                                    </div>
                                    <div class="stat" onclick="editConfession('${c._id}')" title="Edit">
                                        <i class="fas fa-edit"></i>
                                    </div>
                                    <div class="stat" onclick="deleteConfession('${c._id}')" title="Delete">
                                        <i class="fas fa-trash"></i>
                                    </div>
                                </div>
                            </div>
                        </div>`;
                }).join('')
                : '<p style="color:var(--highlight-yellow);text-align:center;padding:40px">No secrets yet. Be the first!</p>';
        } catch (err) {
            confessionsContainer.innerHTML = '<p style="color:var(--highlight-yellow);text-align:center;padding:40px">Failed to load. Please refresh.</p>';
        }
    }

    async function loadUserHistory() {
        try {
            const data = await (await fetch('/confessions/mine')).json();
            userSecretsCount.textContent = data.length;
            userHeartsCount.textContent  = data.reduce((acc, c) => acc + (c.reactions?.like || 0), 0);
            historyContainer.innerHTML = data.length
                ? data.map(c => `
                    <div class="history-item">
                        <div class="history-content">
                            <div class="history-text">${c.text}</div>
                            <div class="history-meta">${timeAgo(c.createdAt)}</div>
                        </div>
                        <span class="status-badge active" style="cursor:pointer" onclick="deleteConfession('${c._id}')">Delete</span>
                    </div>`).join('')
                : '<p style="color:var(--highlight-yellow);text-align:center;padding:40px">You haven\'t posted any secrets yet.</p>';
        } catch (err) {
            historyContainer.innerHTML = '<p style="color:var(--highlight-yellow);text-align:center;padding:40px">Could not load your history.</p>';
        }
    }

    async function checkAuth() {
        let user = null;
        try {
            const text = await (await fetch('/auth/current_user')).text();
            user = text ? JSON.parse(text) : null;
        } catch (e) { 
            console.error('Auth check failed', e);
         }

        if (user?._id) {
            isAuthenticated = true;
            writeSecretBtn.style.display = 'flex';
            welcomeText.textContent      = `Welcome back, ${user.displayName.split(' ')[0]}.`;
            profileCardName.textContent  = user.displayName;
            profileCardImg.src = user.photo
                || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName)}&size=128&background=random`;
            authSidebarSection.innerHTML = `
                <div class="user-profile-mini">
                    <div class="avatar">
                        <img src="${user.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName)}&background=random`}" alt="Avatar">
                    </div>
                    <div class="user-info">
                        <span class="user-name">${user.displayName}</span>
                        <span class="user-status">Online</span>
                    </div>
                    <a href="/auth/logout" class="logout-icon"><i class="fas fa-sign-out-alt"></i></a>
                </div>`;
        } else {
            isAuthenticated = false;
            writeSecretBtn.style.display = 'none';
            welcomeText.textContent      = 'Welcome, Guest.';
            authSidebarSection.innerHTML = `
                <a href="/auth/google" class="btn-login">
                    <i class="fab fa-google"></i> Login
                </a>`;
        }

        loadConfessions();
    }

    navFeed.addEventListener('click', (e) => {
        e.preventDefault();
        navFeed.classList.add('active');
        navHistory.classList.remove('active');
        feedView.style.display    = 'block';
        historyView.style.display = 'none';
        loadConfessions();
    });

    navHistory.addEventListener('click', (e) => {
        e.preventDefault();
        if (!isAuthenticated) {
            alert('Please login to view your profile and secrets.');
            return;
        }
        navHistory.classList.add('active');
        navFeed.classList.remove('active');
        feedView.style.display    = 'none';
        historyView.style.display = 'block';
        loadUserHistory();
    });

    writeSecretBtn.addEventListener('click', () => secretModal.style.display = 'flex');
    document.querySelector('.close-modal').addEventListener('click', () => secretModal.style.display = 'none');
    window.addEventListener('click', (e) => { if (e.target === secretModal) secretModal.style.display = 'none'; });

    confessionForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const text       = document.getElementById('confession-text').value.trim();
        const secretCode = document.getElementById('secret-code').value;
        const tagInput   = document.querySelector('input[name="mood-tag"]:checked');
        const tags       = tagInput ? [tagInput.value] : ['Campus Life'];

        const res = await api('/confessions', 'POST', { text, secretCode, tags });
        if (res.ok) {
            confessionForm.reset();
            secretModal.style.display = 'none';
            loadConfessions();
        } else {
            const err = await res.json();
            alert(err.error || 'Failed to post. Try again.');
        }
    });

    window.reactTo = async (id, type) => {
        const res = await api(`/confessions/${id}/react`, 'POST', { reactionType: type });
        if (res.ok) loadConfessions();
    };

    window.editConfession = async (id) => {
        const secretCode = prompt('Enter your secret code to edit:');
        if (!secretCode) return;
        const text = prompt('Enter the new text:');
        if (!text) return;
        const res = await api(`/confessions/${id}`, 'PUT', { secretCode, text });
        res.ok ? loadConfessions() : alert('Wrong secret code.');
    };

    window.deleteConfession = async (id) => {
        const secretCode = prompt('Enter your secret code to delete:');
        if (!secretCode) return;
        const res = await api(`/confessions/${id}`, 'DELETE', { secretCode });
        if (res.ok) {
            loadConfessions();
            if (historyView.style.display !== 'none') loadUserHistory();
        } else {
            alert('Wrong secret code.');
        }
    };

    checkAuth();
    loadAiForecast();
});

