export interface Config {
    name: string,
    requireAuth: boolean
    isAuth?: boolean,
    requireAuthRoutes?: Array<string>
}

export interface RequestSerivce {
    name: string,
    data: any
}

export interface RequestMicroServicePending {
    uid: number;
    name: string;
    res: any;
    data: any;
    auth: any;
    resolver: {
        resolve: (value?: any) => void;
        reject:  (value?: any) => void;
    };
    requestParams: RequestParams;
}

export interface RequestMicroService {
    uid: number;
    name: string;
    data: any;
    auth: any;
    requestParams: RequestParams;
}
export interface RequestParams {
    url: string;
    parsedUrl: Object;
    method: string;
    headers: any;
}