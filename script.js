function scrollToProject() {
    document.getElementById('project-info').scrollIntoView({ behavior: 'smooth' });
}

// Simple reveal logic for the card
window.addEventListener('scroll', () => {
    const reveals = document.querySelectorAll('.reveal');
    reveals.forEach(el => {
        let windowHeight = window.innerHeight;
        let revealTop = el.getBoundingClientRect().top;
        if (revealTop < windowHeight - 50) {
            el.classList.add('active');
        }
    });
});