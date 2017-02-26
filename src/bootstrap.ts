import * as log from "electron-log";
import {remote} from "electron";
import * as path from "path";

import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule }  from './app.component';

// Configure logging
log.transports.console = false;
log.transports.file.level = "info";
log.transports.file.format = "[{level}] {h}:{i}:{s}.{ms}: {text}";
log.transports.file.file = path.join(remote.app.getPath("userData"), "application.log");

platformBrowserDynamic().bootstrapModule(AppModule);