// Function to calculate word count
function getWordCount(text) {
    const wordMatchRegExp = /[^\s]+/g;
    const words = text.match(wordMatchRegExp) || [];
    return words.length;
}

const article = document.querySelector('article');

// Total word count and reading time for the article
if (article) {
    const text = article.textContent;
    const wordCount = getWordCount(text);
    const readingTime = Math.round(wordCount / 200);
    
    const badge = document.createElement("p");
    badge.classList.add("color-secondary-text", "type--caption");
    badge.textContent = `${readingTime} min read`;
    badge.style.color = "#007BFF";

    const heading = article.querySelector('h1');
    const date = article.querySelector('time')?.parentNode;

    (date ?? heading).insertAdjacentElement("afterend", badge);
}