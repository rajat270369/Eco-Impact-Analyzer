window.onload = () => {
    // Grow the Vines
    anime({
        targets: '.vine-line',
        strokeDashoffset: [anime.setDashoffset, 0],
        easing: 'easeInOutSine',
        duration: 2500,
        delay: 500
    });

    // Pop the Dots
    anime({
        targets: '.vine-dot',
        opacity: [0, 0.7],
        scale: [0, 1],
        duration: 800,
        easing: 'easeOutBack',
        delay: anime.stagger(300, {start: 2500})
    });
};

function scrollToProject() {
    document.getElementById('project-info').scrollIntoView({ behavior: 'smooth' });
}