import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../../../services/auth/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent implements OnInit, OnDestroy {
  isLoggedIn = false;
  userName = '';
  isAdmin = false;
  isProvider = false;
  private authSubscription!: Subscription;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Suscribirse a los cambios en el estado de autenticación
    this.authSubscription = this.authService.currentUser$.subscribe(user => {
      this.isLoggedIn = this.authService.isLoggedIn;
      if (user) {
        this.userName = user.name;
        this.isAdmin = user.role === 'admin';
        this.isProvider = user.role === 'provider' || user.role === 'admin';
      }
    });
  }

  ngOnDestroy(): void {
    // Desuscribirse para evitar memory leaks
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }

  logout(event: Event): void {
    event.preventDefault();

    // Mostrar mensaje de confirmación si se desea
    if (confirm('¿Estás seguro que deseas cerrar sesión?')) {
      console.log('Cerrando sesión...');

      try {
        this.authService.logout();

        // Opcional: Mostrar mensaje de éxito
        // Aquí podrías usar un servicio de notificaciones si tienes uno

        // Redirigir al inicio
        this.router.navigate(['/']);

        // Opcional: recargar la página para asegurar que todo se actualice
        // setTimeout(() => window.location.reload(), 100);
      } catch (error) {
        console.error('Error al cerrar sesión:', error);
      }
    }
  }
}
