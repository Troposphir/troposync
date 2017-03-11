import {ipcRenderer, remote} from "electron";
import * as log from "electron-log";
import * as path from "path";

import {NgModule, OnInit, Inject} from '@angular/core';
import {HttpModule} from '@angular/http';
import {BrowserModule} from '@angular/platform-browser';
import {Component} from '@angular/core';

import {ProgressBarComponent} from "./progress-bar.component";
import {WindowControlsComponent} from "./window-controls.component";
import {CardsComponent} from './news/news.component';
import {CardComponent} from './cards/card.component';

import {UpdaterService} from "./updater.service";
import {Project} from "./updater/project";
import {ProcessStatus, ProcessStatusGroup} from "./updater/process-status";
import {ProjectBaker} from "./updater/baker";
import startProgram from "./utils/startProgram";

export let config: {
    apiUrl: string,
    gameRoot: string,
    executable: string,
    requiredModules: string[]
} = require("../sync.json");

@Component({
    selector: 'App',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
    public process: string;
    public isPlayable: boolean = false;
    public status: ProcessStatusGroup<string>;

    constructor(@Inject(UpdaterService) private updater: UpdaterService) {
        this.status = new ProcessStatusGroup<string>();
    }

    private statusUpdater(): (status: ProcessStatus<string>) => void {
        return (status: ProcessStatus<string>) => {
            this.status.add(status);
            log.debug(
                `Update Status Changed (${this.status.currentStep}/${this.status.stepCount}):`,
                status.payload
            );
        }
    }

    private async startUpdate(): Promise<void> {
        try {
            this.process = "Checking for updates";
            let project = await Project.open(remote.app.getPath("userData"), config.requiredModules);
            let modulesToUpdate = await this.updater.getChanges(project);
            for (let module of modulesToUpdate) {
                this.process = `Updating module ${module.name}`;
                for (let change of module.changes) {
                    let observable = this.updater.performChange(project, module.name, change);
                    await observable.forEach(this.statusUpdater());
                }
                project.getModule(module.name)!.version = module.version;
            }
            this.status.finish();
            this.process = "Done downloading";
            await project.save();

            if (modulesToUpdate.length > 0) {
                this.process = "Applying updates";
                await ProjectBaker.bake(project, config.gameRoot)
                    .forEach(this.statusUpdater());
            }

            this.process = "Ready to play";
        } catch (e) {
            this.process = "Error ocurred while updating. Check devtools for details.";
            log.error(e);
        }
        this.status.finish();
        this.isPlayable = true;
        log.debug("Updating concluded");
    }

    //noinspection JSMethodCanBeStatic
    public startGame(): void {
        startProgram(path.join(config.gameRoot, config.executable));
    }

    ngOnInit(): void {
        ipcRenderer.send("application-started");
        //noinspection JSIgnoredPromiseFromCall
        this.startUpdate();
    }
}

@NgModule({
    imports: [
        BrowserModule,
        HttpModule
    ],
    declarations: [AppComponent, ProgressBarComponent, WindowControlsComponent, CardsComponent, CardComponent],
    bootstrap: [AppComponent],
    providers: [
        UpdaterService as any
    ]
})
export class AppModule { }
