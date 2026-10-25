import axios from "axios";
import type { NetworkTopology, SimulationState, TrafficDemand, SimulationMetrics, ScenarioInfo } from "../types/network";

const API_URL = "http://localhost:8000/api";

export const getTopology = async (): Promise<NetworkTopology> => {
  const response = await axios.get(`${API_URL}/topology`);
  return response.data;
};

export const loadSampleTopology = async (): Promise<NetworkTopology> => {
  const response = await axios.post(`${API_URL}/topology/load-sample`);
  return response.data;
};

export const failLink = async (linkId: string): Promise<void> => {
  await axios.post(`${API_URL}/topology/link/${linkId}/fail`);
};

export const restoreLink = async (linkId: string): Promise<void> => {
  await axios.post(`${API_URL}/topology/link/${linkId}/restore`);
};

export const getSimulationState = async (): Promise<SimulationState> => {
  const response = await axios.get(`${API_URL}/simulation/state`);
  return response.data;
};

export const runSimulation = async (strategy: string): Promise<SimulationState> => {
  const response = await axios.post(`${API_URL}/simulation/run?strategy=${strategy}`);
  return response.data;
};

export const resetSimulation = async (): Promise<SimulationState> => {
  const response = await axios.post(`${API_URL}/simulation/reset`);
  return response.data;
};

export const updateDemands = async (demands: TrafficDemand[]): Promise<TrafficDemand[]> => {
  const response = await axios.post(`${API_URL}/demands`, demands);
  return response.data;
};

export const getScenarios = async (): Promise<ScenarioInfo[]> => {
  const response = await axios.get(`${API_URL}/scenarios`);
  return response.data;
};

export const loadScenario = async (scenarioId: string): Promise<SimulationState> => {
  const response = await axios.post(`${API_URL}/scenarios/${scenarioId}/load`);
  return response.data;
};

export const runComparison = async (): Promise<Record<string, SimulationMetrics>> => {
  const response = await axios.post(`${API_URL}/simulation/compare`);
  return response.data;
};
