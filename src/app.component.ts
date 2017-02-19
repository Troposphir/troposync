import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {Component, OnInit} from '@angular/core';
import {ProgressBarComponent} from "./progress-bar.component";
import {WindowControlsComponent} from "./window-controls.component";

@Component({
    selector: 'App',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
    public readonly name = 'electron-forge';

    ngOnInit(): void {
        console.log('component initialized');
    }
}

@NgModule({
    imports: [
        BrowserModule
    ],
    declarations: [AppComponent, ProgressBarComponent, WindowControlsComponent],
    bootstrap: [AppComponent]
})
export class AppModule { }