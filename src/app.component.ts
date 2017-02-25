import fs = require("fs-promise");

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

export let config: {
    apiUrl: string,
    gameRoot: string
} = fs.readJsonSync("./sync.json");

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
            console.debug(
                `Update Status Changed (${this.status.currentStep}/${this.status.stepCount}):`,
                status.payload
            );
        }
    }

    private async startUpdate(): Promise<void> {
        try {
            this.process = "Checking for updates";
            let project = await Project.open(".");
            let modulesToUpdate = await this.updater.getChanges(project);
            for (let module of modulesToUpdate) {
                this.process = `Updating module ${module.name}`;
                for (let change of module.changes) {
                    let observable = this.updater.performChange(project, module.name, change);
                    await observable.forEach(this.statusUpdater());
                }
                project.getModule(module.name).version = module.version;
            }
            this.status.finish()
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
            console.error(e);
        }
        this.status.finish();
        this.isPlayable = true;
        console.debug("Updating concluded");
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
    declarations: [AppComponent, ProgressBarComponent, WindowControlsComponent, CardsComponent, CardComponent],
    bootstrap: [AppComponent],
    providers: [
        UpdaterService as any
    ]
})
export class AppModule { }
