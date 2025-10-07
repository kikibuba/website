// Register Service Worker for offline capability
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js').catch(registrationError => {
                    console.log('SW registration failed: ', registrationError);
                });
            });
        }
// Game State
        let game = loadGame() || {
            cookies: 0,
            cps: 0,
            clickPower: 1,
            upgrades: {
                cursor: { price: 15, owned: 0, cps: 0.1 },
                grandma: { price: 100, owned: 0, cps: 1 },
                farm: { price: 1100, owned: 0, cps: 8 },
                clickPower: { price: 50, increase: 1 }
            },
            achievements: {
                firstClick: false
            },
            lastUpdate: Date.now()
        };
// DOM Elements
        const cookie = document.getElementById('cookie');
        const cookieCount = document.getElementById('cookie-count');
        const cpsDisplay = document.getElementById('cps');
        const totalCps = document.getElementById('total-cps');
        const clickPower = document.getElementById('click-power');
        const clickPowerBar = document.getElementById('click-power-bar');
        const goldenCookieContainer = document.getElementById('golden-cookie-container');
        const goldenCookie = document.getElementById('golden-cookie');
        const notificationContainer = document.getElementById('notification-container');
        // Initialize
        feather.replace();
        
        // Calculate offline progress
        if (game.lastUpdate) {
            const now = Date.now();
            const timeDiff = (now - game.lastUpdate) / 1000; // in seconds
            if (timeDiff > 0) {
                // Calculate offline cookies (max 24 hours)
                const maxOfflineTime = 24 * 60 * 60; // 24 hours in seconds
                const effectiveTime = Math.min(timeDiff, maxOfflineTime);
                game.cookies += game.cps * effectiveTime;
                
                if (effectiveTime > 60) {
                    showNotification(`Welcome back! You earned ${formatNumber(game.cps * effectiveTime)} cookies while offline.`, 'bg-green-100 text-green-800');
                }
            }
        }
        
        updateUI();
// Event Listeners
        cookie.addEventListener('click', handleCookieClick);
        goldenCookie.addEventListener('click', handleGoldenCookieClick);

        // Game Loop
        setInterval(gameLoop, 1000);
        setInterval(spawnGoldenCookie, 30000);

        // Functions
        function gameLoop() {
            // Passive income
            let passiveIncome = 0;
            Object.keys(game.upgrades).forEach(upgrade => {
                if (game.upgrades[upgrade].cps) {
                    passiveIncome += game.upgrades[upgrade].owned * game.upgrades[upgrade].cps;
                }
            });
            
            game.cookies += passiveIncome;
            game.cps = passiveIncome;
            game.lastUpdate = Date.now();
            saveGame();
            updateUI();
        }
        function saveGame() {
            localStorage.setItem('cookieMancer', JSON.stringify(game));
        }

        function loadGame() {
            const saved = localStorage.getItem('cookieMancer');
            if (saved) {
                const parsed = JSON.parse(saved);
                // Ensure all properties exist for backwards compatibility
                return {
                    cookies: parsed.cookies || 0,
                    cps: parsed.cps || 0,
                    clickPower: parsed.clickPower || 1,
                    upgrades: parsed.upgrades || {
                        cursor: { price: 15, owned: 0, cps: 0.1 },
                        grandma: { price: 100, owned: 0, cps: 1 },
                        farm: { price: 1100, owned: 0, cps: 8 },
                        clickPower: { price: 50, increase: 1 }
                    },
                    achievements: parsed.achievements || {
                        firstClick: false
                    },
                    lastUpdate: parsed.lastUpdate || Date.now()
                };
            }
            return null;
        }

        function handleCookieClick() {
            // Add cookies
            game.cookies += game.clickPower;
            game.lastUpdate = Date.now();
            saveGame();
// Achievement check
            if (!game.achievements.firstClick) {
                game.achievements.firstClick = true;
                showNotification('Achievement Unlocked: First Click!', 'bg-yellow-100 text-yellow-800');
            }
            
            // Animation
            anime({
                targets: '#click-effect',
                scale: [1, 1.5],
                opacity: [0.8, 0],
                duration: 500,
                easing: 'easeOutExpo'
            });
            
            // Create floating number
            const clickText = document.createElement('div');
            clickText.textContent = `+${game.clickPower}`;
            clickText.className = 'absolute text-purple-600 font-bold text-lg pointer-events-none';
            clickText.style.left = `${Math.random() * 100}%`;
            clickText.style.top = `${Math.random() * 100}%`;
            document.getElementById('click-effect').appendChild(clickText);
            
            anime({
                targets: clickText,
                translateY: -50,
                opacity: [1, 0],
                duration: 1000,
                easing: 'easeOutExpo',
                complete: () => clickText.remove()
            });
            
            updateUI();
        }

        function handleGoldenCookieClick() {
            // Bonus cookies
            const bonus = Math.floor(game.cps * 10);
            game.cookies += bonus;
            
            // Animation
            anime({
                targets: goldenCookie,
                scale: [1, 1.5],
                opacity: [1, 0],
                duration: 500,
                easing: 'easeOutExpo',
                complete: () => {
                    goldenCookieContainer.classList.add('hidden');
                }
            });
            
            showNotification(`Golden Cookie! +${bonus} cookies`, 'bg-yellow-100 text-yellow-800');
            updateUI();
        }

        function spawnGoldenCookie() {
            if (Math.random() < 0.3) { // 30% chance to spawn
                goldenCookieContainer.classList.remove('hidden');
                goldenCookie.style.left = `${10 + Math.random() * 80}%`;
                
                // Despawn after 10 seconds if not clicked
                setTimeout(() => {
                    if (!goldenCookieContainer.classList.contains('hidden')) {
                        goldenCookieContainer.classList.add('hidden');
                    }
                }, 10000);
            }
        }
        function buyUpgrade(type) {
            game.lastUpdate = Date.now();
            saveGame();
const upgrade = game.upgrades[type];
            
            if (game.cookies >= upgrade.price) {
                game.cookies -= upgrade.price;
                
                if (type === 'clickPower') {
                    game.clickPower += upgrade.increase;
                    upgrade.price = Math.floor(upgrade.price * 1.5);
                } else {
                    upgrade.owned++;
                    upgrade.price = Math.floor(upgrade.price * 1.15);
                }
                
                showNotification(`Purchased: ${type}`, 'bg-purple-100 text-purple-800');
                updateUI();
            } else {
                showNotification('Not enough cookies!', 'bg-red-100 text-red-800');
            }
        }

        function updateUI() {
            // Update cookie count
            cookieCount.textContent = formatNumber(game.cookies);
            
            // Update CPS
            cpsDisplay.textContent = `${formatNumber(game.cps)} cookies per second`;
            totalCps.textContent = formatNumber(game.cps);
            
            // Update click power
            clickPower.textContent = game.clickPower;
            clickPowerBar.style.width = `${Math.min(100, game.clickPower)}%`;
            
            // Update shop prices and counts
            document.getElementById('cursor-price').textContent = formatNumber(game.upgrades.cursor.price);
            document.getElementById('cursor-count').textContent = `${game.upgrades.cursor.owned} owned`;
            
            document.getElementById('grandma-price').textContent = formatNumber(game.upgrades.grandma.price);
            document.getElementById('grandma-count').textContent = `${game.upgrades.grandma.owned} owned`;
            
            document.getElementById('farm-price').textContent = formatNumber(game.upgrades.farm.price);
            document.getElementById('farm-count').textContent = `${game.upgrades.farm.owned} owned`;
            
            document.getElementById('click-power-price').textContent = formatNumber(game.upgrades.clickPower.price);
        }

        function showNotification(message, classes) {
            const notification = document.createElement('div');
            notification.className = `notification p-3 rounded-lg shadow-md ${classes}`;
            notification.textContent = message;
            notificationContainer.appendChild(notification);
            
            setTimeout(() => {
                notification.remove();
            }, 3000);
        }

        function formatNumber(num) {
            if (num >= 1000000) {
                return (num / 1000000).toFixed(1) + 'M';
            }
            if (num >= 1000) {
                return (num / 1000).toFixed(1) + 'K';
            }
            return Math.floor(num);
        }

feather.replace();
