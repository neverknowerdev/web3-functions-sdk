import "hardhat/types/config";
import "hardhat/types/runtime";
import { W3fUserConfig, W3fHardhatConfig } from "../types";
import { W3fHardhatPlugin } from "./W3fHardhatPlugin";
declare module "hardhat/types/config" {
    interface HardhatUserConfig {
        w3f: Partial<W3fUserConfig>;
    }
    interface HardhatConfig {
        w3f: W3fHardhatConfig;
    }
}
declare module "hardhat/types/runtime" {
    interface HardhatRuntimeEnvironment {
        w3f: W3fHardhatPlugin;
    }
}
