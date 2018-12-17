const db_request = indexedDB.open("Memes", 1);
let db;

db_request.onsuccess = () => {
    db = db_request.result;
}

const iter = (cb = () => {}, count = 0) => {
    let i = 0;
    const req = db.transaction("MemeStore", "readonly")
        .objectStore("MemeStore")
        .openCursor();

    req.onsuccess = ev => {
        const cursor = ev.target.result;

        if (cursor) {
            cb(cursor.value);

            i++;
            if (i < count || count === 0) {
                cursor.continue();
            }
        }
    }
}

let to = setTimeout(() => {}, 0);

const bar = document.getElementById('bar');
const output = document.getElementById('output');

bar.addEventListener('keyup', () => {
    clearTimeout(to);

    to = setTimeout(() => {
        output.innerHTML = '';

        let term = bar.value.toLowerCase().split('').map(char => {
            const code = char.charCodeAt(0);

            if ((code >= 48 && code <= 57) || (code >= 97 && code <= 122)) {
                return char;
            }

            return ' ';
        }).join('').replace(/\s+/gi, ' ').trim();

        console.log(`Searching for "${term}" ...`);

        let i = 0;

        iter(doc => {
            if (doc.text.indexOf(term) !== -1 && i < 15) {
                output.innerHTML += `
                    <a href="${doc.url}" target="_blank" class="result">
                        <img src="${doc.url}">
                    </a>
                `;

                i++;
            }
        });
    }, 500);
});