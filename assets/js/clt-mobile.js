// Mobile-optimized Central Limit Theorem Visualization
class MobileCLT {
    constructor() {
        this.canvas = document.getElementById('mobile-canvas');
        if (!this.canvas) return;
        
        this.ctx = this.canvas.getContext('2d');
        this.setupCanvas();
        
        // Mobile-optimized parameters
        this.distributions = ['uniform', 'exponential', 'bimodal', 'skewed'];
        this.sampleSizes = [10, 20, 30, 50];
        this.currentDistIndex = 0;
        this.currentSizeIndex = 0;
        this.isRunning = true;
        
        // Performance optimizations for mobile
        this.maxParticles = 150; // Reduced from 300+
        this.particleSpeed = 2;
        this.histogramBins = 30; // Reduced bins
        this.generationRate = 0.3; // Slower generation
        
        this.particles = [];
        this.histogram = new Array(this.histogramBins).fill(0);
        this.maxHistogramValue = 1;
        this.sampleCount = 0;
        this.lastTime = 0;
        
        // Auto-cycling
        this.cycleInterval = 8000; // 8 seconds per cycle
        this.lastCycleTime = Date.now();
        
        this.init();
    }
    
    setupCanvas() {
        const resizeCanvas = () => {
            const rect = this.canvas.getBoundingClientRect();
            const dpr = Math.min(window.devicePixelRatio || 1, 2); // Limit DPR for performance
            
            this.canvas.width = rect.width * dpr;
            this.canvas.height = rect.height * dpr;
            
            this.ctx.scale(dpr, dpr);
            this.canvas.style.width = rect.width + 'px';
            this.canvas.style.height = rect.height + 'px';
            
            this.width = rect.width;
            this.height = rect.height;
        };
        
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
    }
    
    getCurrentDistribution() {
        return this.distributions[this.currentDistIndex];
    }
    
    getCurrentSampleSize() {
        return this.sampleSizes[this.currentSizeIndex];
    }
    
    // Distribution functions
    generateSample() {
        const size = this.getCurrentSampleSize();
        const samples = [];
        
        for (let i = 0; i < size; i++) {
            samples.push(this.generateRandomValue());
        }
        
        return samples.reduce((a, b) => a + b, 0) / size;
    }
    
    generateRandomValue() {
        const dist = this.getCurrentDistribution();
        
        switch (dist) {
            case 'uniform':
                return Math.random();
                
            case 'exponential':
                return -Math.log(1 - Math.random()) / 2;
                
            case 'bimodal':
                return Math.random() < 0.5 ? 
                    Math.random() * 0.3 + 0.1 : 
                    Math.random() * 0.3 + 0.6;
                    
            case 'skewed':
                const u1 = Math.random();
                const u2 = Math.random();
                return Math.max(u1, u2);
                
            default:
                return Math.random();
        }
    }
    
    addParticle() {
        if (this.particles.length >= this.maxParticles) return;
        
        const sample = this.generateSample();
        const x = this.width * 0.1 + Math.random() * this.width * 0.8;
        const y = this.height * 0.2;
        
        this.particles.push({
            x: x,
            y: y,
            targetX: this.getSamplePosition(sample),
            targetY: this.height * 0.8,
            sample: sample,
            alpha: 1,
            phase: 'falling'
        });
        
        this.updateHistogram(sample);
        this.sampleCount++;
    }
    
    getSamplePosition(sample) {
        const dist = this.getCurrentDistribution();
        let normalizedSample;
        
        switch (dist) {
            case 'uniform':
                normalizedSample = sample;
                break;
            case 'exponential':
                normalizedSample = Math.min(sample / 2, 1);
                break;
            case 'bimodal':
                normalizedSample = sample;
                break;
            case 'skewed':
                normalizedSample = sample;
                break;
            default:
                normalizedSample = sample;
        }
        
        return this.width * 0.2 + normalizedSample * this.width * 0.6;
    }
    
    updateHistogram(sample) {
        const dist = this.getCurrentDistribution();
        let normalizedSample;
        
        switch (dist) {
            case 'uniform':
                normalizedSample = sample;
                break;
            case 'exponential':
                normalizedSample = Math.min(sample / 2, 1);
                break;
            case 'bimodal':
                normalizedSample = sample;
                break;
            case 'skewed':
                normalizedSample = sample;
                break;
            default:
                normalizedSample = sample;
        }
        
        const binIndex = Math.floor(normalizedSample * this.histogramBins);
        const clampedIndex = Math.max(0, Math.min(binIndex, this.histogramBins - 1));
        
        this.histogram[clampedIndex]++;
        this.maxHistogramValue = Math.max(this.maxHistogramValue, this.histogram[clampedIndex]);
    }
    
    updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            
            if (particle.phase === 'falling') {
                // Move towards target
                const dx = particle.targetX - particle.x;
                const dy = particle.targetY - particle.y;
                
                particle.x += dx * 0.1;
                particle.y += dy * 0.1 + this.particleSpeed;
                
                // Check if reached bottom
                if (particle.y >= particle.targetY - 10) {
                    particle.phase = 'fading';
                }
            } else if (particle.phase === 'fading') {
                particle.alpha -= 0.02;
                if (particle.alpha <= 0) {
                    this.particles.splice(i, 1);
                }
            }
        }
    }
    
    drawHistogram() {
        const histogramWidth = this.width * 0.6;
        const histogramHeight = this.height * 0.3;
        const histogramX = this.width * 0.2;
        const histogramY = this.height * 0.65;
        
        const binWidth = histogramWidth / this.histogramBins;
        
        // Draw histogram bars
        this.ctx.fillStyle = 'rgba(100, 200, 255, 0.6)';
        for (let i = 0; i < this.histogramBins; i++) {
            const barHeight = (this.histogram[i] / this.maxHistogramValue) * histogramHeight;
            const x = histogramX + i * binWidth;
            const y = histogramY + histogramHeight - barHeight;
            
            this.ctx.fillRect(x, y, binWidth - 1, barHeight);
        }
        
        // Draw normal curve overlay (simplified)
        if (this.sampleCount > 20) {
            this.drawNormalCurve(histogramX, histogramY, histogramWidth, histogramHeight);
        }
    }
    
    drawNormalCurve(x, y, width, height) {
        this.ctx.strokeStyle = 'rgba(255, 255, 100, 0.8)';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        
        const points = 50;
        for (let i = 0; i <= points; i++) {
            const t = i / points;
            const curveX = x + t * width;
            
            // Simple normal-like curve
            const normalizedT = (t - 0.5) * 6; // Scale to roughly -3 to 3
            const normalValue = Math.exp(-0.5 * normalizedT * normalizedT);
            const curveY = y + height - (normalValue * height * 0.8);
            
            if (i === 0) {
                this.ctx.moveTo(curveX, curveY);
            } else {
                this.ctx.lineTo(curveX, curveY);
            }
        }
        
        this.ctx.stroke();
    }
    
    drawParticles() {
        for (const particle of this.particles) {
            this.ctx.globalAlpha = particle.alpha;
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, 2, 0, Math.PI * 2);
            this.ctx.fill();
        }
        this.ctx.globalAlpha = 1;
    }
    
    drawInfo() {
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        this.ctx.font = '14px Arial';
        
        const dist = this.getCurrentDistribution();
        const size = this.getCurrentSampleSize();
        
        // Distribution name
        const distName = dist.charAt(0).toUpperCase() + dist.slice(1);
        this.ctx.fillText(`Distribution: ${distName}`, this.width * 0.05, this.height * 0.05);
        
        // Sample size
        this.ctx.fillText(`Sample Size: ${size}`, this.width * 0.05, this.height * 0.08);
        
        // Sample count
        this.ctx.fillText(`Samples: ${this.sampleCount}`, this.width * 0.05, this.height * 0.11);
        
        // CLT explanation
        this.ctx.font = '11px Arial';
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        this.ctx.fillText('Central Limit Theorem', this.width * 0.05, this.height * 0.16);
        this.ctx.fillText('Sample means → Normal', this.width * 0.05, this.height * 0.185);
    }
    
    autoCycle() {
        const now = Date.now();
        if (now - this.lastCycleTime > this.cycleInterval) {
            this.nextCycle();
            this.lastCycleTime = now;
        }
    }
    
    nextCycle() {
        // Cycle through sample sizes first, then distributions
        this.currentSizeIndex++;
        if (this.currentSizeIndex >= this.sampleSizes.length) {
            this.currentSizeIndex = 0;
            this.currentDistIndex = (this.currentDistIndex + 1) % this.distributions.length;
        }
        
        // Reset for new cycle
        this.particles = [];
        this.histogram = new Array(this.histogramBins).fill(0);
        this.maxHistogramValue = 1;
        this.sampleCount = 0;
    }
    
    render(currentTime) {
        if (!this.isRunning) return;
        
        // Clear canvas
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        // Auto-cycle
        this.autoCycle();
        
        // Generate new particles (throttled for mobile)
        if (currentTime - this.lastTime > 100 && Math.random() < this.generationRate) {
            this.addParticle();
            this.lastTime = currentTime;
        }
        
        // Update and draw
        this.updateParticles();
        this.drawHistogram();
        this.drawParticles();
        this.drawInfo();
        
        requestAnimationFrame(this.render.bind(this));
    }
    
    init() {
        if (!this.canvas) return;
        requestAnimationFrame(this.render.bind(this));
    }
}

// Initialize mobile CLT when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Only initialize on mobile screens
    if (window.innerWidth <= 900) {
        new MobileCLT();
    }
    
    // Handle window resize
    window.addEventListener('resize', () => {
        const mobileCanvas = document.getElementById('mobile-canvas');
        if (mobileCanvas && window.innerWidth <= 900) {
            // Reinitialize if switching to mobile view
            new MobileCLT();
        }
    });
});
