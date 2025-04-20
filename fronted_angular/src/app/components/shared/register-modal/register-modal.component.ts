import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ServiceService } from '../../../services/service.service';
import { CategoryService } from '../../../services/category.service';
import { AuthService } from '../../../services/auth/auth.service';
import { ServiceRegistrationService } from '../../../services/service-registration.service';
// Comentamos temporalmente toastr hasta resolver los problemas
// import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-register-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './register-modal.component.html',
  styleUrls: ['./register-modal.component.css']
})
export class RegisterModalComponent implements OnInit {
  private fb = inject(FormBuilder);
  private serviceService = inject(ServiceService);
  private categoryService = inject(CategoryService);
  private authService = inject(AuthService);
  private serviceRegistrationService = inject(ServiceRegistrationService);
  // private toastr = inject(ToastrService); // Comentamos temporalmente

  registerForm!: FormGroup;
  userRegisterForm!: FormGroup;
  categories: any[] = [];
  loading = false;
  success = false;
  error: string | null = null;
  isLoggedIn = false;
  isProvider = false;
  showUserForm = false;
  userHasService = false; // Indica si el usuario ya tiene un servicio registrado
  currentUser: any = null; // Usuario actual
  serviceForm: FormGroup;
  selectedFile: File | null = null;
  imagePreview: string | null = null;

  constructor() {
    this.serviceForm = this.fb.group({
      title: ['', Validators.required],
      description: ['', Validators.required],
      price: ['', [Validators.required, Validators.min(0)]],
      category: ['', Validators.required],
      location: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.createForms();
    this.loadCategories();
    this.checkAuthStatus();

    // Verificar si debemos mostrar el formulario de usuario desde sessionStorage
    this.checkUserFormFlag();

    // Agregar evento para cuando se muestre el modal
    const registerModal = document.getElementById('registerModal');
    if (registerModal) {
      registerModal.addEventListener('show.bs.modal', () => {
        console.log('Modal de registro abierto - verificando flags');
        this.checkUserFormFlag();
      });
    }
  }

  private checkUserFormFlag(): void {
    const showUserFormFlag = sessionStorage.getItem('showUserForm');
    console.log('checkUserFormFlag - valor actual:', showUserFormFlag);
    if (showUserFormFlag === 'true') {
      this.showUserForm = true;
      sessionStorage.removeItem('showUserForm'); // Limpiar después de usarlo
      console.log('Mostrando formulario de usuario por indicación desde sessionStorage');
    }
  }

  private createForms(): void {
    // Formulario para registro de servicio
    this.registerForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      category: ['', Validators.required],
      description: ['', [Validators.required, Validators.minLength(20)]],
      location: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      serviceImage: [''],
      terms: [false, Validators.requiredTrue]
    });

    // Formulario para registro de usuario
    this.userRegisterForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      role: ['user', Validators.required],
      terms: [false, Validators.requiredTrue]
    });
  }

  private loadCategories(): void {
    this.categoryService.getCategories().subscribe(
      (categories) => {
        this.categories = categories;
      },
      (error) => {
        console.error('Error loading categories', error);
      }
    );
  }

  private checkAuthStatus(): void {
    this.isLoggedIn = this.authService.isLoggedIn;

    if (this.isLoggedIn) {
      const user = this.authService.getCurrentUser();
      this.isProvider = user?.role === 'provider';

      // Aquí deberías verificar si el usuario ya tiene un servicio registrado
      // Por ahora, simulamos que no tiene
      this.userHasService = false;
    }
  }

  toggleUserForm(show: boolean): void {
    console.log(`Cambiando estado del formulario de usuario a: ${show}`);
    this.showUserForm = show;
    if (show) {
      // Resetear el formulario cuando se muestra
      this.userRegisterForm.reset({ role: 'user', terms: false });
      this.error = null;
      this.success = false;
    }
  }

  onSubmit(): void {
    if (this.registerForm.valid) {
      this.loading = true;
      this.error = null;

      const serviceData = {
        ...this.registerForm.value,
        serviceImage: this.selectedFile
      };

      this.serviceRegistrationService.registerService(serviceData).subscribe(
        (response: any) => {
          this.loading = false;
          this.success = true;
          this.registerForm.reset({terms: false});
          this.selectedFile = null;
          this.imagePreview = null;

          // Mostrar alerta de éxito y cerrar modal después de 2 segundos
          setTimeout(() => {
            alert('Servicio registrado exitosamente');

            // Cerrar el modal
            const modalElement = document.getElementById('registerModal');
            if (modalElement) {
              const modal = (window as any).bootstrap.Modal.getInstance(modalElement);
              if (modal) {
                modal.hide();
              }
            }
          }, 2000);
        },
        (error: any) => {
          this.loading = false;
          this.error = error.message || 'Error al registrar el servicio. Por favor, inténtalo de nuevo.';
        }
      );
    } else {
      // Marcar todos los campos como touched para mostrar los errores
      Object.keys(this.registerForm.controls).forEach(key => {
        this.registerForm.get(key)?.markAsTouched();
      });
    }
  }

  onUserSubmit(): void {
    if (this.userRegisterForm.invalid) {
      return;
    }

    this.loading = true;
    this.error = null;

    const userData = this.userRegisterForm.value;

    this.authService.register(userData).subscribe(
      (response) => {
        this.loading = false;
        this.success = true;
        this.userRegisterForm.reset({ role: 'user', terms: false });

        // Esperar 2 segundos, mostrar alerta y cerrar modal
        setTimeout(() => {
          alert('Usuario registrado exitosamente');

          // Cerrar el modal
          const modalElement = document.getElementById('registerModal');
          if (modalElement) {
            const modal = (window as any).bootstrap.Modal.getInstance(modalElement);
            if (modal) {
              modal.hide();
            }
          }
        }, 2000);
      },
      (error) => {
        this.loading = false;
        this.error = error.message || 'Error al registrar. Por favor, inténtalo de nuevo.';
      }
    );
  }

  isFieldValid(field: string): boolean {
    const formControl = this.registerForm.get(field);
    return !!formControl && formControl.invalid && (formControl.dirty || formControl.touched);
  }

  isUserFieldValid(field: string): boolean {
    const formControl = this.userRegisterForm.get(field);
    return !!formControl && formControl.invalid && (formControl.dirty || formControl.touched);
  }

  getErrorMessage(field: string): string {
    const formControl = this.registerForm.get(field);

    if (!formControl) return '';

    if (formControl.errors?.['required']) {
      return 'Este campo es obligatorio';
    }

    if (formControl.errors?.['minlength']) {
      return `Debe tener al menos ${formControl.errors['minlength'].requiredLength} caracteres`;
    }

    if (formControl.errors?.['email']) {
      return 'Debe ser un correo electrónico válido';
    }

    if (formControl.errors?.['pattern']) {
      return 'Formato inválido';
    }

    return 'Campo inválido';
  }

  getUserErrorMessage(field: string): string {
    const formControl = this.userRegisterForm.get(field);

    if (!formControl) return '';

    if (formControl.errors?.['required']) {
      return 'Este campo es obligatorio';
    }

    if (formControl.errors?.['minlength']) {
      return `Debe tener al menos ${formControl.errors['minlength'].requiredLength} caracteres`;
    }

    if (formControl.errors?.['email']) {
      return 'Debe ser un correo electrónico válido';
    }

    return 'Campo inválido';
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];

      // Validar tamaño (5MB máximo)
      const maxSize = 5 * 1024 * 1024; // 5MB en bytes
      if (this.selectedFile.size > maxSize) {
        console.error('La imagen es demasiado grande. El tamaño máximo es 5MB.');
        this.selectedFile = null;
        input.value = '';
        this.imagePreview = null;
        return;
      }

      // Crear vista previa de la imagen
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview = reader.result as string;
      };
      reader.readAsDataURL(this.selectedFile);
    }
  }
}
