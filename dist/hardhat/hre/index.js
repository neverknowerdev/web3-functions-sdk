"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("hardhat/config");
const plugins_1 = require("hardhat/plugins");
const path_1 = __importDefault(require("path"));
const index_1 = require("../constants/index");
const W3fHardhatPlugin_1 = require("./W3fHardhatPlugin");
// This import is needed to let the TypeScript compiler know that it should include your type
// extensions in your npm package's types file.
require("./type-extensions");
(0, config_1.extendConfig)((config, userConfig) => {
    var _a, _b;
    // set up root dir
    const usrRootDir = userConfig.w3f.rootDir;
    let w3fRootDir;
    if (usrRootDir === undefined) {
        w3fRootDir = path_1.default.join(config.paths.root, index_1.W3f_ROOT_DIR);
    }
    else if (path_1.default.isAbsolute(usrRootDir)) {
        w3fRootDir = usrRootDir;
    }
    else {
        w3fRootDir = path_1.default.normalize(path_1.default.join(config.paths.root, usrRootDir));
    }
    config.w3f.rootDir = w3fRootDir;
    // set up w3f networks for multi chain provider
    const usrW3fNetworks = userConfig.w3f.networks;
    const defaultNetwork = (_b = (_a = userConfig.defaultNetwork) !== null && _a !== void 0 ? _a : config.defaultNetwork) !== null && _b !== void 0 ? _b : "hardhat";
    let networks;
    if (!usrW3fNetworks || usrW3fNetworks.length === 0) {
        networks = new Set(defaultNetwork);
    }
    else {
        networks = new Set([...usrW3fNetworks, defaultNetwork]);
    }
    config.w3f.networks = Array.from(networks);
});
(0, config_1.extendEnvironment)((hre) => {
    // We add a field to the Hardhat Runtime Environment here.
    // We use lazyObject to avoid initializing things until they are actually
    // needed.
    hre.w3f = (0, plugins_1.lazyObject)(() => new W3fHardhatPlugin_1.W3fHardhatPlugin(hre));
});
