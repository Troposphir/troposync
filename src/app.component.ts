import {ipcRenderer, remote} from "electron";
import * as log from "electron-log";
import * as path from "path";

import {NgModule, OnInit, Inject} from '@angular/core';
import {HttpModule} from '@angular/http';
import {BrowserModule} from '@angular/platform-browser';
import {Component, NgZone} from '@angular/core';

import {ProgressBarComponent} from "./progress-bar.component";
import {WindowControlsComponent} from "./window-controls.component";
import {CardsComponent} from './news/news.component';
import {CardComponent} from './cards/card.component';

import {UpdaterService} from "./updater.service";
import {Project} from "./updater/project";
import {ProcessGroup, ProcessStatus} from "./updater/process-status";
import {ProjectBaker} from "./updater/baker";
import startProgram from "./utils/startProgram";
import * as config from "./config";
import {Observable, Observer} from "rxjs";

export type UpdateState = {
    heading: string,
    status?: ProcessStatus<string>
}

@Component({
    selector: 'App',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
    public isPlayable: boolean = false;
    public processGroup: ProcessGroup<string> = new ProcessGroup<string>(undefined, "");
    public state: UpdateState;

    constructor(
        @Inject(UpdaterService) private updater: UpdaterService,
        @Inject(NgZone) private zone: NgZone
    ) {}

    private startUpdate(): Observable<UpdateState> {
        return Observable.create(async(observer: Observer<UpdateState>) => {
            let heading = "Checking for updates";
            observer.next({heading, status: new ProcessStatus<string>(0, 1, "")});
            try {
                let project = await Project.open(remote.app.getPath("userData"), config.requiredModules);
                let modulesToUpdate = await this.updater.getChanges(project);
                for (let module of modulesToUpdate) {
                    heading = `Updating module ${module.name}`;
                    let changes = module.changes.map(c => this.updater.change(project, module.name, c));
                    this.processGroup.clear();
                    this.processGroup.extend(changes);
                    await this.processGroup.fire().forEach(status => observer.next({heading, status}));
                    project.getModule(module.name)!.version = module.version;
                }
                heading = "Done downloading";
                await project.save();

                if (modulesToUpdate.length > 0) {
                    heading = "Applying updates";
                    this.processGroup.clear();
                    this.processGroup.add(new ProjectBaker({
                        project: project,
                        targetDirectorySuffix: config.gameRoot
                    }));
                    await this.processGroup.fire().forEach(status => observer.next({heading, status}));
                }

                heading = "Ready to play";
            } catch (e) {
                heading = "Error ocurred while updating. Check devtools for details.";
                log.error(e);
                observer.error(e);
            }
            this.isPlayable = true;
            observer.complete();
            log.debug("Updating concluded");
        })
    }

    //noinspection JSMethodCanBeStatic
    public startGame(): void {
        startProgram(path.join(config.gameRoot, config.executable));
    }

    ngOnInit(): void {
        ipcRenderer.send("application-started");
        this.startUpdate().subscribe(state => this.zone.run(() => {
            this.state = state;
        }));
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
