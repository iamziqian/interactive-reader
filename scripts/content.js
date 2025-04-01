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

// Function to chunk paragraphs and add timers
function addTimersToParagraphs() {
    // Select all paragraph elements on the page
    const paragraphs = document.querySelectorAll("p");

    paragraphs.forEach((paragraph) => {
        // Skip the badge paragraph (identified by its class)
        if (paragraph.classList.contains("color-secondary-text") && paragraph.classList.contains("type--caption")) {
            return;
        }

        // Calculate the word count for the paragraph
        const wordCount = getWordCount(paragraph.textContent);
        // Skip empty paragraphs
        if (wordCount === 0) return;

        // Calculate recommended reading time (in seconds)
        const readingTime = Math.ceil(wordCount / (200 / 60)); // 200 words per minute

        // Create a wrapper div for the paragraph and timer
        const wrapper = document.createElement("div");
        wrapper.style.marginBottom = "20px";
        wrapper.style.border = "1px solid #ccc";
        wrapper.style.padding = "10px";
        wrapper.style.borderRadius = "5px";

        // Create a timer element
        const timer = document.createElement("div");
        timer.style.fontSize = "14px";
        timer.style.color = "#555";
        timer.style.marginBottom = "10px";
        timer.textContent = `Time left: ${readingTime} seconds`;

        // Append the timer and paragraph to the wrapper
        wrapper.appendChild(timer);

        // Create a new paragraph element to hold the splitting text
        const newParagraph = document.createElement("p");

        // Wrap each word in a <span> and append it back to the paragraph
        const text = paragraph.textContent;
        text.split(" ").forEach((word) => {
            const span = document.createElement("span");
            span.textContent = word + " "; // Add a space after each word
            span.style.display = "inline-block";
            span.style.transition = "opacity 0.5s ease";
            span.style.whiteSpace = "pre"; // Preserve the whitespace
            newParagraph.appendChild(span);
        });

        // Append the new paragraph to the wrapper
        wrapper.appendChild(newParagraph);

        // Replace the original paragraph with the wrapper
        paragraph.replaceWith(wrapper);

        // Add an event listener to fade out the word when hovered
        newParagraph.addEventListener("mouseover", (event) => {
            const target = event.target;
            if (target.tagName === "SPAN") {
                const fadeTimeout = setTimeout(() => {
                    target.style.opacity = "0"; // Fade out the word after 120ms
                }, 120); 

                target.addEventListener(
                    "mouseleave",
                    () => {
                        clearTimeout(fadeTimeout); // Cancel the fade-out
                    },
                    { once: true }
                );
            }
        });

        // Add an event listener to start the timer when the user interacts with the paragraph
        let timeLeft = readingTime;
        let interval = null;

        wrapper.addEventListener("mouseenter", () => {
            if (!interval) {
                interval = setInterval(() => {
                    timeLeft -= 1;
                    timer.textContent = `Time left: ${timeLeft} seconds`;

                    if (timeLeft <= 0) {
                        clearInterval(interval);
                        timer.textContent = "Time's up!";
                    }
                }, 1000);
            }
        });

        // Stop the timer if the user leaves the paragraph
        wrapper.addEventListener("mouseleave", () => {
            if (timeLeft > 0) {
                clearInterval(interval);
                interval = null;
                timer.textContent = `Time left: ${timeLeft} seconds`;
            }
        });
    });
}

// Run the function when the content script is loaded
addTimersToParagraphs();