import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ServiceService } from '../../services/service.service';
import { CategoryService } from '../../services/category.service';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit {
  featuredServices: any[] = [];
  categories: any[] = [];
  searchQuery: string = '';
  loading = {
    services: false,
    categories: false
  };
  error = {
    services: '',
    categories: ''
  };

  constructor(
    private serviceService: ServiceService,
    private categoryService: CategoryService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.loadFeaturedServices();
    this.loadCategories();
  }

  loadFeaturedServices(): void {
    this.loading.services = true;
    this.error.services = '';

    this.serviceService.getFeaturedServices().subscribe({
      next: (response: any) => {
        // Asegurarse de que featuredServices sea siempre un array
        if (Array.isArray(response)) {
          this.featuredServices = response;
        } else if (response && response.data && Array.isArray(response.data.services)) {
          this.featuredServices = response.data.services;
        } else if (response && response.services && Array.isArray(response.services)) {
          this.featuredServices = response.services;
        } else {
          console.error('Respuesta de servicios destacados no tiene el formato esperado:', response);
          this.featuredServices = [];
        }

        this.loading.services = false;
      },
      error: (err: any) => {
        console.error('Error loading featured services:', err);
        this.error.services = 'Error al cargar los servicios destacados.';
        this.loading.services = false;
        this.featuredServices = [];
      }
    });
  }

  loadCategories(): void {
    this.loading.categories = true;
    this.error.categories = '';

    this.categoryService.getCategories().subscribe({
      next: (response: any) => {
        // Asegurarse de que categories sea siempre un array
        if (Array.isArray(response)) {
          this.categories = response;
        } else if (response && response.data && Array.isArray(response.data.categories)) {
          this.categories = response.data.categories;
        } else if (response && response.categories && Array.isArray(response.categories)) {
          this.categories = response.categories;
        } else {
          console.error('Respuesta de categorías no tiene el formato esperado:', response);
          this.categories = [];
        }

        this.loading.categories = false;
      },
      error: (err: any) => {
        console.error('Error loading categories:', err);
        this.error.categories = 'Error al cargar las categorías.';
        this.loading.categories = false;
        this.categories = [];
      }
    });
  }

  search(): void {
    if (this.searchQuery.trim() !== '') {
      window.location.href = `/gallery?search=${encodeURIComponent(this.searchQuery)}`;
    }
  }

  /**
   * Genera el HTML para la calificación en estrellas
   * @param rating Calificación (1-5)
   * @returns String seguro con el HTML de las estrellas
   */
  generateStarRating(rating: number): SafeHtml {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
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

    // Usar DomSanitizer para que Angular pueda mostrar el HTML de forma segura
    return this.sanitizer.bypassSecurityTrustHtml(starsHTML);
  }
}
