/**************************************************************************************************
 * hoobs-core / homebridge                                                                        *
 * Copyright (C) 2020 Homebridge                                                                  *
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

const HAP = require("hap-nodejs");
const User = require("./user");
const Version = require("./version");
const Platform = require("./platform");
const LegacyTypes = require("hap-nodejs/dist/accessories/types");

const { internal } = require("./logger");
const { EventEmitter } = require("events");

module.exports = class API extends EventEmitter {
    constructor() {
        super();

        this.accessories = {};
        this.platforms = {};

        this.configurableAccessories = {};
        this.dynamicPlatforms = {};

        this.version = 2.4;
        this.serverVersion = Version;

        this.user = User;
        this.hap = HAP;

        this.hapLegacyTypes = LegacyTypes;

        this.platformAccessory = Platform;
    }

    accessory(name) {
        if (name.indexOf(".") === -1) {
            const found = [];

            for (let fullName in this.accessories) {
                if (fullName.split(".")[1] === name) {
                    found.push(fullName);
                }
            }

            if (found.length === 1) {
                return this.accessories[found[0]];
            } else if (found.length > 1) {
                throw new Error(`The requested accessory "${name}" has been registered multiple times.`);
            } else {
                throw new Error(`The requested accessory "${name}" was not registered by any plugin.`);
            }
        } else {
            if (!this.accessories[name]) {
                throw new Error(`The requested accessory "${name}" was not registered by any plugin.`);
            }

            return this.accessories[name];
        }
    }

    registerAccessory(pluginName, accessoryName, constructor, configurationRequestHandler) {
        if (this.accessories[`${pluginName}.${accessoryName}`]) {
            throw new Error(`Attempting to register an accessory "${pluginName}.${accessoryName}" which has already been registered.`);
        }
    
        internal.info(`Registering accessory "${pluginName}.${accessoryName}"`);
    
        this.accessories[`${pluginName}.${accessoryName}`] = constructor;
    
        if (configurationRequestHandler) {
            this.configurableAccessories[`${pluginName}.${accessoryName}`] = configurationRequestHandler;
        }
    }
    
    publishCameraAccessories(pluginName, accessories) {
        for (let index in accessories) {
            if (!(accessories[index] instanceof Platform)) {
                throw new Error(`"${pluginName}" attempt to register an accessory that isn't platform accessory.`);
            }
    
            accessories[index].associatedPlugin = pluginName;
        }
    
        this.emit("publishExternalAccessories", API.seralizeAccessories(accessories));
    }
    
    publishExternalAccessories(pluginName, accessories) {
        for (let index in accessories) {
            if (!(accessories[index] instanceof Platform)) {
                throw new Error(`"${pluginName}" attempt to register an accessory that isn't platform accessory.`);
            }
    
            accessories[index].associatedPlugin = pluginName;
        }
    
        this.emit("publishExternalAccessories", API.seralizeAccessories(accessories));
    }
    
    platform(name) {
        if (name.indexOf(".") === -1) {
            const found = [];
    
            for (let fullName in this.platforms) {
                if (fullName.split(".")[1] === name) {
                    found.push(fullName);
                }
            }
    
            if (found.length === 1) {
                return this.platforms[found[0]];
            } else if (found.length > 1) {
                throw new Error(`The requested platform "${name}" has been registered multiple times.`);
            } else {
                throw new Error(`The requested platform "${name}" was not registered by any plugin.`);
            }
        } else {
            if (!this.platforms[name]) {
                throw new Error(`The requested platform "${name}" was not registered by any plugin.`);
            }
    
            return this.platforms[name];
        }
    }
    
    registerPlatform(pluginName, platformName, constructor, dynamic) {
        if (this.platforms[`${pluginName}.${platformName}`]) {
            throw new Error(`Attempting to register a platform "${pluginName}.${platformName}" which has already been registered!`);
        }
    
        internal.info(`Registering platform "${pluginName}.${platformName}"`);
    
        this.platforms[`${pluginName}.${platformName}`] = constructor;
    
        if (dynamic) {
            this.dynamicPlatforms[`${pluginName}.${platformName}`] = constructor;
        }
    }
    
    registerPlatformAccessories(pluginName, platformName, accessories) {
        for (let index in accessories) {
            if (!(accessories[index] instanceof Platform)) {
                throw new Error(`"${pluginName} - ${platformName}" attempt to register an accessory that isn't platform accessory.`);
            }
    
            accessories[index].associatedPlugin = pluginName;
            accessories[index].associatedPlatform = platformName;
        }
    
        this.emit("registerPlatformAccessories", API.seralizeAccessories(accessories));
    }
    
    updatePlatformAccessories(accessories) {
        this.emit("updatePlatformAccessories", API.seralizeAccessories(accessories));
    }
    
    unregisterPlatformAccessories(pluginName, platformName, accessories) {
        for (let index in accessories) {
            if (!(accessories[index] instanceof Platform)) {
                throw new Error(`"${pluginName} - ${platformName}" attempt to unregister an accessory that isn't platform accessory.`);
            }
        }
    
        this.emit("unregisterPlatformAccessories", API.seralizeAccessories(accessories));
    }
    
    static seralizeAccessories(value) {
        const cache = [];
    
        return JSON.parse(JSON.stringify(value, (_key, item) => {
            if (typeof item === "object" && item !== null) {
                if (cache.indexOf(item) !== -1) {
                    return;
                }
    
                cache.push(item);
            }

            return item;
        }));
    }

    static expandUUID(value) {
        value = `00000000${value}`;

        return `${value.substring(value.length - 8, value.length)}-0000-1000-8000-0026BB765291`;
    }
}