import {Injectable, Inject} from '@angular/core';

import { Card } from '../cards/card';
import {Http, RequestOptions, URLSearchParams} from "@angular/http";
import * as config from "../config";

@Injectable()
export class NewsService {
    private static get apiUrl(): string {
        return `${config.apiUrl}/news`;
    }

    //noinspection JSUnusedLocalSymbols
    private constructor(@Inject(Http) public http: Http) {}

    async getNews(): Promise<Card[]> {
        let params = new URLSearchParams();
        params.set("limit", "3");
        let response = await this.http.get(`${NewsService.apiUrl}/latest`, new RequestOptions({
            search: params
        })).toPromise();
        let data: {
            title: string,
            description: string,
            action: string,
            image: string
        }[] = response.json();
        return data.map(c => new Card(c));
    }
}