import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MenuDiaService } from '../../services/menu-dia.service';
import { RestauranteService } from '../../services/restaurante.service';
import { MenuDia } from '../../models/menu-dia.model';

@Component({
  selector: 'app-menu-dia',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './menu-dia.html',  // Asegúrate que este archivo tenga el HTML simplificado
  styleUrls: ['./menu-dia.css'],
})
export class MenuDiaComponent implements OnInit {
  menus: MenuDia[] = [];
  restauranteId!: number;

  menuForm: MenuDia = {
    diaSemana: 'LUNES',
    menu: '',
    activo: true,
  };

  diasSemana = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO'];

  mostrarModal: boolean = false;
  editando: boolean = false;

  constructor(
    private menuService: MenuDiaService,
    private restauranteService: RestauranteService,
    private cdRef: ChangeDetectorRef,
  ) {
    console.log('🔵 Componente creado');
  }

  ngOnInit() {
    console.log('🔵 ngOnInit ejecutado');
    const restaurante = this.restauranteService.getRestaurante();

    if (!restaurante || !restaurante.id) {
      console.error('❌ No se pudo obtener el restaurante');
      alert('No se pudo identificar el restaurante. Vuelve a iniciar sesión.');
      return;
    }

    this.restauranteId = restaurante.id;
    console.log('✅ Restaurante ID obtenido:', this.restauranteId);

    this.cargarMenus();
  }

  cargarMenus() {
    console.log('🔵 Cargando menús...');
    this.menuService.listar(this.restauranteId).subscribe((data) => {
      console.log('✅ Menús cargados:', data.length);
      this.menus = data;
      this.cdRef.detectChanges();
    });
  }

  // Método original de guardar
  guardar() {
    console.log('🔵 Ejecutando guardar()');
    this.menuService.guardar(this.restauranteId, this.menuForm).subscribe(() => {
      console.log('✅ Menú guardado exitosamente');
      this.menuForm.menu = '';
      this.editando = false;
      this.cargarMenus();
    });
  }

  editar(menu: MenuDia) {
    console.log('✏️ Editando menú:', menu.diaSemana);
    this.menuForm = { ...menu };
    this.editando = true;
  }

  cambiarEstado(menu: MenuDia) {
    console.log('🔄 Cambiando estado de:', menu.diaSemana);
    this.menuService.cambiarEstado(menu.id!, !menu.activo).subscribe(() => {
      this.cargarMenus();
    });
  }

  // MÉTODOS PARA EL MODAL
  abrirConfirmacion() {
    console.log('🎯 abrirConfirmacion() EJECUTADO');
    console.log('Día seleccionado:', this.menuForm.diaSemana);
    console.log('Menú escrito:', this.menuForm.menu);
    
    if (!this.menuForm.diaSemana || !this.menuForm.menu.trim()) {
      console.warn('⚠️ Validación falló');
      alert('Por favor completa el día y el menú antes de guardar.');
      return;
    }

    console.log('✅ Mostrando modal...');
    this.mostrarModal = true;
  }

  cerrarModal() {
    console.log('❌ Cerrando modal');
    this.mostrarModal = false;
  }

  guardarConfirmado() {
    console.log('✅ Confirmado, guardando...');
    this.mostrarModal = false;
    this.guardar();
    
    setTimeout(() => {
      alert('✅ Menú guardado exitosamente!');
    }, 300);
  }
}