import {Injectable, Inject} from "@angular/core";
import {Http} from "@angular/http";
import 'rxjs/add/operator/toPromise';

import {Version} from "./updater/version";

@Injectable()
export class UpdaterService {
    private constructor(@Inject(Http) public http: Http) {}

    public async getCurrentVersion(): Promise<Version> {
        return Version.fromString("0.0.0");
    }

    public async getLatestVersion(): Promise<Version> {
        let response = await this.http.get("").toPromise();
        return response.json() as Version;
    }
}