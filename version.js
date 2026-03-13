// EchoDupe Version Control
const CONFIG = {
    version: "v1.0.1-BETA", 
    buildName: "Build_Registry"
};

// This function finds the version tag and updates the text
document.addEventListener("DOMContentLoaded", () => {
    const versionElement = document.getElementById("app-version");
    if (versionElement) {
        versionElement.textContent = CONFIG.version;
    }
});
