import { AllAgentConfigsType } from "../types";
import frontDeskAuthentication from "./frontDeskAuthentication";
import customerServiceRetail from "./customerServiceRetail";
import example from "./example";

export const allAgentSets: AllAgentConfigsType = {
  frontDeskAuthentication,
  customerServiceRetail,
  example,
};

export const defaultAgentSetKey = "example";
