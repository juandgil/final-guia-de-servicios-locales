import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private apiUrl = `${environment.apiUrl}/categories`;

  // Categorías predeterminadas para casos de error de conexión
  private defaultCategories = [
    { id: 'musicos', name: 'Músicos', icon: 'fas fa-music' },
    { id: 'electricistas', name: 'Electricistas', icon: 'fas fa-bolt' },
    { id: 'mecanicos', name: 'Mecánicos', icon: 'fas fa-car' },
    { id: 'plomeros', name: 'Plomeros', icon: 'fas fa-faucet' },
    { id: 'carpinteros', name: 'Carpinteros', icon: 'fas fa-hammer' },
    { id: 'jardineros', name: 'Jardineros', icon: 'fas fa-leaf' },
    { id: 'pintores', name: 'Pintores', icon: 'fas fa-paint-roller' },
    { id: 'limpieza', name: 'Servicios de Limpieza', icon: 'fas fa-broom' },
    { id: 'otros', name: 'Otros', icon: 'fas fa-ellipsis-h' }
  ];

  constructor(private http: HttpClient) { }

  getCategories(): Observable<any[]> {
    return this.http.get<any>(this.apiUrl).pipe(
      map((response: any) => response.data.categories),
      catchError(error => {
        console.error('Error al obtener categorías desde la API:', error);
        // En caso de error, devolvemos las categorías predeterminadas
        return of(this.defaultCategories);
      })
    );
  }

  getCategory(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      map((response: any) => response.data.category),
      catchError(error => {
        const defaultCategory = this.defaultCategories.find(cat => cat.id === id);
        if (defaultCategory) {
          return of(defaultCategory);
        }
        return throwError(() => new Error('Categoría no encontrada'));
      })
    );
  }
}
