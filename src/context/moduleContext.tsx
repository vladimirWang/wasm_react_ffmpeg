import { createContext, useContext } from "react";
import type { EmscriptenModule } from "../types/wasm";

export const ModuleContext = createContext<EmscriptenModule | null>(null);
