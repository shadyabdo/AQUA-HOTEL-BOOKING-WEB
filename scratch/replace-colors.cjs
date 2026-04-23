const fs = require('fs');
const path = require('path');

const directories = ['components', 'src'];

const colorMap = {
    '#1B142A': '#1e2b8f', // Main primary dark
    '#23263b': '#151e63', // Dark text
    '#05060f': '#0c123b', // Deep background
};

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(dirPath);
    });
}

function processFile(filePath) {
    if (!filePath.match(/\.(tsx|ts|jsx|js|css|html)$/)) return;
    
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;
    
    for (const [oldColor, newColor] of Object.entries(colorMap)) {
        // use case-insensitive regex for the hex codes
        const regex = new RegExp(oldColor, 'gi');
        content = content.replace(regex, newColor);
    }
    
    if (content !== original) {
        fs.writeFileSync(filePath, content);
        console.log(`Updated ${filePath}`);
    }
}

directories.forEach(dir => {
    if (fs.existsSync(dir)) {
        walkDir(dir, processFile);
    }
});
