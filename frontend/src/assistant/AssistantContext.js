import { createContext, useContext } from "react";
export const AssistantContext = createContext(null);
export const useAssistant = () => useContext(AssistantContext);
