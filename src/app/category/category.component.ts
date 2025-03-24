import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CategoryService, Category, PageResponse } from '../services/category/category.service';

@Component({
  selector: 'app-category',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './category.component.html',
  styleUrl: './category.component.css'
})
export class CategoryComponent implements OnInit {
  categories: Category[] = [];
  pagination: PageResponse<Category> | null = null;

  isModalOpen = false;
  editMode = false;
  selectedCategory: Category = { id: 0, name: '', description: '' };

  showDeleteConfirmation = false;
  categoryIdToDelete: number | null = null;

  constructor(private categoryService: CategoryService) {}

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(page = 0, size = 10): void {
    this.categoryService.getAllCategories().subscribe({
      next: (response) => {
        this.categories = response.content;
        this.pagination = response;
      },
      error: (error) => {
        console.error('Error loading categories:', error);
      }
    });
  }

  openAddCategoryModal(): void {
    this.editMode = false;
    this.selectedCategory = { id: 0, name: '', description: '' };
    this.isModalOpen = true;
  }

  editCategory(category: Category): void {
    this.editMode = true;
    this.selectedCategory = { ...category };
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
  }

  saveCategory(): void {
    if (this.editMode) {
      this.categoryService.updateCategory(this.selectedCategory.id, this.selectedCategory).subscribe({
        next: () => {
          this.loadCategories();
          this.closeModal();
        },
        error: (error) => {
          console.error('Error updating category:', error);
        }
      });
    } else {
      this.categoryService.createCategory(this.selectedCategory).subscribe({
        next: () => {
          this.loadCategories();
          this.closeModal();
        },
        error: (error) => {
          console.error('Error creating category:', error);
        }
      });
    }
  }

  deleteCategory(id: number): void {
    this.categoryIdToDelete = id;
    this.showDeleteConfirmation = true;
  }

  confirmDelete(): void {
    if (this.categoryIdToDelete) {
      this.categoryService.deleteCategory(this.categoryIdToDelete).subscribe({
        next: () => {
          this.loadCategories();
          this.cancelDelete();
        },
        error: (error) => {
          console.error('Error deleting category:', error);
        }
      });
    }
  }

  cancelDelete(): void {
    this.showDeleteConfirmation = false;
    this.categoryIdToDelete = null;
  }

  changePage(page: number): void {
    if (this.pagination && page >= 0 && page < this.pagination.totalPages) {
      this.loadCategories(page);
    }
  }
}
