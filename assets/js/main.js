 // Get the appropriate canvas based on screen size
        const canvas = window.innerWidth <= 900 ? 
            document.getElementById('mobile-canvas') : 
            document.getElementById('canvas');
        const ctx = canvas.getContext('2d');
        
        // Set canvas size
        function resizeCanvas() {
            if (window.innerWidth <= 900) {
                // Mobile canvas sizing
                const rect = canvas.getBoundingClientRect();
                canvas.width = rect.width;
                canvas.height = rect.height;
            } else {
                // Desktop canvas sizing
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight;
            }
        }
        
        resizeCanvas();

        // Animation state
        let isAnimating = true;
        let sampleSize = 30;
        let currentDistribution = 'uniform';
        let sampleCount = 0;
        let sampleMeans = [];
        let animationFrame;

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
                this.targetX = canvas.width * 0.8;
                this.targetY = canvas.height * 0.3 + value * 200;
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
                    Math.random() * canvas.width * 0.3 + 50,
                    Math.random() * canvas.height * 0.3 + 100,
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
                x: canvas.width * 0.4,
                y: canvas.height * 0.5,
                targetX: canvas.width * 0.8,
                targetY: canvas.height * 0.8 - mean * 200,
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
            const startX = canvas.width * 0.1;
            const startY = canvas.height * 0.8;
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
            for (let i = 0; i < histogram.length; i++) {
                if (histogram[i] > 0) {
                    const barHeight = (histogram[i] / maxHistogramValue) * height;
                    const x = startX + i * barWidth;
                    const y = startY - barHeight;

                    ctx.fillStyle = colors.accent;
                    ctx.globalAlpha = 0.7;
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
            
            // Clear canvas completely to fix trails
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = 'rgba(0, 0, 0, 0.02)';  // Very subtle background
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Update and draw particles
            particles = particles.filter(particle => {
                particle.update();
                particle.draw();
                return particle.life > 0;
            });
            
            // Draw histogram
            drawHistogram();
            
            // Generate new sample occasionally (slower on mobile)
            const generationRate = window.innerWidth <= 900 ? 0.02 : 0.05;
            const maxParticles = window.innerWidth <= 900 ? 500 : 1000;
            if (Math.random() < generationRate && particles.length < maxParticles) {
                generateSample();
            }
            
            animationFrame = requestAnimationFrame(animate);
        }

        // Control functions
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
        }

        function changeSampleSize() {
            const sizes = [10, 30, 50, 100, 500];
            const currentIndex = sizes.indexOf(sampleSize);
            sampleSize = sizes[(currentIndex + 1) % sizes.length];
            document.getElementById('sampleSize').textContent = sampleSize;
        }

        function changeDistribution() {
            const distributions = ['uniform', 'exponential', 'bimodal', 'skewed'];
            const currentIndex = distributions.indexOf(currentDistribution);
            currentDistribution = distributions[(currentIndex + 1) % distributions.length];
            document.getElementById('distType').textContent = currentDistribution.charAt(0).toUpperCase() + currentDistribution.slice(1);
            resetAnimation();
        }

        // Handle window resize
        window.addEventListener('resize', () => {
            resizeCanvas();
        });

        // Start animation
        animate();