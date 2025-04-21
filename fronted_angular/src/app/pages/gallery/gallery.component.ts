import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ServiceService } from '../../services/service.service';
import { CategoryService } from '../../services/category.service';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Component({
  selector: 'app-gallery',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './gallery.component.html',
  styleUrl: './gallery.component.css'
})
export class GalleryComponent implements OnInit {
  // Variables para filtros y organización
  currentCategory: string = 'todos';
  currentRating: string = 'todos';
  currentView: string = 'grid';
  searchQuery: string = '';

  // Datos principales
  services: any[] = [];
  categories: any[] = [];
  featuredServices: any[] = []; // Agregamos una lista para servicios destacados

  // Paginación
  pagination: any = {
    page: 1,
    limit: 9,
    totalPages: 1,
    total: 0
  };

  // Estado de carga
  loading: boolean = true;

  constructor(
    private serviceService: ServiceService,
    private categoryService: CategoryService,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit() {
    // Cargar las categorías y servicios destacados en paralelo
    forkJoin({
      categories: this.categoryService.getCategories().pipe(catchError(() => of([]))),
      featured: this.serviceService.getFeaturedServices().pipe(catchError(() => of([])))
    }).subscribe({
      next: (results) => {
        this.categories = results.categories;

        // Guardar los servicios destacados para tener referencia local
        if (Array.isArray(results.featured)) {
          this.featuredServices = results.featured;
        } else if (results.featured && results.featured.data && Array.isArray(results.featured.data.services)) {
          this.featuredServices = results.featured.data.services;
        }

        console.log('Servicios destacados cargados en galería:', this.featuredServices.length);
      },
      error: (error) => {
        console.error('Error al cargar datos iniciales:', error);
      },
      complete: () => {
        // Observar los cambios en los parámetros de la URL
        this.route.queryParams.subscribe(params => {
          // Obtener parámetros de la URL
          if (params['category']) {
            this.currentCategory = params['category'];
          }

          if (params['rating']) {
            this.currentRating = params['rating'];
          }

          if (params['page']) {
            this.pagination.page = parseInt(params['page']) || 1;
          }

          if (params['search']) {
            this.searchQuery = params['search'];
            this.performSearch();
          } else {
            // Si no hay búsqueda, cargar por categoría
            this.loadServices();
          }
        });
      }
    });
  }

  /**
   * Carga los servicios aplicando los filtros actuales
   */
  loadServices() {
    this.loading = true;

    // Preparar los filtros
    const filters: any = {
      page: this.pagination.page,
      limit: this.pagination.limit
    };

    // Si hay un filtro de calificación, agregarlo
    if (this.currentRating !== 'todos') {
      filters.minRating = parseFloat(this.currentRating);
    }

    // Determinar qué método usar según la categoría seleccionada
    if (this.currentCategory === 'todos') {
      // Cargar todos los servicios
      this.serviceService.getServicesFiltered(filters).subscribe({
        next: (response) => {
          this.handleServiceResponse(response);
        },
        error: (error) => {
          console.error('Error al cargar servicios:', error);
          this.loading = false;
        }
      });
    } else {
      // Cargar servicios por categoría
      this.serviceService.getServicesByCategoryFiltered(this.currentCategory, filters).subscribe({
        next: (response) => {
          this.handleServiceResponse(response);
        },
        error: (error) => {
          console.error('Error al cargar servicios por categoría:', error);
          this.loading = false;
        }
      });
    }
  }

  /**
   * Maneja la respuesta de servicios cargados
   */
  handleServiceResponse(response: any) {
    // Verificar si la respuesta tiene el formato esperado
    if (response.services) {
      this.services = response.services;

      // Actualizar la paginación si está disponible
      if (response.pagination) {
        this.pagination = response.pagination;
      }
    } else if (response && response.data && response.data.services) {
      // Si la respuesta viene con formato data.services (formato del backend)
      this.services = response.data.services;

      // Actualizar la paginación si está disponible
      if (response.pagination) {
        this.pagination = response.pagination;
      }
    } else if (Array.isArray(response)) {
      // Si es un array simple, asignarlo directamente
      this.services = response;
    }

    this.loading = false;
  }

  /**
   * Aplica los filtros seleccionados y actualiza la URL
   */
  applyFilters() {
    // Resetear a la primera página al cambiar filtros
    this.pagination.page = 1;

    // Actualizar la URL con los filtros
    this.updateUrlWithFilters();

    // Cargar servicios con los nuevos filtros
    this.loadServices();
  }

  /**
   * Realiza la búsqueda de servicios
   */
  performSearch() {
    if (!this.searchQuery.trim()) {
      // Si la búsqueda está vacía, cargar todos los servicios
      this.resetFilters();
      return;
    }

    this.loading = true;
    this.serviceService.searchServices(this.searchQuery).subscribe({
      next: (response) => {
        if (response && response.data && response.data.services) {
          this.services = response.data.services;

          // Mostrar mensaje amigable si no hay resultados
          if (this.services.length === 0) {
            console.log('No se encontraron resultados para la búsqueda:', this.searchQuery);
          }
        } else if (Array.isArray(response)) {
          this.services = response;
        } else {
          this.services = [];
        }
        this.loading = false;

        // Resetear otros filtros cuando se hace una búsqueda
        this.currentCategory = 'todos';
        this.currentRating = 'todos';
      },
      error: (error) => {
        console.error('Error en la búsqueda:', error);
        this.services = [];
        this.loading = false;
      }
    });

    // Actualizar la URL con el término de búsqueda
    this.updateUrlWithFilters();
  }

  /**
   * Restablece todos los filtros
   */
  resetFilters() {
    this.currentCategory = 'todos';
    this.currentRating = 'todos';
    this.searchQuery = '';
    this.pagination.page = 1;
    this.updateUrlWithFilters();
    this.loadServices();
  }

  /**
   * Actualiza la URL con los filtros actuales
   */
  updateUrlWithFilters() {
    const queryParams: any = {};

    if (this.currentCategory !== 'todos') {
      queryParams.category = this.currentCategory;
    }

    if (this.currentRating !== 'todos') {
      queryParams.rating = this.currentRating;
    }

    if (this.pagination.page > 1) {
      queryParams.page = this.pagination.page;
    }

    if (this.searchQuery) {
      queryParams.search = this.searchQuery;
    }

    // Actualizar la URL sin recargar el componente
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: queryParams,
      replaceUrl: true
    });
  }

  /**
   * Cambia a la página especificada
   */
  goToPage(page: number) {
    if (page < 1 || page > this.pagination.totalPages) {
      return;
    }

    this.pagination.page = page;
    this.updateUrlWithFilters();
    this.loadServices();
  }

  /**
   * Genera el rango de páginas para la paginación
   */
  getPageRange(): number[] {
    const totalPages = this.pagination.totalPages;
    const currentPage = this.pagination.page;
    const range: number[] = [];

    // Si hay 7 o menos páginas, mostrar todas
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        range.push(i);
      }
    } else {
      // Mostrar siempre la primera página
      range.push(1);

      // Si estamos cerca del inicio
      if (currentPage <= 4) {
        for (let i = 2; i <= 5; i++) {
          range.push(i);
        }
        // Añadir puntos suspensivos y la última página
        range.push(0, totalPages);
      }
      // Si estamos cerca del final
      else if (currentPage >= totalPages - 3) {
        // Puntos suspensivos después de la primera página
        range.push(0);
        for (let i = totalPages - 4; i <= totalPages; i++) {
          range.push(i);
        }
      }
      // Si estamos en el medio
      else {
        range.push(0);
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          range.push(i);
        }
        range.push(0, totalPages);
      }
    }

    return range;
  }

  /**
   * Cambia entre vista de cuadrícula o lista
   */
  setView(view: string) {
    this.currentView = view;
  }

  /**
   * Obtiene el nombre de una categoría por su ID
   */
  getCategoryName(categoryId: string): string {
    if (!categoryId) return 'Sin categoría';

    const category = this.categories.find(cat => cat._id === categoryId);
    return category ? category.name : 'Categoría';
  }

  /**
   * Obtiene la URL de la imagen de un servicio
   */
  getServiceImage(service: any): string {
    // Si el servicio tiene imágenes, usar la primera
    if (service.images && service.images.length > 0) {
      return service.images[0];
    }

    // Si tiene una imagen principal, usarla
    if (service.mainImage) {
      return service.mainImage;
    }

    // Imagen por defecto
    return 'assets/img/service-placeholder.jpg';
  }

  /**
   * Genera las clases para las estrellas de calificación
   */
  generateStars(rating: number): string[] {
    const stars: string[] = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    // Estrellas completas
    for (let i = 0; i < fullStars; i++) {
      stars.push('fa-star');
    }

    // Media estrella si corresponde
    if (hasHalfStar) {
      stars.push('fa-star-half-alt');
    }

    // Completar hasta 5 estrellas
    const emptyStars = 5 - stars.length;
    for (let i = 0; i < emptyStars; i++) {
      stars.push('fa-star far'); // 'far fa-star' es el orden correcto para estrellas vacías
    }

    return stars;
  }

  // Método para navegar directamente a la página de detalle
  goToServiceDetail(serviceId: string): void {
    this.router.navigate(['/detail', serviceId]);
  }
}
