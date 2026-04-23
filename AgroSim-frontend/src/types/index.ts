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