import { useReducer, useCallback } from "react";
import type { TimeBlock } from "../types";

interface PlannerState {
  energyScore: number;
  socialScore: number;
  date: string;
  timeBlocks: TimeBlock[];
  bezirke: string[];
}

type Action =
  | { type: "SET_MOOD"; energy: number; social: number }
  | { type: "SET_DATE"; date: string }
  | { type: "TOGGLE_TIME_BLOCK"; block: TimeBlock }
  | { type: "TOGGLE_BEZIRK"; bezirk: string }
  | { type: "RESET" };

function getToday(): string {
  return new Date().toISOString().slice(0, 10);
}

const initialState: PlannerState = {
  energyScore: 3,
  socialScore: 3,
  date: getToday(),
  timeBlocks: [],
  bezirke: [],
};

function reducer(state: PlannerState, action: Action): PlannerState {
  switch (action.type) {
    case "SET_MOOD":
      return { ...state, energyScore: action.energy, socialScore: action.social };
    case "SET_DATE":
      return { ...state, date: action.date };
    case "TOGGLE_TIME_BLOCK": {
      const has = state.timeBlocks.includes(action.block);
      return {
        ...state,
        timeBlocks: has
          ? state.timeBlocks.filter((b) => b !== action.block)
          : [...state.timeBlocks, action.block],
      };
    }
    case "TOGGLE_BEZIRK": {
      const has = state.bezirke.includes(action.bezirk);
      return {
        ...state,
        bezirke: has
          ? state.bezirke.filter((b) => b !== action.bezirk)
          : [...state.bezirke, action.bezirk],
      };
    }
    case "RESET":
      return { ...initialState, date: getToday() };
  }
}

export function usePlannerForm() {
  const [state, dispatch] = useReducer(reducer, initialState);

  const isValid =
    state.timeBlocks.length > 0 && state.bezirke.length > 0;

  const setMood = useCallback(
    (energy: number, social: number) =>
      dispatch({ type: "SET_MOOD", energy, social }),
    [],
  );

  const setDate = useCallback(
    (date: string) => dispatch({ type: "SET_DATE", date }),
    [],
  );

  const toggleTimeBlock = useCallback(
    (block: TimeBlock) => dispatch({ type: "TOGGLE_TIME_BLOCK", block }),
    [],
  );

  const toggleBezirk = useCallback(
    (bezirk: string) => dispatch({ type: "TOGGLE_BEZIRK", bezirk }),
    [],
  );

  const reset = useCallback(() => dispatch({ type: "RESET" }), []);

  return {
    state,
    isValid,
    setMood,
    setDate,
    toggleTimeBlock,
    toggleBezirk,
    reset,
  };
}
