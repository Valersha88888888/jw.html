const fs = require("fs");
const path = require("path");

const logFile = path.join(
    __dirname,
    "../logs/application.log"
);

function writeLog(level, message) {

    const time = new Date().toLocaleString("sv-SE");

    const line =
        `[${time}] [${level}] ${message}\n`;

    fs.appendFileSync(
        logFile,
        line,
        "utf8"
    );

}

function info(message) {

    writeLog(
        "INFO",
        message
    );

}

function warning(message) {

    writeLog(
        "WARNING",
        message
    );

}

function error(message) {

    writeLog(
        "ERROR",
        message
    );

}

module.exports = {

    info,
    warning,
    error

};