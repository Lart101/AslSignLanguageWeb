function translateText() {
    const inputText = document.getElementById('input-text').value;
    const imagesContainer = document.getElementById('translated-images');
    imagesContainer.innerHTML = '';

    if (inputText.trim() === '') {
        imagesContainer.innerHTML = '<p class="warning">Please enter some text to translate.</p>';
        return;
    }

    for (let char of inputText) {
        if (/[a-zA-Z]/.test(char)) {
            const upperChar = char.toUpperCase();
            const container = document.createElement('div');
            container.className = 'sign-container';
            
            const img = document.createElement('img');
            img.src = `static/sign_language_images/alphabet_${upperChar}.jpg`;
            img.alt = `Sign for letter ${char}`;
            img.style.width = '120px';
            img.style.height = '120px';
            
            const letter = document.createElement('p');
            letter.textContent = char;
            
            container.appendChild(img);
            container.appendChild(letter);
            imagesContainer.appendChild(container);
        } else if (char === ' ') {
            const space = document.createElement('div');
            space.style.width = '40px';
            space.style.height = '120px';
            imagesContainer.appendChild(space);
        }
    }

    if (imagesContainer.children.length === 0) {
        imagesContainer.innerHTML = '<p class="warning">No valid letters found to translate. Please enter A-Z or a-z characters.</p>';
    }
}

document.querySelector('.menu-toggle').addEventListener('click', function() {
    this.classList.toggle('active');
    document.querySelector('nav').classList.toggle('active');
});