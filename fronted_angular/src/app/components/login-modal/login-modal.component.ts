import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth/auth.service';

@Component({
  selector: 'app-login-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login-modal.component.html',
  styleUrls: ['./login-modal.component.css']
})
export class LoginModalComponent implements OnInit {
  loginForm!: FormGroup;
  loading = false;
  success = false;
  error = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.createForm();
  }

  createForm(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      Object.keys(this.loginForm.controls).forEach(key => {
        const control = this.loginForm.get(key);
        control?.markAsTouched();
      });
      return;
    }

    this.loading = true;
    this.error = '';
    this.success = false;

    const { email, password } = this.loginForm.value;

    this.authService.login(email, password).subscribe({
      next: (response) => {
        this.loading = false;
        this.success = true;
        this.loginForm.reset();

        // Cerrar el modal después de un tiempo
        setTimeout(() => {
          this.success = false;
          const modalElement = document.getElementById('loginModal');
          if (modalElement) {
            const modal = (window as any).bootstrap.Modal.getInstance(modalElement);
            if (modal) {
              modal.hide();
            }
          }
          // Recargar la página para actualizar el estado de la autenticación
          window.location.reload();
        }, 1500);
      },
      error: (err) => {
        this.loading = false;
        this.error = err.message || 'Error al iniciar sesión. Verifique sus credenciales.';
      }
    });
  }

  navigateToRegister(event: Event): void {
    event.preventDefault();
    console.log('Navegando al formulario de registro');

    // Almacenar en el sessionStorage que debe mostrar el formulario de usuario
    sessionStorage.setItem('showUserForm', 'true');
    console.log('Flag showUserForm establecido en sessionStorage');

    // Cerrar el modal de login de forma segura
    const loginModal = document.getElementById('loginModal');
    if (loginModal) {
      // Usar try/catch porque podría fallar si Bootstrap no está cargado
      try {
        // Importar el objeto Modal de bootstrap directamente
        const Modal = (window as any).bootstrap.Modal;
        const bsLoginModal = Modal.getInstance(loginModal);

        if (bsLoginModal) {
          bsLoginModal.hide();
        } else {
          // Cerrar manualmente si no hay instancia
          loginModal.classList.remove('show');
          loginModal.style.display = 'none';
          document.body.classList.remove('modal-open');
          const backdrop = document.querySelector('.modal-backdrop');
          if (backdrop) backdrop.remove();
        }
      } catch (error) {
        console.error('Error al cerrar el modal de login:', error);
        // Fallback: cerrar manualmente
        loginModal.classList.remove('show');
        loginModal.style.display = 'none';
        document.body.classList.remove('modal-open');
        const backdrop = document.querySelector('.modal-backdrop');
        if (backdrop) backdrop.remove();
      }
    }

    // Esperar a que el modal termine de cerrarse
    setTimeout(() => {
      // Abrir el modal de registro
      const registerModal = document.getElementById('registerModal');
      if (registerModal) {
        try {
          // Crear una nueva instancia con opciones explícitas
          const Modal = (window as any).bootstrap.Modal;
          // Opciones explícitas para evitar errores
          const modalOptions = {
            backdrop: true,
            keyboard: true,
            focus: true
          };

          // Crear una nueva instancia con opciones
          const modal = new Modal(registerModal, modalOptions);
          modal.show();
        } catch (error) {
          console.error('Error al abrir el modal de registro:', error);
          // Fallback: abrir manualmente
          registerModal.classList.add('show');
          registerModal.style.display = 'block';
          document.body.classList.add('modal-open');
          const newBackdrop = document.createElement('div');
          newBackdrop.className = 'modal-backdrop fade show';
          document.body.appendChild(newBackdrop);
        }
      }
    }, 500);
  }

  // Helpers para validación
  isFieldValid(field: string): boolean {
    const control = this.loginForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  getErrorMessage(field: string): string {
    const control = this.loginForm.get(field);
    if (!control) return '';

    if (control.hasError('required')) {
      return 'Este campo es obligatorio';
    }

    if (control.hasError('email')) {
      return 'Por favor ingrese un correo electrónico válido';
    }

    if (control.hasError('minlength')) {
      const requiredLength = control.getError('minlength').requiredLength;
      return `Debe tener al menos ${requiredLength} caracteres`;
    }

    return 'Campo inválido';
  }
}
