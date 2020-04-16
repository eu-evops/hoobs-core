/**************************************************************************************************
 * hoobs-core                                                                                     *
 * Copyright (C) 2020 HOOBS                                                                       *
 *                                                                                                *
 * This program is free software: you can redistribute it and/or modify                           *
 * it under the terms of the GNU General Public License as published by                           *
 * the Free Software Foundation, either version 3 of the License, or                              *
 * (at your option) any later version.                                                            *
 *                                                                                                *
 * This program is distributed in the hope that it will be useful,                                *
 * but WITHOUT ANY WARRANTY; without even the implied warranty of                                 *
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the                                  *
 * GNU General Public License for more details.                                                   *
 *                                                                                                *
 * You should have received a copy of the GNU General Public License                              *
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.                          *
 **************************************************************************************************/

const Path = require("path");
const File = require("fs-extra");
const Process = require("child_process");

module.exports = (enviornment) => {
    return new Promise(async (resolve) => {
        console.log("");
        console.log("Removing the HOOBS/Homebridge Switch Capabilities");

        const known = [
            "auth.json",
            "config.json",
            "layout.json"
        ];

        console.log("Removing Configuration Files");

        if (File.existsSync(Path.join(enviornment.storage, "config.json"))) {
            File.unlinkSync(Path.join(enviornment.storage, "config.json"));
        }

        if (File.existsSync(Path.join(enviornment.storage, "auth.json"))) {
            File.unlinkSync(Path.join(enviornment.storage, "auth.json"));
        }

        if (File.existsSync(Path.join(enviornment.storage, "accessories/uiAccessoriesLayout.json"))) {
            File.unlinkSync(Path.join(enviornment.storage, "accessories/uiAccessoriesLayout.json"));
        }

        console.log("Removing Homebridge Accessory Cache");

        if (File.existsSync(Path.join(enviornment.storage, "accessories"))) {
            File.removeSync(Path.join(enviornment.storage, "accessories"));
        }

        if (File.existsSync(Path.join(enviornment.storage, "persist"))) {
            File.removeSync(Path.join(enviornment.storage, "persist"));
        }

        console.log("Removing Unmanaged Files");

        if (File.existsSync(enviornment.storage)) {
            const files = File.readdirSync(enviornment.storage).filter(f => File.lstatSync(Path.join(enviornment.storage, f)).isFile() && known.indexOf(f) === -1);

            for (let i = 0; i < files.length; i++) {
                File.unlinkSync(Path.join(enviornment.storage, files[i]));
            }
        }

        console.log("Removing Services - This May Take Some Time");

        if (File.existsSync("/etc/systemd/system/multi-user.target.wants/homebridge-config-ui-x.service")) {
            Process.execSync("systemctl disable homebridge-config-ui-x.service");
            Process.execSync("systemctl stop homebridge-config-ui-x.service");
        }

        if (File.existsSync("/etc/systemd/system/homebridge-config-ui-x.service")) {
            File.unlinkSync("/etc/systemd/system/homebridge-config-ui-x.service");
        }

        if (File.existsSync("/etc/systemd/system/multi-user.target.wants/homebridge.service")) {
            Process.execSync("systemctl disable homebridge.service");
            Process.execSync("systemctl stop homebridge.service");
        }

        if (File.existsSync("/etc/systemd/system/homebridge.service")) {
            File.unlinkSync("/etc/systemd/system/homebridge.service");
        }

        console.log("Removing Enviornment File");

        if (File.existsSync(enviornment.defaults)) {
            File.unlinkSync(enviornment.defaults);
        }

        if (File.existsSync(enviornment.storage)) {
            Process.execSync(`rm -fR ${enviornment.storage}`);
        }

        for (let i = 0; i < enviornment.incompatable.length; i++) {
            await npmUnnstall(enviornment.incompatable[i]);
        }

        for (let i = 0; i < enviornment.plugins.length; i++) {
            await npmUnnstall(enviornment.plugins[i].name);
        }

        console.log("Starting HOOBS");

        if (!File.existsSync("/etc/systemd/system/multi-user.target.wants/hoobs.service")) {
            Process.execSync("systemctl enable hoobs.service");
        }

        Process.execSync("systemctl start hoobs.service");

        console.log("");

        resolve();
    });
};

const npmUnnstall = function (name) {
    return new Promise((resolve) => {
        console.log(`Removing Plugin "${name}"`);

        const proc = Process.spawn("npm", [
            "uninstall",
            "-g",
            name
        ]);

        proc.on("close", () => {
            resolve();
        });
    });
};
