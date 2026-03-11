// 1. Anime.js Vine Growth Animation
window.onload = () => {
    anime({
        targets: '.vine-line',
        strokeDashoffset: [anime.setDashoffset, 0],
        easing: 'easeInOutQuart',
        duration: 2500,
        delay: 800,
        begin: function(anim) {
            // Optional: make lines visible only when animation starts
            document.querySelectorAll('.vine-line').forEach(el => el.style.opacity = "1");
        }
    });

    anime({
        targets: '.vine-dot',
        opacity: [0, 0.6],
        scale: [0, 1],
        easing: 'easeOutElastic(1, .6)',
        duration: 800,
        delay: anime.stagger(200, {start: 2800}) // Dots pop after vine grows
    });
};

// 2. Scroll Reveal Logic
window.addEventListener('scroll', () => {
    const reveals = document.querySelectorAll('.reveal');
    reveals.forEach(el => {
        let windowHeight = window.innerHeight;
        let revealTop = el.getBoundingClientRect().top;
        if (revealTop < windowHeight - 100) {
            el.classList.add('active');
        }
    });
});

// 3. Smooth Scroll
function scrollToProject() {
    document.getElementById('project-info').scrollIntoView({ behavior: 'smooth' });
}