const CONFIG = {
    version: "1.1.0" 
};

document.addEventListener("DOMContentLoaded", () => {
    const versionElement = document.getElementById("app-version");
    if (versionElement) {
        versionElement.textContent = CONFIG.version;
    }
});
