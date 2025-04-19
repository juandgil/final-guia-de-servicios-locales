import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from './components/shared/navbar/navbar.component';
import { FooterComponent } from './components/shared/footer/footer.component';
import { RegisterModalComponent } from './components/shared/register-modal/register-modal.component';
import { LoginModalComponent } from './components/login-modal/login-modal.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    NavbarComponent,
    FooterComponent,
    RegisterModalComponent,
    LoginModalComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  title = 'Guía de Servicios Locales';

  ngOnInit() {
    // Esto asegura que Bootstrap se inicialice correctamente
    this.loadBootstrapScripts();
  }

  private loadBootstrapScripts() {
    // Asegurarse de que Bootstrap esté disponible
    const bootstrapScript = document.createElement('script');
    bootstrapScript.src = 'assets/js/bootstrap-init.js';
    bootstrapScript.defer = true;
    document.body.appendChild(bootstrapScript);
  }
}
