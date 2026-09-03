// Smooth scrolling for navigation links
function scrollToSection(sectionId) {
    const element = document.getElementById(sectionId);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
    }
}

// AI Style Recommender Form Handler
document.getElementById('styleForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const recommendations = document.getElementById('recommendations');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const recommendationContent = document.getElementById('recommendationContent');
    
    // Show loading spinner
    loadingSpinner.style.display = 'block';
    recommendations.style.display = 'none';
    
    try {
        // Call your backend API to get AI recommendations
        const response = await axios.post('/api/ai-recommendation', {
            faceShape: formData.get('faceShape'),
            hairType: formData.get('hairType'),
            skinTone: formData.get('skinTone'),
            occasion: formData.get('occasion')
        });
        
        loadingSpinner.style.display = 'none';
        recommendations.style.display = 'block';
        recommendationContent.textContent = response.data.recommendations;
    } catch (error) {
        loadingSpinner.style.display = 'none';
        recommendations.style.display = 'block';
        recommendationContent.textContent = `Error getting recommendations: ${error.message}. 
        
Please try again or contact us on WhatsApp for personalized consultation!`;
        console.error('Error:', error);
    }
});

// Add scroll animation for service cards
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

document.querySelectorAll('.service-card, .gallery-item').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'all 0.6s ease';
    observer.observe(el);
});

// Navbar scroll effect
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 50) {
        navbar.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.15)';
    } else {
        navbar.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
    }
});