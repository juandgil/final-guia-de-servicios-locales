import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/users`;
  private currentUserSubject = new BehaviorSubject<any>(null);

  public currentUser$ = this.currentUserSubject.asObservable();
  public isLoggedIn = false;

  constructor(private http: HttpClient) {
    // Verificar si hay un token almacenado
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');

    if (token && user) {
      this.currentUserSubject.next(JSON.parse(user));
      this.isLoggedIn = true;
    }
  }

  /**
   * Registrar un nuevo usuario
   * @param userData Datos del usuario a registrar
   * @returns Observable con la respuesta
   */
  register(userData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/register`, userData).pipe(
      tap(response => {
        if (response && response.token) {
          this.storeUserData(response.token, response.data.user);
        }
      }),
      catchError(error => {
        console.error('Error en registro:', error);
        return throwError(() => new Error(error.error?.message || 'Error al registrar usuario'));
      })
    );
  }

  /**
   * Iniciar sesión
   * @param email Correo electrónico del usuario
   * @param password Contraseña del usuario
   * @returns Observable con la respuesta
   */
  login(email: string, password: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login`, { email, password }).pipe(
      tap(response => {
        if (response && response.token) {
          this.storeUserData(response.token, response.data.user);
        }
      }),
      catchError(error => {
        console.error('Error en login:', error);
        return throwError(() => new Error(error.error?.message || 'Credenciales inválidas'));
      })
    );
  }

  /**
   * Cerrar sesión
   */
  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.currentUserSubject.next(null);
    this.isLoggedIn = false;
  }

  /**
   * Obtener el token actual
   * @returns Token de autenticación
   */
  getToken(): string | null {
    return localStorage.getItem('token');
  }

  /**
   * Obtener el usuario actual
   * @returns Usuario actual
   */
  getCurrentUser(): any {
    return this.currentUserSubject.value;
  }

  /**
   * Verificar si el usuario tiene un rol específico
   * @param role Rol a verificar
   * @returns true si el usuario tiene el rol, false en caso contrario
   */
  hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    return user && user.role === role;
  }

  /**
   * Almacenar datos del usuario en localStorage y actualizar el BehaviorSubject
   * @param token Token de autenticación
   * @param user Datos del usuario
   */
  private storeUserData(token: string, user: any): void {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    this.currentUserSubject.next(user);
    this.isLoggedIn = true;
  }
}
