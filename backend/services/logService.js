const fs = require("fs");
const path = require("path");

const logDirectory = path.join(
    __dirname,
    "../logs"
);

const logFile = path.join(
    logDirectory,
    "application.log"
);

function ensureLogDirectory() {
    if (!fs.existsSync(logDirectory)) {
        fs.mkdirSync(logDirectory, {
            recursive: true
        });
    }
}

function writeLog(level, message) {
    ensureLogDirectory();

    const time = new Date().toLocaleString("sv-SE");

    const line =
        `[${time}] [${level}] ${message}`;

    fs.appendFileSync(
        logFile,
        `${line}\n`,
        "utf8"
    );

    if (level === "ERROR") {
        console.error(line);
    } else if (level === "WARNING") {
        console.warn(line);
    } else {
        console.log(line);
    }
}

function info(message) {
    writeLog("INFO", message);
}

function warning(message) {
    writeLog("WARNING", message);
}

function error(message) {
    writeLog("ERROR", message);
}

module.exports = {
    info,
    warning,
    error
};
