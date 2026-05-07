export interface SimulationRequest {
    region_id: number;
    days: number;
    initial_moisture: number;
    initial_temp: number;
    daily_rain: number;
    solar_radiation: number;
}

export interface SimulationListItem {
    id: number;
    created_at: string;
    days: number;
}

export interface RegionSimulationsResponse {
    total: number;
    skip: number;
    limit: number;
    simulations: SimulationListItem[];
}

export interface SimulationResult {
    simulation_id: number;
    region_id: number;
    created_at: string;
    time: number[];
    moisture: number[];
    temperature: number[];
}

export interface TaskResult {
    simulation_id: number;
    time: number[];
    moisture: number[];
    temperature: number[];
}

export interface TaskStatus {
    task_id: number;
    status: 'running' | 'done' | 'error';
    result: TaskResult | null;
    error: string | null;
}