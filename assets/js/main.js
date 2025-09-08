 const canvas = document.getElementById('canvas');
        const ctx = canvas.getContext('2d');
        
        // Set canvas size
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        // Animation state
        let isAnimating = true;
        let sampleSize = 30;
        let currentDistribution = 'uniform';
        let sampleCount = 0;
        let sampleMeans = [];
        let animationFrame;
        
        // Auto-cycling state
        let autoMode = true;
        let cycleTimer = 0;
        let cycleDuration = 1800; // frames before switching (about 3 seconds at 60fps)
        let currentSizeIndex = 0;
        let currentDistIndex = 0;
        const allSizes = [10, 30, 50, 100, 500];
        const allDistributions = ['uniform', 'exponential', 'bimodal', 'skewed'];
        
        // Transition state
        let isTransitioning = false;
        let transitionAlpha = 1.0;
        let transitionSpeed = 0.03; // Slower for smoother transition
        let transitionPhase = 'fadeOut'; // 'fadeOut' or 'fadeIn'

        // Colors
        const colors = {
            primary: '#61dafb',
            secondary: '#ff6b6b',
            accent: '#4ecdc4',
            background: 'rgba(26, 34, 44, 0.1)'
        };

        // Distribution functions
        function uniform() {
            return Math.random();
        }

        function exponential() {
            return -Math.log(Math.random());
        }

        function bimodal() {
            return Math.random() < 0.5 ? Math.random() * 0.4 : 0.6 + Math.random() * 0.4;
        }

        function skewed() {
            let x = Math.random();
            return Math.pow(x, 3);
        }

        // Get sample from current distribution
        function getSample() {
            switch(currentDistribution) {
                case 'uniform': return uniform();
                case 'exponential': return exponential() / 5; // Normalize
                case 'bimodal': return bimodal();
                case 'skewed': return skewed();
                default: return uniform();
            }
        }

        // Particle system for visualization
        class Particle {
            constructor(x, y, value) {
                this.x = x;
                this.y = y;
                this.value = value;
                this.targetX = canvas.width * 0.7; // Adjusted target position
                this.targetY = canvas.height * 0.4 + value * 150; // Adjusted for new layout
                this.speed = 0.02;
                this.life = 1;
                this.size = Math.random() * 3 + 2;
            }

            update() {
                // Move towards target
                this.x += (this.targetX - this.x) * this.speed;
                this.y += (this.targetY - this.y) * this.speed;
                
                // Fade out
                this.life -= 0.005;
                
                return this.life > 0;
            }

            draw() {
                ctx.save();
                ctx.globalAlpha = this.life * 0.6;
                ctx.fillStyle = colors.primary;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
        }

        let particles = [];
        let histogram = new Array(50).fill(0);
        let maxHistogramValue = 1;

        // Generate sample and create particles
        function generateSample() {
            let sum = 0;
            let sampleParticles = [];
            
            // Generate sample
            for (let i = 0; i < sampleSize; i++) {
                let value = getSample();
                sum += value;
                
                // Create particle for each data point
                sampleParticles.push(new Particle(
                    Math.random() * canvas.width * 0.4 + canvas.width * 0.3, // More centered spawn area
                    Math.random() * canvas.height * 0.3 + canvas.height * 0.1, // Adjusted vertical position
                    value
                ));
            }
            
            let mean = sum / sampleSize;
            sampleMeans.push(mean);
            
            // Add to histogram
            let bin = Math.floor(mean * (histogram.length - 1));
            bin = Math.max(0, Math.min(histogram.length - 1, bin));
            histogram[bin]++;
            maxHistogramValue = Math.max(maxHistogramValue, histogram[bin]);
            
            // Add particles to main array
            particles.push(...sampleParticles);
            
            // Create mean particle (larger, different color)
            particles.push({
                x: canvas.width * 0.5, // Center horizontally
                y: canvas.height * 0.4, // Adjusted vertical position
                targetX: canvas.width * 0.7, // Adjusted target position
                targetY: canvas.height * 0.75 - mean * 200, // Align with new histogram position
                speed: 0.03,
                life: 2,
                size: 8,
                isMean: true,
                update: function() {
                    this.x += (this.targetX - this.x) * this.speed;
                    this.y += (this.targetY - this.y) * this.speed;
                    this.life -= 0.003;
                    return this.life > 0;
                },
                draw: function() {
                    ctx.save();
                    ctx.globalAlpha = Math.min(this.life, 1) * 0.8;
                    ctx.fillStyle = colors.secondary;
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                    ctx.fill();
                    
                    // Add glow effect
                    ctx.shadowBlur = 15;
                    ctx.shadowColor = colors.secondary;
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, this.size * 0.5, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                }
            });
            
            sampleCount++;
            document.getElementById('sampleCount').textContent = sampleCount;
        }

        // Draw histogram of sample means
        function drawHistogram() {
            const startX = canvas.width * 0.2; // More centered positioning
            const startY = canvas.height * 0.75; // Slightly higher
            const width = canvas.width * 0.6;
            const height = 150;
            const barWidth = width / histogram.length;

            // Draw axes
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(startX + width, startY);
            ctx.moveTo(startX, startY);
            ctx.lineTo(startX, startY - height);
            ctx.stroke();

            // Draw bars
            ctx.globalAlpha = 0.7;
            for (let i = 0; i < histogram.length; i++) {
                if (histogram[i] > 0) {
                    const barHeight = (histogram[i] / maxHistogramValue) * height;
                    const x = startX + i * barWidth;
                    const y = startY - barHeight;

                    ctx.fillStyle = colors.accent;
                    ctx.fillRect(x, y, barWidth - 1, barHeight);
                }
            }
            ctx.globalAlpha = 1;

            // Draw normal curve overlay if enough samples
            if (sampleMeans.length > 10) {
                drawNormalCurve(startX, startY, width, height);
            }
        }

        // Draw theoretical normal distribution
        function drawNormalCurve(startX, startY, width, height) {
            if (sampleMeans.length === 0) return;
            
            const mean = sampleMeans.reduce((a, b) => a + b, 0) / sampleMeans.length;
            const variance = sampleMeans.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0) / sampleMeans.length;
            const std = Math.sqrt(variance);
            
            ctx.strokeStyle = colors.secondary;
            ctx.lineWidth = 2;
            ctx.beginPath();
            
            for (let x = 0; x <= width; x += 2) {
                const normalizedX = x / width;
                const z = (normalizedX - mean) / std;
                const y = Math.exp(-0.5 * z * z) / (std * Math.sqrt(2 * Math.PI));
                const scaledY = startY - (y * height * std * 5);
                
                if (x === 0) {
                    ctx.moveTo(startX + x, scaledY);
                } else {
                    ctx.lineTo(startX + x, scaledY);
                }
            }
            ctx.stroke();
        }

        // Animation loop
        function animate() {
            if (!isAnimating) return;
            
            // Clear the entire canvas completely
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = 'rgba(0, 0, 0, 0.95)'; // Solid dark background
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Handle transition fade effect with easing
            if (isTransitioning) {
                if (transitionPhase === 'fadeOut') {
                    // Smooth fade out with easing
                    transitionAlpha -= transitionSpeed * (transitionAlpha * 0.8 + 0.2);
                    if (transitionAlpha <= 0.05) {
                        transitionAlpha = 0;
                        completeTransition();
                        transitionPhase = 'fadeIn';
                    }
                } else if (transitionPhase === 'fadeIn') {
                    // Smooth fade in with easing
                    transitionAlpha += transitionSpeed * ((1 - transitionAlpha) * 0.8 + 0.2);
                    if (transitionAlpha >= 0.95) {
                        transitionAlpha = 1.0;
                        isTransitioning = false;
                        transitionPhase = 'fadeOut';
                    }
                }
            }
            
            // Apply smooth transition alpha with additional smoothing
            const smoothAlpha = transitionAlpha * transitionAlpha * (3 - 2 * transitionAlpha); // Smoothstep function
            ctx.globalAlpha = smoothAlpha;
            
            // Update and draw particles
            particles = particles.filter(particle => {
                particle.update();
                particle.draw();
                return particle.life > 0;
            });
            
            // Draw histogram
            drawHistogram();
            
            // Reset global alpha
            ctx.globalAlpha = 1.0;
            
        // Generate new sample occasionally
        if (Math.random() < 0.15 && particles.length < 1000) { // Increased frequency for faster cycling
            generateSample();
        }
        
        // Auto-cycle through configurations
        if (autoMode) {
            cycleTimer++;
            if (cycleTimer >= cycleDuration && !isTransitioning) {
                cycleTimer = 0;
                startTransition();
            }
        }            animationFrame = requestAnimationFrame(animate);
        }

        // Start smooth transition
        function startTransition() {
            if (!isTransitioning) {
                isTransitioning = true;
                transitionPhase = 'fadeOut';
                transitionAlpha = 1.0;
            }
        }
        
        // Complete the transition (called when fade reaches 0)
        function completeTransition() {
            // Cycle through sample sizes first, then distributions
            currentSizeIndex++;
            if (currentSizeIndex >= allSizes.length) {
                currentSizeIndex = 0;
                currentDistIndex++;
                if (currentDistIndex >= allDistributions.length) {
                    currentDistIndex = 0;
                }
                currentDistribution = allDistributions[currentDistIndex];
                document.getElementById('distType').textContent = currentDistribution.charAt(0).toUpperCase() + currentDistribution.slice(1);
            }
            
            sampleSize = allSizes[currentSizeIndex];
            document.getElementById('sampleSize').textContent = sampleSize;
            
            // Complete reset for clean transition
            particles = [];
            histogram = new Array(50).fill(0);
            sampleMeans = [];
            sampleCount = 0;
            maxHistogramValue = 1;
            document.getElementById('sampleCount').textContent = sampleCount;
        }

        // Control functions
        function nextConfiguration() {
            // For manual transitions, also use smooth fade
            if (!isTransitioning) {
                startTransition();
            }
        }
        
        function toggleAutoMode() {
            autoMode = !autoMode;
            cycleTimer = 0;
        }

        function toggleAnimation() {
            isAnimating = !isAnimating;
            if (isAnimating) animate();
        }

        function resetAnimation() {
            particles = [];
            histogram = new Array(50).fill(0);
            sampleMeans = [];
            sampleCount = 0;
            maxHistogramValue = 1;
            document.getElementById('sampleCount').textContent = sampleCount;
            
            // Reset transition state
            isTransitioning = false;
            transitionAlpha = 1.0;
            transitionPhase = 'fadeOut';
        }

        function changeSampleSize() {
            if (!autoMode) { // Only allow manual changes when auto mode is off
                const sizes = [10, 30, 50, 100, 500];
                const currentIndex = sizes.indexOf(sampleSize);
                sampleSize = sizes[(currentIndex + 1) % sizes.length];
                document.getElementById('sampleSize').textContent = sampleSize;
            }
        }

        function changeDistribution() {
            if (!autoMode) { // Only allow manual changes when auto mode is off
                if (!isTransitioning) {
                    startTransition();
                }
            }
        }

        // Handle window resize
        window.addEventListener('resize', () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        });
        
        // Add keyboard controls
        window.addEventListener('keydown', (e) => {
            switch(e.key) {
                case ' ': // Spacebar to toggle auto mode
                    e.preventDefault();
                    toggleAutoMode();
                    break;
                case 'r': // R to reset
                    resetAnimation();
                    break;
                case 'p': // P to pause/play animation
                    toggleAnimation();
                    break;
                case 'ArrowRight': // Right arrow for next config (manual mode only)
                    if (!autoMode) nextConfiguration();
                    break;
            }
        });

        // Initialize display
        document.getElementById('sampleSize').textContent = sampleSize;
        document.getElementById('distType').textContent = currentDistribution.charAt(0).toUpperCase() + currentDistribution.slice(1);
        document.getElementById('sampleCount').textContent = sampleCount;

        // Start animation
        animate();