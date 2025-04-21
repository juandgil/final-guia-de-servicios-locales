import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ActivatedRoute, Router } from '@angular/router';
import { ServiceService } from '../../services/service.service';
import { ReviewService } from '../../services/review.service';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DomSanitizer } from '@angular/platform-browser';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, ReactiveFormsModule],
  templateUrl: './detail.component.html',
  styleUrl: './detail.component.css'
})
export class DetailComponent implements OnInit {
  serviceId: string = '';
  service: any = null;
  relatedServices: any[] = [];
  mainImage: string = '';
  reviewForm!: FormGroup;
  rating: number = 0;
  loading = {
    service: false,
    related: false,
    review: false
  };
  error = {
    service: '',
    related: '',
    review: ''
  };
  success = {
    review: false
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private serviceService: ServiceService,
    private reviewService: ReviewService,
    private authService: AuthService,
    private fb: FormBuilder,
    private sanitizer: DomSanitizer
  ) { }

  ngOnInit(): void {
    this.serviceId = this.route.snapshot.paramMap.get('id') || '';

    if (this.serviceId) {
      this.loadServiceDetail();
      this.initReviewForm();
    } else {
      this.error.service = 'No se especificó un servicio';
    }

    // Suscribirse a cambios en los parámetros de la ruta para recargar cuando cambie el ID
    this.route.paramMap.subscribe(params => {
      const newServiceId = params.get('id') || '';
      if (newServiceId && newServiceId !== this.serviceId) {
        this.serviceId = newServiceId;
        this.loadServiceDetail();
        this.initReviewForm();
      }
    });
  }

  // Método para navegar a otro servicio desde la misma página
  navigateToService(serviceId: string): void {
    this.router.navigate(['/detail', serviceId]);
  }

  loadServiceDetail(): void {
    this.loading.service = true;
    this.error.service = '';

    // Verificar si el usuario está autenticado
    const userIsLoggedIn = this.authService.isLoggedIn();

    // Primero verificamos si hay un servicio en el caché
    const cachedPreview = this.serviceService.getServicePreviewFromCache(this.serviceId);

    // Si hay un servicio en caché, lo mostramos inmediatamente mientras cargamos los detalles completos
    if (cachedPreview) {
      console.log('Usando versión de vista previa desde caché inicialmente');
      this.service = cachedPreview;

      // Si el usuario está autenticado, no mostrar como vista previa
      if (userIsLoggedIn) {
        this.service.isPreview = false;
      }

      this.mainImage = cachedPreview.mainImage || cachedPreview.images?.[0] || 'assets/img/service-placeholder.jpg';

      // Actualizar título de la página
      document.title = `${cachedPreview.name} - Guía de Servicios Locales`;

      // Intentamos cargar servicios relacionados
      if (cachedPreview.category) {
        this.loadRelatedServices(this.serviceId, cachedPreview.category?._id || cachedPreview.category);
      }
    }

    // Intentamos cargar los detalles completos del servicio
    this.serviceService.getServiceById(this.serviceId).subscribe({
      next: (service: any) => {
        this.service = service;

        // Si el usuario está autenticado, no mostrar como vista previa
        if (userIsLoggedIn) {
          this.service.isPreview = false;
        }

        // Actualizar título de la página
        document.title = `${service.name} - Guía de Servicios Locales`;

        // Establecer imagen principal
        this.mainImage = service.mainImage || service.images?.[0] || 'assets/img/service-placeholder.jpg';

        // Cargar servicios relacionados si no lo hemos hecho antes
        if (!cachedPreview || !cachedPreview.category) {
          this.loadRelatedServices(service.id, service.category?._id || service.category);
        }

        this.loading.service = false;
      },
      error: (err: any) => {
        console.error('Error loading service:', err);

        // Si tenemos una versión en caché, la mantenemos y mostramos un mensaje menos alarmante
        if (cachedPreview) {
          console.log('Manteniendo versión en caché tras error');

          // Si el usuario está autenticado, no mostrar como vista previa
          if (userIsLoggedIn) {
            this.service.isPreview = false;
          }

          this.loading.service = false;
          return;
        }

        // Mensaje de error más descriptivo dependiendo del tipo de error
        if (err.status === 401 || err.status === 403) {
          this.error.service = 'Se requiere inicio de sesión para ver los detalles completos de este servicio.';
        } else if (err.status === 404) {
          this.error.service = 'El servicio solicitado no existe o ha sido removido.';
        } else {
          this.error.service = 'Error al cargar los detalles del servicio. Por favor, inténtelo de nuevo más tarde.';
        }

        this.loading.service = false;
      }
    });
  }

  loadRelatedServices(serviceId: string, categoryId: string): void {
    if (!categoryId) return;

    this.loading.related = true;
    this.error.related = '';

    this.serviceService.getRelatedServices(serviceId, categoryId).subscribe({
      next: (services) => {
        this.relatedServices = services;
        this.loading.related = false;
      },
      error: (err) => {
        console.error('Error loading related services:', err);
        this.error.related = 'Error al cargar servicios relacionados.';
        this.loading.related = false;
      }
    });
  }

  setMainImage(src: string): void {
    this.mainImage = src;
  }

  getDayName(day: unknown): string {
    if (typeof day !== 'string') {
      return String(day);
    }

    const days: {[key: string]: string} = {
      monday: 'Lunes',
      tuesday: 'Martes',
      wednesday: 'Miércoles',
      thursday: 'Jueves',
      friday: 'Viernes',
      saturday: 'Sábado',
      sunday: 'Domingo'
    };

    return days[day] || day;
  }

  initReviewForm(): void {
    this.reviewForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      rating: [0, [Validators.required, Validators.min(1)]],
      comment: ['', [Validators.required, Validators.minLength(10)]]
    });

    // Si el usuario está autenticado, prellenar campos
    const user = this.authService.getCurrentUser();
    if (user) {
      this.reviewForm.patchValue({
        name: user.name,
        email: user.email
      });
    }
  }

  setRating(rating: number): void {
    this.rating = rating;
    this.reviewForm.get('rating')?.setValue(rating);
  }

  highlightStars(rating: number): void {
    const stars = document.querySelectorAll('.rating-select i');

    stars.forEach((star, index) => {
      if (index < rating) {
        star.classList.add('highlighted');
      } else {
        star.classList.remove('highlighted');
      }
    });
  }

  submitReview(): void {
    if (this.reviewForm.invalid) {
      Object.keys(this.reviewForm.controls).forEach(key => {
        const control = this.reviewForm.get(key);
        control?.markAsTouched();
      });
      return;
    }

    this.loading.review = true;
    this.error.review = '';
    this.success.review = false;

    const reviewData = {
      ...this.reviewForm.value,
      service: this.serviceId
    };

    this.reviewService.createReview(this.serviceId, reviewData).subscribe({
      next: (response) => {
        this.success.review = true;
        this.loading.review = false;

        // Añadir la reseña a la lista actual
        if (this.service && this.service.reviews) {
          this.service.reviews.unshift(response);
        }

        // Resetear el formulario
        this.reviewForm.reset();
        this.rating = 0;

        setTimeout(() => {
          this.success.review = false;
        }, 5000);
      },
      error: (err) => {
        console.error('Error submitting review:', err);
        this.error.review = 'Error al enviar la reseña. Por favor, inténtelo de nuevo.';
        this.loading.review = false;
      }
    });
  }

  /**
   * Genera el HTML para la calificación en estrellas
   * @param rating Calificación (1-5)
   * @returns String seguro con el HTML de las estrellas
   */
  generateStarRating(rating: number | undefined | null) {
    // Si rating es undefined o null, establecer a 0
    const actualRating = rating ?? 0;

    const fullStars = Math.floor(actualRating);
    const halfStar = actualRating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

    let starsHTML = '';

    // Estrellas completas
    for (let i = 0; i < fullStars; i++) {
      starsHTML += '<i class="fas fa-star"></i>';
    }

    // Media estrella si corresponde
    if (halfStar) {
      starsHTML += '<i class="fas fa-star-half-alt"></i>';
    }

    // Estrellas vacías
    for (let i = 0; i < emptyStars; i++) {
      starsHTML += '<i class="far fa-star"></i>';
    }

    return this.sanitizer.bypassSecurityTrustHtml(starsHTML);
  }

  // Helpers para validación
  isFieldValid(field: string): boolean {
    const control = this.reviewForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  getErrorMessage(field: string): string {
    const control = this.reviewForm.get(field);
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

    if (control.hasError('min') && field === 'rating') {
      return 'Por favor seleccione una calificación';
    }

    return 'Campo inválido';
  }
}
