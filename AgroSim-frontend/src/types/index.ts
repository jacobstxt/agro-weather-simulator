export interface Region {
    id: number;
    name: string;
    latitude: number;
    longitude: number;
    soil_type: string;
    area_ha: number;
}

export interface RegionCreate {
    name: string;
    latitude: number;
    longitude: number;
    soil_type: string;
    area_ha: number;
}

export interface RegionsResponse {
    total: number;
    skip: number;
    limit: number;
    regions: Region[];
}



export interface LocationSearchResult {
    display_name: string;
    latitude: number;
    longitude: number;
}

export interface LocationSearchResponse {
    results: LocationSearchResult[];
}





// --- Simulation types ---

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