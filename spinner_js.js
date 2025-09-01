class WheelSpinner {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.currentRotation = 0;
        
        this.foodOptions = [
            { name: 'Pizza', emoji: '🍕', color: '#ff6b6b', query: 'pizza' },
            { name: 'Burger', emoji: '🍔', color: '#4ecdc4', query: 'burger' },
            { name: 'Sushi', emoji: '🍣', color: '#45b7d1', query: 'sushi' },
            { name: 'Coffee', emoji: '☕', color: '#8B4513', query: 'coffee' },
            { name: 'Ramen', emoji: '🍜', color: '#ff9ff3', query: 'ramen' },
            { name: 'Pasta', emoji: '🍝', color: '#54a0ff', query: 'pasta' },
            { name: 'Chicken', emoji: '🍗', color: '#5f27cd', query: 'chicken' },
            { name: 'Salad', emoji: '🥗', color: '#00d2d3', query: 'salad' },
            { name: 'Steak', emoji: '🥩', color: '#ff6348', query: 'steak' },
            { name: 'Ice Cream', emoji: '🍦', color: '#ffb8b8', query: 'ice cream' },
            { name: 'Sandwich', emoji: '🥪', color: '#c44569', query: 'sandwich' },
            { name: 'Bakery', emoji: '🥖', color: '#fd79a8', query: 'bakery' }
        ];
    }

    drawWheel() {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const radius = 160;
        const numSegments = this.foodOptions.length;
        const anglePerSegment = (2 * Math.PI) / numSegments;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw segments
        this.foodOptions.forEach((food, index) => {
            const startAngle = index * anglePerSegment + this.currentRotation;
            const endAngle = (index + 1) * anglePerSegment + this.currentRotation;
            
            // Draw segment
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, radius, startAngle, endAngle);
            this.ctx.lineTo(centerX, centerY);
            this.ctx.fillStyle = food.color;
            this.ctx.fill();
            this.ctx.strokeStyle = '#fff';
            this.ctx.lineWidth = 3;
            this.ctx.stroke();

            // Draw emoji
            const textAngle = startAngle + anglePerSegment / 2;
            const textX = centerX + Math.cos(textAngle) * (radius * 0.7);
            const textY = centerY + Math.sin(textAngle) * (radius * 0.7);
            
            this.ctx.font = '24px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(food.emoji, textX, textY);

            // Draw food name
            this.ctx.font = '12px Arial';
            this.ctx.fillStyle = 'white';
            this.ctx.strokeStyle = 'black';
            this.ctx.lineWidth = 2;
            const nameX = centerX + Math.cos(textAngle) * (radius * 0.85);
            const nameY = centerY + Math.sin(textAngle) * (radius * 0.85);
            this.ctx.strokeText(food.name, nameX, nameY);
            this.ctx.fillText(food.name, nameX, nameY);
        });

        // Draw center circle
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, 30, 0, 2 * Math.PI);
        this.ctx.fillStyle = '#fff';
        this.ctx.fill();
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        
        // Draw center emoji
        this.ctx.font = '20px Arial';
        this.ctx.fillStyle = '#333';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('🎯', centerX, centerY);
    }

    spin() {
        return new Promise((resolve) => {
            // Generate random spin
            const minSpins = 3;
            const maxSpins = 6;
            const spins = Math.random() * (maxSpins - minSpins) + minSpins;
            const finalAngle = spins * 2 * Math.PI;
            
            // Animation duration
            const duration = 3000;
            
            // Set CSS variables for animation
            document.documentElement.style.setProperty('--spin-rotation', `${finalAngle}rad`);
            document.documentElement.style.setProperty('--spin-duration', `${duration}ms`);
            
            this.canvas.classList.add('spinning');
            
            setTimeout(() => {
                this.canvas.classList.remove('spinning');
                this.currentRotation = finalAngle % (2 * Math.PI);
                this.drawWheel();
                
                // Determine winning segment (fixed calculation for top pointer)
                const pointerAngle = Math.PI / 2; // Pointer at top (90 degrees)
                const adjustedAngle = (pointerAngle - this.currentRotation) % (2 * Math.PI);
                const normalizedAngle = adjustedAngle < 0 ? adjustedAngle + (2 * Math.PI) : adjustedAngle;
                const segmentIndex = Math.floor(normalizedAngle / ((2 * Math.PI) / this.foodOptions.length));
                const winningFood = this.foodOptions[segmentIndex];
                
                resolve(winningFood);
            }, duration);
        });
    }
}