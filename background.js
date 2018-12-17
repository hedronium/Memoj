const id = chrome.runtime.id;

const Tess = Tesseract.create({
    workerPath: `chrome-extension://${id}/tess/worker.min.js`,
    langPath: `chrome-extension://${id}/lang/`,
    corePath: `chrome-extension://${id}/tess/core.js`,
});

const db_request = indexedDB.open("Memes", 1);
let db;

db_request.onupgradeneeded = () => {
    db = db_request.result;

    store = db.createObjectStore("MemeStore", {
        keyPath: "url"
    });

    console.log('Object store created.');

    text_index = store.createIndex("MemeTextIndex", "text");
    console.log('Text Index created.');


    url_index = store.createIndex("MemeURLIndex", "url", {
        unique: true
    });
    console.log('URL Index created.');

}

db_request.onsuccess = () => {
    db = db_request.result;
}

const insert = doc => {
    console.log('Inserting:', doc);
    db.transaction(["MemeStore"], "readwrite").objectStore("MemeStore").put(doc);
}

const process = (image) => {
    Tess.recognize(
        image, {
            lang: 'eng'
        }
    ).then((result) => {
        let text = "";
        text += result.text;

        let sanitized = text.toLowerCase().split('').map(char => {
            const code = char.charCodeAt(0);

            if ((code >= 48 && code <= 57) || (code >= 97 && code <= 122)) {
                return char;
            }

            return ' ';
        }).join('').replace(/\s+/gi, ' ').trim();

        insert({
            text: sanitized,
            url: image.src,
            width: image.width,
            height: image.height
        });
    });
}

const handler = (request) => {
    if (request.type !== 'image') {
        return;
    }

    const img = new Image();

    img.onload = () => {
        if (img.width >= 300 && img.height >= 300) {
            process(img);
        }
    };

    img.src = request.url;
};

chrome.webRequest.onCompleted.addListener(handler, {
    urls: [
        "<all_urls>"
    ]
});