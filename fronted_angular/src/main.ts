import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

// Importar bootstrap para activar funcionalidades como modales
import 'bootstrap';

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
