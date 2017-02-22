import fs = require("fs-promise");

import {NgModule, OnInit, Inject} from '@angular/core';
import {HttpModule} from '@angular/http';
import {BrowserModule} from '@angular/platform-browser';
import {Component} from '@angular/core';

import {ProgressBarComponent} from "./progress-bar.component";
import {WindowControlsComponent} from "./window-controls.component";
import {UpdaterService, UPDATE_API_URL} from "./updater.service";
import {Project} from "./updater/project";

let config = fs.readJsonSync("./sync.json");

@Component({
    selector: 'App',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
    public updateMessage: string;

    constructor(@Inject(UpdaterService) private updater: UpdaterService) {}

    private async startUpdate(): Promise<void> {
        let project = await Project.open("./test-fs");
        let modulesToUpdate = await this.updater.getChanges(project);
        for (let module of modulesToUpdate) {
            for (let change of module.changes) {
                await this.updater.performChange(project, module.name, change)
                    .toPromise();
            }
            project.getModule(module.name).version = module.version;
        }
        await project.save();
    }

    ngOnInit(): void {
        //noinspection JSIgnoredPromiseFromCall
        this.startUpdate();
    }
}

@NgModule({
    imports: [
        BrowserModule,
        HttpModule
    ],
    declarations: [AppComponent, ProgressBarComponent, WindowControlsComponent],
    bootstrap: [AppComponent],
    providers: [
        UpdaterService as any,
        {provide: UPDATE_API_URL, useValue: config.apiUrl}
    ]
})
export class AppModule { }
