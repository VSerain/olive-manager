export interface Config {
    name: string,
    requireAuth: boolean
    isAuth?: boolean
}

export interface RequestSerivce {
    name: string,
    data: any
}

export interface RequestApi {
    uid: number;
    name: string;
    res: any;
    data: any;
    auth: any;
    resolever: {
        resolve: (value?: any) => void;
        reject:  (value?: any) => void;
    },
    requestParams: RequestParams,
}

export interface RequestParams {
    url: string,
    parsedUrl: Object,
    method: string,
    headers: any
}