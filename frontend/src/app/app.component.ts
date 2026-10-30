import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthResponse, LoginRequest, RegisterRequest, Task, TaskPayload, TaskPriority } from './task.model';
import { TaskService } from './task.service';

type TaskFilter = 'all' | 'active' | 'completed';
type AuthMode = 'login' | 'register';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [DatePipe, FormsModule],
  templateUrl: './app.component.html',
})
export class AppComponent implements OnInit {
  private readonly taskService = inject(TaskService);
  private readonly reminderSeen = new Set<number>();

  tasks: Task[] = [];
  filter: TaskFilter = 'all';
  title = '';
  description = '';
  priority: TaskPriority = 'MEDIUM';
  reminderAt = '';
  editingId: number | null = null;
  loading = false;
  saving = false;
  errorMessage = '';
  authMode: AuthMode = 'login';
  authName = '';
  authEmail = '';
  authPassword = '';
  isAuthenticated = false;
  userName = '';
  authLoading = false;
  authError = '';

  ngOnInit(): void {
    const savedToken = localStorage.getItem('daymark_token');
    if (savedToken) {
      this.isAuthenticated = true;
      this.userName = localStorage.getItem('daymark_name') ?? 'Member';
      this.loadTasks();
      return;
    }

    this.tasks = [];
  }

  get visibleTasks(): Task[] {
    if (this.filter === 'active') {
      return this.tasks.filter((task) => !task.completed);
    }
    if (this.filter === 'completed') {
      return this.tasks.filter((task) => task.completed);
    }
    return this.tasks;
  }

  get remainingCount(): number {
    return this.tasks.filter((task) => !task.completed).length;
  }

  get completedCount(): number {
    return this.tasks.length - this.remainingCount;
  }

  loadTasks(): void {
    if (!this.isAuthenticated) {
      this.tasks = [];
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.taskService.getAll().subscribe({
      next: (tasks) => {
        this.tasks = tasks;
        this.loading = false;
        this.checkReminderAlerts();
      },
      error: (error: unknown) => {
        this.loading = false;
        if (error instanceof HttpErrorResponse && error.status === 401) {
          localStorage.removeItem('daymark_token');
          localStorage.removeItem('daymark_name');
          this.isAuthenticated = false;
          this.userName = '';
          this.tasks = [];
          this.authMode = 'login';
          this.authError = 'Your session has expired. Sign in again to continue.';
          this.errorMessage = '';
          return;
        }
        this.handleError(error, 'Could not load tasks. Please try again.');
      },
    });
  }

  setAuthMode(mode: AuthMode): void {
    if (this.authLoading) {
      return;
    }

    this.authMode = mode;
    this.authError = '';
  }

  submitAuth(): void {
    const email = this.authEmail.trim();
    const password = this.authPassword;
    if (this.authLoading) {
      return;
    }
    if (!email || !password.trim()) {
      this.authError = 'Enter your email address and password to continue.';
      return;
    }

    let name = '';
    if (this.authMode === 'register') {
      name = this.authName.trim();
      if (!name) {
        this.authError = 'Please provide your name.';
        return;
      }
    }

    this.authLoading = true;
    this.authError = '';

    const request$ = this.authMode === 'login'
      ? this.taskService.login({ email, password } satisfies LoginRequest)
      : this.taskService.register({ name, email, password } satisfies RegisterRequest);

    request$.subscribe({
      next: (result: AuthResponse) => {
        localStorage.setItem('daymark_token', result.token);
        localStorage.setItem('daymark_name', result.name);
        this.userName = result.name;
        this.isAuthenticated = true;
        this.authLoading = false;
        this.authError = '';
        this.authEmail = '';
        this.authPassword = '';
        this.authName = '';
        this.loadTasks();
      },
      error: (error: unknown) => {
        this.authLoading = false;
        this.handleAuthError(error, 'Unable to sign in right now.');
      },
    });
  }

  logout(): void {
    localStorage.removeItem('daymark_token');
    localStorage.removeItem('daymark_name');
    this.isAuthenticated = false;
    this.userName = '';
    this.tasks = [];
    this.filter = 'all';
    this.resetForm();
    this.authMode = 'login';
    this.authError = '';
  }

  submitTask(): void {
    if (!this.isAuthenticated) {
      return;
    }

    const trimmedTitle = this.title.trim();
    if (!trimmedTitle || this.saving) {
      return;
    }

    const editingId = this.editingId;
    const payload: TaskPayload = {
      title: trimmedTitle,
      description: this.description.trim(),
      completed: editingId === null
        ? false
        : this.tasks.find((task) => task.id === editingId)?.completed ?? false,
      priority: this.priority,
      reminderAt: this.reminderAt ? new Date(this.reminderAt).toISOString() : null,
    };
    const request = editingId !== null
      ? this.taskService.update(editingId, payload)
      : this.taskService.create(payload);

    this.saving = true;
    this.errorMessage = '';
    request.subscribe({
      next: (savedTask) => {
        this.tasks = editingId !== null
          ? this.tasks.map((task) => (task.id === savedTask.id ? savedTask : task))
          : [savedTask, ...this.tasks];
        if (this.editingId === editingId) {
          this.resetForm();
        }
        this.saving = false;
        this.checkReminderAlerts();
      },
      error: (error: unknown) => {
        this.saving = false;
        this.handleError(error, 'Could not save this task. Please try again.');
      },
    });
  }

  editTask(task: Task): void {
    this.editingId = task.id;
    this.title = task.title;
    this.description = task.description;
    this.priority = task.priority;
    this.reminderAt = task.reminderAt ? new Date(task.reminderAt).toISOString().slice(0, 16) : '';
    this.errorMessage = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cancelEdit(): void {
    this.resetForm();
  }

  toggleTask(task: Task): void {
    this.errorMessage = '';
    this.taskService.toggle(task.id).subscribe({
      next: (updatedTask) => {
        this.tasks = this.tasks.map((item) => (item.id === updatedTask.id ? updatedTask : item));
        this.checkReminderAlerts();
      },
      error: (error: unknown) => this.handleError(error, 'Could not update this task. Please try again.'),
    });
  }

  deleteTask(task: Task): void {
    this.errorMessage = '';
    this.taskService.delete(task.id).subscribe({
      next: () => {
        this.tasks = this.tasks.filter((item) => item.id !== task.id);
        this.reminderSeen.delete(task.id);
        if (this.editingId === task.id) {
          this.resetForm();
        }
      },
      error: (error: unknown) => this.handleError(error, 'Could not delete this task. Please try again.'),
    });
  }

  setFilter(filter: TaskFilter): void {
    this.filter = filter;
  }

  trackTask(_index: number, task: Task): number {
    return task.id;
  }

  private resetForm(): void {
    this.title = '';
    this.description = '';
    this.priority = 'MEDIUM';
    this.reminderAt = '';
    this.editingId = null;
  }

  private checkReminderAlerts(): void {
    if (!('Notification' in window) && !this.tasks.some((task) => task.reminderAt && !task.completed)) {
      return;
    }

    const now = Date.now();
    for (const task of this.tasks) {
      if (!task.reminderAt || task.completed) {
        continue;
      }

      const reminderMs = new Date(task.reminderAt).getTime();
      if (reminderMs <= now && !this.reminderSeen.has(task.id)) {
        this.reminderSeen.add(task.id);
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Task reminder', { body: `${task.title} is due now.` });
        } else if ('Notification' in window && Notification.permission === 'default') {
          Notification.requestPermission().catch(() => undefined);
        }

        setTimeout(() => window.alert(`Reminder: ${task.title}`), 0);
      }
    }
  }

  private handleError(error: unknown, fallback: string): void {
    this.loading = false;
    if (error instanceof HttpErrorResponse && typeof error.error?.message === 'string') {
      this.errorMessage = error.error.message;
      return;
    }
    if (error instanceof HttpErrorResponse && typeof error.error?.error === 'string') {
      this.errorMessage = error.error.error;
      return;
    }
    this.errorMessage = fallback;
  }

  private handleAuthError(error: unknown, fallback: string): void {
    if (error instanceof HttpErrorResponse && typeof error.error?.message === 'string') {
      this.authError = error.error.message;
      return;
    }
    if (error instanceof HttpErrorResponse && typeof error.error?.error === 'string') {
      this.authError = error.error.error;
      return;
    }
    if (error instanceof HttpErrorResponse && error.status === 401) {
      this.authError = 'Email address or password is incorrect.';
      return;
    }
    if (error instanceof HttpErrorResponse && error.status === 0) {
      this.authError = 'We could not reach the server. Check your connection and try again.';
      return;
    }
    this.authError = fallback;
  }
}
