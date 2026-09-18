const intro = document.getElementById("intro");

intro.innerHTML = `
    <div class="intro-scene">

        <div class="particles"></div>

        <div class="logo-container">

            <div class="logo-mark">
                <div class="logo-book left"></div>
                <div class="logo-book right"></div>
                <div class="logo-pencil"></div>
            </div>

            <div class="logo-text">
                <span>Study</span><strong>AI</strong>
            </div>

            <p class="tagline">
                Aprende. Comprende. Domina.
            </p>

        </div>

        <div class="intro-line"></div>

    </div>
`;


/* =========================================
   PARTÍCULAS
========================================= */

const particles = document.querySelector(".particles");

for (let i = 0; i < 45; i++) {

    const particle = document.createElement("span");

    particle.className = "particle";

    particle.style.left =
        Math.random() * 100 + "%";

    particle.style.top =
        Math.random() * 100 + "%";

    particle.style.animationDelay =
        Math.random() * 4 + "s";

    particle.style.animationDuration =
        3 + Math.random() * 4 + "s";

    particles.appendChild(particle);
}


/* =========================================
   FINAL DE LA INTRO
========================================= */

setTimeout(() => {

    document.querySelector(".intro-scene")
        ?.classList.add("intro-finished");

}, 5000);